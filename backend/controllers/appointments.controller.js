const db = require('../config/database');
const Respuesta = require('../utils/Respuesta');
const notificationService = require('../services/notification.service');

/**
 * Create new appointment
 */
const createAppointment = async (req, res) => {
    let respuesta = new Respuesta();
    try {
        const clientId = req.user.id;
        const { technicianId, scheduledDate, scheduledTime, description, serviceLat, serviceLng, serviceAddress, serviceType } = req.body;

        // Verify technician or store exists
        const destRes = await db.listar(
            'SELECT id, role FROM users WHERE id = ? AND role IN ("tech", "store")',
            false,
            [technicianId]
        );

        if (!destRes.exito || !destRes.resultado) {
            respuesta.estado = 404;
            respuesta.mensaje = 'El técnico o sucursal seleccionada no está disponible en este momento.';
            return res.status(404).json(respuesta);
        }

        const destRole = destRes.resultado.role;

        // Check for existing active appointment (ignoring expired ones)
        const activeAppRes = await db.listar(
            `SELECT id FROM appointments 
             WHERE client_id = ? AND technician_id = ? 
             AND status IN ('pending', 'confirmed')
             AND (scheduled_date > CURDATE() OR (scheduled_date = CURDATE() AND scheduled_time > CURTIME()))`,
            false,
            [clientId, technicianId]
        );

        if (activeAppRes.resultado) {
            respuesta.estado = 400;
            respuesta.mensaje = 'Ya tienes una cita activa programada con este técnico o sucursal.';
            return res.status(400).json(respuesta);
        }

        // Create appointment
        const dbRes = await db.ejecutar(
            `INSERT INTO appointments (client_id, technician_id, scheduled_date, scheduled_time, description, status, service_lat, service_lng, service_address, service_type)
             VALUES (?, ?, ?, ?, ?, 'pending', ?, ?, ?, ?)`,
            [clientId, technicianId, scheduledDate, scheduledTime, description, serviceLat || null, serviceLng || null, serviceAddress || null, serviceType || 'local']
        );

        if (!dbRes.exito) {
            return res.status(500).json(dbRes);
        }

        const appointmentId = dbRes.resultado.insertId;

        // --- PARITY FIX: Insert chat message for the appointment ---
        const chatMsg = `📅 *Nueva Cita Agendada*
Servicio: ${serviceType === 'domicilio' || serviceType === 'home' ? 'A Domicilio' : 'En Local'}
Fecha: ${scheduledDate}
Hora: ${scheduledTime}
Descripción: ${description || 'Sin descripción'}`;

        await db.ejecutar(
            'INSERT INTO chat_messages (sender_id, receiver_id, message_text, message_type, appointment_id) VALUES (?, ?, ?, "appointment", ?)',
            [clientId, technicianId, chatMsg, appointmentId]
        );
        // -----------------------------------------------------------

        // If it's a store, link it in sucursales_citas
        if (destRole === 'store') {
            const storeRes = await db.listar('SELECT id FROM sucursales WHERE user_id = ?', false, [technicianId]);
            if (storeRes.resultado) {
                await db.ejecutar(
                    'INSERT INTO sucursales_citas (sucursal_id, cita_id) VALUES (?, ?)',
                    [storeRes.resultado.id, appointmentId]
                );
            }
        }

        // Notificar al destino (Técnico o Sucursal)
        await notificationService.createNotification(
            technicianId,
            'Nueva Cita Recibida',
            `Tienes una nueva solicitud de servicio para el ${scheduledDate} a las ${scheduledTime}`,
            'appointment',
            { appointmentId: appointmentId.toString(), type: 'new_appointment' }
        );

        respuesta.exito = true;
        respuesta.estado = 201;
        respuesta.mensaje = '¡Tu cita ha sido agendada con éxito!';
        respuesta.resultado = { appointmentId };

        res.status(201).json(respuesta);

    } catch (error) {
        console.error('Create appointment error:', error);
        respuesta.mensaje = 'Error al crear la cita: ' + error.message;
        res.status(500).json(respuesta);
    }
};

