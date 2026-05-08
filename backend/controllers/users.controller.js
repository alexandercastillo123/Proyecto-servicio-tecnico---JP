const db = require('../config/database');
const upload = require('../middleware/upload');
const Respuesta = require('../utils/Respuesta');

/**
 * Get authenticated user's profile
 */
const getProfile = async (req, res) => {
    let respuesta = new Respuesta();
    try {
        const userId = req.user.id;

        const dbRes = await db.listar(
            `SELECT 
        u.id, u.email, u.username, u.role, u.created_at,
        up.phone, up.profile_image_url, up.address, up.city,
        up.person_type, up.names, up.surnames, up.dni,
        up.company_name, up.ruc, up.reference_address,
        up.rating, up.reviews_count, up.is_available, up.description
      FROM users u
      LEFT JOIN user_profiles up ON u.id = up.user_id
      WHERE u.id = ?`,
            false,
            [userId]
        );

        if (!dbRes.exito || !dbRes.resultado) {
            respuesta.estado = 404;
            respuesta.mensaje = 'Usuario no encontrado';
            return res.status(404).json(respuesta);
        }

        respuesta.exito = true;
        respuesta.estado = 200;
        respuesta.mensaje = "exito";
        respuesta.resultado = dbRes.resultado;

        res.json(respuesta);

    } catch (error) {
        console.error('Get profile error:', error);
        respuesta.mensaje = 'Error al obtener el perfil: ' + error.message;
        res.status(500).json(respuesta);
    }
};

/**
 * Update user profile
 */
const updateProfile = async (req, res) => {
    let respuesta = new Respuesta();
    try {
        const userId = req.user.id;
        const {
            username,
            phone,
            address,
            city,
            names,
            surnames,
            dni,
            companyName,
            ruc,
            referenceAddress,
            description
        } = req.body;

        // If username is being updated, check if it's already taken by another user
        if (username) {
            const [existing] = await db.pool.query(
                'SELECT id FROM users WHERE username = ? AND id != ?',
                [username, userId]
            );

            if (existing.length > 0) {
                respuesta.estado = 409;
                respuesta.mensaje = 'El nombre de usuario ya está en uso por otra persona';
                return res.status(409).json(respuesta);
            }

            // Update username in users table
            await db.ejecutar(
                'UPDATE users SET username = ? WHERE id = ?',
                [username, userId]
            );
        }

        const dbRes = await db.ejecutar(
            `UPDATE user_profiles SET
        phone = COALESCE(?, phone),
        address = COALESCE(?, address),
        city = COALESCE(?, city),
        names = COALESCE(?, names),
        surnames = COALESCE(?, surnames),
        dni = COALESCE(?, dni),
        company_name = COALESCE(?, company_name),
        ruc = COALESCE(?, ruc),
        reference_address = COALESCE(?, reference_address),
        description = COALESCE(?, description)
      WHERE user_id = ?`,
            [phone, address, city, names, surnames, dni, companyName, ruc, referenceAddress, description, userId]
        );

        if (!dbRes.exito) {
            respuesta.estado = 500;
            respuesta.mensaje = 'Error interno al actualizar perfil';
            return res.status(500).json(respuesta);
        }

        // Even if affectedRows is 0 (no profile fields changed), 
        // if the profile exists or we updated the username, it's a success.

        respuesta.exito = true;
        respuesta.estado = 200;
        respuesta.mensaje = 'Perfil actualizado con éxito';
        res.json(respuesta);

    } catch (error) {
        console.error('Update profile error:', error);
        respuesta.mensaje = 'Error al actualizar perfil: ' + error.message;
        res.status(500).json(respuesta);
    }
};

/**
 * Upload profile photo
 */
