const db = require('../config/database');
const Respuesta = require('../utils/Respuesta');

/**
 * Get user conversations list
 */
const getConversations = async (req, res) => {
    let respuesta = new Respuesta();
    try {
        const userId = req.user.id;

        const dbRes = await db.listar(
            `SELECT DISTINCT
        CASE 
          WHEN sender_id = ? THEN receiver_id
          ELSE sender_id
        END as other_user_id,
        u.email,
        up.names, up.surnames, up.company_name, up.profile_image_url,
        MAX(cm.created_at) as last_message_time,
        COUNT(CASE WHEN cm.receiver_id = ? AND cm.is_read = FALSE THEN 1 END) as unread_count
      FROM chat_messages cm
      INNER JOIN users u ON (
        CASE 
          WHEN cm.sender_id = ? THEN cm.receiver_id
          ELSE cm.sender_id
        END = u.id
      )
      LEFT JOIN user_profiles up ON u.id = up.user_id
      WHERE sender_id = ? OR receiver_id = ?
      GROUP BY other_user_id, u.email, up.names, up.surnames, up.company_name, up.profile_image_url
      ORDER BY last_message_time DESC`,
            true,
            [userId, userId, userId, userId, userId]
        );

        respuesta.exito = true;
        respuesta.estado = 200;
        respuesta.mensaje = "exito";
        respuesta.resultado = dbRes.resultado || [];

        res.json(respuesta);

    } catch (error) {
        console.error('Get conversations error:', error);
        respuesta.mensaje = 'Failed to retrieve conversations: ' + error.message;
        res.status(500).json(respuesta);
    }
};

/**
 * Get messages with specific user
 */
const getMessages = async (req, res) => {
    let respuesta = new Respuesta();
    try {
        const userId = req.user.id;
        const { otherUserId } = req.params;

        const dbRes = await db.listar(
            `SELECT 
        cm.id, cm.sender_id, cm.receiver_id, cm.message_text,
        cm.message_type, cm.offer_price, cm.offer_status,
        cm.created_at, cm.is_read, cm.appointment_id
      FROM chat_messages cm
      WHERE (sender_id = ? AND receiver_id = ?)
         OR (sender_id = ? AND receiver_id = ?)
      ORDER BY created_at ASC`,
            true,
            [userId, otherUserId, otherUserId, userId]
        );

        // Mark messages as read
        await db.ejecutar(
            `UPDATE chat_messages SET is_read = TRUE
       WHERE receiver_id = ? AND sender_id = ? AND is_read = FALSE`,
            [userId, otherUserId]
        );

        respuesta.exito = true;
        respuesta.estado = 200;
        respuesta.mensaje = "exito";
        respuesta.resultado = dbRes.resultado || [];

        res.json(respuesta);

    } catch (error) {
        console.error('Get messages error:', error);
        respuesta.mensaje = 'Failed to retrieve messages: ' + error.message;
        res.status(500).json(respuesta);
    }
};

/**
 * Send text message
 */
const sendMessage = async (req, res) => {
    let respuesta = new Respuesta();
    try {
        const senderId = req.user.id;
        const { receiverId, messageText, appointmentId, messageType = 'text' } = req.body;

        // Verify receiver exists
        const recRes = await db.listar('SELECT id FROM users WHERE id = ?', false, [receiverId]);

        if (!recRes.exito || !recRes.resultado) {
            respuesta.estado = 404;
            respuesta.mensaje = 'Receiver not found';
            return res.status(404).json(respuesta);
        }

        const dbRes = await db.ejecutar(
            `INSERT INTO chat_messages (sender_id, receiver_id, message_text, message_type, appointment_id)
       VALUES (?, ?, ?, ?, ?)`,
            [senderId, receiverId, messageText, messageType, appointmentId || null]
        );

        if (!dbRes.exito) {
            return res.status(500).json(dbRes);
        }

        respuesta.exito = true;
        respuesta.estado = 201;
        respuesta.mensaje = 'Message sent successfully';
        respuesta.resultado = {
            messageId: dbRes.resultado.insertId
        };

        res.status(201).json(respuesta);

    } catch (error) {
        console.error('Send message error:', error);
        respuesta.mensaje = 'Failed to send message: ' + error.message;
        res.status(500).json(respuesta);
    }
};

/**
 * Send service offer
 */
const sendOffer = async (req, res) => {
    let respuesta = new Respuesta();
    try {
        const senderId = req.user.id;
        const { receiverId, offerPrice, messageText, appointmentId } = req.body;

        // Verify sender is a technician
        const userRes = await db.listar(
            'SELECT role FROM users WHERE id = ?',
            false,
            [senderId]
        );

        if (!userRes.exito || !userRes.resultado || userRes.resultado.role !== 'tech') {
            respuesta.estado = 403;
            respuesta.mensaje = 'Only technicians can send offers';
            return res.status(403).json(respuesta);
        }

        const dbRes = await db.ejecutar(
            `INSERT INTO chat_messages (
        sender_id, receiver_id, message_text, message_type,
        offer_price, offer_status, appointment_id
      ) VALUES (?, ?, ?, 'offer', ?, 'pending', ?)`,
            [senderId, receiverId, messageText || `Oferta de servicio: S/.${offerPrice}`, offerPrice, appointmentId || null]
        );

        if (!dbRes.exito) {
            return res.status(500).json(dbRes);
        }

        respuesta.exito = true;
        respuesta.estado = 201;
        respuesta.mensaje = 'Offer sent successfully';
        respuesta.resultado = {
            offerId: dbRes.resultado.insertId
        };

        res.status(201).json(respuesta);

    } catch (error) {
        console.error('Send offer error:', error);
        respuesta.mensaje = 'Failed to send offer: ' + error.message;
        res.status(500).json(respuesta);
    }
};

