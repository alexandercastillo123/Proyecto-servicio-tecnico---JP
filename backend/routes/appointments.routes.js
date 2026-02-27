const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const appointmentsController = require('../controllers/appointments.controller');
const { authenticate } = require('../middleware/auth');
const validate = require('../middleware/validation');

/**
 * @route   POST /api/appointments
 * @desc    Create new appointment
 * @access  Private
 */
router.post(
    '/',
    authenticate,
    [
        body('technicianId').isInt().withMessage('Valid technician ID is required'),
        body('scheduledDate').isDate().withMessage('Valid date is required (YYYY-MM-DD)'),
        body('scheduledTime').matches(/^([01]\d|2[0-3]):([0-5]\d)$/).withMessage('Valid time is required (HH:MM)'),
        body('description').optional().isString()
    ],
    validate,
    appointmentsController.createAppointment
);

/**
 * @route   GET /api/appointments
 * @desc    Get user appointments
 * @access  Private
 */
router.get('/', authenticate, appointmentsController.getAppointments);

/**
 * @route   GET /api/appointments/:id
 * @desc    Get specific appointment details
 * @access  Private
 */
router.get('/:id', authenticate, appointmentsController.getAppointmentById);

/**
 * @route   PUT /api/appointments/:id/status
 * @desc    Update appointment status
 * @access  Private
 */
router.put(
    '/:id/status',
    authenticate,
    [
        body('status').isIn(['pending', 'confirmed', 'completed', 'cancelled'])
            .withMessage('Invalid status value')
    ],
    validate,
    appointmentsController.updateAppointmentStatus
);

/**
 * @route   PATCH /api/appointments/:id/price
 * @desc    Set appointment price (Technician)
 */
router.patch(
    '/:id/price',
    authenticate,
    [
        body('price').isDecimal().withMessage('Valid price is required')
    ],
    validate,
    appointmentsController.setAppointmentPrice
);

/**
 * @route   POST /api/appointments/:id/pay
 * @desc    Pay appointment (Client)
 */
router.post(
    '/:id/pay',
    authenticate,
    [
        body('paymentMethod').isIn(['yape', 'plin', 'transfer', 'cash']).withMessage('Invalid payment method')
    ],
    validate,
    appointmentsController.payAppointment
);

/**
 * @route   POST /api/appointments/:id/confirm-payment
 * @desc    Confirm payment (Technician)
 */
router.post('/:id/confirm-payment', authenticate, appointmentsController.confirmPayment);

/**
 * @route   DELETE /api/appointments/:id
 * @desc    Cancel appointment
 * @access  Private
 */
router.delete('/:id', authenticate, appointmentsController.cancelAppointment);

module.exports = router;
