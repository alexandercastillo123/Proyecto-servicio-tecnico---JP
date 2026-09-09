const { pool } = require('../config/database');
const Respuesta = require('../utils/Respuesta');
const asyncHandler = require('../utils/asyncHandler');
const notificationService = require('../services/notification.service');
const { getIO } = require('../config/socketManager');
const AppError = require('../utils/AppError');

/**
 * GET /api/messages/conversations
 */
const getConversations = asyncHandler(async (req, res) => {
    const userId = req.user.id;

    const [rows] = await pool.query(
        `SELECT DISTINCT
            CASE WHEN sender_id = ? THEN receiver_id ELSE sender_id END as other_user_id,
            u.email, u.username, u.role as other_user_role,
            up.names, up.surnames, up.company_name, up.profile_image_url,
            MAX(cm.created_at) as last_message_time,
            (SELECT message_text FROM chat_messages
             WHERE (sender_id = other_user_id AND receiver_id = ?)
                OR (sender_id = ? AND receiver_id = other_user_id)
             ORDER BY created_at DESC LIMIT 1) as last_message_text,
            COUNT(CASE WHEN cm.receiver_id = ? AND cm.is_read = FALSE THEN 1 END) as unread_count
        FROM chat_messages cm
        INNER JOIN users u ON (
            CASE WHEN cm.sender_id = ? THEN cm.receiver_id ELSE cm.sender_id END = u.id
        )
        LEFT JOIN user_profiles up ON u.id = up.user_id
        WHERE sender_id = ? OR receiver_id = ?
        GROUP BY other_user_id, u.email, u.username, u.role, up.names, up.surnames, up.company_name, up.profile_image_url
        ORDER BY last_message_time DESC`,
        [userId, userId, userId, userId, userId, userId, userId]
    );

    res.json(Respuesta.ok(rows, 'Éxito'));
});

/**
 * GET /api/messages/:otherUserId
 */
const getMessages = asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const { otherUserId } = req.params;

    const [rows] = await pool.query(
        `SELECT
            cm.id, cm.sender_id, cm.receiver_id, cm.message_text,
            cm.message_type, cm.offer_price, cm.offer_status, cm.cancelled_by,
            cm.created_at, cm.is_read, cm.deleted_at, cm.is_edited,
            cm.appointment_id, cm.order_id,
            a.status as appointment_status,
            a.price as appointment_price,
            a.payment_method as appointment_payment_method,
            a.payment_status as appointment_payment_status,
            a.payment_confirmed_at as appointment_payment_confirmed_at,
            a.cancelled_by as app_cancelled_by,
            (SELECT role FROM users WHERE id = a.cancelled_by) as canceller_role,
            o.status as order_status,
            o.payment_status as order_payment_status,
            o.payment_method as order_payment_method,
            o.total_price as order_price,
            o.delivery_address as order_address,
            o.latitude as order_lat, o.longitude as order_lng,
            p.name as order_product_name
        FROM chat_messages cm
        LEFT JOIN appointments a ON cm.appointment_id = a.id
        LEFT JOIN store_orders o ON cm.order_id = o.id
        LEFT JOIN store_products p ON o.product_id = p.id
        WHERE (cm.sender_id = ? AND cm.receiver_id = ?)
           OR (cm.sender_id = ? AND cm.receiver_id = ?)
        ORDER BY cm.created_at ASC`,
        [userId, otherUserId, otherUserId, userId]
    );

    // Mark as read
    await pool.query(
        'UPDATE chat_messages SET is_read = TRUE WHERE receiver_id = ? AND sender_id = ? AND is_read = FALSE',
        [userId, otherUserId]
    );

    res.json(Respuesta.ok(rows, 'Éxito'));
});

/**
 * POST /api/messages/send
 */
