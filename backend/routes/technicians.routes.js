const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const techniciansController = require('../controllers/technicians.controller');
const { authenticate, authorizeRole } = require('../middleware/auth');
const validate = require('../middleware/validation');

/**
 * @route   GET /api/technicians
 * @desc    Get list of technicians with filters
 * @access  Public
 */
router.get('/', techniciansController.getTechnicians);

/**
 * @route   GET /api/technicians/:id
 * @desc    Get technician details with schedule
 * @access  Public
 */
router.get('/:id', techniciansController.getTechnicianById);

/**
 * @route   GET /api/technicians/:id/schedule
 * @desc    Get technician schedule
 * @access  Public
 */
router.get('/:id/schedule', techniciansController.getTechnicianSchedule);

/**
 * @route   POST /api/technicians/schedule
 * @desc    Create/update technician schedule
 * @access  Private (Tech only)
 */
router.post(
    '/schedule',
    authenticate,
    authorizeRole('tech'),
    [
        body('schedules').isArray().withMessage('Schedules must be an array'),
        body('schedules.*.dayOfWeek').isIn(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'])
            .withMessage('Invalid day of week'),
        body('schedules.*.startTime').matches(/^([01]\d|2[0-3]):([0-5]\d)$/).withMessage('Invalid start time format'),
        body('schedules.*.endTime').matches(/^([01]\d|2[0-3]):([0-5]\d)$/).withMessage('Invalid end time format')
    ],
    validate,
    techniciansController.createSchedule
);

/**
 * @route   PUT /api/technicians/schedule/:id
 * @desc    Update specific schedule entry
 * @access  Private (Tech only)
 */
router.put(
    '/schedule/:id',
    authenticate,
    authorizeRole('tech'),
    techniciansController.updateSchedule
);

/**
 * @route   GET /api/technicians/:id/reviews
 * @desc    Get reviews for a technician
 * @access  Public
 */
router.get('/:id/reviews', techniciansController.getTechnicianReviews);

/**
 * @route   POST /api/technicians/review
 * @desc    Add review for a technician
 * @access  Private
 */
router.post(
    '/review',
    authenticate,
    [
        body('technicianId').isInt().withMessage('Technician ID must be an integer'),
        body('rating').isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5')
    ],
    validate,
    techniciansController.addReview
);

module.exports = router;