const uploadPhoto = async (req, res) => {
    let respuesta = new Respuesta();
    try {
        const userId = req.user.id;

        if (!req.file) {
            respuesta.mensaje = 'No se ha subido ningún archivo';
            return res.status(400).json(respuesta);
        }

        const imageUrl = upload.getRelativePath(req.file);

        const dbRes = await db.ejecutar(
            'UPDATE user_profiles SET profile_image_url = ? WHERE user_id = ?',
            [imageUrl, userId]
        );

        if (!dbRes.exito) {
            respuesta.mensaje = 'Error al actualizar la ruta de la imagen';
            return res.status(500).json(respuesta);
        }

        respuesta.exito = true;
        respuesta.estado = 200;
        respuesta.mensaje = 'Foto subida con éxito';
        respuesta.resultado = { imageUrl };
        res.json(respuesta);

    } catch (error) {
        console.error('Upload photo error:', error);
        respuesta.mensaje = 'Error al subir foto: ' + error.message;
        res.status(500).json(respuesta);
    }
};

/**
 * Get public user profile by ID
 */
const getUserById = async (req, res) => {
    let respuesta = new Respuesta();
    try {
        const { id } = req.params;

        const dbRes = await db.listar(
            `SELECT 
        u.id, u.email, u.username, u.role,
        up.phone, up.profile_image_url, up.address, up.city,
        up.person_type, up.names, up.surnames, up.dni,
        up.company_name, up.ruc, up.reference_address,
        up.rating, up.reviews_count,
        s.id as store_id
      FROM users u
      LEFT JOIN user_profiles up ON u.id = up.user_id
      LEFT JOIN sucursales s ON u.id = s.user_id
      WHERE u.id = ?`,
            false,
            [id]
        );

        if (!dbRes.exito || !dbRes.resultado) {
            respuesta.estado = 404;
            respuesta.mensaje = 'Usuario no encontrado';
            return res.status(404).json(respuesta);
        }

        // Remove sensitive information for public profile
        const profile = dbRes.resultado;
        delete profile.email;

        respuesta.exito = true;
        respuesta.estado = 200;
        respuesta.mensaje = "exito";
        respuesta.resultado = profile;
        res.json(respuesta);

    } catch (error) {
        console.error('Get user by ID error:', error);
        respuesta.mensaje = 'Error al obtener usuario: ' + error.message;
        res.status(500).json(respuesta);
    }
};

/**
 * Toggle technician availability status
 */
const toggleAvailability = async (req, res) => {
    let respuesta = new Respuesta();
    try {
        const userId = req.user.id;
        const { is_available } = req.body;

        if (!is_available) {
            // Verificar si tiene citas activas (pendientes o confirmadas) en el futuro
            // status IN ('pending', 'confirmed', 'on_the_way', 'arrived', 'in_progress')
            const appointmentsRes = await db.listar(
                `SELECT id FROM appointments 
                 WHERE technician_id = ? 
                 AND status IN ('pending', 'confirmed', 'on_the_way', 'arrived', 'in_progress') 
                 AND (scheduled_date > CURDATE() OR (scheduled_date = CURDATE() AND scheduled_time >= CURTIME()))`,
                false,
                [userId]
            );

            if (appointmentsRes.resultado) {
                respuesta.estado = 400;
                respuesta.mensaje = 'No puedes desactivar tu cuenta mientras tengas citas activas programadas. Finaliza o cancela tus servicios pendientes primero.';
                return res.status(400).json(respuesta);
            }
        }

        const dbRes = await db.ejecutar(
            'UPDATE user_profiles SET is_available = ? WHERE user_id = ?',
            [is_available, userId]
        );

        if (!dbRes.exito) {
            respuesta.mensaje = 'Error al actualizar disponibilidad';
            return res.status(500).json(respuesta);
        }

        respuesta.exito = true;
        respuesta.estado = 200;
        respuesta.mensaje = is_available ? 'Ahora estás disponible' : 'Ahora estás inactivo';
        respuesta.resultado = { is_available };
        res.json(respuesta);

    } catch (error) {
        console.error('Toggle availability error:', error);
        respuesta.mensaje = 'Error al cambiar disponibilidad: ' + error.message;
        res.status(500).json(respuesta);
    }
};

module.exports = {
    getProfile,
    updateProfile,
    uploadPhoto,
    getUserById,
    toggleAvailability
};