/**
 * Get user appointments (client or technician view)
 */
const getAppointments = async (req, res) => {
    let respuesta = new Respuesta();
    try {
        const userId = req.user.id;
        const { status } = req.query;

        // Auto-expirar citas pasadas que sigan pendientes o confirmadas
        await db.ejecutar(
            `UPDATE appointments 
             SET status = 'expired' 
             WHERE status IN ('pending', 'confirmed') 
             AND (scheduled_date < CURDATE() OR (scheduled_date = CURDATE() AND scheduled_time < CURTIME()))`,
            []
        );

        let query = `
      SELECT 
        a.id, a.scheduled_date, a.scheduled_time, a.description, a.status, a.created_at,
        a.price, a.payment_method, a.payment_status, a.payment_confirmed_at, a.service_type,
        client.id as client_id, client.username as client_username, client_profile.names as client_names, 
        client_profile.surnames as client_surnames, client_profile.phone as client_phone,
        tech.id as technician_id, tech_profile.names as tech_names,
        tech_profile.surnames as tech_surnames, tech_profile.company_name as tech_company,
        tech_profile.phone as tech_phone, tech_profile.address as tech_address
      FROM appointments a
      INNER JOIN users client ON a.client_id = client.id
      INNER JOIN user_profiles client_profile ON client.id = client_profile.user_id
      INNER JOIN users tech ON a.technician_id = tech.id
      INNER JOIN user_profiles tech_profile ON tech.id = tech_profile.user_id
      WHERE (a.client_id = ? OR a.technician_id = ?)
    `;

        const params = [userId, userId];

        if (status) {
            query += ' AND a.status = ?';
            params.push(status);
        }

        query += ' ORDER BY a.scheduled_date DESC, a.scheduled_time DESC';

        const dbRes = await db.listar(query, true, params);

        respuesta.exito = true;
        respuesta.estado = 200;
        respuesta.mensaje = "exito";
        respuesta.resultado = dbRes.resultado || [];

        res.json(respuesta);

    } catch (error) {
        console.error('Get appointments error:', error);
        respuesta.mensaje = 'Error al obtener las citas: ' + error.message;
        res.status(500).json(respuesta);
    }
};

/**
 * Get specific appointment details
 */
const getAppointmentById = async (req, res) => {
    let respuesta = new Respuesta();
    try {
        const { id } = req.params;
        const userId = req.user.id;

        const dbRes = await db.listar(
            `SELECT 
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
      WHERE a.id = ? AND (a.client_id = ? OR a.technician_id = ?)`,
            false,
            [id, userId, userId]
        );

        if (!dbRes.exito || !dbRes.resultado) {
            respuesta.estado = 404;
            respuesta.mensaje = 'No pudimos encontrar los detalles de la cita solicitada.';
            return res.status(404).json(respuesta);
        }

        respuesta.exito = true;
        respuesta.estado = 200;
        respuesta.mensaje = "exito";
        respuesta.resultado = dbRes.resultado;

        res.json(respuesta);

    } catch (error) {
        console.error('Get appointment by ID error:', error);
        respuesta.mensaje = 'Error al obtener la cita: ' + error.message;
        res.status(500).json(respuesta);
    }
};

/**
 * Update appointment status (State Machine logic)
 */
