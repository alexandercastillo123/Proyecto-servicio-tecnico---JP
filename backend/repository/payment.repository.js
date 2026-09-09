/**
 * payment.repository.js
 * Single Responsibility: ALL SQL queries for payment logs.
 * Culqi charge data and cross-entity payment confirmations
 * are handled in the respective entity repositories (appointment / sucursal).
 */
const { pool } = require('../config/database');

/**
 * Persiste un log de pago (éxito, fallo o rechazo).
 */
const logPayment = async ({ type, entityId, method, chargeId, amount, status, error, raw }) => {
    try {
        await pool.query(
            `INSERT INTO payment_logs
                (entity_type, entity_id, payment_method, culqi_charge_id, amount, status, error_message, raw_response)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [type, entityId, method || 'culqi', chargeId || null, amount, status, error || null, JSON.stringify(raw || {})]
        );
    } catch (e) {
        // Payment logs are non-critical — swallow error to avoid disrupting payment flow
        console.error('[payment.repository] Error saving payment log:', e.message);
    }
};

module.exports = { logPayment };
