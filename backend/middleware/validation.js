const { validationResult } = require('express-validator');

/**
 * Middleware to validate request using express-validator rules.
 * Must be placed after the validation chain in the route definition.
 * Returns 400 with a structured error list if any validation fails.
 */
const validate = (req, res, next) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(400).json({
            exito: false,
            estado: 400,
            mensaje: 'Error de validación en los datos enviados.',
            resultado: errors.array().map(err => ({
                campo: err.path,
                mensaje: err.msg
            }))
        });
    }

    next();
};

module.exports = validate;
