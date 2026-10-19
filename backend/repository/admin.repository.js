/**
 * admin.repository.js
 * Single Responsibility: ALL SQL queries for admin panel views.
 * Read-heavy, no writes — admin reads are JOINs across multiple tables.
 */
const { pool } = require('../config/database');

const getAllAppointments = async ({ status, date } = {}) => {
    let sql = `
        SELECT
            a.*,
            c.username as client_username,
            cp.names as client_names, cp.surnames as client_surnames,
            t.username as tech_username,
            tp.names as tech_names, tp.surnames as tech_surnames,
            s.name as store_name
        FROM appointments a
        JOIN users c ON a.client_id = c.id
        JOIN user_profiles cp ON c.id = cp.user_id
        JOIN users t ON a.technician_id = t.id
        JOIN user_profiles tp ON t.id = tp.user_id
        LEFT JOIN sucursales_citas sc ON a.id = sc.cita_id
        LEFT JOIN sucursales s ON sc.sucursal_id = s.id
        WHERE 1=1
    `;
    const params = [];
    if (status) { sql += ' AND a.status = ?'; params.push(status); }
    if (date) { sql += ' AND a.scheduled_date = ?'; params.push(date); }
    sql += ' ORDER BY a.created_at DESC';
    const [rows] = await pool.query(sql, params);
    return rows;
};

const getAllUsers = async ({ role } = {}) => {
    let sql = `
        SELECT u.id, u.username, u.email, u.role, u.created_at,
               up.names, up.surnames, up.phone, up.person_type, up.company_name, up.ruc, up.city
        FROM users u
        LEFT JOIN user_profiles up ON u.id = up.user_id
        WHERE 1=1
    `;
    const params = [];
    if (role) { sql += ' AND u.role = ?'; params.push(role); }
    const [rows] = await pool.query(sql, params);
    return rows;
};

const getAllBranches = async () => {
    const [rows] = await pool.query(
        `SELECT s.*, u.username as owner_username, u.email as owner_email
         FROM sucursales s
         JOIN users u ON s.user_id = u.id`
    );
    return rows;
};

const getAllOrders = async ({ status } = {}) => {
    let sql = `
        SELECT o.*, p.name as product_name, s.name as store_name,
               up.names as client_names, up.surnames as client_surnames
        FROM store_orders o
        JOIN store_products p ON o.product_id = p.id
        JOIN sucursales s ON o.sucursal_id = s.id
        JOIN user_profiles up ON o.client_id = up.user_id
        WHERE 1=1
    `;
    const params = [];
    if (status) { sql += ' AND o.status = ?'; params.push(status); }
    sql += ' ORDER BY o.created_at DESC';
    const [rows] = await pool.query(sql, params);
    return rows;
};

module.exports = { getAllAppointments, getAllUsers, getAllBranches, getAllOrders };