/**
 * Accept offer
 */
const acceptOffer = async (req, res) => {
    let respuesta = new Respuesta();
    try {
        const userId = req.user.id;
        const { id } = req.params;

        // Verify user is receiver
        const offerRes = await db.listar(
            'SELECT receiver_id, offer_status FROM chat_messages WHERE id = ? AND message_type = "offer"',
            false,
            [id]
        );

        if (!offerRes.exito || !offerRes.resultado) {
            respuesta.estado = 404;
            respuesta.mensaje = 'Offer not found';
            return res.status(404).json(respuesta);
        }

        if (offerRes.resultado.receiver_id !== userId) {
            respuesta.estado = 403;
            respuesta.mensaje = 'Unauthorized to accept this offer';
            return res.status(403).json(respuesta);
        }

        if (offerRes.resultado.offer_status !== 'pending') {
            respuesta.estado = 400;
            respuesta.mensaje = 'Offer is no longer pending';
            return res.status(400).json(respuesta);
        }

        await db.ejecutar(
            'UPDATE chat_messages SET offer_status = "accepted" WHERE id = ?',
            [id]
        );

        respuesta.exito = true;
        respuesta.estado = 200;
        respuesta.mensaje = 'Offer accepted successfully';
        res.json(respuesta);

    } catch (error) {
        console.error('Accept offer error:', error);
        respuesta.mensaje = 'Failed to accept offer: ' + error.message;
        res.status(500).json(respuesta);
    }
};

/**
 * Reject offer
 */
const rejectOffer = async (req, res) => {
    let respuesta = new Respuesta();
    try {
        const userId = req.user.id;
        const { id } = req.params;

        const dbRes = await db.ejecutar(
            'UPDATE chat_messages SET offer_status = "rejected" WHERE id = ? AND receiver_id = ? AND message_type = "offer"',
            [id, userId]
        );

        if (!dbRes.exito || dbRes.resultado.affectedRows === 0) {
            respuesta.estado = 404;
            respuesta.mensaje = 'Offer not found or unauthorized';
            return res.status(404).json(respuesta);
        }

        respuesta.exito = true;
        respuesta.estado = 200;
        respuesta.mensaje = 'Offer rejected successfully';
        res.json(respuesta);

    } catch (error) {
        console.error('Reject offer error:', error);
        respuesta.mensaje = 'Failed to reject offer: ' + error.message;
        res.status(500).json(respuesta);
    }
};

/**
 * Cancel offer (sender only)
 */
const cancelOffer = async (req, res) => {
    let respuesta = new Respuesta();
    try {
        const userId = req.user.id;
        const { id } = req.params;

        const dbRes = await db.ejecutar(
            'UPDATE chat_messages SET offer_status = "cancelled" WHERE id = ? AND sender_id = ? AND message_type = "offer"',
            [id, userId]
        );

        if (!dbRes.exito || dbRes.resultado.affectedRows === 0) {
            respuesta.estado = 404;
            respuesta.mensaje = 'Offer not found or unauthorized';
            return res.status(404).json(respuesta);
        }

        respuesta.exito = true;
        respuesta.estado = 200;
        respuesta.mensaje = 'Offer cancelled successfully';
        res.json(respuesta);

    } catch (error) {
        console.error('Cancel offer error:', error);
        respuesta.mensaje = 'Failed to cancel offer: ' + error.message;
        res.status(500).json(respuesta);
    }
};

/**
 * Mark message as read
 */
const markAsRead = async (req, res) => {
    let respuesta = new Respuesta();
    try {
        const userId = req.user.id;
        const { id } = req.params;

        const dbRes = await db.ejecutar(
            'UPDATE chat_messages SET is_read = TRUE WHERE id = ? AND receiver_id = ?',
            [id, userId]
        );

        if (!dbRes.exito || dbRes.resultado.affectedRows === 0) {
            respuesta.estado = 404;
            respuesta.mensaje = 'Message not found or unauthorized';
            return res.status(404).json(respuesta);
        }

        respuesta.exito = true;
        respuesta.estado = 200;
        respuesta.mensaje = 'Message marked as read';
        res.json(respuesta);

    } catch (error) {
        console.error('Mark as read error:', error);
        respuesta.mensaje = 'Failed to mark message as read: ' + error.message;
        res.status(500).json(respuesta);
    }
};

module.exports = {
    getConversations,
    getMessages,
    sendMessage,
    sendOffer,
    acceptOffer,
    rejectOffer,
    cancelOffer,
    markAsRead
};
