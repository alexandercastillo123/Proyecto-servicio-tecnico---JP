const express = require('express');
const router = express.Router();
const adminController = require('../controllers/admin.controller');
const { authenticate, authorizeRole } = require('../middleware/auth');

// All admin routes require authentication and admin role
router.use(authenticate);
router.use(authorizeRole('admin'));

/**
 * @route   GET /api/admin/appointments
 * @desc    Get all appointments with filters
 */
router.get('/appointments', adminController.getAllAppointments);

/**
 * @route   GET /api/admin/users
 * @desc    Get all users with profiles
 */
router.get('/users', adminController.getAllUsers);

/**
 * @route   GET /api/admin/sucursales
 * @desc    Get all branches
 */
router.get('/sucursales', adminController.getAllBranches);

/**
 * @route   GET /api/admin/orders
 * @desc    Get all store orders
 */
router.get('/orders', adminController.getAllOrders);

module.exports = router;