const updateAppointmentStatus = async (req, res) => {
    let respuesta = new Respuesta();
    try {
        const { id } = req.params;
        const userId = req.user.id;
        const userRole = req.user.role;
        const { status: nextStatus } = req.body;

        // Verify appointment existence and current state
        const appRes = await db.listar(
            'SELECT client_id, technician_id, status, service_type FROM appointments WHERE id = ?',
            false,
            [id]
        );

        if (!appRes.exito || !appRes.resultado) {
            respuesta.estado = 404;
            respuesta.mensaje = 'La cita no existe o ha sido eliminada.';
            return res.status(404).json(respuesta);
        }

        const appointment = appRes.resultado;
        const currentStatus = appointment.status;

        // Authorization: Participant or Admin
        if (appointment.client_id !== userId && appointment.technician_id !== userId && userRole !== 'admin') {
            respuesta.estado = 403;
            respuesta.mensaje = 'No tienes permisos para realizar cambios en esta cita.';
            return res.status(403).json(respuesta);
        }

        // Logic: State Machine Transitions
        const validTransitions = {
            'pending': ['confirmed', 'cancelled', 'expired'],
            'confirmed': ['on_the_way', 'arrived', 'cancelled', 'cancellation_pending', 'expired'],
            'on_the_way': ['arrived', 'cancelled'],
            'arrived': ['in_progress', 'cancelled'],
            'in_progress': ['completed', 'cancelled'],
            'cancellation_pending': ['cancelled', 'confirmed'], // Store confirms or rejects cancellation
            'expired': [],
            'completed': [],
            'cancelled': []
        };

        if (!validTransitions[currentStatus].includes(nextStatus)) {
            respuesta.estado = 400;
            respuesta.mensaje = 'No es posible realizar este cambio de estado en el momento actual.';
            return res.status(400).json(respuesta);
        }

        // Role-based logic for transitions
        if (nextStatus === 'on_the_way' || nextStatus === 'arrived') {
            const isDomicilio = appointment.service_type === 'domicilio';
            if (isDomicilio) {
                // For Domicilio, only the tech can mark "on the way" or "arrived"
                if (appointment.technician_id !== userId && userRole !== 'admin') {
                    respuesta.estado = 403;
                    respuesta.mensaje = 'Solo el técnico puede marcar que está en camino al domicilio';
                    return res.status(403).json(respuesta);
                }
            } else {
                // For Local, only the client can mark "on the way" or "arrived"
                if (appointment.client_id !== userId && userRole !== 'admin') {
                    respuesta.estado = 403;
                    respuesta.mensaje = 'Solo el cliente puede marcar que está en camino al local';
                    return res.status(403).json(respuesta);
                }
            }
        }

        if (['in_progress', 'completed'].includes(nextStatus)) {
            if (appointment.technician_id !== userId && userRole !== 'admin') {
                respuesta.estado = 403;
                respuesta.mensaje = 'Solo el prestador del servicio puede marcar este estado';
                return res.status(403).json(respuesta);
            }
        }

        // Determine timestamp column to update
        let timestampCol = null;
        if (nextStatus === 'on_the_way') timestampCol = 'en_camino_at';
        if (nextStatus === 'arrived') timestampCol = 'llegado_at';
        if (nextStatus === 'in_progress') timestampCol = 'en_progreso_at';
        if (nextStatus === 'completed') timestampCol = 'completado_at';

        // Update status and timestamp if applicable
        let updateQuery = 'UPDATE appointments SET status = ?';
        let updateParams = [nextStatus];
        
        if (timestampCol) {
            updateQuery += `, ${timestampCol} = NOW()`;
        }
        
        updateQuery += ' WHERE id = ?';
        updateParams.push(id);

        const dbRes = await db.ejecutar(updateQuery, updateParams);

        // --- Notificar por chat sobre el cambio de estado ---
        const statusMsg = {
            confirmed: '✅ Tu cita ha sido confirmada.',
            on_the_way: '🚚 En camino.',
            arrived: '📍 Ha llegado.',
            in_progress: '🛠 El servicio está en progreso.',
            completed: '🎉 ¡Servicio completado! Por favor, confirma la finalización.',
            cancelled: '❌ La cita ha sido cancelada.'
        };

        if (statusMsg[nextStatus]) {
            const receiverId = userId === appointment.client_id ? appointment.technician_id : appointment.client_id;
            
            // Custom messages for dynamic journey
            let customMsg = statusMsg[nextStatus];
            if (nextStatus === 'on_the_way') {
                customMsg = appointment.service_type === 'domicilio' 
                    ? '🚚 *¡Voy en camino!* El técnico está dirigiéndose a tu domicilio.'
                    : '🚶 *¡Voy para allá!* El cliente está en camino al local.';
            } else if (nextStatus === 'arrived') {
                customMsg = appointment.service_type === 'domicilio'
                    ? '📍 *¡He llegado!* El técnico ya está en tu ubicación.'
                    : '🏬 *¡He llegado!* El cliente ya está en el local.';
            } else if (nextStatus === 'in_progress') {
                customMsg = '🛠 *Servicio en curso:* Estamos trabajando en tu equipo ahora mismo.';
            } else if (nextStatus === 'completed') {
                customMsg = '🎉 *¡Trabajo terminado!* El servicio ha sido completado con éxito.';
            }

            await db.ejecutar(
                'INSERT INTO chat_messages (sender_id, receiver_id, message_text, message_type, appointment_id) VALUES (?, ?, ?, "appointment_progress", ?)',
                [userId, receiverId, customMsg, id]
            );

            // Also create a system notification (Push + In-app)
            await notificationService.createNotification(
                receiverId,
                'Actualización de Cita',
                customMsg,
                'appointment',
                { appointmentId: id.toString(), nextStatus }
            );
        }

        respuesta.exito = true;
        respuesta.estado = 200;
        respuesta.mensaje = 'El estado de la cita ha sido actualizado correctamente.';
        res.json(respuesta);

    } catch (error) {
        console.error('Update appointment status error:', error);
        respuesta.mensaje = 'Error al actualizar la cita: ' + error.message;
        res.status(500).json(respuesta);
    }
};

