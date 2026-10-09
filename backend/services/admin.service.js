/**
 * admin.service.js
 * Single Responsibility: Admin business logic (thin layer over admin.repository).
 */
const adminRepo = require('../repository/admin.repository');

const getAllAppointments = (filters) => adminRepo.getAllAppointments(filters);
const getAllUsers = (filters) => adminRepo.getAllUsers(filters);
const getAllBranches = () => adminRepo.getAllBranches();
const getAllOrders = (filters) => adminRepo.getAllOrders(filters);

module.exports = { getAllAppointments, getAllUsers, getAllBranches, getAllOrders };
