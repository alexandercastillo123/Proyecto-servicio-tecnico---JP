const db = require('../config/database');
const Respuesta = require('../utils/Respuesta');

/**
 * Get all appointments in the system with filters
 */
const getAllAppointments = async (req, res) => {
    let respuesta = new Respuesta();
    try {
        const { status, date } = req.query;
        let query = `
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

        if (status) {
            query += ' AND a.status = ?';
            params.push(status);
        }
        if (date) {
            query += ' AND a.scheduled_date = ?';
            params.push(date);
        }

        query += ' ORDER BY a.created_at DESC';

        const dbRes = await db.listar(query, true, params);
        respuesta.exito = true;
        respuesta.resultado = dbRes.resultado || [];
        res.json(respuesta);
    } catch (error) {
        respuesta.mensaje = 'Error al obtener citas: ' + error.message;
        res.status(500).json(respuesta);
    }
};

/**
 * Get all users with their profiles
 */
const getAllUsers = async (req, res) => {
    let respuesta = new Respuesta();
    try {
        const { role } = req.query;
        let query = `
            SELECT u.id, u.username, u.email, u.role, u.created_at,
                   up.names, up.surnames, up.phone, up.person_type, up.company_name, up.ruc, up.city
            FROM users u
            LEFT JOIN user_profiles up ON u.id = up.user_id
            WHERE 1=1
        `;
        const params = [];

        if (role) {
            query += ' AND u.role = ?';
            params.push(role);
        }

        const dbRes = await db.listar(query, true, params);
        respuesta.exito = true;
        respuesta.resultado = dbRes.resultado || [];
        res.json(respuesta);
    } catch (error) {
        respuesta.mensaje = 'Error al obtener usuarios: ' + error.message;
        res.status(500).json(respuesta);
    }
};

/**
 * Get all branches with owner info
 */
const getAllBranches = async (req, res) => {
    let respuesta = new Respuesta();
    try {
        const query = `
            SELECT s.*, u.username as owner_username, u.email as owner_email
            FROM sucursales s
            JOIN users u ON s.user_id = u.id
        `;
        const dbRes = await db.listar(query, true);
        respuesta.exito = true;
        respuesta.resultado = dbRes.resultado || [];
        res.json(respuesta);
    } catch (error) {
        respuesta.mensaje = 'Error al obtener sucursales: ' + error.message;
        res.status(500).json(respuesta);
    }
};

module.exports = {
    getAllAppointments,
    getAllUsers,
    getAllBranches
};
