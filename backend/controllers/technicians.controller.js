const Respuesta = require('../utils/Respuesta');
const asyncHandler = require('../utils/asyncHandler');
const technicianService = require('../services/technician.service');

/**
 * GET /api/technicians
 */
const getTechnicians = asyncHandler(async (req, res) => {
    const data = await technicianService.getTechnicians(req.query);
    res.json(Respuesta.ok(data, 'Éxito'));
});

/**
 * GET /api/technicians/nearby
 */
const getNearbyTechnicians = asyncHandler(async (req, res) => {
    const data = await technicianService.getNearbyTechnicians(req.query);
    res.json(Respuesta.ok(data, 'Técnicos cercanos obtenidos.'));
});

/**
 * GET /api/technicians/:id
 */
const getTechnicianById = asyncHandler(async (req, res) => {
    const data = await technicianService.getTechnicianById(req.params.id);
    res.json(Respuesta.ok(data, 'Éxito'));
});

/**
 * GET /api/technicians/:id/schedule
 */
const getTechnicianSchedule = asyncHandler(async (req, res) => {
    const data = await technicianService.getTechnicianSchedule(req.params.id);
    res.json(Respuesta.ok(data, 'Éxito'));
});

/**
 * POST /api/technicians/schedule
 */
const createSchedule = asyncHandler(async (req, res) => {
    await technicianService.createSchedule(req.user.id, req.body.schedules);
    res.json(Respuesta.ok(null, 'Horario guardado correctamente.'));
});

/**
 * PUT /api/technicians/schedule/:id
 */
const updateSchedule = asyncHandler(async (req, res) => {
    await technicianService.updateSchedule(req.params.id, req.user.id, req.body);
    res.json(Respuesta.ok(null, 'Horario actualizado correctamente.'));
});

/**
 * POST /api/technicians/review
 */
const addReview = asyncHandler(async (req, res) => {
    await technicianService.addReview({ clientId: req.user.id, ...req.body });
    res.status(201).json(Respuesta.ok(null, 'Reseña enviada con éxito.', 201));
});

module.exports = {
    getTechnicians, getNearbyTechnicians, getTechnicianById,
    getTechnicianSchedule, createSchedule, updateSchedule, addReview
};
