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
        u.email, u.username, u.role as other_user_role,
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
      GROUP BY other_user_id, u.email, u.username, u.role, up.names, up.surnames, up.company_name, up.profile_image_url
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
        respuesta.mensaje = 'Error al obtener las conversaciones: ' + error.message;
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
                cm.message_type, cm.offer_price, cm.offer_status, cm.cancelled_by,
                cm.created_at, cm.is_read,
                cm.appointment_id, cm.order_id,
                a.status as appointment_status,
                a.price as appointment_price,
                a.payment_method as appointment_payment_method,
                a.payment_status as appointment_payment_status,
                a.payment_confirmed_at as appointment_payment_confirmed_at,
                a.cancelled_by as app_cancelled_by,
                (SELECT role FROM users WHERE id = a.cancelled_by) as canceller_role,
                o.status as order_status,
                o.delivery_address as order_address,
                o.latitude as order_lat,
                o.longitude as order_lng,
                p.name as order_product_name
            FROM chat_messages cm
            LEFT JOIN appointments a ON cm.appointment_id = a.id
            LEFT JOIN store_orders o ON cm.order_id = o.id
            LEFT JOIN store_products p ON o.product_id = p.id
            WHERE (cm.sender_id = ? AND cm.receiver_id = ?)
               OR (cm.sender_id = ? AND cm.receiver_id = ?)
            ORDER BY cm.created_at ASC`,
            true,
            [userId, otherUserId, otherUserId, userId]
        );

        if (!dbRes.exito) {
            throw new Error(dbRes.mensaje);
        }

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
        respuesta.mensaje = 'Error al obtener los mensajes: ' + error.message;
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
            respuesta.mensaje = 'Destinatario no encontrado';
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
        respuesta.mensaje = 'Mensaje enviado con éxito';
        respuesta.resultado = {
            messageId: dbRes.resultado.insertId
        };

        res.status(201).json(respuesta);

    } catch (error) {
        console.error('Send message error:', error);
        respuesta.mensaje = 'Error al enviar el mensaje: ' + error.message;
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
            respuesta.mensaje = 'Solo los técnicos pueden enviar ofertas';
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
        respuesta.mensaje = 'Oferta enviada con éxito';
        respuesta.resultado = {
            offerId: dbRes.resultado.insertId
        };

        res.status(201).json(respuesta);

    } catch (error) {
        console.error('Send offer error:', error);
        respuesta.mensaje = 'Error al enviar la oferta: ' + error.message;
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
            respuesta.mensaje = 'Oferta no encontrada';
            return res.status(404).json(respuesta);
        }

        if (offerRes.resultado.receiver_id !== userId) {
            respuesta.estado = 403;
            respuesta.mensaje = 'No autorizado para aceptar esta oferta';
            return res.status(403).json(respuesta);
        }

        if (offerRes.resultado.offer_status !== 'pending') {
            respuesta.estado = 400;
            respuesta.mensaje = 'La oferta ya no está pendiente';
            return res.status(400).json(respuesta);
        }

        await db.ejecutar(
            'UPDATE chat_messages SET offer_status = "accepted" WHERE id = ?',
            [id]
        );

        respuesta.exito = true;
        respuesta.estado = 200;
        respuesta.mensaje = 'Oferta aceptada con éxito';
        res.json(respuesta);

    } catch (error) {
        console.error('Accept offer error:', error);
        respuesta.mensaje = 'Error al aceptar la oferta: ' + error.message;
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
            respuesta.mensaje = 'Oferta no encontrada o no autorizada';
            return res.status(404).json(respuesta);
        }

        respuesta.exito = true;
        respuesta.estado = 200;
        respuesta.mensaje = 'Oferta rechazada con éxito';
        res.json(respuesta);

    } catch (error) {
        console.error('Reject offer error:', error);
        respuesta.mensaje = 'Error al rechazar la oferta: ' + error.message;
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
            'UPDATE chat_messages SET offer_status = "cancelled", cancelled_by = ? WHERE id = ? AND sender_id = ? AND message_type = "offer"',
            [userId, id, userId]
        );

        if (!dbRes.exito || dbRes.resultado.affectedRows === 0) {
            respuesta.estado = 404;
            respuesta.mensaje = 'Oferta no encontrada o no autorizada';
            return res.status(404).json(respuesta);
        }

        respuesta.exito = true;
        respuesta.estado = 200;
        respuesta.mensaje = 'Oferta cancelada con éxito';
        res.json(respuesta);

    } catch (error) {
        console.error('Cancel offer error:', error);
        respuesta.mensaje = 'Error al cancelar la oferta: ' + error.message;
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
            respuesta.mensaje = 'Mensaje no encontrado o no autorizado';
            return res.status(404).json(respuesta);
        }

        respuesta.exito = true;
        respuesta.estado = 200;
        respuesta.mensaje = 'Mensaje marcado como leído';
        res.json(respuesta);

    } catch (error) {
        console.error('Mark as read error:', error);
        respuesta.mensaje = 'Error al marcar como leído: ' + error.message;
        res.status(500).json(respuesta);
    }
};

/**
 * Update message text
 */
const updateMessage = async (req, res) => {
    let respuesta = new Respuesta();
    try {
        const userId = req.user.id;
        const { id } = req.params;
        const { messageText } = req.body;

        const dbRes = await db.ejecutar(
            'UPDATE chat_messages SET message_text = ? WHERE id = ? AND sender_id = ? AND message_type = "text"',
            [messageText, id, userId]
        );

        if (!dbRes.exito || dbRes.resultado.affectedRows === 0) {
            respuesta.estado = 404;
            respuesta.mensaje = 'Mensaje no encontrado o no autorizado para editar';
            return res.status(404).json(respuesta);
        }

        respuesta.exito = true;
        respuesta.mensaje = 'Mensaje actualizado';
        res.json(respuesta);
    } catch (error) {
        res.status(500).json({ mensaje: error.message });
    }
};

/**
 * Delete message (Delete for everyone if requested)
 */
const deleteMessage = async (req, res) => {
    let respuesta = new Respuesta();
    try {
        const userId = req.user.id;
        const { id } = req.params;
        const { deleteForEveryone = false } = req.body;

        // Fetch message details
        const msgRes = await db.listar('SELECT sender_id FROM chat_messages WHERE id = ?', false, [id]);
        
        if (!msgRes.exito || !msgRes.resultado) {
            return res.status(404).json({ mensaje: 'Mensaje no encontrado' });
        }

        const msg = msgRes.resultado;

        if (deleteForEveryone) {
            if (msg.sender_id !== userId) {
                return res.status(403).json({ mensaje: 'No puedes eliminar mensajes de otros para todos' });
            }

            await db.ejecutar('UPDATE chat_messages SET message_text = "🚫 Este mensaje fue eliminado" WHERE id = ?', [id]);
        } else {
            // Delete for me
            await db.ejecutar('DELETE FROM chat_messages WHERE id = ? AND (sender_id = ? OR receiver_id = ?)', [id, userId, userId]);
        }

        respuesta.exito = true;
        respuesta.mensaje = 'Mensaje eliminado';
        res.json(respuesta);
    } catch (error) {
        res.status(500).json({ mensaje: error.message });
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
    markAsRead,
    updateMessage,
    deleteMessage
};
