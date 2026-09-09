/**
 * sucursal.repository.js
 * Single Responsibility: ALL SQL queries for stores (sucursales),
 * their products, orders, reviews and schedules.
 */
const { pool } = require('../config/database');

// ─── Stores ────────────────────────────────────────────────────────────────────

const findAll = async () => {
    const [rows] = await pool.query(`SELECT * FROM sucursales WHERE status = 'active' ORDER BY created_at DESC`);
    return rows;
};

const findById = async (id) => {
    const [rows] = await pool.query('SELECT * FROM sucursales WHERE id = ? OR user_id = ?', [id, id]);
    return rows[0] || null;
};

const findByUserId = async (userId) => {
    const [rows] = await pool.query('SELECT * FROM sucursales WHERE user_id = ?', [userId]);
    return rows[0] || null;
};

const findNearby = async (lat, lng, radius) => {
    const [rows] = await pool.query(
        `SELECT s.*,
            (6371 * ACOS(GREATEST(-1, LEAST(1,
                COS(RADIANS(?)) * COS(RADIANS(s.latitude)) * COS(RADIANS(s.longitude) - RADIANS(?)) +
                SIN(RADIANS(?)) * SIN(RADIANS(s.latitude))
            )))) AS distance_km
         FROM sucursales s
         WHERE s.status = 'active' AND s.latitude IS NOT NULL AND s.longitude IS NOT NULL
         HAVING distance_km <= ?
         ORDER BY distance_km ASC LIMIT 50`,
        [parseFloat(lat), parseFloat(lng), parseFloat(lat), parseFloat(radius)]
    );
    return rows;
};

const existsByUserId = async (userId) => {
    const [rows] = await pool.query('SELECT id FROM sucursales WHERE user_id = ?', [userId]);
    return rows.length > 0;
};

