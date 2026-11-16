/**
 * Custom operational error class for the API.
 * Allows distinguishing between programmer errors (bugs) and
 * operational errors (expected failures like 404, 401, etc.)
 */
class AppError extends Error {
    /**
     * @param {string} message - Human-readable error message
     * @param {number} statusCode - HTTP status code (4xx, 5xx)
     * @param {string} [code] - Optional machine-readable error code
     */
    constructor(message, statusCode, code = null) {
        super(message);
        this.statusCode = statusCode;
        this.code = code;
        this.isOperational = true; // Flag to distinguish from unexpected bugs

        // Capture stack trace, excluding the constructor call from it
        Error.captureStackTrace(this, this.constructor);
    }
}

module.exports = AppError;
