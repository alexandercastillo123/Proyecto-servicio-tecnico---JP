/**
 * technician.service.js
 * Single Responsibility: Technician business logic.
 * Delegates all DB access to technician.repository.js
 */
const technicianRepo = require('../repository/technician.repository');
const AppError = require('../utils/AppError');

const getTechnicians = async ({ city, minRating, page = 1, limit = 10 }) => {
    const offset = (page - 1) * limit;
    const [technicians, total] = await Promise.all([
        technicianRepo.findAll({ city, minRating, limit, offset }),
        technicianRepo.countAll({ city, minRating })
    ]);
    return {
        technicians,
        pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total,
            totalPages: Math.ceil(total / limit)
        }
    };
};

const getTechnicianById = async (id) => {
    const tech = await technicianRepo.findById(id);
    if (!tech) throw new AppError('Técnico no encontrado.', 404);
    const schedule = await technicianRepo.getSchedule(id, true);
    return { ...tech, schedule };
};

const getNearbyTechnicians = async ({ lat, lng, radius = 5 }) => {
    if (!lat || !lng) throw new AppError('Se requieren los parámetros lat y lng.', 400);
    const latF = parseFloat(lat);
    const lngF = parseFloat(lng);
    const radiusF = parseFloat(radius);
    if (isNaN(latF) || isNaN(lngF) || isNaN(radiusF)) {
        throw new AppError('Los parámetros lat, lng y radius deben ser números válidos.', 400);
    }
    return technicianRepo.findNearby(latF, lngF, radiusF);
};

const getTechnicianSchedule = async (technicianId) => {
    return technicianRepo.getSchedule(technicianId, false);
};

const createSchedule = async (technicianId, schedules) => {
    if (!Array.isArray(schedules) || schedules.length === 0) {
        throw new AppError('Se requiere un array de horarios válido.', 400);
    }
    await technicianRepo.replaceSchedule(technicianId, schedules);
};

const updateSchedule = async (scheduleId, technicianId, fields) => {
    const affected = await technicianRepo.updateScheduleEntry(scheduleId, technicianId, fields);
    if (affected === 0) throw new AppError('Horario no encontrado o no autorizado.', 404);
};

const addReview = async ({ clientId, technicianId, rating, comment, appointmentId }) => {
    if (!technicianId || !rating) throw new AppError('Técnico y rating son obligatorios.', 400);

    const hasCompleted = await technicianRepo.hasCompletedAppointment(clientId, technicianId);
    if (!hasCompleted) throw new AppError('Solo puedes reseñar después de haber completado un servicio con este técnico.', 403);

    const hasReview = await technicianRepo.hasExistingReview(clientId, technicianId);
    if (hasReview) throw new AppError('Ya has calificado a este técnico.', 400);

    await technicianRepo.insertReview(appointmentId, clientId, technicianId, rating, comment);
    await technicianRepo.recalculateRating(technicianId);
};

module.exports = {
    getTechnicians, getTechnicianById, getNearbyTechnicians,
    getTechnicianSchedule, createSchedule, updateSchedule, addReview
};
