const Respuesta = require('../utils/Respuesta');
const asyncHandler = require('../utils/asyncHandler');
const adminService = require('../services/admin.service');

const getAllAppointments = asyncHandler(async (req, res) => {
    const data = await adminService.getAllAppointments(req.query);
    res.json(Respuesta.ok(data, 'Éxito'));
});

const getAllUsers = asyncHandler(async (req, res) => {
    const data = await adminService.getAllUsers(req.query);
    res.json(Respuesta.ok(data, 'Éxito'));
});

const getAllBranches = asyncHandler(async (req, res) => {
    const data = await adminService.getAllBranches();
    res.json(Respuesta.ok(data, 'Éxito'));
});

const getAllOrders = asyncHandler(async (req, res) => {
    const data = await adminService.getAllOrders(req.query);
    res.json(Respuesta.ok(data, 'Éxito'));
});

module.exports = { getAllAppointments, getAllUsers, getAllBranches, getAllOrders };
