/**
 * user.repository.js
 * Single Responsibility: ALL SQL queries related to users, profiles,
 * password resets and device tokens. No business logic here.
 */
const { pool } = require('../config/database');

// ─── Users ────────────────────────────────────────────────────────────────────

const findByEmail = async (email) => {
    const [rows] = await pool.query(
        'SELECT id, email, username, password_hash, role FROM users WHERE email = ?',
        [email]
    );
    return rows[0] || null;
};

const findById = async (userId) => {
    const [rows] = await pool.query(
        `SELECT
            u.id, u.email, u.username, u.role, u.created_at,
            up.phone, up.profile_image_url, up.address, up.city,
            up.person_type, up.names, up.surnames, up.dni,
            up.company_name, up.ruc, up.reference_address,
            up.rating, up.reviews_count, up.is_available, up.description
         FROM users u
         LEFT JOIN user_profiles up ON u.id = up.user_id
         WHERE u.id = ?`,
        [userId]
    );
    return rows[0] || null;
};

const findPublicById = async (userId) => {
    const [rows] = await pool.query(
        `SELECT
            u.id, u.username, u.role,
            up.phone, up.profile_image_url, up.address, up.city,
            up.person_type, up.names, up.surnames, up.dni,
            up.company_name, up.ruc, up.reference_address,
            up.rating, up.reviews_count,
            s.id as store_id
         FROM users u
         LEFT JOIN user_profiles up ON u.id = up.user_id
         LEFT JOIN sucursales s ON u.id = s.user_id
         WHERE u.id = ?`,
        [userId]
    );
    return rows[0] || null;
};

const emailExists = async (email) => {
    const [rows] = await pool.query('SELECT id FROM users WHERE email = ?', [email]);
    return rows.length > 0;
};

const usernameExists = async (username, excludeId = null) => {
    if (excludeId) {
        const [rows] = await pool.query('SELECT id FROM users WHERE username = ? AND id != ?', [username, excludeId]);
        return rows.length > 0;
    }
    const [rows] = await pool.query('SELECT id FROM users WHERE username = ?', [username]);
    return rows.length > 0;
};

const dniOrRucExists = async (dni, ruc) => {
    const [rows] = await pool.query(
        'SELECT user_id FROM user_profiles WHERE dni = ? OR ruc = ?',
        [dni || null, ruc || null]
    );
    return rows.length > 0;
};

const create = async (data, connection) => {
    const { email, username, passwordHash, role, policiesAccepted } = data;
    const [result] = await connection.query(
        'INSERT INTO users (email, username, password_hash, role, policies_accepted) VALUES (?, ?, ?, ?, ?)',
        [email, username || null, passwordHash, role, policiesAccepted || false]
    );
    return result.insertId;
};

const createBasic = async (email, username, passwordHash, role, conn) => {
    const [result] = await conn.query(
        'INSERT INTO users (email, username, password_hash, role) VALUES (?, ?, ?, ?)',
        [email, username, passwordHash, role]
    );
    return result.insertId;
};

const updateUsername = async (userId, username) => {
    await pool.query('UPDATE users SET username = ? WHERE id = ?', [username, userId]);
};

const updatePassword = async (userId, passwordHash) => {
    const [result] = await pool.query(
        'UPDATE users SET password_hash = ? WHERE id = ?',
        [passwordHash, userId]
    );
    return result.affectedRows;
};

const updatePasswordByEmail = async (email, passwordHash) => {
    const [result] = await pool.query(
        'UPDATE users SET password_hash = ? WHERE email = ?',
        [passwordHash, email]
    );
    return result.affectedRows;
};

// ─── User Profiles ────────────────────────────────────────────────────────────

