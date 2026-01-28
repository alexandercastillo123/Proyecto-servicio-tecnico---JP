const db = require('../config/database');
const Respuesta = require('../utils/Respuesta');

/**
 * Get list of technicians with optional filters
 */
const getTechnicians = async (req, res) => {
    let respuesta = new Respuesta();
    try {
        const { city, minRating, page = 1, limit = 10 } = req.query;
        const offset = (page - 1) * limit;

        let query = `
      SELECT 
        u.id, u.email,
        up.phone, up.profile_image_url, up.address, up.city,
        up.person_type, up.names, up.surnames, up.dni,
        up.company_name, up.ruc, up.reference_address,
        up.rating, up.reviews_count
      FROM users u
      INNER JOIN user_profiles up ON u.id = up.user_id
      WHERE u.role = 'tech'
    `;

        const params = [];

        if (city) {
            query += ' AND up.city = ?';
            params.push(city);
        }

        if (minRating) {
            query += ' AND up.rating >= ?';
            params.push(parseFloat(minRating));
        }

        query += ' ORDER BY up.rating DESC, up.reviews_count DESC';
        query += ' LIMIT ? OFFSET ?';
        params.push(parseInt(limit), parseInt(offset));

        const dbRes = await db.listar(query, true, params);

        if (!dbRes.exito) {
            return res.status(400).json(dbRes);
        }

        // Get total count
        let countQuery = 'SELECT COUNT(*) as total FROM users u INNER JOIN user_profiles up ON u.id = up.user_id WHERE u.role = "tech"';
        const countParams = [];

        if (city) {
            countQuery += ' AND up.city = ?';
            countParams.push(city);
        }

        if (minRating) {
            countQuery += ' AND up.rating >= ?';
            countParams.push(parseFloat(minRating));
        }

        const countRes = await db.listar(countQuery, false, countParams);
        const total = countRes.resultado ? countRes.resultado.total : 0;

        respuesta.exito = true;
        respuesta.estado = 200;
        respuesta.mensaje = "exito";
        respuesta.resultado = {
            technicians: dbRes.resultado,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                totalPages: Math.ceil(total / limit)
            }
        };

        res.json(respuesta);

    } catch (error) {
        console.error('Get technicians error:', error);
        respuesta.mensaje = 'Failed to retrieve technicians: ' + error.message;
        res.status(500).json(respuesta);
    }
};

/**
 * Get technician details with schedule
 */
const getTechnicianById = async (req, res) => {
    let respuesta = new Respuesta();
    try {
        const { id } = req.params;

        // Get technician profile
        const dbRes = await db.listar(
            `SELECT 
        u.id, u.email,
        up.phone, up.profile_image_url, up.address, up.city,
        up.person_type, up.names, up.surnames, up.dni,
        up.company_name, up.ruc, up.reference_address,
        up.rating, up.reviews_count
      FROM users u
      INNER JOIN user_profiles up ON u.id = up.user_id
      WHERE u.id = ? AND u.role = 'tech'`,
            false,
            [id]
        );

        if (!dbRes.exito || !dbRes.resultado) {
            respuesta.estado = 404;
            respuesta.mensaje = 'Technician not found';
            return res.status(404).json(respuesta);
        }

        // Get schedule
        const schedRes = await db.listar(
            `SELECT id, day_of_week, start_time, end_time, is_active
       FROM technician_schedules
       WHERE technician_id = ? AND is_active = TRUE
       ORDER BY FIELD(day_of_week, 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday')`,
            true,
            [id]
        );

        respuesta.exito = true;
        respuesta.estado = 200;
        respuesta.mensaje = "exito";
        respuesta.resultado = {
            ...dbRes.resultado,
            schedule: schedRes.resultado || []
        };

        res.json(respuesta);

    } catch (error) {
        console.error('Get technician by ID error:', error);
        respuesta.mensaje = 'Failed to retrieve technician: ' + error.message;
        res.status(500).json(respuesta);
    }
};

/**
 * Get technician schedule
 */
const getTechnicianSchedule = async (req, res) => {
    let respuesta = new Respuesta();
    try {
        const { id } = req.params;

        const dbRes = await db.listar(
            `SELECT id, day_of_week, start_time, end_time, is_active
       FROM technician_schedules
       WHERE technician_id = ?
       ORDER BY FIELD(day_of_week, 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday')`,
            true,
            [id]
        );

        respuesta.exito = true;
        respuesta.estado = 200;
        respuesta.mensaje = "exito";
        respuesta.resultado = dbRes.resultado || [];
        res.json(respuesta);

    } catch (error) {
        console.error('Get schedule error:', error);
        respuesta.mensaje = 'Failed to retrieve schedule: ' + error.message;
        res.status(500).json(respuesta);
    }
};

/**
 * Create or update technician schedule
 */
const createSchedule = async (req, res) => {
    let respuesta = new Respuesta();
    try {
        const technicianId = req.user.id;
        const { schedules } = req.body; // Array of schedule objects

        if (!Array.isArray(schedules) || schedules.length === 0) {
            respuesta.mensaje = 'Schedules array is required';
            return res.status(400).json(respuesta);
        }

        // Delete existing schedules
        await db.ejecutar('DELETE FROM technician_schedules WHERE technician_id = ?', [technicianId]);

        // Insert new schedules
        const values = schedules.map(s => [
            technicianId,
            s.dayOfWeek,
            s.startTime,
            s.endTime,
            s.isActive !== undefined ? s.isActive : true
        ]);

        const dbRes = await db.pool.query(
            `INSERT INTO technician_schedules (technician_id, day_of_week, start_time, end_time, is_active)
       VALUES ?`,
            [values]
        );

        respuesta.exito = true;
        respuesta.estado = 200;
        respuesta.mensaje = 'Schedule created successfully';
        res.json(respuesta);

    } catch (error) {
        console.error('Create schedule error:', error);
        respuesta.mensaje = 'Failed to create schedule: ' + error.message;
        res.status(500).json(respuesta);
    }
};

/**
 * Update specific schedule entry
 */
const updateSchedule = async (req, res) => {
    let respuesta = new Respuesta();
    try {
        const { id } = req.params;
        const technicianId = req.user.id;
        const { dayOfWeek, startTime, endTime, isActive } = req.body;

        const dbRes = await db.ejecutar(
            `UPDATE technician_schedules SET
        day_of_week = COALESCE(?, day_of_week),
        start_time = COALESCE(?, start_time),
        end_time = COALESCE(?, end_time),
        is_active = COALESCE(?, is_active)
      WHERE id = ? AND technician_id = ?`,
            [dayOfWeek, startTime, endTime, isActive, id, technicianId]
        );

        if (!dbRes.exito || dbRes.resultado.affectedRows === 0) {
            respuesta.estado = 404;
            respuesta.mensaje = 'Schedule not found or unauthorized';
            return res.status(404).json(respuesta);
        }

        respuesta.exito = true;
        respuesta.estado = 200;
        respuesta.mensaje = 'Schedule updated successfully';
        res.json(respuesta);

    } catch (error) {
        console.error('Update schedule error:', error);
        respuesta.mensaje = 'Failed to update schedule: ' + error.message;
        res.status(500).json(respuesta);
    }
};

module.exports = {
    getTechnicians,
    getTechnicianById,
    getTechnicianSchedule,
    createSchedule,
    updateSchedule
};
