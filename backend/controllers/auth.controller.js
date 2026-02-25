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
            longitude
        } = req.body;

        // Validate email
        if (!isValidEmail(email)) {
            respuesta.mensaje = 'Formato de correo inválido';
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
            'INSERT INTO users (email, username, password_hash, role) VALUES (?, ?, ?, ?)',
            [email, username || null, passwordHash, role]
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
        respuesta.mensaje = 'Usuario registrado con éxito';
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
        respuesta.mensaje = 'Error en el registro: ' + error.message;
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
        respuesta.mensaje = 'Inicio de sesión exitoso';
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
        respuesta.mensaje = 'Error al iniciar sesión: ' + error.message;
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
        await db.ejecutar(
            'INSERT INTO password_resets (email, code, expires_at) VALUES (?, ?, ?)',
            [email, verificationCode, expiresAt]
        );

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
            mensaje: 'Código de verificación enviado al correo'
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
    try {
        const { email, code } = req.body;

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

        res.json({
            exito: true,
            estado: 200,
            mensaje: 'Código verificado con éxito'
        });

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
            mensaje: 'Contraseña restablecida con éxito'
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

module.exports = {
    register,
    login,
    forgotPassword,
    verifyCode,
    resetPassword
};
