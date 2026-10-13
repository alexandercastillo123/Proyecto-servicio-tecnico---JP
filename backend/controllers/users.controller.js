const Respuesta = require('../utils/Respuesta');
const asyncHandler = require('../utils/asyncHandler');
const userService = require('../services/user.service');
const upload = require('../middleware/upload');

/**
 * GET /api/users/profile
 */
const getProfile = asyncHandler(async (req, res) => {
    const data = await userService.getProfile(req.user.id);
    res.json(Respuesta.ok(data, 'Éxito'));
});

/**
 * PUT /api/users/profile
 */
const updateProfile = asyncHandler(async (req, res) => {
    await userService.updateProfile(req.user.id, req.body);
    res.json(Respuesta.ok(null, 'Perfil actualizado con éxito.'));
});

/**
 * POST /api/users/upload-photo
 */
const uploadPhoto = asyncHandler(async (req, res) => {
    if (!req.file) {
        return res.status(400).json(Respuesta.fail('No se ha subido ningún archivo.'));
    }
    const imageUrl = upload.getRelativePath(req.file);
    await userService.updateProfileImage(req.user.id, imageUrl);
    res.json(Respuesta.ok({ imageUrl }, 'Foto subida con éxito.'));
});

/**
 * GET /api/users/:id
 */
const getUserById = asyncHandler(async (req, res) => {
    const data = await userService.getUserById(req.params.id);
    res.json(Respuesta.ok(data, 'Éxito'));
});

/**
 * PATCH /api/users/availability
 */
const toggleAvailability = asyncHandler(async (req, res) => {
    const { is_available } = req.body;
    await userService.toggleAvailability(req.user.id, is_available);
    const msg = is_available ? 'Ahora estás disponible.' : 'Ahora estás inactivo.';
    res.json(Respuesta.ok({ is_available }, msg));
});

module.exports = {
    getProfile,
    updateProfile,
    uploadPhoto,
    getUserById,
    toggleAvailability
};