const sendMessage = asyncHandler(async (req, res) => {
    const senderId = req.user.id;
    const { receiverId, messageText, appointmentId, messageType = 'text' } = req.body;

    const [receiver] = await pool.query('SELECT id FROM users WHERE id = ?', [receiverId]);
    if (receiver.length === 0) {
        throw new AppError('No logramos encontrar al destinatario del mensaje.', 404);
    }

    const [result] = await pool.query(
        'INSERT INTO chat_messages (sender_id, receiver_id, message_text, message_type, appointment_id) VALUES (?, ?, ?, ?, ?)',
        [senderId, receiverId, messageText, messageType, appointmentId || null]
    );
    const messageId = result.insertId;

    // Real-time emit
    try {
        getIO().to(`user_${receiverId}`).emit('receive_message', {
            id: messageId, sender_id: senderId, receiver_id: receiverId,
            message_text: messageText, message_type: messageType,
            appointment_id: appointmentId, created_at: new Date().toISOString(), is_read: false
        });
    } catch (_) { /* Socket.IO not yet initialized */ }

    // Push notification
    const [senderProfile] = await pool.query('SELECT names, company_name FROM user_profiles WHERE user_id = ?', [senderId]);
    const senderName = senderProfile[0]?.company_name || senderProfile[0]?.names || 'Un usuario';
    await notificationService.createNotification(
        receiverId, `Mensaje de ${senderName}`, messageText, 'chat',
        { senderId: senderId.toString(), messageType: 'text' }
    );

    res.status(201).json(Respuesta.ok({ messageId }, 'Mensaje enviado correctamente.', 201));
});

/**
 * POST /api/messages/offer
 */
const sendOffer = asyncHandler(async (req, res) => {
    const senderId = req.user.id;
    const { receiverId, offerPrice, messageText, appointmentId } = req.body;

    const [userRows] = await pool.query('SELECT role FROM users WHERE id = ?', [senderId]);
    if (userRows.length === 0 || userRows[0].role !== 'tech') {
        throw new AppError('Solo los prestadores de servicio autorizados pueden enviar propuestas.', 403);
    }

    const [result] = await pool.query(
        `INSERT INTO chat_messages (sender_id, receiver_id, message_text, message_type, offer_price, offer_status, appointment_id)
         VALUES (?, ?, ?, 'offer', ?, 'pending', ?)`,
        [senderId, receiverId, messageText || `Oferta de servicio: S/.${offerPrice}`, offerPrice, appointmentId || null]
    );

    const offerId = result.insertId;

    // Real-time emit to receiver and sender
    try {
        const offerPayload = {
            id: offerId,
            sender_id: senderId,
            receiver_id: receiverId,
            message_text: messageText || `Oferta de servicio: S/.${offerPrice}`,
            message_type: 'offer',
            offer_price: parseFloat(offerPrice),
            offer_status: 'pending',
            appointment_id: appointmentId || null,
            created_at: new Date().toISOString(),
            is_read: false
        };
        getIO().to(`user_${receiverId}`).emit('receive_message', offerPayload);
        getIO().to(`user_${senderId}`).emit('receive_message', offerPayload);
    } catch (_) { /* Socket.IO not yet initialized */ }

    const [techProfile] = await pool.query('SELECT names, company_name FROM user_profiles WHERE user_id = ?', [senderId]);
    const techName = techProfile[0]?.company_name || techProfile[0]?.names || 'Un técnico';

    await notificationService.createNotification(
        receiverId, 'Propuesta de Servicio Recibida',
        `${techName} te ha enviado una oferta por S/.${offerPrice}`,
        'offer', { senderId: senderId.toString(), offerId: offerId.toString(), price: offerPrice.toString() }
    );

    res.status(201).json(Respuesta.ok({ offerId }, '¡Tu propuesta ha sido enviada al cliente!', 201));
});

/**
 * PUT /api/messages/offers/:id/accept
 */
const acceptOffer = asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const { id } = req.params;

    const [rows] = await pool.query(
        'SELECT sender_id, receiver_id, offer_status FROM chat_messages WHERE id = ? AND message_type = "offer"',
        [id]
    );
    if (rows.length === 0) throw new AppError('No se pudo localizar la propuesta solicitada.', 404);
    if (rows[0].receiver_id !== userId) throw new AppError('No autorizado para aceptar esta oferta.', 403);
    if (rows[0].offer_status !== 'pending') throw new AppError('Esta propuesta ya ha sido procesada o ha expirado.', 400);

    await pool.query('UPDATE chat_messages SET offer_status = "accepted" WHERE id = ?', [id]);

    try {
        const updatePayload = { offerId: parseInt(id), offerStatus: 'accepted' };
        getIO().to(`user_${rows[0].sender_id}`).emit('offer_updated', updatePayload);
        getIO().to(`user_${userId}`).emit('offer_updated', updatePayload);
    } catch (_) {}

    res.json(Respuesta.ok(null, '¡Has aceptado la propuesta correctamente!'));
});

