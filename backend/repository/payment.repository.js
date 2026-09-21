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

/**
 * Indica si ya existe un log exitoso para la entidad (usado en idempotencia).
 */
const existsSuccessfulPayment = async (type, entityId) => {
    const [rows] = await pool.query(
        'SELECT 1 FROM payment_logs WHERE entity_type = ? AND entity_id = ? AND status = ? LIMIT 1',
        [type, entityId, 'success']
    );
    return rows.length > 0;
};

/**
 * Busca un log de pago por charge id de Culqi (usado en idempotencia de webhook).
 */
const findByChargeId = async (chargeId) => {
    const [rows] = await pool.query(
        'SELECT id, entity_type, entity_id, status FROM payment_logs WHERE culqi_charge_id = ? LIMIT 1',
        [chargeId]
    );
    return rows[0] || null;
};

/**
 * Actualiza el estado de un log de pago por charge id (usado en webhook idempotente).
 */
const updateStatusByCharge = async (chargeId, status, error = null, raw = null) => {
    const fields = ['status = ?'];
    const params = [status];
    if (error) {
        fields.push('error_message = ?');
        params.push(error);
    } else {
        fields.push('error_message = NULL');
    }
    if (raw) {
        fields.push('raw_response = ?');
        params.push(JSON.stringify(raw));
    }
    params.push(chargeId);

    const [result] = await pool.query(
        `UPDATE payment_logs SET ${fields.join(', ')} WHERE culqi_charge_id = ?`,
        params
    );
    return result.affectedRows;
};

module.exports = { logPayment, existsSuccessfulPayment, findByChargeId, updateStatusByCharge };
