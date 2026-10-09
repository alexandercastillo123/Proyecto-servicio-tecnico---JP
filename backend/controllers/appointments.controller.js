const Respuesta = require('../utils/Respuesta');
const asyncHandler = require('../utils/asyncHandler');
const appointmentService = require('../services/appointment.service');

/**
 * POST /api/appointments
 */
const createAppointment = asyncHandler(async (req, res) => {
    const { technicianId, scheduledDate, scheduledTime, description, serviceLat, serviceLng, serviceAddress, serviceType } = req.body;
    const data = await appointmentService.createAppointment({
        clientId: req.user.id, technicianId, scheduledDate, scheduledTime,
        description, serviceLat, serviceLng, serviceAddress, serviceType
    });
    res.status(201).json(Respuesta.ok(data, '¡Tu cita ha sido agendada con éxito!', 201));
});

/**
 * GET /api/appointments
 */
const getAppointments = asyncHandler(async (req, res) => {
    const rows = await appointmentService.getAppointments(req.user.id, req.query.status);
    res.json(Respuesta.ok(rows, 'Éxito'));
});

/**
 * GET /api/appointments/:id
 */
const getAppointmentById = asyncHandler(async (req, res) => {
    const data = await appointmentService.getAppointmentById(req.params.id, req.user.id);
    res.json(Respuesta.ok(data, 'Éxito'));
});

/**
 * PATCH /api/appointments/:id/status
 */
const updateAppointmentStatus = asyncHandler(async (req, res) => {
    await appointmentService.updateAppointmentStatus(
        req.params.id, req.user.id, req.user.role, req.body.status
    );
    res.json(Respuesta.ok(null, 'El estado de la cita ha sido actualizado correctamente.'));
});

/**
 * PATCH /api/appointments/:id/cancel
 */
const cancelAppointment = asyncHandler(async (req, res) => {
    const newStatus = await appointmentService.cancelAppointment(req.params.id, req.user.id);
    const msg = newStatus === 'cancelled'
        ? 'Tu cita ha sido cancelada correctamente.'
        : 'Tu solicitud de cancelación ha sido enviada para validación.';
    res.json(Respuesta.ok(null, msg));
});

/**
 * PATCH /api/appointments/:id/price
 */
const setAppointmentPrice = asyncHandler(async (req, res) => {
    await appointmentService.setAppointmentPrice(req.params.id, req.user.id, req.body.price);
    res.json(Respuesta.ok(null, 'Precio establecido con éxito.'));
});

/**
 * PATCH /api/appointments/:id/pay
 */
const payAppointment = asyncHandler(async (req, res) => {
    await appointmentService.payAppointment(req.params.id, req.user.id, req.body.paymentMethod);
    res.json(Respuesta.ok(null, 'Tu pago ha sido registrado. El técnico validará la recepción en breve.'));
});

/**
 * PATCH /api/appointments/:id/confirm-payment
 */
const confirmPayment = asyncHandler(async (req, res) => {
    await appointmentService.confirmPayment(req.params.id, req.user.id);
    res.json(Respuesta.ok(null, '¡Pago validado con éxito! La cita ahora está lista para el servicio.'));
});

/**
 * PATCH /api/appointments/:id/confirm-completion
 */
const confirmCompletion = asyncHandler(async (req, res) => {
    await appointmentService.confirmCompletion(req.params.id, req.user.id);
    res.json(Respuesta.ok(null, '¡Gracias por confirmar! El servicio ha concluido oficialmente.'));
});

module.exports = {
    createAppointment,
    getAppointments,
    getAppointmentById,
    updateAppointmentStatus,
    cancelAppointment,
    setAppointmentPrice,
    payAppointment,
    confirmPayment,
    confirmCompletion
};