const createProfile = async (data, connection) => {
    const {
        userId, phone, address, city, personType, names, surnames,
        dni, companyName, ruc, referenceAddress, latitude, longitude
    } = data;
    await connection.query(
        `INSERT INTO user_profiles
            (user_id, phone, address, city, person_type, names, surnames, dni, company_name, ruc, reference_address, latitude, longitude)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [userId, phone || null, address || null, city || null, personType,
         names || null, surnames || null, dni || null, companyName || null,
         ruc || null, referenceAddress || null, latitude || null, longitude || null]
    );
};

const createBasicProfile = async (userId, data, conn) => {
    const { phone, address, city, personType, names } = data;
    await conn.query(
        'INSERT INTO user_profiles (user_id, phone, address, city, person_type, names) VALUES (?, ?, ?, ?, ?, ?)',
        [userId, phone, address, city, personType, names]
    );
};

const updateProfile = async (userId, fields) => {
    const { phone, address, city, names, surnames, dni, companyName, ruc, referenceAddress, description } = fields;
    await pool.query(
        `UPDATE user_profiles SET
            phone             = COALESCE(?, phone),
            address           = COALESCE(?, address),
            city              = COALESCE(?, city),
            names             = COALESCE(?, names),
            surnames          = COALESCE(?, surnames),
            dni               = COALESCE(?, dni),
            company_name      = COALESCE(?, company_name),
            ruc               = COALESCE(?, ruc),
            reference_address = COALESCE(?, reference_address),
            description       = COALESCE(?, description)
         WHERE user_id = ?`,
        [phone, address, city, names, surnames, dni, companyName, ruc, referenceAddress, description, userId]
    );
};

const updateProfileImage = async (userId, imageUrl) => {
    await pool.query('UPDATE user_profiles SET profile_image_url = ? WHERE user_id = ?', [imageUrl, userId]);
};

const updateAvailability = async (userId, isAvailable) => {
    await pool.query('UPDATE user_profiles SET is_available = ? WHERE user_id = ?', [isAvailable, userId]);
};

const hasActiveAppointments = async (userId) => {
    const [rows] = await pool.query(
        `SELECT id FROM appointments
         WHERE technician_id = ?
           AND status IN ('pending','confirmed','on_the_way','arrived','in_progress')
           AND (scheduled_date > CURDATE() OR (scheduled_date = CURDATE() AND scheduled_time >= CURTIME()))`,
        [userId]
    );
    return rows.length > 0;
};

// ─── Password Resets ──────────────────────────────────────────────────────────

const saveResetCode = async (email, code, expiresAt) => {
    await pool.query('DELETE FROM password_resets WHERE email = ?', [email]);
    await pool.query(
        'INSERT INTO password_resets (email, code, expires_at) VALUES (?, ?, ?)',
        [email, code, expiresAt]
    );
};

const findValidResetCode = async (email, code) => {
    const [rows] = await pool.query(
        'SELECT id FROM password_resets WHERE email = ? AND code = ? AND expires_at > NOW()',
        [email, code]
    );
    return rows[0] || null;
};

const deleteResetCode = async (email) => {
    await pool.query('DELETE FROM password_resets WHERE email = ?', [email]);
};

// ─── Device Tokens ────────────────────────────────────────────────────────────

const saveDeviceToken = async (userId, token, platform) => {
    await pool.query(
        `INSERT INTO user_device_tokens (user_id, fcm_token, platform)
         VALUES (?, ?, ?)
         ON DUPLICATE KEY UPDATE user_id = ?, platform = ?, last_used = CURRENT_TIMESTAMP`,
        [userId, token, platform || null, userId, platform || null]
    );
};

const removeDeviceToken = async (userId, token) => {
    await pool.query(
        'DELETE FROM user_device_tokens WHERE user_id = ? AND fcm_token = ?',
        [userId, token]
    );
};

const getFCMTokens = async (userId) => {
    const [rows] = await pool.query(
        'SELECT fcm_token FROM user_device_tokens WHERE user_id = ?',
        [userId]
    );
    return rows;
};

module.exports = {
    // Users
    findByEmail, findById, findPublicById,
    emailExists, usernameExists, dniOrRucExists,
    create, createBasic, updateUsername, updatePassword, updatePasswordByEmail,
    // Profiles
    createProfile, createBasicProfile, updateProfile, updateProfileImage,
    updateAvailability, hasActiveAppointments,
    // Password resets
    saveResetCode, findValidResetCode, deleteResetCode,
    // Device tokens
    saveDeviceToken, removeDeviceToken, getFCMTokens
};