/**
 * Cancel appointment (with cancellation_pending logic for stores)
 */
const cancelAppointment = async (req, res) => {
    let respuesta = new Respuesta();
    try {
        const { id } = req.params;
        const userId = req.user.id;

        const initialRes = await db.listar(
            'SELECT a.*, u.role FROM appointments a JOIN users u ON a.technician_id = u.id WHERE a.id = ?',
            false,
            [id]
        );

        if (!initialRes.resultado) {
            respuesta.estado = 404;
            respuesta.mensaje = 'Cita no encontrada';
            return res.status(404).json(respuesta);
        }

        const appointment = initialRes.resultado;

        if (appointment.payment_status === 'paid') {
            respuesta.estado = 400;
            respuesta.mensaje = 'Lo sentimos, las citas que ya han sido pagadas no pueden ser canceladas.';
            return res.status(400).json(respuesta);
        }

        // Logic: Store confirm cancellation if it was already confirmed and client is cancelling
        let newStatus = 'cancelled';
        if (appointment.role === 'store' && appointment.status === 'confirmed' && userId !== appointment.technician_id) {
            newStatus = 'cancellation_pending';
        }

        const dbRes = await db.ejecutar(
            `UPDATE appointments SET status = ?, cancelled_by = ?
             WHERE id = ? AND (client_id = ? OR technician_id = ?)`,
            [newStatus, userId, id, userId, userId]
        );

        if (!dbRes.exito || dbRes.resultado.affectedRows === 0) {
            respuesta.estado = 404;
            respuesta.mensaje = 'Error al cancelar la cita o no autorizada';
            return res.status(404).json(respuesta);
        }

        respuesta.exito = true;
        respuesta.estado = 200;
        respuesta.mensaje = newStatus === 'cancelled' ? 'Tu cita ha sido cancelada correctamente.' : 'Tu solicitud de cancelación ha sido enviada para validación.';
        res.json(respuesta);

    } catch (error) {
        console.error('Cancel appointment error:', error);
        respuesta.mensaje = 'Error al cancelar la cita: ' + error.message;
        res.status(500).json(respuesta);
    }
};

/**
 * Set appointment price (By Provider)
 */
