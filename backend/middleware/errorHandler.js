const AppError = require('../utils/AppError');

/**
 * Global error handling middleware.
 * Handles both operational errors (AppError) and unexpected programmer errors.
 * Must be registered last in Express middleware chain.
 *
 * @param {Error} err
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
const errorHandler = (err, req, res, next) => {
    // Log all errors in development; log only unexpected errors in production
    if (process.env.NODE_ENV === 'development' || !err.isOperational) {
        console.error('❌ Error:', err);
    }

    // ── Multer errors ──────────────────────────────────────────────────────
    if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({
            exito: false, estado: 400,
            mensaje: 'El tamaño del archivo es demasiado grande. Máximo 10MB.',
            resultado: null
        });
    }

    if (err.message && err.message.includes('Solo se permiten imágenes')) {
        return res.status(400).json({
            exito: false, estado: 400,
            mensaje: err.message,
            resultado: null
        });
    }

    // ── MySQL errors ───────────────────────────────────────────────────────
    if (err.code === 'ER_DUP_ENTRY') {
        return res.status(409).json({
            exito: false, estado: 409,
            mensaje: 'El registro ya existe (entrada duplicada).',
            resultado: null
        });
    }

    if (err.code && err.code.startsWith('ER_')) {
        return res.status(500).json({
            exito: false, estado: 500,
            mensaje: process.env.NODE_ENV === 'development'
                ? `Error de base de datos: ${err.message}`
                : 'Error interno de base de datos.',
            resultado: null
        });
    }

    // ── AppError (operational, expected) ──────────────────────────────────
    if (err.isOperational) {
        return res.status(err.statusCode).json({
            exito: false,
            estado: err.statusCode,
            mensaje: err.message,
            resultado: null
        });
    }

    // ── Unknown / programmer errors ────────────────────────────────────────
    res.status(500).json({
        exito: false, estado: 500,
        mensaje: process.env.NODE_ENV === 'development'
            ? err.message
            : 'Error interno del servidor. Por favor intenta más tarde.',
        resultado: null
    });
};

module.exports = errorHandler;
