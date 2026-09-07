/**
 * auth.service.js
 * Single Responsibility: Authentication and authorization business logic.
 * Delegates all DB access to user.repository.js
 */
const bcrypt = require('bcryptjs');
const { pool } = require('../config/database');
const userRepo = require('../repository/user.repository');
const { generateToken } = require('../utils/jwt');
const { isValidEmail } = require('../utils/validators');
const { sendResetCode } = require('../utils/email.service');
const AppError = require('../utils/AppError');

/**
 * Register a new user — handles user + profile + schedules in a transaction.
 */
const registerUser = async (body) => {
    const {
        email, username, password, role, personType,
        names, surnames, dni, companyName, ruc,
        phone, referenceAddress, address, city,
        latitude, longitude, policiesAccepted, schedules
    } = body;

    if (!(await isValidEmail(email))) {
        throw new AppError('El correo electrónico no existe o el dominio es inválido.', 400);
    }

    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        // Uniqueness checks (done in-transaction to avoid race conditions)
        const [existingEmail] = await connection.query('SELECT id FROM users WHERE email = ?', [email]);
        if (existingEmail.length > 0) throw new AppError('El correo electrónico ya está registrado.', 409);

        if (username) {
            const [existingUsername] = await connection.query('SELECT id FROM users WHERE username = ?', [username]);
            if (existingUsername.length > 0) throw new AppError('El nombre de usuario ya está registrado.', 409);
        }

        if (dni || ruc) {
            const [existingProfile] = await connection.query(
                'SELECT user_id FROM user_profiles WHERE dni = ? OR ruc = ?',
                [dni || null, ruc || null]
            );
            if (existingProfile.length > 0) throw new AppError(`El ${dni ? 'DNI' : 'RUC'} ya está registrado.`, 409);
        }

        const passwordHash = await bcrypt.hash(password, 10);
        const isTech = role === 'tech';

        const userId = await userRepo.create(
            { email, username: username || null, passwordHash, role, policiesAccepted: policiesAccepted || false },
            connection
        );

        await userRepo.createProfile({
            userId,
            phone: phone || null,
            address: address || null,
            city: city || null,
            personType,
            names:             personType === 'natural'   ? names       : null,
            surnames:          personType === 'natural'   ? surnames     : null,
            dni:               personType === 'natural'   ? dni         : null,
            companyName:       personType === 'juridical' ? companyName  : null,
            ruc:               personType === 'juridical' ? ruc         : null,
            referenceAddress:  isTech ? referenceAddress : null,
            latitude:          isTech && latitude  ? parseFloat(latitude)  : null,
            longitude:         isTech && longitude ? parseFloat(longitude) : null
        }, connection);

        if (isTech) {
            let schedulesToInsert = [];
            if (schedules && Array.isArray(schedules) && schedules.length > 0) {
                schedulesToInsert = schedules.map(s => [userId, s.dayOfWeek, s.startTime, s.endTime, s.isActive ?? true]);
            } else if (personType === 'natural') {
                ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'].forEach(day =>
                    schedulesToInsert.push([userId, day, '08:00:00', '18:00:00', true])
                );
                schedulesToInsert.push([userId, 'Sunday', '00:00:00', '00:00:00', false]);
            }
            if (schedulesToInsert.length > 0) {
                await connection.query(
                    'INSERT INTO technician_schedules (technician_id, day_of_week, start_time, end_time, is_active) VALUES ?',
                    [schedulesToInsert]
                );
            }
        }

        await connection.commit();
        const token = generateToken({ id: userId, email, username, role });
        return { userId, email, username, role, token };

    } catch (err) {
        await connection.rollback();
        throw err;
    } finally {
        connection.release();
    }
};

/**
 * Authenticate credentials and return a JWT.
 */
const loginUser = async (email, password) => {
    const user = await userRepo.findByEmail(email);
    if (!user) throw new AppError('Correo o contraseña inválidos.', 401);

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) throw new AppError('Correo o contraseña inválidos.', 401);

    const token = generateToken({ id: user.id, email: user.email, username: user.username, role: user.role });
    return { userId: user.id, email: user.email, username: user.username, role: user.role, token };
};

/**
 * Generate, store and email a 6-digit password reset code.
 */
const requestPasswordReset = async (email) => {
    const user = await userRepo.findByEmail(email);
    if (!user) throw new AppError('No se encontró cuenta con este correo.', 404);

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60000);
    await userRepo.saveResetCode(email, code, expiresAt);

    const sent = await sendResetCode(email, code);
    if (!sent) throw new AppError('No se pudo enviar el correo de recuperación. Inténtalo más tarde.', 500);
};

/**
 * Verify that a password reset code is valid and not expired.
 */
const verifyResetCode = async (email, code) => {
    const record = await userRepo.findValidResetCode(email, code);
    if (!record) throw new AppError('Código inválido o expirado.', 400);
};

/**
 * Reset password after code verification.
 */
const resetUserPassword = async (email, code, newPassword) => {
    await verifyResetCode(email, code);
    const passwordHash = await bcrypt.hash(newPassword, 10);
    const affected = await userRepo.updatePasswordByEmail(email, passwordHash);
    if (affected === 0) throw new AppError('Usuario no encontrado.', 404);
    await userRepo.deleteResetCode(email);
};

/**
 * Change password for an authenticated user.
 */
const changeUserPassword = async (userId, newPassword) => {
    const passwordHash = await bcrypt.hash(newPassword, 10);
    const affected = await userRepo.updatePassword(userId, passwordHash);
    if (affected === 0) throw new AppError('Usuario no encontrado.', 404);
};

/**
 * Validate email MX + uniqueness.
 */
const validateEmailAvailability = async (email) => {
    if (!(await isValidEmail(email))) throw new AppError('El correo electrónico no existe o el dominio es inválido.', 400);
    if (await userRepo.emailExists(email)) throw new AppError('El correo electrónico ya está registrado.', 409);
};

/**
 * Validate username uniqueness.
 */
const validateUsernameAvailability = async (username) => {
    if (await userRepo.usernameExists(username)) throw new AppError('El nombre de usuario ya está registrado.', 409);
};

module.exports = {
    registerUser, loginUser,
    requestPasswordReset, verifyResetCode, resetUserPassword,
    changeUserPassword,
    validateEmailAvailability, validateUsernameAvailability
};
