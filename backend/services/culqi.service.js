/**
 * culqi.service.js
 * Single Responsibility: Culqi payment flow orchestration.
 * Validates business rules, calls Culqi API, then delegates DB access to repositories.
 */
const axios = require('axios');
const crypto = require('crypto');
const appointmentRepo = require('../repository/appointment.repository');
const sucursalRepo = require('../repository/sucursal.repository');
const paymentRepo = require('../repository/payment.repository');
const { sendPaymentConfirmation } = require('../utils/email.service');
const AppError = require('../utils/AppError');

// Claves requeridas por env. En NODE_ENV=test se usan las de prueba por defecto
// para que los tests unitarios no fallen cuando .env no está cargado.
const isTest = process.env.NODE_ENV === 'test';
const CULQI_PRIVATE_KEY = process.env.CULQI_PRIVATE_KEY || (isTest ? 'sk_test_AkwtAL7LwriNndnn' : undefined);
const CULQI_PUBLIC_KEY  = process.env.CULQI_PUBLIC_KEY  || (isTest ? 'pk_test_Q7byV7qjU6Jpn0jv' : undefined);
const CULQI_WEBHOOK_SECRET = process.env.CULQI_WEBHOOK_SECRET || '';

if (!CULQI_PRIVATE_KEY && !isTest) {
    console.warn('⚠️ CULQI_PRIVATE_KEY no está definida. Los pagos con Culqi fallarán.');
}
if (!CULQI_PUBLIC_KEY && !isTest) {
    console.warn('⚠️ CULQI_PUBLIC_KEY no está definida.');
}

// ─── Private helper ───────────────────────────────────────────────────────────

const createCulqiCharge = async (token, amount, email, desc) => {
    const response = await axios.post(
        'https://api.culqi.com/v2/charges',
        { amount: Math.round(amount * 100), currency_code: 'PEN', email, source_id: token, description: desc, capture: true },
        { headers: { Authorization: `Bearer ${CULQI_PRIVATE_KEY}`, 'Content-Type': 'application/json' } }
    );
    return response.data;
};

// ─── Pay appointment ──────────────────────────────────────────────────────────

const payAppointmentCulqi = async (appointmentId, userId, culqiToken) => {
    if (!culqiToken) throw new AppError('Token de Culqi requerido.', 400);

    const appData = await appointmentRepo.findWithClientEmail(appointmentId);
    if (!appData) throw new AppError('Cita no encontrada.', 404);
    if (appData.client_id !== userId) throw new AppError('Solo el cliente puede pagar esta cita.', 403);
    if (!appData.price) throw new AppError('El técnico aún no ha establecido el precio.', 400);
    if (appData.payment_status === 'paid') throw new AppError('Esta cita ya fue pagada.', 400);

    // Idempotencia: evitar cobrar dos veces la misma cita.
    if (await paymentRepo.existsSuccessfulPayment('appointment', appointmentId)) {
        throw new AppError('Esta cita ya fue pagada.', 400);
    }

    let charge;
    try {
        charge = await createCulqiCharge(culqiToken, parseFloat(appData.price), appData.email, `Cita de servicio técnico #${appointmentId}`);
    } catch (culqiError) {
        const errMsg = culqiError.response?.data?.user_message || culqiError.message;
        await paymentRepo.logPayment({ type: 'appointment', entityId: appointmentId, amount: appData.price, status: 'failed', error: errMsg, raw: culqiError.response?.data || {} });
        throw new AppError(errMsg, 402);
    }

    if (charge.object !== 'charge' || charge.outcome?.type !== 'venta_exitosa') {
        await paymentRepo.logPayment({ type: 'appointment', entityId: appointmentId, chargeId: charge.id, amount: appData.price, status: 'rejected', error: charge.user_message, raw: charge });
        throw new AppError(charge.user_message || 'Pago rechazado por Culqi.', 402);
    }

    await appointmentRepo.confirmPaymentCulqi(appointmentId, charge.id);

    const chatMsg = `💳 *¡Pago con Culqi confirmado!* El cliente pagó S/ ${appData.price} para la cita #${appointmentId}. La cita está *confirmada automáticamente*.`;
    await appointmentRepo.insertChatMessage(userId, appData.technician_id, chatMsg, 'appointment', appointmentId);

    try {
        await sendPaymentConfirmation(appData.email, { type: 'appointment', id: appointmentId, itemName: 'Servicio Técnico / Cita', amount: appData.price });
        console.log(`📧 Comprobante de pago Culqi enviado a: ${appData.email}`);
    } catch (emailErr) {
        console.error('⚠️ Error al enviar comprobante Culqi:', emailErr.message);
    }

    await paymentRepo.logPayment({ type: 'appointment', entityId: appointmentId, chargeId: charge.id, amount: appData.price, status: 'success', raw: charge });

    return { chargeId: charge.id };
};

// ─── Pay order ────────────────────────────────────────────────────────────────

