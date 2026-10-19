/**
 * appointment.repository.js
 * Single Responsibility: ALL SQL queries for appointments and related chat messages.
 * No business logic, no validations — only data access.
 */
const { pool } = require('../config/database');

const APPOINTMENT_SELECT = `
    SELECT
        a.id, a.scheduled_date, a.scheduled_time, a.description, a.status, a.created_at,
        a.price, a.payment_method, a.payment_status, a.payment_confirmed_at, a.service_type,
        a.service_lat, a.service_lng, a.service_address,
        a.en_camino_at, a.llegado_at, a.en_progreso_at, a.completado_at, a.client_confirmed_completion,
        client.id as client_id, client.email as client_email, client.username as client_username,
        client_profile.names as client_names, client_profile.surnames as client_surnames,
        client_profile.phone as client_phone, client_profile.address as client_address,
        tech.id as technician_id, tech.email as tech_email,
        tech_profile.names as tech_names, tech_profile.surnames as tech_surnames,
        tech_profile.company_name as tech_company, tech_profile.phone as tech_phone,
        tech_profile.address as tech_address, tech_profile.rating as tech_rating
    FROM appointments a
    INNER JOIN users client ON a.client_id = client.id
    INNER JOIN user_profiles client_profile ON client.id = client_profile.user_id
    INNER JOIN users tech ON a.technician_id = tech.id
    INNER JOIN user_profiles tech_profile ON tech.id = tech_profile.user_id
`;

// ─── Reads ────────────────────────────────────────────────────────────────────

const findById = async (id) => {
    const [rows] = await pool.query(
        `${APPOINTMENT_SELECT} WHERE a.id = ?`,
        [id]
    );
    return rows[0] || null;
};

const findByIdForParticipant = async (id, userId) => {
    const [rows] = await pool.query(
        `${APPOINTMENT_SELECT} WHERE a.id = ? AND (a.client_id = ? OR a.technician_id = ?)`,
        [id, userId, userId]
    );
    return rows[0] || null;
};

const findByUser = async (userId, status = null) => {
    const LIST_SELECT = `
        SELECT
            a.id, a.scheduled_date, a.scheduled_time, a.description, a.status, a.created_at,
            a.price, a.payment_method, a.payment_status, a.payment_confirmed_at, a.service_type,
            client.id as client_id, client.username as client_username,
            client_profile.names as client_names, client_profile.surnames as client_surnames,
            client_profile.phone as client_phone,
            tech.id as technician_id,
            tech_profile.names as tech_names, tech_profile.surnames as tech_surnames,
            tech_profile.company_name as tech_company, tech_profile.phone as tech_phone,
            tech_profile.address as tech_address
        FROM appointments a
        INNER JOIN users client ON a.client_id = client.id
        INNER JOIN user_profiles client_profile ON client.id = client_profile.user_id
        INNER JOIN users tech ON a.technician_id = tech.id
        INNER JOIN user_profiles tech_profile ON tech.id = tech_profile.user_id
        WHERE (a.client_id = ? OR a.technician_id = ?)
    `;
    const params = [userId, userId];
    let sql = LIST_SELECT;
    if (status) { sql += ' AND a.status = ?'; params.push(status); }
    sql += ' ORDER BY a.scheduled_date DESC, a.scheduled_time DESC';

    const [rows] = await pool.query(sql, params);
    return rows;
};

const findForRole = async (id) => {
    const [rows] = await pool.query(
        'SELECT client_id, technician_id, status, service_type, payment_status, cancelled_by FROM appointments a JOIN users u ON a.technician_id = u.id WHERE a.id = ?',
        [id]
    );
    return rows[0] || null;
};

const findActiveForPair = async (clientId, technicianId) => {
    const [rows] = await pool.query(
        `SELECT id FROM appointments
         WHERE client_id = ? AND technician_id = ?
           AND status IN ('pending','confirmed')
           AND (scheduled_date > CURDATE() OR (scheduled_date = CURDATE() AND scheduled_time > CURTIME()))`,
        [clientId, technicianId]
    );
    return rows[0] || null;
};

const findWithClientEmail = async (id) => {
    const [rows] = await pool.query(
        'SELECT a.*, u.email FROM appointments a JOIN users u ON a.client_id = u.id WHERE a.id = ?',
        [id]
    );
    return rows[0] || null;
};

// ─── Writes ───────────────────────────────────────────────────────────────────

const create = async (data, conn) => {
    const { clientId, technicianId, scheduledDate, scheduledTime, description, serviceLat, serviceLng, serviceAddress, serviceType } = data;
    const [result] = await conn.query(
        `INSERT INTO appointments
            (client_id, technician_id, scheduled_date, scheduled_time, description, status, service_lat, service_lng, service_address, service_type)
         VALUES (?, ?, ?, ?, ?, 'pending', ?, ?, ?, ?)`,
        [clientId, technicianId, scheduledDate, scheduledTime, description,
         serviceLat || null, serviceLng || null, serviceAddress || null, serviceType || 'local']
    );
    return result.insertId;
};