const create = async (data, conn) => {
    const {
        userId, name, description, address, city, state, zip_code, country,
        phone, email, whatsapp, website_url, image_url, latitude, longitude,
        specialties, opening_time, closing_time, open_days
    } = data;
    await conn.query(
        `INSERT INTO sucursales (
            user_id, name, description, address, city, state, zip_code, country,
            phone, email, whatsapp, website_url, image_url, latitude, longitude,
            specialties, opening_time, closing_time, open_days
         ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [userId, name, description, address, city, state, zip_code, country,
         phone, email, whatsapp, website_url, image_url, latitude, longitude,
         specialties, opening_time || '09:00:00', closing_time || '18:00:00', open_days || 'Lunes-Sábado']
    );
};

const update = async (storeId, userId, fields) => {
    const PROTECTED = new Set(['id', 'user_id', 'created_at']);
    const updates = Object.keys(fields).filter(k => !PROTECTED.has(k)).map(k => `${k} = ?`);
    const params = [...Object.entries(fields).filter(([k]) => !PROTECTED.has(k)).map(([, v]) => v), storeId, userId];
    await pool.query(`UPDATE sucursales SET ${updates.join(', ')} WHERE id = ? AND user_id = ?`, params);
};

const remove = async (id) => {
    await pool.query('DELETE FROM sucursales WHERE id = ?', [id]);
};

const updateStatus = async (id, status) => {
    await pool.query('UPDATE sucursales SET status = ? WHERE id = ?', [status, id]);
};

const ownsStore = async (storeId, userId) => {
    const [rows] = await pool.query('SELECT id FROM sucursales WHERE id = ? AND user_id = ?', [storeId, userId]);
    return rows.length > 0;
};

// ─── Products ──────────────────────────────────────────────────────────────────

const getProducts = async (storeId) => {
    const [rows] = await pool.query(
        `SELECT sp.* FROM store_products sp
         JOIN sucursales s ON sp.sucursal_id = s.id
         WHERE s.id = ? OR s.user_id = ?
         ORDER BY sp.created_at DESC`,
        [storeId, storeId]
    );
    return rows;
};

const insertProduct = async (data) => {
    const { sucursal_id, name, description, price, image_url, category, brand, sku, is_available } = data;
    const [result] = await pool.query(
        'INSERT INTO store_products (sucursal_id, name, description, price, image_url, category, brand, sku, is_available) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [sucursal_id, name, description, price, image_url, category, brand, sku, is_available ?? true]
    );
    return result.insertId;
};

const findProductWithStore = async (productId) => {
    const [rows] = await pool.query(
        'SELECT sp.sucursal_id, s.user_id FROM store_products sp JOIN sucursales s ON sp.sucursal_id = s.id WHERE sp.id = ?',
        [productId]
    );
    return rows[0] || null;
};

const updateProduct = async (productId, fields) => {
    const PROTECTED = new Set(['id', 'sucursal_id', 'created_at']);
    const updates = Object.keys(fields).filter(k => !PROTECTED.has(k)).map(k => `${k} = ?`);
    const params = [...Object.entries(fields).filter(([k]) => !PROTECTED.has(k)).map(([, v]) => v), productId];
    await pool.query(`UPDATE store_products SET ${updates.join(', ')} WHERE id = ?`, params);
};

const deleteProduct = async (id) => {
    await pool.query('DELETE FROM store_products WHERE id = ?', [id]);
};

const findProductForOrder = async (productId, conn) => {
    const [rows] = await conn.query(
        'SELECT sucursal_id, name, price FROM store_products WHERE id = ? AND is_available = TRUE',
        [productId]
    );
    return rows[0] || null;
};

// ─── Schedules ────────────────────────────────────────────────────────────────

const getSchedules = async (storeId) => {
    const [rows] = await pool.query('SELECT * FROM store_schedules WHERE sucursal_id = ?', [storeId]);
    return rows;
};

// ─── Reviews ──────────────────────────────────────────────────────────────────

const getReviews = async (storeId) => {
    const [rows] = await pool.query(
        `SELECT sr.*, up.names, up.surnames, up.profile_image_url
         FROM store_reviews sr
         JOIN user_profiles up ON sr.client_id = up.user_id
         WHERE sr.sucursal_id = ? ORDER BY sr.created_at DESC`,
        [storeId]
    );
    return rows;
};

const hasCompletedTransaction = async (clientId, storeId) => {
    const [orderRows] = await pool.query(
        `SELECT id FROM store_orders WHERE client_id = ? AND sucursal_id = ? AND status = 'delivered' LIMIT 1`,
        [clientId, storeId]
    );
    const [appRows] = await pool.query(
        `SELECT id FROM appointments WHERE client_id = ? AND store_id = ? AND status = 'completed' LIMIT 1`,
        [clientId, storeId]
    );
    return orderRows.length > 0 || appRows.length > 0;
};

const hasExistingReview = async (clientId, storeId) => {
    const [rows] = await pool.query(
        'SELECT id FROM store_reviews WHERE client_id = ? AND sucursal_id = ?',
        [clientId, storeId]
    );
    return rows.length > 0;
};

const insertReview = async (storeId, clientId, rating, comment) => {
    await pool.query(
        'INSERT INTO store_reviews (sucursal_id, client_id, rating, comment) VALUES (?, ?, ?, ?)',
        [storeId, clientId, rating, comment]
    );
};

const recalculateRating = async (storeId) => {
    await pool.query(
        `UPDATE sucursales SET
            rating = (SELECT AVG(rating) FROM store_reviews WHERE sucursal_id = ?),
            reviews_count = (SELECT COUNT(*) FROM store_reviews WHERE sucursal_id = ?)
         WHERE id = ?`,
        [storeId, storeId, storeId]
    );
};

// ─── Orders ────────────────────────────────────────────────────────────────────

const insertOrder = async (data, conn) => {
    const { clientId, sucursalId, productId, quantity, unitPrice, totalPrice, deliveryAddress, latitude, longitude } = data;
    const [result] = await conn.query(
        `INSERT INTO store_orders (client_id, sucursal_id, product_id, quantity, unit_price, total_price, status, delivery_address, latitude, longitude)
         VALUES (?, ?, ?, ?, ?, ?, 'pending', ?, ?, ?)`,
        [clientId, sucursalId, productId, quantity, unitPrice, totalPrice, deliveryAddress, latitude, longitude]
    );
    return result.insertId;
};

const insertOrderProduct = async (orderId, productId, quantity, unitPrice, conn) => {
    await conn.query(
        'INSERT INTO store_order_products (order_id, product_id, quantity, unit_price) VALUES (?, ?, ?, ?)',
        [orderId, productId, quantity, unitPrice]
    );
};

const findStoreOwner = async (sucursalId, conn) => {
    const [rows] = await conn.query('SELECT user_id FROM sucursales WHERE id = ?', [sucursalId]);
    return rows[0]?.user_id || null;
};

const findOrderById = async (id) => {
    const [rows] = await pool.query(
        `SELECT o.*, s.user_id as store_user_id, p.name as product_name
         FROM store_orders o
         JOIN sucursales s ON o.sucursal_id = s.id
         JOIN store_products p ON o.product_id = p.id
         WHERE o.id = ?`,
        [id]
    );
    return rows[0] || null;
};

const findOrderWithEmail = async (id) => {
    const [rows] = await pool.query(
        `SELECT o.*, u.email, p.name as product_name, s.user_id as store_user_id
         FROM store_orders o
         JOIN users u ON o.client_id = u.id
         JOIN store_products p ON o.product_id = p.id
         JOIN sucursales s ON o.sucursal_id = s.id
         WHERE o.id = ?`,
        [id]
    );
    return rows[0] || null;
};

const updateOrderPaymentWaiting = async (id, paymentMethod) => {
    await pool.query(
        'UPDATE store_orders SET payment_method = ?, payment_status = "waiting_confirmation" WHERE id = ?',
        [paymentMethod, id]
    );
};

const confirmOrderPayment = async (id) => {
    await pool.query(
        `UPDATE store_orders SET payment_status = 'paid', status = 'confirmed', payment_confirmed_at = NOW() WHERE id = ?`,
        [id]
    );
};

const confirmOrderPaymentCulqi = async (id, chargeId) => {
    await pool.query(
        `UPDATE store_orders
         SET payment_method = 'culqi', payment_status = 'paid', culqi_charge_id = ?,
             payment_confirmed_at = NOW(), status = 'confirmed'
         WHERE id = ?`,
        [chargeId, id]
    );
};

const findMyOrders = async (clientId) => {
    const [rows] = await pool.query(
        `SELECT o.*, p.name as product_name, p.image_url as product_image, s.name as branch_name, s.user_id as branch_user_id
         FROM store_orders o
         JOIN store_products p ON o.product_id = p.id
         JOIN sucursales s ON o.sucursal_id = s.id
         WHERE o.client_id = ? ORDER BY o.created_at DESC`,
        [clientId]
    );
    return rows;
};

const findStoreOrders = async (storeId) => {
    const [rows] = await pool.query(
        `SELECT o.*, p.name as product_name, up.names as client_names, up.surnames as client_surnames, up.phone as client_phone
         FROM store_orders o
         JOIN store_products p ON o.product_id = p.id
         JOIN user_profiles up ON o.client_id = up.user_id
         WHERE o.sucursal_id = ? ORDER BY o.created_at DESC`,
        [storeId]
    );
    return rows;
};

const updateOrderStatus = async (id, status, conn) => {
    await conn.query('UPDATE store_orders SET status = ? WHERE id = ?', [status, id]);
};

const findOrderForStatus = async (id, conn) => {
    const [rows] = await conn.query(
        `SELECT o.*, s.user_id as store_user_id, p.name as product_name
         FROM store_orders o
         JOIN sucursales s ON o.sucursal_id = s.id
         JOIN store_products p ON o.product_id = p.id
         WHERE o.id = ?`,
        [id]
    );
    return rows[0] || null;
};

const insertOrderChatMessage = async (senderId, receiverId, text, orderId) => {
    await pool.query(
        'INSERT INTO chat_messages (sender_id, receiver_id, message_text, message_type, order_id) VALUES (?, ?, ?, "order", ?)',
        [senderId, receiverId, text, orderId]
    );
};

const insertOrderChatMessageConn = async (conn, senderId, receiverId, text, orderId) => {
    await conn.query(
        'INSERT INTO chat_messages (sender_id, receiver_id, message_text, message_type, order_id) VALUES (?, ?, ?, "order", ?)',
        [senderId, receiverId, text, orderId]
    );
};

// ─── Store Appointments ────────────────────────────────────────────────────────

const findStoreAppointments = async (storeId) => {
    const [rows] = await pool.query(
        `SELECT a.*,
            up_c.names as client_names, up_c.surnames as client_surnames, up_c.phone as client_phone,
            up_t.names as tech_names, up_t.surnames as tech_surnames
         FROM sucursales_citas sc
         JOIN appointments a ON sc.cita_id = a.id
         JOIN user_profiles up_c ON a.client_id = up_c.user_id
         LEFT JOIN user_profiles up_t ON a.technician_id = up_t.user_id
         WHERE sc.sucursal_id = ?
         ORDER BY a.scheduled_date DESC, a.scheduled_time DESC`,
        [storeId]
    );
    return rows;
};

module.exports = {
    // Stores
    findAll, findById, findByUserId, findNearby, existsByUserId,
    create, update, remove, updateStatus, ownsStore,
    // Products
    getProducts, insertProduct, findProductWithStore, updateProduct, deleteProduct, findProductForOrder,
    // Schedules
    getSchedules,
    // Reviews
    getReviews, hasCompletedTransaction, hasExistingReview, insertReview, recalculateRating,
    // Orders
    insertOrder, insertOrderProduct, findStoreOwner, findOrderById, findOrderWithEmail,
    updateOrderPaymentWaiting, confirmOrderPayment, confirmOrderPaymentCulqi,
    findMyOrders, findStoreOrders, updateOrderStatus, findOrderForStatus,
    insertOrderChatMessage, insertOrderChatMessageConn,
    // Store appointments
    findStoreAppointments
};
