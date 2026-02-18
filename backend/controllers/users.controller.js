const db = require('../config/database');
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
        u.id, u.email, u.role, u.created_at,
        up.phone, up.profile_image_url, up.address, up.city,
        up.person_type, up.names, up.surnames, up.dni,
        up.company_name, up.ruc, up.reference_address,
        up.rating, up.reviews_count
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
            phone,
            address,
            city,
            names,
            surnames,
            dni,
            companyName,
            ruc,
            referenceAddress
        } = req.body;

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
        reference_address = COALESCE(?, reference_address)
      WHERE user_id = ?`,
            [phone, address, city, names, surnames, dni, companyName, ruc, referenceAddress, userId]
        );

        if (!dbRes.exito || dbRes.resultado.affectedRows === 0) {
            respuesta.estado = 404;
            respuesta.mensaje = 'Perfil no encontrado o error al actualizar';
            return res.status(404).json(respuesta);
        }

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

        const imageUrl = `/uploads/${req.file.filename}`;

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
        u.id, u.email, u.role,
        up.phone, up.profile_image_url, up.address, up.city,
        up.person_type, up.names, up.surnames, up.dni,
        up.company_name, up.ruc, up.reference_address,
        up.rating, up.reviews_count
      FROM users u
      LEFT JOIN user_profiles up ON u.id = up.user_id
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

module.exports = {
    getProfile,
    updateProfile,
    uploadPhoto,
    getUserById
};
