/**
 * appointment.service.js
 * Single Responsibility: Appointment business logic, state machine and notifications.
 * Delegates all DB access to appointment.repository.js
 */
const { pool } = require('../config/database');
const appointmentRepo = require('../repository/appointment.repository');
const notificationService = require('./notification.service');
const AppError = require('../utils/AppError');
const { getIO } = require('../config/socketManager');

// ─── State machine ────────────────────────────────────────────────────────────

const VALID_TRANSITIONS = {
    pending:              ['confirmed', 'cancelled', 'expired'],
    confirmed:            ['on_the_way', 'arrived', 'cancelled', 'cancellation_pending', 'expired'],
    on_the_way:           ['arrived', 'cancelled'],
    arrived:              ['in_progress', 'cancelled'],
    in_progress:          ['completed', 'cancelled'],
    cancellation_pending: ['cancelled', 'confirmed'],
    expired: [], completed: [], cancelled: []
};

const TIMESTAMP_COLUMNS = {
    on_the_way: 'en_camino_at', arrived: 'llegado_at',
    in_progress: 'en_progreso_at', completed: 'completado_at'
};

const buildStatusMessage = (nextStatus, serviceType) => {
    if (nextStatus === 'on_the_way') return serviceType === 'domicilio'
        ? '🚚 *¡Voy en camino!* El técnico está dirigiéndose a tu domicilio.'
        : '🚶 *¡Voy para allá!* El cliente está en camino al local.';
    if (nextStatus === 'arrived') return serviceType === 'domicilio'
        ? '📍 *¡He llegado!* El técnico ya está en tu ubicación.'
        : '🏬 *¡He llegado!* El cliente ya está en el local.';
    if (nextStatus === 'in_progress') return '🛠 *Servicio en curso:* Estamos trabajando en tu equipo ahora mismo.';
    if (nextStatus === 'completed')   return '🎉 *¡Trabajo terminado!* El servicio ha sido completado con éxito.';
    return '';
};

// ─── Create ───────────────────────────────────────────────────────────────────

const createAppointment = async ({ clientId, technicianId, scheduledDate, scheduledTime, description, serviceLat, serviceLng, serviceAddress, serviceType }) => {
    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();

        // Verify destination user exists
        const [dest] = await conn.query('SELECT id, role FROM users WHERE id = ? AND role IN ("tech","store")', [technicianId]);
        if (dest.length === 0) throw new AppError('El técnico o sucursal seleccionada no está disponible.', 404);

        // Check no duplicate active appointment
        const active = await appointmentRepo.findActiveForPair(clientId, technicianId);
        if (active) throw new AppError('Ya tienes una cita activa programada con este técnico o sucursal.', 400);

        const appointmentId = await appointmentRepo.create(
            { clientId, technicianId, scheduledDate, scheduledTime, description, serviceLat, serviceLng, serviceAddress, serviceType },
            conn
        );

        const chatMsg = `📅 *Nueva Cita Agendada*\nServicio: ${serviceType === 'domicilio' || serviceType === 'home' ? 'A Domicilio' : 'En Local'}\nFecha: ${scheduledDate}\nHora: ${scheduledTime}\nDescripción: ${description || 'Sin descripción'}`;
        await appointmentRepo.insertChatMessageConn(conn, clientId, technicianId, chatMsg, 'appointment', appointmentId);

        if (dest[0].role === 'store') {
            const store = await appointmentRepo.findStoreByUserId(technicianId, conn);
            if (store) await appointmentRepo.linkStoreAppointment(store.id, appointmentId, conn);
        }

        await conn.commit();

        await notificationService.createNotification(
            technicianId, 'Nueva Cita Recibida',
            `Tienes una nueva solicitud de servicio para el ${scheduledDate} a las ${scheduledTime}`,
            'appointment', { appointmentId: appointmentId.toString(), type: 'new_appointment' }
        );

        return { appointmentId };
    } catch (err) {
        await conn.rollback();
        throw err;
    } finally {
        conn.release();
    }
};

