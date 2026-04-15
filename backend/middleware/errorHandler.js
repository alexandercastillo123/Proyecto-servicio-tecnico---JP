/**
 * Global error handling middleware
 */
const errorHandler = (err, req, res, next) => {
    console.error('Error:', err);

    // Multer file upload errors
    if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({
            success: false,
            message: 'El tamaño del archivo es demasiado grande. Máximo 10MB.'
        });
    }

    if (err.message && err.message.includes('Solo se permiten imágenes')) {
        return res.status(400).json({
            success: false,
            message: err.message
        });
    }

    // MySQL errors
    if (err.code === 'ER_DUP_ENTRY') {
        return res.status(409).json({
            success: false,
            message: 'Duplicate entry. This record already exists.'
        });
    }

    if (err.code && err.code.startsWith('ER_')) {
        return res.status(500).json({
            success: false,
            message: 'Database error occurred',
            error: process.env.NODE_ENV === 'development' ? err.message : undefined
        });
    }

    // Default error response
    res.status(err.statusCode || 500).json({
        success: false,
        message: err.message || 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
};

module.exports = errorHandler;
