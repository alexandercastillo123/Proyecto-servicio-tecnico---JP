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
 * @param {string} token    - Token generado por Culqi.js en el cliente
 * @param {number} amount   - Monto en centavos (soles * 100)
 * @param {string} email    - Email del cliente
 * @param {string} desc     - Descripción del cargo
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
 * POST /api/culqi/pay-appointment/:id
 * Pagar una CITA con Culqi (token generado en el frontend)
 */
const payAppointmentCulqi = async (req, res) => {
    const respuesta = new Respuesta();
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

        const app = appRes.resultado;

        if (app.client_id !== userId) {
            respuesta.estado = 403;
            respuesta.mensaje = 'Solo el cliente puede pagar esta cita';
            return res.status(403).json(respuesta);
        }

        if (!app.price) {
            respuesta.estado = 400;
            respuesta.mensaje = 'El técnico aún no ha establecido el precio';
            return res.status(400).json(respuesta);
        }

        if (app.payment_status === 'paid') {
            respuesta.estado = 400;
            respuesta.mensaje = 'Esta cita ya fue pagada';
            return res.status(400).json(respuesta);
        }

        // Realizar el cargo en Culqi
        const charge = await createCulqiCharge(
            culqiToken,
            parseFloat(app.price),
            app.email,
            `Cita de servicio técnico #${id}`
        );

        if (charge.object !== 'charge' || charge.outcome?.type !== 'venta_exitosa') {
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
        const receiverId = app.technician_id;
        const chatMsg = `💳 *¡Pago con Culqi confirmado!* El cliente pagó S/ ${app.price} para la cita #${id}. La cita está *confirmada automáticamente*.`;
        await db.ejecutar(
            'INSERT INTO chat_messages (sender_id, receiver_id, message_text, message_type, appointment_id) VALUES (?, ?, ?, "appointment", ?)',
            [userId, receiverId, chatMsg, id]
        );

        // Enviar correo de confirmación
        emailService.sendPaymentConfirmation(app.email, {
            type: 'appointment',
            id: id,
            itemName: 'Servicio Técnico / Cita',
            amount: app.price
        });

        respuesta.exito = true;
        respuesta.mensaje = '¡Pago exitoso! La cita ha sido confirmada automáticamente.';
        respuesta.resultado = { chargeId: charge.id };
        res.json(respuesta);

    } catch (error) {
        console.error('Culqi appointment pay error:', error.response?.data || error.message);
        const culqiMsg = error.response?.data?.user_message || 'Error al procesar el pago con Culqi';
        respuesta.mensaje = culqiMsg;
        res.status(402).json(respuesta);
    }
};

/**
 * POST /api/culqi/pay-order/:id
 * Pagar un PEDIDO de tienda con Culqi
 */
const payOrderCulqi = async (req, res) => {
    const respuesta = new Respuesta();
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

        const order = orderRes.resultado;

        if (order.client_id !== userId) {
            respuesta.estado = 403;
            respuesta.mensaje = 'Solo el cliente puede pagar este pedido';
            return res.status(403).json(respuesta);
        }

        if (order.payment_status === 'paid') {
            respuesta.estado = 400;
            respuesta.mensaje = 'Este pedido ya fue pagado';
            return res.status(400).json(respuesta);
        }

        // Cargo Culqi
        const charge = await createCulqiCharge(
            culqiToken,
            parseFloat(order.total_price),
            order.email,
            `Pedido de ${order.product_name} x${order.quantity} - Tienda #${order.sucursal_id}`
        );

        if (charge.object !== 'charge' || charge.outcome?.type !== 'venta_exitosa') {
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
        const chatMsg = `💳 *¡Pago con Culqi exitoso!* El cliente pagó S/ ${parseFloat(order.total_price).toFixed(2)} por "${order.product_name}" x${order.quantity}. El pedido está *confirmado automáticamente*.`;
        await db.ejecutar(
            'INSERT INTO chat_messages (sender_id, receiver_id, message_text, message_type, order_id) VALUES (?, ?, ?, "order", ?)',
            [userId, order.store_user_id, chatMsg, id]
        );

        // Enviar correo de confirmación
        emailService.sendPaymentConfirmation(order.email, {
            type: 'order',
            id: id,
            itemName: order.product_name,
            amount: order.total_price
        });

        respuesta.exito = true;
        respuesta.mensaje = '¡Pago exitoso! El pedido ha sido confirmado automáticamente.';
        respuesta.resultado = { chargeId: charge.id };
        res.json(respuesta);

    } catch (error) {
        console.error('Culqi order pay error:', error.response?.data || error.message);
        const culqiMsg = error.response?.data?.user_message || 'Error al procesar el pago con Culqi';
        respuesta.mensaje = culqiMsg;
        res.status(402).json(respuesta);
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
