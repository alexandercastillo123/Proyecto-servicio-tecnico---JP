/**
 * notification.repository.js
 * Single Responsibility: ALL SQL queries for notifications,
 * notification settings and FCM device tokens.
 */
const { pool } = require('../config/database');

// ─── Notifications ────────────────────────────────────────────────────────────

const insert = async (userId, title, message, type, extraData = {}) => {
    const [result] = await pool.query(
        'INSERT INTO notifications (user_id, title, message, type, extra_data) VALUES (?, ?, ?, ?, ?)',
        [userId, title, message, type, JSON.stringify(extraData)]
    );
    return result.insertId;
};

const findByUser = async (userId, limit = 50) => {
    const [rows] = await pool.query(
        'SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT ?',
        [userId, limit]
    );
    return rows;
};

const markAsRead = async (id, userId) => {
    const [result] = await pool.query(
        'UPDATE notifications SET is_read = TRUE WHERE id = ? AND user_id = ?',
        [id, userId]
    );
    return result.affectedRows;
};

// ─── Settings ─────────────────────────────────────────────────────────────────

const getSettings = async (userId) => {
    const [rows] = await pool.query(
        'SELECT * FROM notification_settings WHERE user_id = ?',
        [userId]
    );
    return rows[0] || null;
};

const createDefaultSettings = async (userId) => {
    await pool.query('INSERT INTO notification_settings (user_id) VALUES (?)', [userId]);
};

const updateSettings = async (userId, fields) => {
    const { push_enabled, appointments_reminders, chat_notifications, order_updates } = fields;
    await pool.query(
        `UPDATE notification_settings
         SET push_enabled              = COALESCE(?, push_enabled),
             appointments_reminders    = COALESCE(?, appointments_reminders),
             chat_notifications        = COALESCE(?, chat_notifications),
             order_updates             = COALESCE(?, order_updates)
         WHERE user_id = ?`,
        [push_enabled, appointments_reminders, chat_notifications, order_updates, userId]
    );
};

const getSettingsForPush = async (userId) => {
    const [rows] = await pool.query(
        'SELECT push_enabled, chat_notifications, appointment_reminders, order_updates FROM notification_settings WHERE user_id = ?',
        [userId]
    );
    return rows[0] || null;
};

// ─── Device Tokens ────────────────────────────────────────────────────────────

const getFCMTokens = async (userId) => {
    const [rows] = await pool.query(
        'SELECT fcm_token FROM user_device_tokens WHERE user_id = ?',
        [userId]
    );
    return rows;
};

const saveToken = async (userId, token, platform) => {
    await pool.query(
        `INSERT INTO user_device_tokens (user_id, fcm_token, platform)
         VALUES (?, ?, ?)
         ON DUPLICATE KEY UPDATE user_id = ?, platform = ?, last_used = CURRENT_TIMESTAMP`,
        [userId, token, platform || null, userId, platform || null]
    );
};

const removeToken = async (userId, token) => {
    await pool.query(
        'DELETE FROM user_device_tokens WHERE user_id = ? AND fcm_token = ?',
        [userId, token]
    );
};

// ─── Cleanup ──────────────────────────────────────────────────────────────────

const deleteExpiredResets = async () => {
    const [result] = await pool.query('DELETE FROM password_resets WHERE expires_at < NOW()');
    return result.affectedRows;
};

module.exports = {
    insert, findByUser, markAsRead,
    getSettings, createDefaultSettings, updateSettings, getSettingsForPush,
    getFCMTokens, saveToken, removeToken,
    deleteExpiredResets
};
