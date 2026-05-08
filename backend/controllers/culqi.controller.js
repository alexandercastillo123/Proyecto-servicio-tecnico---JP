/**
 * culqi.controller.js
 * Controlador para pagos Culqi (modo TEST)
 * Maneja pagos tanto de CITAS como de PEDIDOS de tienda
 */

const axios = require('axios');
const db = require('../config/database');
const Respuesta = require('../utils/Respuesta');
const emailService = require('../utils/email.service');

const CULQI_PRIVATE_KEY = process.env.CULQI_PRIVATE_KEY || 'sk_test_AkwtAL7LwriNndnn';
const CULQI_PUBLIC_KEY = process.env.CULQI_PUBLIC_KEY || 'pk_test_Q7byV7qjU6Jpn0jv';

/**
 * Crear un cargo en Culqi con un token de tarjeta
 */
async function createCulqiCharge(token, amount, email, desc) {
    const response = await axios.post(
        'https://api.culqi.com/v2/charges',
        {
            amount: Math.round(amount * 100), // Culqi usa centavos
            currency_code: 'PEN',
            email,
            source_id: token,
            description: desc,
            capture: true,
        },
        {
            headers: {
                Authorization: `Bearer ${CULQI_PRIVATE_KEY}`,
                'Content-Type': 'application/json',
            },
        }
    );
    return response.data;
}

/**
 * Helper para registrar logs de pago en la BD
 */
async function logPayment(details) {
    try {
        const { type, entityId, method, chargeId, amount, status, error, raw } = details;
        await db.ejecutar(
            `INSERT INTO payment_logs 
            (entity_type, entity_id, payment_method, culqi_charge_id, amount, status, error_message, raw_response) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [type, entityId, method || 'culqi', chargeId, amount, status, error || null, JSON.stringify(raw || {})]
        );
    } catch (e) {
        console.error('Error saving payment log:', e.message);
    }
}

/**
 * POST /api/culqi/pay-appointment/:id
 * Pagar una CITA con Culqi (token generado en el frontend)
 */
const payAppointmentCulqi = async (req, res) => {
    const respuesta = new Respuesta();
    let appData = null;
    try {
        const { id } = req.params;
        const { culqiToken } = req.body;
        const userId = req.user.id;

        if (!culqiToken) {
            respuesta.mensaje = 'Token de Culqi requerido';
            return res.status(400).json(respuesta);
        }

        // Verificar que la cita existe y el usuario es el cliente
        const appRes = await db.listar(
            'SELECT a.*, u.email FROM appointments a JOIN users u ON a.client_id = u.id WHERE a.id = ?',
            false,
            [id]
        );

        if (!appRes.resultado) {
            respuesta.estado = 404;
            respuesta.mensaje = 'Cita no encontrada';
            return res.status(404).json(respuesta);
        }

        appData = appRes.resultado;

        if (appData.client_id !== userId) {
            respuesta.estado = 403;
            respuesta.mensaje = 'Solo el cliente puede pagar esta cita';
            return res.status(403).json(respuesta);
        }

        if (!appData.price) {
            respuesta.estado = 400;
            respuesta.mensaje = 'El técnico aún no ha establecido el precio';
            return res.status(400).json(respuesta);
        }

        if (appData.payment_status === 'paid') {
            respuesta.estado = 400;
            respuesta.mensaje = 'Esta cita ya fue pagada';
            return res.status(400).json(respuesta);
        }

        // Realizar el cargo en Culqi
        let charge;
        try {
            charge = await createCulqiCharge(
                culqiToken,
                parseFloat(appData.price),
                appData.email,
                `Cita de servicio técnico #${id}`
            );
        } catch (culqiError) {
            const errMsg = culqiError.response?.data?.user_message || culqiError.message;
            // Log fallido
            await logPayment({
                type: 'appointment',
                entityId: id,
                amount: appData.price,
                status: 'failed',
                error: errMsg,
                raw: culqiError.response?.data || { message: culqiError.message }
            });
            respuesta.mensaje = errMsg;
            return res.status(402).json(respuesta);
        }

        if (charge.object !== 'charge' || charge.outcome?.type !== 'venta_exitosa') {
            await logPayment({
                type: 'appointment',
                entityId: id,
                chargeId: charge.id,
                amount: appData.price,
                status: 'rejected',
                error: charge.user_message || 'Rechazado por Culqi',
                raw: charge
            });
            respuesta.estado = 402;
            respuesta.mensaje = charge.user_message || 'Pago rechazado por Culqi';
            return res.status(402).json(respuesta);
        }

        // Pago exitoso → marcar como pagado Y confirmar automáticamente
        await db.ejecutar(
            `UPDATE appointments 
             SET payment_method = 'culqi', 
                 payment_status = 'paid', 
                 culqi_charge_id = ?,
                 payment_confirmed_at = NOW(),
                 status = IF(status = 'pending', 'confirmed', status)
             WHERE id = ?`,
            [charge.id, id]
        );

        // Notificar al técnico por chat
        const receiverId = appData.technician_id;
        const chatMsg = `💳 *¡Pago con Culqi confirmado!* El cliente pagó S/ ${appData.price} para la cita #${id}. La cita está *confirmada automáticamente*.`;
        await db.ejecutar(
            'INSERT INTO chat_messages (sender_id, receiver_id, message_text, message_type, appointment_id) VALUES (?, ?, ?, "appointment", ?)',
            [userId, receiverId, chatMsg, id]
        );

        // Enviar correo de confirmación
        emailService.sendPaymentConfirmation(appData.email, {
            type: 'appointment',
            id: id,
            itemName: 'Servicio Técnico / Cita',
            amount: appData.price
        });

        // Log exitoso
        await logPayment({
            type: 'appointment',
            entityId: id,
            chargeId: charge.id,
            amount: appData.price,
            status: 'success',
            raw: charge
        });

        respuesta.exito = true;
        respuesta.mensaje = '¡Pago exitoso! La cita ha sido confirmada automáticamente.';
        respuesta.resultado = { chargeId: charge.id };
        res.json(respuesta);

    } catch (error) {
        console.error('Culqi appointment pay error:', error.message);
        respuesta.mensaje = 'Error al procesar el pago con Culqi';
        res.status(500).json(respuesta);
    }
};