const updateStatus = async (id, status, timestampCol = null) => {
    const extra = timestampCol ? `, ${timestampCol} = NOW()` : '';
    await pool.query(`UPDATE appointments SET status = ?${extra} WHERE id = ?`, [status, id]);
};

const setCancelledStatus = async (id, newStatus, cancelledBy) => {
    const [result] = await pool.query(
        'UPDATE appointments SET status = ?, cancelled_by = ? WHERE id = ? AND (client_id = ? OR technician_id = ?)',
        [newStatus, cancelledBy, id, cancelledBy, cancelledBy]
    );
    return result.affectedRows;
};

const setPrice = async (id, price) => {
    await pool.query('UPDATE appointments SET price = ? WHERE id = ?', [price, id]);
};

const setPaymentWaiting = async (id, paymentMethod) => {
    await pool.query(
        'UPDATE appointments SET payment_method = ?, payment_status = "waiting_confirmation" WHERE id = ?',
        [paymentMethod, id]
    );
};

const confirmPayment = async (id) => {
    await pool.query(
        'UPDATE appointments SET payment_status = "paid", payment_confirmed_at = NOW(), status = IF(status = "pending", "confirmed", status) WHERE id = ?',
        [id]
    );
};

const confirmPaymentCulqi = async (id, chargeId) => {
    await pool.query(
        `UPDATE appointments
         SET payment_method = 'culqi', payment_status = 'paid', culqi_charge_id = ?,
             payment_confirmed_at = NOW(), status = IF(status = 'pending', 'confirmed', status)
         WHERE id = ?`,
        [chargeId, id]
    );
};

const confirmCompletion = async (id) => {
    await pool.query('UPDATE appointments SET client_confirmed_completion = TRUE WHERE id = ?', [id]);
};

// ─── Cron tasks ───────────────────────────────────────────────────────────────

const expireOldAppointments = async () => {
    const [result] = await pool.query(
        `UPDATE appointments SET status = 'expired'
         WHERE status IN ('pending','confirmed')
           AND (scheduled_date < CURDATE() OR (scheduled_date = CURDATE() AND scheduled_time < CURTIME()))`
    );
    return result.affectedRows;
};

const findUpcomingForReminder = async () => {
    const [rows] = await pool.query(
        `SELECT a.id, a.client_id, a.technician_id, a.scheduled_time,
                up_c.names as client_name, up_t.names as tech_name
         FROM appointments a
         JOIN user_profiles up_c ON a.client_id = up_c.user_id
         JOIN user_profiles up_t ON a.technician_id = up_t.user_id
         JOIN notification_settings ns_t ON a.technician_id = ns_t.user_id
         WHERE a.status = 'confirmed'
           AND a.scheduled_date = CURDATE()
           AND a.scheduled_time BETWEEN CURTIME() AND ADDTIME(CURTIME(), '00:30:00')
           AND ns_t.appointment_reminders = TRUE
           AND NOT EXISTS (
               SELECT 1 FROM notifications n
               WHERE n.user_id = a.technician_id
                 AND n.type = 'reminder'
                 AND n.message LIKE CONCAT('%', a.id, '%')
                 AND n.created_at > DATE_SUB(NOW(), INTERVAL 12 HOUR)
           )`
    );
    return rows;
};

// ─── Chat messages ────────────────────────────────────────────────────────────

const insertChatMessage = async (senderId, receiverId, text, type, appointmentId) => {
    await pool.query(
        'INSERT INTO chat_messages (sender_id, receiver_id, message_text, message_type, appointment_id) VALUES (?, ?, ?, ?, ?)',
        [senderId, receiverId, text, type, appointmentId]
    );
};

const insertChatMessageConn = async (conn, senderId, receiverId, text, type, appointmentId) => {
    await conn.query(
        'INSERT INTO chat_messages (sender_id, receiver_id, message_text, message_type, appointment_id) VALUES (?, ?, ?, ?, ?)',
        [senderId, receiverId, text, type, appointmentId]
    );
};

// ─── Sucursales link ──────────────────────────────────────────────────────────

const findStoreByUserId = async (userId, conn) => {
    const [rows] = await conn.query('SELECT id FROM sucursales WHERE user_id = ?', [userId]);
    return rows[0] || null;
};

const linkStoreAppointment = async (sucursalId, appointmentId, conn) => {
    await conn.query(
        'INSERT INTO sucursales_citas (sucursal_id, cita_id) VALUES (?, ?)',
        [sucursalId, appointmentId]
    );
};

// ─── Reminder notifications ───────────────────────────────────────────────────

const insertReminderNotification = async (userId, title, message) => {
    await pool.query(
        'INSERT INTO notifications (user_id, title, message, type) VALUES (?, ?, ?, ?)',
        [userId, title, message, 'reminder']
    );
};

module.exports = {
    findById, findByIdForParticipant, findByUser, findForRole, findActiveForPair, findWithClientEmail,
    create, updateStatus, setCancelledStatus, setPrice, setPaymentWaiting,
    confirmPayment, confirmPaymentCulqi, confirmCompletion,
    expireOldAppointments, findUpcomingForReminder,
    insertChatMessage, insertChatMessageConn,
    findStoreByUserId, linkStoreAppointment,
    insertReminderNotification
};
