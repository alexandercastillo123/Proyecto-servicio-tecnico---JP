const db = require('../config/database');
const Respuesta = require('../utils/Respuesta');

/**
 * Get notification settings for user
 */
const getSettings = async (req, res) => {
    let respuesta = new Respuesta();
    try {
        const userId = req.user.id;
        let [settings] = await db.pool.query('SELECT * FROM notification_settings WHERE user_id = ?', [userId]);
        
        if (settings.length === 0) {
            // Create default settings
            await db.ejecutar('INSERT INTO notification_settings (user_id) VALUES (?)', [userId]);
            [settings] = await db.pool.query('SELECT * FROM notification_settings WHERE user_id = ?', [userId]);
        }

        respuesta.exito = true;
        respuesta.resultado = settings[0];
        res.json(respuesta);
    } catch (error) {
        res.status(500).json({ mensaje: error.message });
    }
};

/**
 * Update notification settings
 */
const updateSettings = async (req, res) => {
    let respuesta = new Respuesta();
    try {
        const userId = req.user.id;
        const { appointmentsReminders, chatNotifications, orderUpdates } = req.body;

        await db.ejecutar(
            `UPDATE notification_settings 
             SET appointments_reminders = ?, chat_notifications = ?, order_updates = ? 
             WHERE user_id = ?`,
            [appointmentsReminders, chatNotifications, orderUpdates, userId]
        );

        respuesta.exito = true;
        respuesta.mensaje = 'Configuración actualizada';
        res.json(respuesta);
    } catch (error) {
        res.status(500).json({ mensaje: error.message });
    }
};

/**
 * Get user notifications
 */
const getNotifications = async (req, res) => {
    let respuesta = new Respuesta();
    try {
        const userId = req.user.id;
        const notifications = await db.listar(
            'SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 50',
            true,
            [userId]
        );

        respuesta.exito = true;
        respuesta.resultado = notifications.resultado;
        res.json(respuesta);
    } catch (error) {
        res.status(500).json({ mensaje: error.message });
    }
};

/**
 * Mark notification as read
 */
const markAsRead = async (req, res) => {
    let respuesta = new Respuesta();
    try {
        const { id } = req.params;
        const userId = req.user.id;

        await db.ejecutar('UPDATE notifications SET is_read = TRUE WHERE id = ? AND user_id = ?', [id, userId]);

        respuesta.exito = true;
        res.json(respuesta);
    } catch (error) {
        res.status(500).json({ mensaje: error.message });
    }
};

module.exports = {
    getSettings,
    updateSettings,
    getNotifications,
    markAsRead
};