const setAppointmentPrice = async (req, res) => {
    let respuesta = new Respuesta();
    try {
        const { id } = req.params;
        const { price } = req.body;
        const userId = req.user.id;

        const appRes = await db.listar(
            'SELECT technician_id, payment_status FROM appointments WHERE id = ?',
            false,
            [id]
        );

        if (!appRes.resultado) {
            respuesta.estado = 404;
            respuesta.mensaje = 'Cita no encontrada';
            return res.status(404).json(respuesta);
        }

        if (appRes.resultado.technician_id !== userId) {
            respuesta.estado = 403;
            respuesta.mensaje = 'Solo el prestador del servicio puede establecer el precio';
            return res.status(403).json(respuesta);
        }

        if (appRes.resultado.payment_status === 'paid') {
            respuesta.estado = 400;
            respuesta.mensaje = 'No se puede cambiar el precio de una cita ya pagada';
            return res.status(400).json(respuesta);
        }

        await db.ejecutar('UPDATE appointments SET price = ? WHERE id = ?', [price, id]);

        // Notify client via chat and notification
        const client_id = appRes.resultado.client_id || (await db.listar('SELECT client_id FROM appointments WHERE id = ?', false, [id])).resultado.client_id;
        
        const priceMsg = `💰 *Precio Establecido*\nEl prestador ha fijado el precio del servicio en: *S/ ${price}*.\nYa puedes proceder con el pago.`;
        
        await db.ejecutar(
            'INSERT INTO chat_messages (sender_id, receiver_id, message_text, message_type, appointment_id) VALUES (?, ?, ?, "appointment", ?)',
            [userId, client_id, priceMsg, id]
        );

        await notificationService.createNotification(
            client_id,
            'Precio Establecido',
            `Se ha fijado un precio de S/ ${price} para tu cita.`,
            'appointment',
            { appointmentId: id.toString(), price: price.toString() }
        );

        respuesta.exito = true;
        respuesta.mensaje = 'Precio establecido con éxito';
        res.json(respuesta);
    } catch (error) {
        console.error('Set price error:', error);
        res.status(500).json({ mensaje: 'Error al establecer precio' });
    }
};

/**
 * Pay appointment (By Client)
 */
const payAppointment = async (req, res) => {
    let respuesta = new Respuesta();
    try {
        const { id } = req.params;
        const { paymentMethod } = req.body;
        const userId = req.user.id;

        const appRes = await db.listar(
            'SELECT client_id, price, payment_status FROM appointments WHERE id = ?',
            false,
            [id]
        );

        if (!appRes.resultado) {
            respuesta.estado = 404;
            respuesta.mensaje = 'Cita no encontrada';
            return res.status(404).json(respuesta);
        }

        if (appRes.resultado.client_id !== userId) {
            respuesta.estado = 403;
            respuesta.mensaje = 'Solo el cliente puede pagar la cita';
            return res.status(403).json(respuesta);
        }

        if (!appRes.resultado.price) {
            respuesta.estado = 400;
            respuesta.mensaje = 'El prestador aún no ha establecido un precio para esta cita';
            return res.status(400).json(respuesta);
        }

        await db.ejecutar(
            'UPDATE appointments SET payment_method = ?, payment_status = "waiting_confirmation" WHERE id = ?',
            [paymentMethod, id]
        );

        // Notificar al prestador sobre el pago
        const app = appRes.resultado;
        await notificationService.createNotification(
            app.technician_id || (await db.listar('SELECT technician_id FROM appointments WHERE id = ?', false, [id])).resultado.technician_id,
            'Pago de Cita Notificado',
            `El cliente ha notificado el pago vía ${paymentMethod.toUpperCase()}.`,
            'appointment',
            { appointmentId: id.toString(), action: 'payment_notified' }
        );

        respuesta.exito = true;
        respuesta.mensaje = 'Tu pago ha sido registrado. El técnico validará la recepción en breve.';
        res.json(respuesta);
    } catch (error) {
        console.error('Pay error:', error);
        res.status(500).json({ mensaje: 'Error al procesar pago' });
    }
};

/**
 * Confirm completion by client
 */
