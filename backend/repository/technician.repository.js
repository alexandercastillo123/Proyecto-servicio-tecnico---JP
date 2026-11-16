/**
 * technician.repository.js
 * Single Responsibility: ALL SQL queries for technicians,
 * their schedules and reviews.
 */
const { pool } = require('../config/database');

const TECH_SELECT = `
    SELECT
        u.id, u.email, u.username,
        up.phone, up.profile_image_url, up.address, up.city,
        up.person_type, up.names, up.surnames, up.dni,
        up.company_name, up.ruc, up.reference_address,
        up.rating, up.reviews_count,
        up.latitude, up.longitude, up.description
    FROM users u
    INNER JOIN user_profiles up ON u.id = up.user_id
    WHERE u.role = 'tech'
`;

const SCHEDULE_ORDER = `ORDER BY FIELD(day_of_week, 'Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday')`;

// ─── Technicians ──────────────────────────────────────────────────────────────

const findAll = async ({ city, minRating, limit, offset }) => {
    let sql = `${TECH_SELECT} AND (up.is_available IS NULL OR up.is_available = TRUE)`;
    const params = [];
    if (city) { sql += ' AND up.city = ?'; params.push(city); }
    if (minRating) { sql += ' AND up.rating >= ?'; params.push(parseFloat(minRating)); }
    sql += ` ORDER BY up.rating DESC, up.reviews_count DESC LIMIT ? OFFSET ?`;
    params.push(parseInt(limit), parseInt(offset));
    const [rows] = await pool.query(sql, params);
    return rows;
};

const countAll = async ({ city, minRating }) => {
    let sql = `SELECT COUNT(*) as total FROM users u INNER JOIN user_profiles up ON u.id = up.user_id
               WHERE u.role = 'tech' AND (up.is_available IS NULL OR up.is_available = TRUE)`;
    const params = [];
    if (city) { sql += ' AND up.city = ?'; params.push(city); }
    if (minRating) { sql += ' AND up.rating >= ?'; params.push(parseFloat(minRating)); }
    const [rows] = await pool.query(sql, params);
    return rows[0]?.total || 0;
};

const findById = async (id) => {
    const [rows] = await pool.query(
        `${TECH_SELECT} AND u.id = ?`,
        [id]
    );
    return rows[0] || null;
};

const findNearby = async (lat, lng, radius) => {
    const [rows] = await pool.query(
        `SELECT
            u.id, u.email, u.username,
            up.phone, up.profile_image_url, up.address, up.city,
            up.person_type, up.names, up.surnames, up.company_name,
            up.rating, up.reviews_count,
            up.latitude, up.longitude,
            (6371 * ACOS(GREATEST(-1, LEAST(1,
                COS(RADIANS(?)) * COS(RADIANS(up.latitude)) * COS(RADIANS(up.longitude) - RADIANS(?)) +
                SIN(RADIANS(?)) * SIN(RADIANS(up.latitude))
            )))) AS distance_km
         FROM users u
         INNER JOIN user_profiles up ON u.id = up.user_id
         WHERE u.role = 'tech'
           AND up.latitude IS NOT NULL
           AND up.longitude IS NOT NULL
           AND (up.is_available IS NULL OR up.is_available = TRUE)
         HAVING distance_km <= ?
         ORDER BY distance_km ASC
         LIMIT 50`,
        [lat, lng, lat, radius]
    );
    return rows;
};

// ─── Schedules ────────────────────────────────────────────────────────────────

const getSchedule = async (technicianId, activeOnly = false) => {
    let sql = `SELECT id, day_of_week, start_time, end_time, is_active FROM technician_schedules WHERE technician_id = ?`;
    if (activeOnly) sql += ' AND is_active = TRUE';
    sql += ` ${SCHEDULE_ORDER}`;
    const [rows] = await pool.query(sql, [technicianId]);
    return rows;
};

const replaceSchedule = async (technicianId, schedules) => {
    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();
        await conn.query('DELETE FROM technician_schedules WHERE technician_id = ?', [technicianId]);
        const values = schedules.map(s => [
            technicianId, s.dayOfWeek, s.startTime, s.endTime,
            s.isActive !== undefined ? s.isActive : true
        ]);
        await conn.query(
            'INSERT INTO technician_schedules (technician_id, day_of_week, start_time, end_time, is_active) VALUES ?',
            [values]
        );
        await conn.commit();
    } catch (e) {
        await conn.rollback();
        throw e;
    } finally {
        conn.release();
    }
};

const updateScheduleEntry = async (id, technicianId, { dayOfWeek, startTime, endTime, isActive }) => {
    const [result] = await pool.query(
        `UPDATE technician_schedules SET
            day_of_week = COALESCE(?, day_of_week),
            start_time  = COALESCE(?, start_time),
            end_time    = COALESCE(?, end_time),
            is_active   = COALESCE(?, is_active)
         WHERE id = ? AND technician_id = ?`,
        [dayOfWeek, startTime, endTime, isActive, id, technicianId]
    );
    return result.affectedRows;
};

// ─── Reviews ──────────────────────────────────────────────────────────────────

const hasCompletedAppointment = async (clientId, technicianId) => {
    const [rows] = await pool.query(
        `SELECT id FROM appointments WHERE client_id = ? AND technician_id = ? AND status = 'completed' LIMIT 1`,
        [clientId, technicianId]
    );
    return rows.length > 0;
};

const hasExistingReview = async (clientId, technicianId) => {
    const [rows] = await pool.query(
        'SELECT id FROM reviews WHERE client_id = ? AND technician_id = ?',
        [clientId, technicianId]
    );
    return rows.length > 0;
};

const insertReview = async (appointmentId, clientId, technicianId, rating, comment) => {
    const [result] = await pool.query(
        'INSERT INTO reviews (appointment_id, client_id, technician_id, rating, comment) VALUES (?, ?, ?, ?, ?)',
        [appointmentId || null, clientId, technicianId, rating, comment || '']
    );
    return result.insertId;
};

const recalculateRating = async (technicianId) => {
    const [rows] = await pool.query(
        'SELECT AVG(rating) as avg_rating, COUNT(*) as total FROM reviews WHERE technician_id = ?',
        [technicianId]
    );
    const { avg_rating, total } = rows[0];
    await pool.query(
        'UPDATE user_profiles SET rating = ?, reviews_count = ? WHERE user_id = ?',
        [avg_rating || 0, total, technicianId]
    );
};

module.exports = {
    findAll, countAll, findById, findNearby,
    getSchedule, replaceSchedule, updateScheduleEntry,
    hasCompletedAppointment, hasExistingReview, insertReview, recalculateRating
};
