const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const authController = require('../controllers/auth.controller');
const validate = require('../middleware/validation');

/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: Endpoints para autenticación y recuperación de cuenta
 */

/**
 * @swagger
 * /auth/register:
 *   post:
 *     summary: Registrar un nuevo usuario
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password, role, personType]
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *               role:
 *                 type: string
 *                 enum: [client, tech]
 *               personType:
 *                 type: string
 *                 enum: [natural, juridical]
 *               names:
 *                 type: string
 *               surnames:
 *                 type: string
 *               dni:
 *                 type: string
 *               companyName:
 *                 type: string
 *               ruc:
 *                 type: string
 *               phone:
 *                 type: string
 *     responses:
 *       201:
 *         description: Usuario registrado exitosamente
 *       400:
 *         description: Error en la validación o el usuario ya existe
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
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Iniciar sesión
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login exitoso, devuelve JWT
 *       401:
 *         description: Credenciales inválidas
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
 * @swagger
 * /auth/forgot-password:
 *   post:
 *     summary: Solicitar código de recuperación de contraseña
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *     responses:
 *       200:
 *         description: Código enviado al correo
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
 * @swagger
 * /auth/verify-code:
 *   post:
 *     summary: Verificar código de recuperación
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *               code:
 *                 type: string
 *     responses:
 *       200:
 *         description: Código verificado correctamente
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
 * @swagger
 * /auth/reset-password:
 *   post:
 *     summary: Restablecer contraseña con código
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *               code:
 *                 type: string
 *               newPassword:
 *                 type: string
 *     responses:
 *       200:
 *         description: Contraseña restablecida
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

router.post('/validate-email', authController.validateEmail);
router.post('/validate-username', authController.validateUsername);

module.exports = router;