// ─── Read ─────────────────────────────────────────────────────────────────────

const getAppointments = async (userId, status = null) => {
    await appointmentRepo.expireOldAppointments();
    return appointmentRepo.findByUser(userId, status);
};

const getAppointmentById = async (appointmentId, userId) => {
    const row = await appointmentRepo.findByIdForParticipant(appointmentId, userId);
    if (!row) throw new AppError('No pudimos encontrar los detalles de la cita solicitada.', 404);
    return row;
};

// ─── Status transitions ───────────────────────────────────────────────────────

const updateAppointmentStatus = async (appointmentId, userId, userRole, nextStatus) => {
    const appointment = await appointmentRepo.findForRole(appointmentId);
    if (!appointment) throw new AppError('La cita no existe o ha sido eliminada.', 404);

    if (appointment.client_id !== userId && appointment.technician_id !== userId && userRole !== 'admin') {
        throw new AppError('No tienes permisos para realizar cambios en esta cita.', 403);
    }

    if (!VALID_TRANSITIONS[appointment.status]?.includes(nextStatus)) {
        throw new AppError('No es posible realizar este cambio de estado en el momento actual.', 400);
    }

    if (['on_the_way', 'arrived'].includes(nextStatus)) {
        const isDomicilio = appointment.service_type === 'domicilio';
        if (isDomicilio && appointment.technician_id !== userId && userRole !== 'admin') {
            throw new AppError('Solo el técnico puede marcar que está en camino al domicilio.', 403);
        }
        if (!isDomicilio && appointment.client_id !== userId && userRole !== 'admin') {
            throw new AppError('Solo el cliente puede marcar que está en camino al local.', 403);
        }
    }

    if (['in_progress', 'completed'].includes(nextStatus) && appointment.technician_id !== userId && userRole !== 'admin') {
        throw new AppError('Solo el prestador del servicio puede marcar este estado.', 403);
    }

    await appointmentRepo.updateStatus(appointmentId, nextStatus, TIMESTAMP_COLUMNS[nextStatus]);

    const msg = buildStatusMessage(nextStatus, appointment.service_type);
    if (msg) {
        const receiverId = userId === appointment.client_id ? appointment.technician_id : appointment.client_id;
        await appointmentRepo.insertChatMessage(userId, receiverId, msg, 'appointment_progress', appointmentId);

        try {
            const io = getIO();
            const payload = { appointment_id: appointmentId, message: msg, status: nextStatus, service_type: appointment.service_type };
            io.to(`user_${receiverId}`).emit('appointment_progress', payload);
            io.to(`user_${userId}`).emit('appointment_progress', payload);
        } catch (_) { /* Socket not yet initialized */ }

        await notificationService.createNotification(
            receiverId, 'Actualización de Cita', msg, 'appointment',
            { appointmentId: appointmentId.toString(), nextStatus }
        );
    }
};

// ─── Cancel ───────────────────────────────────────────────────────────────────

const cancelAppointment = async (appointmentId, userId) => {
    const [rows] = await pool.query(
        'SELECT a.*, u.role FROM appointments a JOIN users u ON a.technician_id = u.id WHERE a.id = ?',
        [appointmentId]
    );
    if (rows.length === 0) throw new AppError('Cita no encontrada.', 404);
    const appointment = rows[0];

    if (appointment.payment_status === 'paid') {
        throw new AppError('Las citas que ya han sido pagadas no pueden ser canceladas.', 400);
    }

    const newStatus = (appointment.role === 'store' && appointment.status === 'confirmed' && userId !== appointment.technician_id)
        ? 'cancellation_pending'
        : 'cancelled';

    const affected = await appointmentRepo.setCancelledStatus(appointmentId, newStatus, userId);
    if (affected === 0) throw new AppError('Error al cancelar la cita o no autorizada.', 404);
    return newStatus;
};