const confirmCompletion = async (req, res) => {
    let respuesta = new Respuesta();
    try {
        const { id } = req.params;
        const userId = req.user.id;

        const appRes = await db.listar(
            'SELECT client_id, status FROM appointments WHERE id = ?',
            false,
            [id]
        );

        if (!appRes.resultado) {
            respuesta.estado = 404;
            respuesta.mensaje = 'Cita no encontrada';
            return res.status(404).json(respuesta);
        }

        if (appRes.resultado.client_id !== userId) {
            respuesta.estado = 403;
            respuesta.mensaje = 'Solo el cliente puede confirmar la finalización del trabajo';
            return res.status(403).json(respuesta);
        }

        if (appRes.resultado.status !== 'completed') {
            respuesta.estado = 400;
            respuesta.mensaje = 'El trabajo aún no ha sido marcado como completado por el técnico';
            return res.status(400).json(respuesta);
        }

        await db.ejecutar(
            'UPDATE appointments SET client_confirmed_completion = TRUE WHERE id = ?',
            [id]
        );

        await notificationService.createNotification(
            appRes.resultado.technician_id,
            'Trabajo Confirmado',
            'El cliente ha confirmado la finalización exitosa del trabajo.',
            'appointment',
            { appointmentId: id.toString(), action: 'completion_confirmed' }
        );

        respuesta.exito = true;
        respuesta.mensaje = '¡Gracias por confirmar! El servicio ha concluido oficialmente.';
        res.json(respuesta);
    } catch (error) {
        console.error('Confirm completion error:', error);
        res.status(500).json({ mensaje: 'Error al confirmar finalización' });
    }
};
/**
 * Confirm payment by provider
 */
const confirmPayment = async (req, res) => {
    let respuesta = new Respuesta();
    try {
        const { id } = req.params;
        const userId = req.user.id;

        const appRes = await db.listar(
            'SELECT technician_id FROM appointments WHERE id = ?',
            false,
            [id]
        );

        if (!appRes.resultado) {
            respuesta.estado = 404;
            respuesta.mensaje = 'Cita no encontrada';
            return res.status(404).json(respuesta);
        }

        if (appRes.resultado.technician_id !== userId) {
            respuesta.estado = 403;
            respuesta.mensaje = 'Solo el prestador del servicio puede confirmar el pago';
            return res.status(403).json(respuesta);
        }

        // Update payment status AND appointment status to confirmed if it was pending
        await db.ejecutar(
            'UPDATE appointments SET payment_status = "paid", payment_confirmed_at = NOW(), status = IF(status = "pending", "confirmed", status) WHERE id = ?',
            [id]
        );

        // Notify client
        const client_id = (await db.listar('SELECT client_id FROM appointments WHERE id = ?', false, [id])).resultado.client_id;
        const confirmMsg = '✅ *Pago Confirmado*\nEl técnico ha confirmado la recepción de tu pago. La cita ahora está confirmada y el servicio puede iniciar.';

        await db.ejecutar(
            'INSERT INTO chat_messages (sender_id, receiver_id, message_text, message_type, appointment_id) VALUES (?, ?, ?, "appointment", ?)',
            [userId, client_id, confirmMsg, id]
        );

        await notificationService.createNotification(
            client_id,
            'Pago Confirmado',
            'Tu pago ha sido validado por el técnico.',
            'appointment',
            { appointmentId: id.toString(), action: 'payment_confirmed' }
        );

        respuesta.exito = true;
        respuesta.mensaje = '¡Pago validado con éxito! La cita ahora está lista para el servicio.';
        res.json(respuesta);
    } catch (error) {
        console.error('Confirm payment error:', error);
        res.status(500).json({ mensaje: 'Error al confirmar pago' });
    }
};

module.exports = {
    createAppointment,
    getAppointments,
    getAppointmentById,
    updateAppointmentStatus,
    cancelAppointment,
    setAppointmentPrice,
    payAppointment,
    confirmPayment,
    confirmCompletion
};
