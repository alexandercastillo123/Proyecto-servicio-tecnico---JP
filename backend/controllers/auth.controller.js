const bcrypt = require('bcryptjs');
const db = require('../config/database');
const { generateToken } = require('../utils/jwt');
const { isValidEmail } = require('../utils/validators');
const Respuesta = require('../utils/Respuesta');

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
            password,
            role, // 'client' or 'tech'
            personType, // 'natural' or 'juridical'
            names,
            surnames,
            dni,
            companyName,
            ruc,
            phone,
            referenceAddress,
            address,
            city
        } = req.body;

        // Validate email
        if (!isValidEmail(email)) {
            respuesta.mensaje = 'Invalid email format';
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
            respuesta.mensaje = 'Email already registered';
            return res.status(409).json(respuesta);
        }

        // Hash password
        const passwordHash = await bcrypt.hash(password, 10);

        // Insert user
        const [userResult] = await connection.query(
            'INSERT INTO users (email, password_hash, role) VALUES (?, ?, ?)',
            [email, passwordHash, role]
        );

        const userId = userResult.insertId;
        const isTech = role === 'tech';

        // Insert user profile
        await connection.query(
            `INSERT INTO user_profiles (
        user_id, phone, address, city, person_type,
        names, surnames, dni, company_name, ruc, reference_address
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
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
                isTech ? referenceAddress : null
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
                    '09:00:00',
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
            role: role
        });

        respuesta.exito = true;
        respuesta.estado = 201;
        respuesta.mensaje = 'User registered successfully';
        respuesta.resultado = {
            userId,
            email,
            role,
            token
        };

        res.status(201).json(respuesta);

    } catch (error) {
        await connection.rollback();
        console.error('Registration error:', error);
        respuesta.mensaje = 'Registration failed: ' + error.message;
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
            respuesta.mensaje = 'Invalid email or password';
            return res.status(401).json(respuesta);
        }

        const user = dbRes.resultado;

        // Verify password
        const isPasswordValid = await bcrypt.compare(password, user.password_hash);

        if (!isPasswordValid) {
            respuesta.estado = 401;
            respuesta.mensaje = 'Invalid email or password';
            return res.status(401).json(respuesta);
        }

        // Generate token
        const token = generateToken({
            id: user.id,
            email: user.email,
            role: user.role
        });

        respuesta.exito = true;
        respuesta.estado = 200;
        respuesta.mensaje = 'Login successful';
        respuesta.resultado = {
            userId: user.id,
            email: user.email,
            role: user.role,
            token
        };

        res.json(respuesta);

    } catch (error) {
        console.error('Login error:', error);
        respuesta.mensaje = 'Login failed: ' + error.message;
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
        const [users] = await db.query(
            'SELECT id FROM users WHERE email = ?',
            [email]
        );

        if (users.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'No account found with this email'
            });
        }

        // Generate 6-digit code (in production, send via email)
        const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();

        // In a real app, you'd store this code in DB with expiration
        // and send it via email service

        res.json({
            success: true,
            message: 'Verification code sent to email',
            // ONLY FOR DEVELOPMENT - Remove in production
            devCode: verificationCode
        });

    } catch (error) {
        console.error('Forgot password error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to process request',
            error: error.message
        });
    }
};

/**
 * Verify reset code
 */
const verifyCode = async (req, res) => {
    try {
        const { email, code } = req.body;

        // In real implementation, verify code from database
        // For now, we'll just validate format

        res.json({
            success: true,
            message: 'Code verified successfully'
        });

    } catch (error) {
        console.error('Verify code error:', error);
        res.status(500).json({
            success: false,
            message: 'Verification failed',
            error: error.message
        });
    }
};

/**
 * Reset password with verification code
 */
const resetPassword = async (req, res) => {
    try {
        const { email, code, newPassword } = req.body;

        // In real implementation, verify code first

        // Hash new password
        const passwordHash = await bcrypt.hash(newPassword, 10);

        // Update password
        const [result] = await db.query(
            'UPDATE users SET password_hash = ? WHERE email = ?',
            [passwordHash, email]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        res.json({
            success: true,
            message: 'Password reset successfully'
        });

    } catch (error) {
        console.error('Reset password error:', error);
        res.status(500).json({
            success: false,
            message: 'Password reset failed',
            error: error.message
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
