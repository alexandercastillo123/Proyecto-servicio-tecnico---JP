const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const usersController = require('../controllers/users.controller');
const { authenticate } = require('../middleware/auth');
const validate = require('../middleware/validation');
const upload = require('../utils/fileUpload');

/**
 * @route   GET /api/users/profile
 * @desc    Get authenticated user's profile
 * @access  Private
 */
router.get('/profile', authenticate, usersController.getProfile);

/**
 * @route   PUT /api/users/profile
 * @desc    Update user profile
 * @access  Private
 */
router.put(
    '/profile',
    authenticate,
    [
        body('phone').optional().isMobilePhone().withMessage('Valid phone number is required'),
        body('email').optional().isEmail().withMessage('Valid email is required')
    ],
    validate,
    usersController.updateProfile
);

/**
 * @route   POST /api/users/profile/photo
 * @desc    Upload profile photo
 * @access  Private
 */
router.post(
    '/profile/photo',
    authenticate,
    upload.single('photo'),
    usersController.uploadPhoto
);

/**
 * @route   GET /api/users/:id
 * @desc    Get user public profile by ID
 * @access  Public
 */
router.get('/:id', usersController.getUserById);

/**
 * @route   PATCH /api/users/availability
 * @desc    Toggle technician availability (active/inactive)
 * @access  Private (Tech only)
 */
router.patch('/availability', authenticate, usersController.toggleAvailability);

module.exports = router;
