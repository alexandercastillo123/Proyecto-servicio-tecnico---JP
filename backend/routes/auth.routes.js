const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const authController = require('../controllers/auth.controller');
const validate = require('../middleware/validation');

/**
 * @route   POST /api/auth/register
 * @desc    Register new user
 * @access  Public
 */
router.post(
    '/register',
    [
        body('email').isEmail().withMessage('Valid email is required'),
        body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
        body('role').isIn(['client', 'tech']).withMessage('Role must be client or tech'),
        body('personType').isIn(['natural', 'juridical']).withMessage('Person type must be natural or juridical'),
        body('phone').optional().isMobilePhone().withMessage('Valid phone number is required')
    ],
    validate,
    authController.register
);

/**
 * @route   POST /api/auth/login
 * @desc    Login user
 * @access  Public
 */
router.post(
    '/login',
    [
        body('email').isEmail().withMessage('Valid email is required'),
        body('password').notEmpty().withMessage('Password is required')
    ],
    validate,
    authController.login
);

/**
 * @route   POST /api/auth/forgot-password
 * @desc    Request password reset code
 * @access  Public
 */
router.post(
    '/forgot-password',
    [
        body('email').isEmail().withMessage('Valid email is required')
    ],
    validate,
    authController.forgotPassword
);

/**
 * @route   POST /api/auth/verify-code
 * @desc    Verify password reset code
 * @access  Public
 */
router.post(
    '/verify-code',
    [
        body('email').isEmail().withMessage('Valid email is required'),
        body('code').isLength({ min: 6, max: 6 }).withMessage('Code must be 6 digits')
    ],
    validate,
    authController.verifyCode
);

/**
 * @route   POST /api/auth/reset-password
 * @desc    Reset password with code
 * @access  Public
 */
router.post(
    '/reset-password',
    [
        body('email').isEmail().withMessage('Valid email is required'),
        body('code').isLength({ min: 6, max: 6 }).withMessage('Code must be 6 digits'),
        body('newPassword').isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
    ],
    validate,
    authController.resetPassword
);

module.exports = router;
