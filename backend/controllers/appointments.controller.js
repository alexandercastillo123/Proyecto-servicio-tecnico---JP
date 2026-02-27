const db = require('../config/database');
const Respuesta = require('../utils/Respuesta');

/**
 * Create new appointment
 */
const createAppointment = async (req, res) => {
    let respuesta = new Respuesta();
    try {
        const clientId = req.user.id;
        const { technicianId, scheduledDate, scheduledTime, description, serviceLat, serviceLng, serviceAddress } = req.body;

        // Verify technician exists
        const techRes = await db.listar(
            'SELECT id FROM users WHERE id = ? AND role = "tech"',
            false,
            [technicianId]
        );

        if (!techRes.exito || !techRes.resultado) {
            respuesta.estado = 404;
            respuesta.mensaje = 'Técnico no encontrado';
            return res.status(404).json(respuesta);
        }

        // Check for existing active appointment (ignoring expired ones)
        // A appointment is "vigente" if it's pending/confirmed AND (date is future OR (date is today AND time is future))
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
            respuesta.mensaje = 'Ya tienes una cita vigente con este técnico.';
            return res.status(400).json(respuesta);
        }

        // Create appointment
        const dbRes = await db.ejecutar(
            `INSERT INTO appointments (client_id, technician_id, scheduled_date, scheduled_time, description, status, service_lat, service_lng, service_address)
       VALUES (?, ?, ?, ?, ?, 'pending', ?, ?, ?)`,
            [clientId, technicianId, scheduledDate, scheduledTime, description, serviceLat || null, serviceLng || null, serviceAddress || null]
        );

        if (!dbRes.exito) {
            return res.status(500).json(dbRes);
        }

        respuesta.exito = true;
        respuesta.estado = 201;
        respuesta.mensaje = 'Cita creada con éxito';
        respuesta.resultado = {
            appointmentId: dbRes.resultado.insertId
        };

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

        let query = `
      SELECT 
        a.id, a.scheduled_date, a.scheduled_time, a.description, a.status, a.created_at,
        a.price, a.payment_method, a.payment_status, a.payment_confirmed_at,
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
        a.price, a.payment_method, a.payment_status, a.payment_confirmed_at,
        a.service_lat, a.service_lng, a.service_address,
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
            respuesta.mensaje = 'Cita no encontrada o no autorizada';
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
 * Update appointment status
 */
const updateAppointmentStatus = async (req, res) => {
    let respuesta = new Respuesta();
    try {
        const { id } = req.params;
        const userId = req.user.id;
        const { status } = req.body;

        // Verify user is part of appointment
        const appRes = await db.listar(
            'SELECT client_id, technician_id FROM appointments WHERE id = ?',
            false,
            [id]
        );

        if (!appRes.exito || !appRes.resultado) {
            respuesta.estado = 404;
            respuesta.mensaje = 'Cita no encontrada';
            return res.status(404).json(respuesta);
        }

        const appointment = appRes.resultado;
        if (appointment.client_id !== userId && appointment.technician_id !== userId) {
            respuesta.estado = 403;
            respuesta.mensaje = 'No autorizado para actualizar esta cita';
            return res.status(403).json(respuesta);
        }

        // Update status
        const dbRes = await db.ejecutar(
            'UPDATE appointments SET status = ? WHERE id = ?',
            [status, id]
        );

        respuesta.exito = true;
        respuesta.estado = 200;
        respuesta.mensaje = 'Estado de la cita actualizado con éxito';
        res.json(respuesta);

    } catch (error) {
        console.error('Update appointment status error:', error);
        respuesta.mensaje = 'Error al actualizar la cita: ' + error.message;
        res.status(500).json(respuesta);
    }
};

/**
 * Cancel/delete appointment
 */
const cancelAppointment = async (req, res) => {
    let respuesta = new Respuesta();
    try {
        const { id } = req.params;
        const userId = req.user.id;

        // Check if appointment is already paid
        const isPaidRes = await db.listar(
            'SELECT payment_status FROM appointments WHERE id = ?',
            false,
            [id]
        );

        if (isPaidRes.resultado && isPaidRes.resultado.payment_status === 'paid') {
            respuesta.estado = 400;
            respuesta.mensaje = 'No se puede cancelar una cita que ya ha sido pagada.';
            return res.status(400).json(respuesta);
        }

        // Update to cancelled status instead of deleting
        const dbRes = await db.ejecutar(
            `UPDATE appointments SET status = 'cancelled', cancelled_by = ?
       WHERE id = ? AND (client_id = ? OR technician_id = ?)`,
            [userId, id, userId, userId]
        );

        if (!dbRes.exito || dbRes.resultado.affectedRows === 0) {
            respuesta.estado = 404;
            respuesta.mensaje = 'Cita no encontrada o no autorizada';
            return res.status(404).json(respuesta);
        }

        respuesta.exito = true;
        respuesta.estado = 200;
        respuesta.mensaje = 'Cita cancelada con éxito';
        res.json(respuesta);

    } catch (error) {
        console.error('Cancel appointment error:', error);
        respuesta.mensaje = 'Error al cancelar la cita: ' + error.message;
        res.status(500).json(respuesta);
    }
};

/**
 * Set appointment price (By Technician)
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
            respuesta.mensaje = 'Solo el técnico puede establecer el precio';
            return res.status(403).json(respuesta);
        }

        if (appRes.resultado.payment_status === 'paid') {
            respuesta.estado = 400;
            respuesta.mensaje = 'No se puede cambiar el precio de una cita ya pagada';
            return res.status(400).json(respuesta);
        }

        await db.ejecutar('UPDATE appointments SET price = ? WHERE id = ?', [price, id]);

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
            respuesta.mensaje = 'El técnico aún no ha establecido un precio para esta cita';
            return res.status(400).json(respuesta);
        }

        await db.ejecutar(
            'UPDATE appointments SET payment_method = ?, payment_status = "waiting_confirmation" WHERE id = ?',
            [paymentMethod, id]
        );

        respuesta.exito = true;
        respuesta.mensaje = 'Pago registrado, esperando confirmación del técnico';
        res.json(respuesta);
    } catch (error) {
        console.error('Pay error:', error);
        res.status(500).json({ mensaje: 'Error al procesar pago' });
    }
};

/**
 * Confirm payment (By Technician)
 */
const confirmPayment = async (req, res) => {
    let respuesta = new Respuesta();
    try {
        const { id } = req.params;
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
            respuesta.mensaje = 'Solo el técnico puede confirmar el pago';
            return res.status(403).json(respuesta);
        }

        await db.ejecutar(
            'UPDATE appointments SET payment_status = "paid", payment_confirmed_at = NOW() WHERE id = ?',
            [id]
        );

        respuesta.exito = true;
        respuesta.mensaje = 'Pago confirmado con éxito. La cita ahora es incancelable.';
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
    confirmPayment
};