/**
 * PUT /api/messages/offers/:id/reject
 */
const rejectOffer = asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const { id } = req.params;

    const [rows] = await pool.query(
        'SELECT sender_id, receiver_id FROM chat_messages WHERE id = ? AND receiver_id = ? AND message_type = "offer"',
        [id, userId]
    );
    if (rows.length === 0) throw new AppError('Oferta no encontrada o no autorizada.', 404);

    await pool.query(
        'UPDATE chat_messages SET offer_status = "rejected" WHERE id = ? AND receiver_id = ? AND message_type = "offer"',
        [id, userId]
    );

    try {
        const updatePayload = { offerId: parseInt(id), offerStatus: 'rejected' };
        getIO().to(`user_${rows[0].sender_id}`).emit('offer_updated', updatePayload);
        getIO().to(`user_${userId}`).emit('offer_updated', updatePayload);
    } catch (_) {}

    res.json(Respuesta.ok(null, 'Propuesta rechazada.'));
});

/**
 * PUT /api/messages/offers/:id/cancel
 */
const cancelOffer = asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const { id } = req.params;

    const [rows] = await pool.query(
        'SELECT sender_id, receiver_id FROM chat_messages WHERE id = ? AND sender_id = ? AND message_type = "offer"',
        [id, userId]
    );
    if (rows.length === 0) throw new AppError('Oferta no encontrada o no autorizada.', 404);

    await pool.query(
        'UPDATE chat_messages SET offer_status = "cancelled", cancelled_by = ? WHERE id = ? AND sender_id = ? AND message_type = "offer"',
        [userId, id, userId]
    );

    try {
        const updatePayload = { offerId: parseInt(id), offerStatus: 'cancelled' };
        getIO().to(`user_${rows[0].receiver_id}`).emit('offer_updated', updatePayload);
        getIO().to(`user_${userId}`).emit('offer_updated', updatePayload);
    } catch (_) {}

    res.json(Respuesta.ok(null, 'Propuesta cancelada correctamente.'));
});

/**
 * PUT /api/messages/:id/read
 */
const markAsRead = asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const { id } = req.params;

    const [result] = await pool.query(
        'UPDATE chat_messages SET is_read = TRUE WHERE id = ? AND receiver_id = ?',
        [id, userId]
    );
    if (result.affectedRows === 0) throw new AppError('Mensaje no encontrado o no autorizado.', 404);
    res.json(Respuesta.ok(null, 'Mensaje marcado como leído.'));
});

/**
 * PUT /api/messages/:id
 */
const updateMessage = asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const { id } = req.params;
    const { messageText } = req.body;

    const [result] = await pool.query(
        'UPDATE chat_messages SET message_text = ?, is_edited = TRUE WHERE id = ? AND sender_id = ? AND message_type = "text"',
        [messageText, id, userId]
    );
    if (result.affectedRows === 0) throw new AppError('Mensaje no encontrado o no autorizado para editar.', 404);
    res.json(Respuesta.ok(null, 'Mensaje editado con éxito.'));
});

/**
 * DELETE /api/messages/:id
 */
const deleteMessage = asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const { id } = req.params;
    const { deleteForEveryone = false } = req.body;

    const [rows] = await pool.query('SELECT sender_id FROM chat_messages WHERE id = ?', [id]);
    if (rows.length === 0) throw new AppError('Mensaje no encontrado.', 404);

    if (deleteForEveryone) {
        if (rows[0].sender_id !== userId) throw new AppError('No puedes eliminar mensajes de otros para todos.', 403);
        await pool.query('UPDATE chat_messages SET message_text = "🚫 Mensaje eliminado", deleted_at = NOW() WHERE id = ?', [id]);
    } else {
        await pool.query('DELETE FROM chat_messages WHERE id = ? AND (sender_id = ? OR receiver_id = ?)', [id, userId, userId]);
    }

    res.json(Respuesta.ok(null, 'El mensaje ha sido eliminado.'));
});

module.exports = {
    getConversations, getMessages, sendMessage, sendOffer,
    acceptOffer, rejectOffer, cancelOffer, markAsRead, updateMessage, deleteMessage
};
