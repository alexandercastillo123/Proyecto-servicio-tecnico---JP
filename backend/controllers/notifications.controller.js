const Respuesta = require('../utils/Respuesta');
const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/AppError');
const notificationRepo = require('../repository/notification.repository');

/**
 * GET /api/notifications/settings
 */
const getSettings = asyncHandler(async (req, res) => {
    const userId = req.user.id;
    let settings = await notificationRepo.getSettings(userId);
    if (!settings) {
        await notificationRepo.createDefaultSettings(userId);
        settings = await notificationRepo.getSettings(userId);
    }
    res.json(Respuesta.ok(settings, 'Éxito'));
});

/**
 * PUT /api/notifications/settings
 */
const updateSettings = asyncHandler(async (req, res) => {
    await notificationRepo.updateSettings(req.user.id, req.body);
    res.json(Respuesta.ok(null, 'Configuración actualizada.'));
});

/**
 * GET /api/notifications
 */
const getNotifications = asyncHandler(async (req, res) => {
    const data = await notificationRepo.findByUser(req.user.id, 50);
    res.json(Respuesta.ok(data, 'Éxito'));
});

/**
 * PUT /api/notifications/:id/read
 */
const markAsRead = asyncHandler(async (req, res) => {
    const affected = await notificationRepo.markAsRead(req.params.id, req.user.id);
    if (affected === 0) throw new AppError('Notificación no encontrada o no autorizada.', 404);
    res.json(Respuesta.ok(null, 'Notificación marcada como leída.'));
});

/**
 * POST /api/notifications/token
 */
const saveToken = asyncHandler(async (req, res) => {
    const { token, platform } = req.body;
    if (!token) return res.status(400).json(Respuesta.fail('Token es requerido.'));
    await notificationRepo.saveToken(req.user.id, token, platform);
    res.json(Respuesta.ok(null, 'Token registrado correctamente.'));
});

/**
 * DELETE /api/notifications/token/:token
 */
const removeToken = asyncHandler(async (req, res) => {
    await notificationRepo.removeToken(req.user.id, req.params.token);
    res.json(Respuesta.ok(null, 'Token eliminado correctamente.'));
});

module.exports = { getSettings, updateSettings, getNotifications, markAsRead, saveToken, removeToken };