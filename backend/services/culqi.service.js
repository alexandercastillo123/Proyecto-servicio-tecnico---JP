/**
 * culqi.service.js
 * Single Responsibility: Culqi payment flow orchestration.
 * Validates business rules, calls Culqi API, then delegates DB access to repositories.
 */
const axios = require('axios');
const appointmentRepo = require('../repository/appointment.repository');
const sucursalRepo = require('../repository/sucursal.repository');
const paymentRepo = require('../repository/payment.repository');
const { sendPaymentConfirmation } = require('../utils/email.service');
const AppError = require('../utils/AppError');

const CULQI_PRIVATE_KEY = process.env.CULQI_PRIVATE_KEY || 'sk_test_AkwtAL7LwriNndnn';
const CULQI_PUBLIC_KEY  = process.env.CULQI_PUBLIC_KEY  || 'pk_test_Q7byV7qjU6Jpn0jv';

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

    sendPaymentConfirmation(appData.email, { type: 'appointment', id: appointmentId, itemName: 'Servicio Técnico / Cita', amount: appData.price });

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

    sendPaymentConfirmation(orderData.email, { type: 'order', id: orderId, itemName: orderData.product_name, amount: orderData.total_price });

    await paymentRepo.logPayment({ type: 'order', entityId: orderId, chargeId: charge.id, amount: orderData.total_price, status: 'success', raw: charge });

    return { chargeId: charge.id };
};

const getPublicKey = () => CULQI_PUBLIC_KEY;

module.exports = { payAppointmentCulqi, payOrderCulqi, getPublicKey };
