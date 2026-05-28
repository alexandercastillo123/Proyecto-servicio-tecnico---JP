const db = require('../config/database');
const { sendPushNotification } = require('../config/firebase');

/**
 * Creates an in-app notification and attempts to send a push notification
 * Respeta la configuración push_enabled + tipos específicos
 */
const createNotification = async (userId, title, message, type, data = {}) => {
    try {
        // 1. Create in-app notification in DB
        const dbRes = await db.ejecutar(
            'INSERT INTO notifications (user_id, title, message, type, extra_data) VALUES (?, ?, ?, ?, ?)',
            [userId, title, message, type, JSON.stringify(data)]
        );

        // 2. Check all notification settings
        const [settings] = await db.pool.query(
            'SELECT push_enabled, chat_notifications, appointment_reminders, order_updates FROM notification_settings WHERE user_id = ?',
            [userId]
        );

        // Check if push is enabled globally
        if (settings.length > 0 && !settings[0].push_enabled) {
            return true; // In-app notification saved but no push
        }

        let shouldSendPush = true;
        if (settings.length > 0) {
            const s = settings[0];
            if (type === 'chat' && !s.chat_notifications) shouldSendPush = false;
            if ((type === 'appointment' || type === 'offer') && !s.appointment_reminders) shouldSendPush = false;
            if (type === 'order' && !s.order_updates) shouldSendPush = false;
        }

        if (shouldSendPush) {
            // 3. Get FCM tokens for this user
            const [tokens] = await db.pool.query(
                'SELECT fcm_token FROM user_device_tokens WHERE user_id = ?',
                [userId]
            );

            // 4. Send push to all devices
            if (tokens.length > 0) {
                const pushPromises = tokens.map(t =>
                    sendPushNotification(t.fcm_token, title, message, {
                        ...data,
                        type,
                        notificationId: dbRes.resultado?.insertId?.toString()
                    })
                );
                await Promise.all(pushPromises);
            }
        }

        return true;
    } catch (error) {
        console.error('Error creating notification:', error);
        return false;
    }
};

const notifyOrderStatus = async (userId, orderId, status, productName) => {
    let msg = '';
    if (status === 'confirmed') msg = `Pedido Confirmado: Tu pedido de "${productName}" ha sido aceptado.`;
    if (status === 'shipped') msg = `Pedido en Camino: Tu pedido de "${productName}" ya está en camino.`;
    if (status === 'delivered') msg = `Pedido Entregado: El pedido de "${productName}" ha sido entregado.`;
    if (status === 'cancelled') msg = `Pedido Cancelado: Tu pedido de "${productName}" ha sido cancelado.`;

    if (msg) {
        return await createNotification(userId, 'Actualización de Pedido', msg, 'order', { orderId: orderId.toString(), status });
    }
    return true;
};

module.exports = {
    createNotification,
    notifyOrderStatus
};