/**
 * POST /api/culqi/pay-order/:id
 * Pagar un PEDIDO de tienda con Culqi
 */
const payOrderCulqi = async (req, res) => {
    const respuesta = new Respuesta();
    let orderData = null;
    try {
        const { id } = req.params;
        const { culqiToken } = req.body;
        const userId = req.user.id;

        if (!culqiToken) {
            respuesta.mensaje = 'Token de Culqi requerido';
            return res.status(400).json(respuesta);
        }

        // Verificar pedido
        const orderRes = await db.listar(
            `SELECT o.*, u.email, p.name as product_name, s.user_id as store_user_id
             FROM store_orders o 
             JOIN users u ON o.client_id = u.id
             JOIN store_products p ON o.product_id = p.id
             JOIN sucursales s ON o.sucursal_id = s.id
             WHERE o.id = ?`,
            false,
            [id]
        );

        if (!orderRes.resultado) {
            respuesta.estado = 404;
            respuesta.mensaje = 'Pedido no encontrado';
            return res.status(404).json(respuesta);
        }

        orderData = orderRes.resultado;

        if (orderData.client_id !== userId) {
            respuesta.estado = 403;
            respuesta.mensaje = 'Solo el cliente puede pagar este pedido';
            return res.status(403).json(respuesta);
        }

        if (orderData.payment_status === 'paid') {
            respuesta.estado = 400;
            respuesta.mensaje = 'Este pedido ya fue pagado';
            return res.status(400).json(respuesta);
        }

        // Cargo Culqi
        let charge;
        try {
            charge = await createCulqiCharge(
                culqiToken,
                parseFloat(orderData.total_price),
                orderData.email,
                `Pedido de ${orderData.product_name} x${orderData.quantity} - Tienda #${orderData.sucursal_id}`
            );
        } catch (culqiError) {
            const errMsg = culqiError.response?.data?.user_message || culqiError.message;
            // Log fallido
            await logPayment({
                type: 'order',
                entityId: id,
                amount: orderData.total_price,
                status: 'failed',
                error: errMsg,
                raw: culqiError.response?.data || { message: culqiError.message }
            });
            respuesta.mensaje = errMsg;
            return res.status(402).json(respuesta);
        }

        if (charge.object !== 'charge' || charge.outcome?.type !== 'venta_exitosa') {
            await logPayment({
                type: 'order',
                entityId: id,
                chargeId: charge.id,
                amount: orderData.total_price,
                status: 'rejected',
                error: charge.user_message || 'Rechazado por Culqi',
                raw: charge
            });
            respuesta.estado = 402;
            respuesta.mensaje = charge.user_message || 'Pago rechazado por Culqi';
            return res.status(402).json(respuesta);
        }

        // Actualizar pedido: pagado y confirmado automáticamente
        await db.ejecutar(
            `UPDATE store_orders 
             SET payment_method = 'culqi',
                 payment_status = 'paid',
                 culqi_charge_id = ?,
                 payment_confirmed_at = NOW(),
                 status = 'confirmed'
             WHERE id = ?`,
            [charge.id, id]
        );

        // Notificar a la tienda
        const chatMsg = `💳 *¡Pago con Culqi exitoso!* El cliente pagó S/ ${parseFloat(orderData.total_price).toFixed(2)} por "${orderData.product_name}" x${orderData.quantity}. El pedido está *confirmado automáticamente*.`;
        await db.ejecutar(
            'INSERT INTO chat_messages (sender_id, receiver_id, message_text, message_type, order_id) VALUES (?, ?, ?, "order", ?)',
            [userId, orderData.store_user_id, chatMsg, id]
        );

        // Enviar correo de confirmación
        emailService.sendPaymentConfirmation(orderData.email, {
            type: 'order',
            id: id,
            itemName: orderData.product_name,
            amount: orderData.total_price
        });

        // Log exitoso
        await logPayment({
            type: 'order',
            entityId: id,
            chargeId: charge.id,
            amount: orderData.total_price,
            status: 'success',
            raw: charge
        });

        respuesta.exito = true;
        respuesta.mensaje = '¡Pago exitoso! El pedido ha sido confirmado automáticamente.';
        respuesta.resultado = { chargeId: charge.id };
        res.json(respuesta);

    } catch (error) {
        console.error('Culqi order pay error:', error.message);
        respuesta.mensaje = 'Error al procesar el pago con Culqi';
        res.status(500).json(respuesta);
    }
};

/**
 * GET /api/culqi/public-key
 * Devuelve la public key para el frontend
 */
const getPublicKey = (req, res) => {
    res.json({ exito: true, publicKey: CULQI_PUBLIC_KEY });
};

module.exports = { payAppointmentCulqi, payOrderCulqi, getPublicKey };
