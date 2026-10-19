const Respuesta = require('../utils/Respuesta');
const asyncHandler = require('../utils/asyncHandler');
const authService = require('../services/auth.service');

/**
 * POST /api/auth/register
 */
const register = asyncHandler(async (req, res) => {
    const data = await authService.registerUser(req.body);
    res.status(201).json(Respuesta.ok(data, '¡Bienvenido! Tu cuenta ha sido creada exitosamente.', 201));
});

/**
 * POST /api/auth/login
 */
const login = asyncHandler(async (req, res) => {
    const { email, password } = req.body;
    const data = await authService.loginUser(email, password);
    res.json(Respuesta.ok(data, 'Bienvenido de nuevo. Has iniciado sesión correctamente.'));
});

/**
 * POST /api/auth/forgot-password
 */
const forgotPassword = asyncHandler(async (req, res) => {
    await authService.requestPasswordReset(req.body.email);
    res.json(Respuesta.ok(null, 'Hemos enviado un código de seguridad a tu correo electrónico.'));
});

/**
 * POST /api/auth/verify-code
 */
const verifyCode = asyncHandler(async (req, res) => {
    const { email, code } = req.body;
    await authService.verifyResetCode(email, code);
    res.json(Respuesta.ok(null, 'Código validado correctamente.'));
});

/**
 * POST /api/auth/reset-password
 */
const resetPassword = asyncHandler(async (req, res) => {
    const { email, code, newPassword } = req.body;
    await authService.resetUserPassword(email, code, newPassword);
    res.json(Respuesta.ok(null, 'Tu contraseña ha sido actualizada. Ahora puedes iniciar sesión con tus nuevas credenciales.'));
});

/**
 * POST /api/auth/validate-email
 */
const validateEmail = asyncHandler(async (req, res) => {
    const { email } = req.body;
    if (!email) return res.status(400).json(Respuesta.fail('El correo es obligatorio.'));
    await authService.validateEmailAvailability(email);
    res.json(Respuesta.ok(null, 'El correo ingresado es válido y está disponible.'));
});

/**
 * POST /api/auth/validate-username
 */
const validateUsername = asyncHandler(async (req, res) => {
    const { username } = req.body;
    if (!username) return res.status(400).json(Respuesta.fail('El usuario es obligatorio.'));
    await authService.validateUsernameAvailability(username);
    res.json(Respuesta.ok(null, 'El nombre de usuario está disponible.'));
});

/**
 * POST /api/auth/change-password
 */
const changePassword = asyncHandler(async (req, res) => {
    const { newPassword } = req.body;
    if (!newPassword || newPassword.length < 6) {
        return res.status(400).json(Respuesta.fail('La nueva contraseña debe tener al menos 6 caracteres.'));
    }
    await authService.changeUserPassword(req.user.id, newPassword);
    res.json(Respuesta.ok(null, 'Tu contraseña se ha actualizado correctamente.'));
});

module.exports = {
    register,
    login,
    forgotPassword,
    verifyCode,
    resetPassword,
    validateEmail,
    validateUsername,
    changePassword
};
