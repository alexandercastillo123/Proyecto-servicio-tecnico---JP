const bcrypt = require('bcryptjs');
const db = require('../config/database');
const { generateToken } = require('../utils/jwt');
const { isValidEmail } = require('../utils/validators');
const Respuesta = require('../utils/Respuesta');
const { sendResetCode } = require('../utils/email.service');

/**
 * Register new user
 */
const register = async (req, res) => {
    let respuesta = new Respuesta();
    const connection = await db.pool.getConnection();

    try {
        await connection.beginTransaction();

        const {
            email,
            username,
            password,
            role,
            personType,
            names,
            surnames,
            dni,
            companyName,
            ruc,
            phone,
            referenceAddress,
            address,
            city,
            latitude,   // Coordenadas del técnico (geocodificadas en el app)
            longitude,
            policiesAccepted
        } = req.body;

        // Validate email existence (MX check)
        if (!(await isValidEmail(email))) {
            respuesta.mensaje = 'El correo electrónico no existe o el dominio es inválido';
            return res.status(400).json(respuesta);
        }

        // Check if user already exists
        const [existingUsers] = await connection.query(
            'SELECT id FROM users WHERE email = ?',
            [email]
        );

        if (existingUsers.length > 0) {
            await connection.rollback();
            respuesta.estado = 409;
            respuesta.mensaje = 'El correo electrónico ya está registrado';
            return res.status(409).json(respuesta);
        }

        // Check if username already exists
        if (username) {
            const [existingUsernames] = await connection.query(
                'SELECT id FROM users WHERE username = ?',
                [username]
            );

            if (existingUsernames.length > 0) {
                await connection.rollback();
                respuesta.estado = 409;
                respuesta.mensaje = 'El nombre de usuario ya está registrado';
                return res.status(409).json(respuesta);
            }
        }

        // Check if DNI/RUC already exists
        if (dni || ruc) {
            const [existingProfiles] = await connection.query(
                'SELECT user_id FROM user_profiles WHERE dni = ? OR ruc = ?',
                [dni || null, ruc || null]
            );

            if (existingProfiles.length > 0) {
                await connection.rollback();
                respuesta.estado = 409;
                respuesta.mensaje = `El ${dni ? 'DNI' : 'RUC'} ya está registrado`;
                return res.status(409).json(respuesta);
            }
        }

        // Hash password
        const passwordHash = await bcrypt.hash(password, 10);

        // Insert user
        const [userResult] = await connection.query(
            'INSERT INTO users (email, username, password_hash, role, policies_accepted) VALUES (?, ?, ?, ?, ?)',
            [email, username || null, passwordHash, role, policiesAccepted || false]
        );

        const userId = userResult.insertId;
        const isTech = role === 'tech';

        // Insert user profile
        await connection.query(
            `INSERT INTO user_profiles (
        user_id, phone, address, city, person_type,
        names, surnames, dni, company_name, ruc, reference_address,
        latitude, longitude
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                userId,
                phone || null,
                address || null,
                city || null,
                personType,
                personType === 'natural' ? names : null,
                personType === 'natural' ? surnames : null,
                personType === 'natural' ? dni : null,
                personType === 'juridical' ? companyName : null,
                personType === 'juridical' ? ruc : null,
                isTech ? referenceAddress : null,
                isTech && latitude ? parseFloat(latitude) : null,
                isTech && longitude ? parseFloat(longitude) : null
            ]
        );

        // Handle Technician Schedules
        if (isTech) {
            let schedulesToInsert = [];
            const { schedules } = req.body;

            if (schedules && Array.isArray(schedules) && schedules.length > 0) {
                // Use provided schedules
                schedulesToInsert = schedules.map(s => [
                    userId,
                    s.dayOfWeek,
                    s.startTime,
                    s.endTime,
                    s.isActive !== undefined ? s.isActive : true
                ]);
            } else if (personType === 'natural') {
                // Default schedule for natural person technician: Mon-Sat, 9:00 - 18:00
                const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
                schedulesToInsert = days.map(day => [
                    userId,
                    day,
                    '08:00:00',
                    '18:00:00',
                    true
                ]);
                // Add Sunday as inactive
                schedulesToInsert.push([userId, 'Sunday', '00:00:00', '00:00:00', false]);
            }

            if (schedulesToInsert.length > 0) {
                await connection.query(
                    `INSERT INTO technician_schedules (technician_id, day_of_week, start_time, end_time, is_active)
           VALUES ?`,
                    [schedulesToInsert]
                );
            }
        }

        await connection.commit();

        // Generate token
        const token = generateToken({
            id: userId,
            email: email,
            username: username,
            role: role
        });

        respuesta.exito = true;
        respuesta.estado = 201;
        respuesta.mensaje = '¡Bienvenido! Tu cuenta ha sido creada exitosamente.';
        respuesta.resultado = {
            userId,
            email,
            username,
            role,
            token
        };

        res.status(201).json(respuesta);

    } catch (error) {
        await connection.rollback();
        console.error('Registration error:', error);
        respuesta.mensaje = 'No pudimos completar el registro. Por favor, verifica tus datos e inténtalo de nuevo.';
        res.status(500).json(respuesta);
    } finally {
        connection.release();
    }
};

/**
 * Login user
 */
const login = async (req, res) => {
    let respuesta = new Respuesta();
    try {
        const { email, password } = req.body;

        const dbRes = await db.listar('SELECT id, email, password_hash, role FROM users WHERE email = ?', false, [email]);

        if (!dbRes.exito || !dbRes.resultado) {
            respuesta.estado = 401;
            respuesta.mensaje = 'Correo o contraseña inválidos';
            return res.status(401).json(respuesta);
        }

        const user = dbRes.resultado;

        // Verify password
        const isPasswordValid = await bcrypt.compare(password, user.password_hash);

        if (!isPasswordValid) {
            respuesta.estado = 401;
            respuesta.mensaje = 'Correo o contraseña inválidos';
            return res.status(401).json(respuesta);
        }

        // Generate token
        const token = generateToken({
            id: user.id,
            email: user.email,
            username: user.username,
            role: user.role
        });

        respuesta.exito = true;
        respuesta.estado = 200;
        respuesta.mensaje = 'Bienvenido de nuevo. Has iniciado sesión correctamente.';
        respuesta.resultado = {
            userId: user.id,
            email: user.email,
            username: user.username,
            role: user.role,
            token
        };

        res.json(respuesta);

    } catch (error) {
        console.error('Login error:', error);
        respuesta.mensaje = 'Hubo un problema al intentar ingresar. Revisa tus credenciales o inténtalo más tarde.';
        res.status(500).json(respuesta);
    }
};

/**
 * Request password reset (send verification code)
 */
const forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;

        // Check if user exists
        const [users] = await db.pool.query(
            'SELECT id FROM users WHERE email = ?',
            [email]
        );

        if (users.length === 0) {
            return res.status(404).json({
                exito: false,
                estado: 404,
                mensaje: 'No se encontró cuenta con este correo'
            });
        }

        // Generate 6-digit code
        const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
        const expiresAt = new Date(Date.now() + 10 * 60000); // 10 minutes from now

        // Delete any existing codes for this email to avoid clutter
        await db.ejecutar('DELETE FROM password_resets WHERE email = ?', [email]);

        // Save code to DB
        const insertRes = await db.ejecutar(
            'INSERT INTO password_resets (email, code, expires_at) VALUES (?, ?, ?)',
            [email, verificationCode, expiresAt]
        );

        if (!insertRes.exito) {
            return res.status(500).json({
                exito: false,
                estado: 500,
                mensaje: 'Error interno al generar código de recuperación'
            });
        }

        // Send email via SMTP
        const emailSent = await sendResetCode(email, verificationCode);

        if (!emailSent) {
            return res.status(500).json({
                exito: false,
                estado: 500,
                mensaje: 'No se pudo enviar el correo de recuperación. Inténtalo más tarde.'
            });
        }

        res.json({
            exito: true,
            estado: 200,
            mensaje: 'Hemos enviado un código de seguridad a tu correo electrónico.'
        });

    } catch (error) {
        console.error('Forgot password error:', error);
        res.status(500).json({
            exito: false,
            estado: 500,
            mensaje: 'Error al enviar correo de recuperación'
        });
    }
};

/**
 * Verify reset code
 */
const verifyCode = async (req, res) => {
    let respuesta = new Respuesta();
    try {
        const { email, code } = req.body;
        console.log(`[DEBUG] Intentando verificar código: "${code}" para email: "${email}"`);

        // Log all records for this email to see what's happening
        const [allResets] = await db.pool.query(
            'SELECT code, expires_at, NOW() as db_now FROM password_resets WHERE email = ?',
            [email]
        );
        console.log(`[DEBUG] Estado actual en DB para ${email}:`, allResets);

        const [validResult] = await db.pool.query(
            'SELECT id FROM password_resets WHERE email = ? AND code = ? AND expires_at > NOW()',
            [email, code]
        );

        if (validResult.length === 0) {
            respuesta.mensaje = 'Código inválido o expirado';
            respuesta.estado = 400;
            respuesta.exito = false;
            return res.status(400).json(respuesta);
        }

        respuesta.exito = true;
        respuesta.mensaje = 'Código validado correctamente.';
        res.json(respuesta);

    } catch (error) {
        console.error('Verify code error:', error);
        res.status(500).json({
            exito: false,
            estado: 500,
            mensaje: 'Error al verificar el código'
        });
    }
};

/**
 * Reset password with verification code
 */
const resetPassword = async (req, res) => {
    try {
        const { email, code, newPassword } = req.body;

        // Verify code again before resetting
        const [results] = await db.pool.query(
            'SELECT id FROM password_resets WHERE email = ? AND code = ? AND expires_at > NOW()',
            [email, code]
        );

        if (results.length === 0) {
            return res.status(400).json({
                exito: false,
                estado: 400,
                mensaje: 'Código inválido o expirado'
            });
        }

        // Hash new password
        const passwordHash = await bcrypt.hash(newPassword, 10);

        // Update password
        const [result] = await db.pool.query(
            'UPDATE users SET password_hash = ? WHERE email = ?',
            [passwordHash, email]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                exito: false,
                estado: 404,
                mensaje: 'Usuario no encontrado'
            });
        }

        // Clean up: delete the used code
        await db.ejecutar('DELETE FROM password_resets WHERE email = ?', [email]);

        res.json({
            exito: true,
            estado: 200,
            mensaje: 'Tu contraseña ha sido actualizada. Ahora puedes iniciar sesión con tus nuevas credenciales.'
        });

    } catch (error) {
        console.error('Reset password error:', error);
        res.status(500).json({
            exito: false,
            estado: 500,
            mensaje: 'Error al restablecer la contraseña'
        });
    }
};

/**
 * Validate email availability and existence (for real-time UI)
 */
const validateEmailEndpoint = async (req, res) => {
    let respuesta = new Respuesta();
    try {
        const { email } = req.body;
        if (!email) {
            respuesta.mensaje = 'El correo es obligatorio';
            return res.status(400).json(respuesta);
        }

        if (!(await isValidEmail(email))) {
            respuesta.mensaje = 'El correo electrónico no existe o el dominio es inválido';
            return res.status(400).json(respuesta);
        }

        const [existing] = await db.pool.query('SELECT id FROM users WHERE email = ?', [email]);
        if (existing.length > 0) {
            respuesta.mensaje = 'El correo electrónico ya está registrado';
            return res.status(409).json(respuesta);
        }

        respuesta.exito = true;
        respuesta.mensaje = 'El correo ingresado es válido y está disponible.';
        res.json(respuesta);
    } catch (error) {
        respuesta.mensaje = 'Error al validar correo';
        res.status(500).json(respuesta);
    }
};

/**
 * Validate username availability (for real-time UI)
 */
const validateUsernameEndpoint = async (req, res) => {
    let respuesta = new Respuesta();
    try {
        const { username } = req.body;
        if (!username) {
            respuesta.mensaje = 'El usuario es obligatorio';
            return res.status(400).json(respuesta);
        }

        const [existing] = await db.pool.query('SELECT id FROM users WHERE username = ?', [username]);
        if (existing.length > 0) {
            respuesta.mensaje = 'El nombre de usuario ya está registrado';
            return res.status(409).json(respuesta);
        }

        respuesta.exito = true;
        respuesta.mensaje = 'El nombre de usuario está disponible.';
        res.json(respuesta);
    } catch (error) {
        respuesta.mensaje = 'Error al validar usuario';
        res.status(500).json(respuesta);
    }
};

/**
 * Change password for authenticated user
 */
const changePassword = async (req, res) => {
    let respuesta = new Respuesta();
    try {
        const userId = req.user.id;
        const { newPassword } = req.body;

        if (!newPassword || newPassword.length < 6) {
            respuesta.mensaje = 'La nueva contraseña debe tener al menos 6 caracteres';
            return res.status(400).json(respuesta);
        }

        const passwordHash = await bcrypt.hash(newPassword, 10);

        const [result] = await db.pool.query(
            'UPDATE users SET password_hash = ? WHERE id = ?',
            [passwordHash, userId]
        );

        if (result.affectedRows === 0) {
            respuesta.mensaje = 'Usuario no encontrado';
            return res.status(404).json(respuesta);
        }

        respuesta.exito = true;
        respuesta.mensaje = 'Tu contraseña se ha actualizado correctamente.';
        res.json(respuesta);

    } catch (error) {
        console.error('Change password error:', error);
        respuesta.mensaje = 'Error al cambiar la contraseña: ' + error.message;
        res.status(500).json(respuesta);
    }
};

module.exports = {
    register,
    login,
    forgotPassword,
    verifyCode,
    resetPassword,
    validateEmail: validateEmailEndpoint,
    validateUsername: validateUsernameEndpoint,
    changePassword
};
