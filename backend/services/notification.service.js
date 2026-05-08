const db = require('../config/database');

/**
 * Service to handle internal notifications
 */
class NotificationService {
    /**
     * Create a notification for a user
     * @param {number} userId - The user to notify
     * @param {string} title - Notification title
     * @param {string} message - Notification message body
     * @param {string} type - 'appointment', 'chat', 'order', 'system'
     * @param {number} relatedId - ID of related entity (appointmentId, orderId, etc.)
     */
    static async createNotification(userId, title, message, type, relatedId = null) {
        try {
            // 1. Check if user has notifications enabled for this type
            const [settings] = await db.pool.query('SELECT * FROM notification_settings WHERE user_id = ?', [userId]);
            
            if (settings.length > 0) {
                const s = settings[0];
                if (type === 'appointment' && !s.appointment_reminders) return;
                if (type === 'chat' && !s.chat_notifications) return;
                if (type === 'order' && !s.order_updates) return;
            }

            // 2. Save to DB
            await db.ejecutar(
                'INSERT INTO notifications (user_id, title, message, type, related_id) VALUES (?, ?, ?, ?, ?)',
                [userId, title, message, type, relatedId]
            );

            // 3. (Optional) Send Push Notification via FCM
            // This would require firebase-admin setup
            // console.log(`[PUSH] To User ${userId}: ${title} - ${message}`);

            return true;
        } catch (error) {
            console.error('Error creating notification:', error);
            return false;
        }
    }

    /**
     * Notify technician about a new appointment or message
     */
    static async notifyNewChat(receiverId, senderName, messageText) {
        return this.createNotification(
            receiverId,
            `Mensaje de ${senderName}`,
            messageText.length > 50 ? messageText.substring(0, 47) + '...' : messageText,
            'chat'
        );
    }

    /**
     * Notify about order status changes
     */
    static async notifyOrderStatus(clientId, orderId, status, productName) {
        const statusMap = {
            'confirmed': 'confirmado y está siendo procesado',
            'shipped': 'en camino a tu dirección',
            'delivered': 'entregado con éxito',
            'cancelled': 'cancelado'
        };

        const statusText = statusMap[status] || status;
        
        return this.createNotification(
            clientId,
            'Actualización de tu pedido',
            `Tu pedido de "${productName}" ha sido ${statusText}.`,
            'order',
            orderId
        );
    }
}

module.exports = NotificationService;