// ─── Price ────────────────────────────────────────────────────────────────────

const setAppointmentPrice = async (appointmentId, userId, price) => {
    const row = await appointmentRepo.findForRole(appointmentId);
    if (!row) throw new AppError('Cita no encontrada.', 404);
    if (row.technician_id !== userId) throw new AppError('Solo el prestador del servicio puede establecer el precio.', 403);
    if (row.payment_status === 'paid') throw new AppError('No se puede cambiar el precio de una cita ya pagada.', 400);

    await appointmentRepo.setPrice(appointmentId, price);

    const priceMsg = `💰 *Precio Establecido*\nEl prestador ha fijado el precio del servicio en: *S/ ${price}*.\nYa puedes proceder con el pago.`;
    await appointmentRepo.insertChatMessage(userId, row.client_id, priceMsg, 'appointment', appointmentId);

    await notificationService.createNotification(
        row.client_id, 'Precio Establecido',
        `Se ha fijado un precio de S/ ${price} para tu cita.`,
        'appointment', { appointmentId: appointmentId.toString(), price: price.toString() }
    );
};

// ─── Payment ──────────────────────────────────────────────────────────────────

const payAppointment = async (appointmentId, userId, paymentMethod) => {
    const row = await appointmentRepo.findForRole(appointmentId);
    if (!row) throw new AppError('Cita no encontrada.', 404);
    if (row.client_id !== userId) throw new AppError('Solo el cliente puede pagar la cita.', 403);

    // Re-fetch price
    const full = await appointmentRepo.findById(appointmentId);
    if (!full?.price) throw new AppError('El prestador aún no ha establecido un precio para esta cita.', 400);

    await appointmentRepo.setPaymentWaiting(appointmentId, paymentMethod);

    await notificationService.createNotification(
        row.technician_id, 'Pago de Cita Notificado',
        `El cliente ha notificado el pago vía ${paymentMethod.toUpperCase()}.`,
        'appointment', { appointmentId: appointmentId.toString(), action: 'payment_notified' }
    );
};

const confirmPayment = async (appointmentId, userId) => {
    const row = await appointmentRepo.findForRole(appointmentId);
    if (!row) throw new AppError('Cita no encontrada.', 404);
    if (row.technician_id !== userId) throw new AppError('Solo el prestador del servicio puede confirmar el pago.', 403);

    await appointmentRepo.confirmPayment(appointmentId);

    const confirmMsg = '✅ *Pago Confirmado*\nEl técnico ha confirmado la recepción de tu pago. La cita ahora está confirmada y el servicio puede iniciar.';
    await appointmentRepo.insertChatMessage(userId, row.client_id, confirmMsg, 'appointment', appointmentId);

    await notificationService.createNotification(
        row.client_id, 'Pago Confirmado', 'Tu pago ha sido validado por el técnico.',
        'appointment', { appointmentId: appointmentId.toString(), action: 'payment_confirmed' }
    );
};

// ─── Completion ───────────────────────────────────────────────────────────────

const confirmCompletion = async (appointmentId, userId) => {
    const row = await appointmentRepo.findForRole(appointmentId);
    if (!row) throw new AppError('Cita no encontrada.', 404);
    if (row.client_id !== userId) throw new AppError('Solo el cliente puede confirmar la finalización del trabajo.', 403);
    if (row.status !== 'completed') throw new AppError('El trabajo aún no ha sido marcado como completado por el técnico.', 400);

    await appointmentRepo.confirmCompletion(appointmentId);

    await notificationService.createNotification(
        row.technician_id, 'Trabajo Confirmado',
        'El cliente ha confirmado la finalización exitosa del trabajo.',
        'appointment', { appointmentId: appointmentId.toString(), action: 'completion_confirmed' }
    );
};

module.exports = {
    createAppointment, getAppointments, getAppointmentById,
    updateAppointmentStatus, cancelAppointment,
    setAppointmentPrice, payAppointment, confirmPayment, confirmCompletion
};
