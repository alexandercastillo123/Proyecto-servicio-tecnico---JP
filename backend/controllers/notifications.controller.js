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
        const { push_enabled, appointments_reminders, chat_notifications, order_updates } = req.body;

        await db.ejecutar(
            `UPDATE notification_settings 
             SET push_enabled = COALESCE(?, push_enabled),
                 appointments_reminders = COALESCE(?, appointments_reminders), 
                 chat_notifications = COALESCE(?, chat_notifications), 
                 order_updates = COALESCE(?, order_updates)
             WHERE user_id = ?`,
            [push_enabled, appointments_reminders, chat_notifications, order_updates, userId]
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

/**
 * Save/Update FCM token for user
 */
const saveToken = async (req, res) => {
    let respuesta = new Respuesta();
    try {
        const userId = req.user.id;
        const { token, platform } = req.body;

        if (!token) {
            respuesta.mensaje = 'Token es requerido';
            return res.status(400).json(respuesta);
        }

        await db.ejecutar(
            `INSERT INTO user_device_tokens (user_id, fcm_token, platform) 
             VALUES (?, ?, ?) 
             ON DUPLICATE KEY UPDATE user_id = ?, platform = ?, last_used = CURRENT_TIMESTAMP`,
            [userId, token, platform || null, userId, platform || null]
        );

        respuesta.exito = true;
        respuesta.mensaje = 'Token registrado correctamente';
        res.json(respuesta);
    } catch (error) {
        console.error('Save token error:', error);
        res.status(500).json({ mensaje: error.message });
    }
};

/**
 * Remove FCM token for user
 */
const removeToken = async (req, res) => {
    let respuesta = new Respuesta();
    try {
        const userId = req.user.id;
        const { token } = req.params;

        await db.ejecutar(
            'DELETE FROM user_device_tokens WHERE user_id = ? AND fcm_token = ?',
            [userId, token]
        );

        respuesta.exito = true;
        respuesta.mensaje = 'Token eliminado correctamente';
        res.json(respuesta);
    } catch (error) {
        console.error('Remove token error:', error);
        res.status(500).json({ mensaje: error.message });
    }
};

module.exports = {
    getSettings,
    updateSettings,
    getNotifications,
    markAsRead,
    saveToken,
    removeToken
};