const payOrderCulqi = async (orderId, userId, culqiToken) => {
    if (!culqiToken) throw new AppError('Token de Culqi requerido.', 400);

    const orderData = await sucursalRepo.findOrderWithEmail(orderId);
    if (!orderData) throw new AppError('Pedido no encontrado.', 404);
    if (orderData.client_id !== userId) throw new AppError('Solo el cliente puede pagar este pedido.', 403);
    if (orderData.payment_status === 'paid') throw new AppError('Este pedido ya fue pagado.', 400);

    // Idempotencia: evitar cobrar dos veces el mismo pedido.
    if (await paymentRepo.existsSuccessfulPayment('order', orderId)) {
        throw new AppError('Este pedido ya fue pagado.', 400);
    }

    let charge;
    try {
        charge = await createCulqiCharge(
            culqiToken, parseFloat(orderData.total_price), orderData.email,
            `Pedido de ${orderData.product_name} x${orderData.quantity} - Tienda #${orderData.sucursal_id}`
        );
    } catch (culqiError) {
        const errMsg = culqiError.response?.data?.user_message || culqiError.message;
        await paymentRepo.logPayment({ type: 'order', entityId: orderId, amount: orderData.total_price, status: 'failed', error: errMsg, raw: culqiError.response?.data || {} });
        throw new AppError(errMsg, 402);
    }

    if (charge.object !== 'charge' || charge.outcome?.type !== 'venta_exitosa') {
        await paymentRepo.logPayment({ type: 'order', entityId: orderId, chargeId: charge.id, amount: orderData.total_price, status: 'rejected', error: charge.user_message, raw: charge });
        throw new AppError(charge.user_message || 'Pago rechazado por Culqi.', 402);
    }

    await sucursalRepo.confirmOrderPaymentCulqi(orderId, charge.id);

    const chatMsg = `💳 *¡Pago con Culqi exitoso!* El cliente pagó S/ ${parseFloat(orderData.total_price).toFixed(2)} por "${orderData.product_name}" x${orderData.quantity}. El pedido está *confirmado automáticamente*.`;
    await sucursalRepo.insertOrderChatMessage(userId, orderData.store_user_id, chatMsg, orderId);

    try {
        await sendPaymentConfirmation(orderData.email, { type: 'order', id: orderId, itemName: orderData.product_name, amount: orderData.total_price });
        console.log(`📧 Comprobante de pago Culqi enviado a: ${orderData.email}`);
    } catch (emailErr) {
        console.error('⚠️ Error al enviar comprobante Culqi:', emailErr.message);
    }

    await paymentRepo.logPayment({ type: 'order', entityId: orderId, chargeId: charge.id, amount: orderData.total_price, status: 'success', raw: charge });

    return { chargeId: charge.id };
};

const getPublicKey = () => CULQI_PUBLIC_KEY;

/**
 * Verifica la firma HMAC-SHA256 que Culqi envía en el webhook.
 * Si CULQI_WEBHOOK_SECRET no está configurada, se permite el paso pero se avisa.
 * @param {string|Buffer} rawBody - cuerpo crudo recibido
 * @param {string} signature - valor del header de firma
 * @param {string} timestamp - timestamp enviado por Culqi
 */
const verifyWebhookSignature = (rawBody, signature, timestamp) => {
    if (!CULQI_WEBHOOK_SECRET) {
        console.warn('⚠️ CULQI_WEBHOOK_SECRET no configurada; se omite verificación de firma de webhook.');
        return true;
    }

    const signedPayload = `${timestamp}.${rawBody}`;
    const expected = 'sha256=' + crypto
        .createHmac('sha256', CULQI_WEBHOOK_SECRET)
        .update(signedPayload)
        .digest('hex');

    const a = Buffer.from(signature || '');
    const b = Buffer.from(expected);
    if (a.length !== b.length) return false;
    return crypto.timingSafeEqual(a, b);
};

/**
 * Procesa un webhook de Culqi de forma idempotente.
 * @param {string|Buffer} rawBody - cuerpo crudo del request
 * @param {string} signature - firma del header
 * @param {string} timestamp - timestamp del header
 * @param {object} body - payload ya parseado (para fallback cuando no se usa raw)
 */
const handleWebhook = async (rawBody, signature, timestamp, body) => {
    if (!verifyWebhookSignature(rawBody, signature, timestamp)) {
        throw new AppError('Firma de webhook Culqi inválida', 401);
    }

    const payload = body || JSON.parse(rawBody);
    const type = payload.type;
    const chargeId = payload.data?.id || payload.data?.charge_id;
    if (!chargeId) {
        console.warn('[culqi.webhook] Evento sin charge id, se ignora:', type);
        return { received: true, ignored: true };
    }

    // Idempotencia: si el evento fue procesado antes, se ignora.
    const existing = await paymentRepo.findByChargeId(chargeId);
    const rawError = payload.data?.user_message || null;

    let status;
    switch (type) {
        case 'charge.success': status = 'success'; break;
        case 'charge.failed':
        case 'charge.rejected': status = 'failed'; break;
        case 'charge.refunded': status = 'refunded'; break;
        default:
            console.warn(`[culqi.webhook] Evento desconocido ${type} para charge ${chargeId}`);
            return { received: true, ignored: true };
    }

    if (existing) {
        // No sobrees status ya confirmado como success para evitar falsos negativos.
        if (existing.status === 'success' && status !== 'success') {
            return { received: true, chargeId, already: 'success' };
        }
        await paymentRepo.updateStatusByCharge(chargeId, status, rawError, payload);
    } else {
        await paymentRepo.logPayment({
            type: 'appointment', // tipo desconocido en webhook entrante; se audita en payment_logs
            entityId: null,
            chargeId,
            amount: payload.data?.amount ? payload.data.amount / 100 : 0,
            status,
            raw: payload
        });
    }

    console.log(`[culqi.webhook] Procesado evento ${type} charge ${chargeId} -> ${status}`);
    return { received: true, chargeId, status };
};

module.exports = { payAppointmentCulqi, payOrderCulqi, getPublicKey, verifyWebhookSignature, handleWebhook };
