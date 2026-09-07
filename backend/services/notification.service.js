/**
 * notification.service.js
 * Single Responsibility: Orchestrate in-app notifications and push notifications.
 * Delegates all DB access to notification.repository.js
 */
const notificationRepo = require('../repository/notification.repository');
const { sendPushNotification } = require('../config/firebase');

/**
 * Creates an in-app notification and attempts to send a push notification.
 * Respects per-user push_enabled + notification type settings.
 */
const createNotification = async (userId, title, message, type, data = {}) => {
    try {
        // 1. Persist in-app notification
        const notificationId = await notificationRepo.insert(userId, title, message, type, data);

        // 2. Check push settings
        const settings = await notificationRepo.getSettingsForPush(userId);

        if (settings && !settings.push_enabled) return true;

        let shouldSendPush = true;
        if (settings) {
            if (type === 'chat' && !settings.chat_notifications) shouldSendPush = false;
            if ((type === 'appointment' || type === 'offer') && !settings.appointment_reminders) shouldSendPush = false;
            if (type === 'order' && !settings.order_updates) shouldSendPush = false;
        }

        if (shouldSendPush) {
            // 3. Get FCM tokens and fan out push
            const tokens = await notificationRepo.getFCMTokens(userId);
            if (tokens.length > 0) {
                await Promise.all(
                    tokens.map(t => sendPushNotification(t.fcm_token, title, message, {
                        ...data, type, notificationId: notificationId.toString()
                    }))
                );
            }
        }

        return true;
    } catch (error) {
        console.error('[notification.service] Error creating notification:', error.message);
        return false;
    }
};

const notifyOrderStatus = async (userId, orderId, status, productName) => {
    const MSG_MAP = {
        confirmed: `Pedido Confirmado: Tu pedido de "${productName}" ha sido aceptado.`,
        shipped:   `Pedido en Camino: Tu pedido de "${productName}" ya está en camino.`,
        delivered: `Pedido Entregado: El pedido de "${productName}" ha sido entregado.`,
        cancelled: `Pedido Cancelado: Tu pedido de "${productName}" ha sido cancelado.`
    };
    const msg = MSG_MAP[status];
    if (msg) {
        return createNotification(userId, 'Actualización de Pedido', msg, 'order',
            { orderId: orderId.toString(), status });
    }
    return true;
};

module.exports = { createNotification, notifyOrderStatus };