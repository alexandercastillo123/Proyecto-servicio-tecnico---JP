const Respuesta = require('../utils/Respuesta');
const asyncHandler = require('../utils/asyncHandler');
const culqiService = require('../services/culqi.service');

/**
 * POST /api/culqi/pay-appointment/:id
 */
const payAppointmentCulqi = asyncHandler(async (req, res) => {
    const data = await culqiService.payAppointmentCulqi(
        req.params.id, req.user.id, req.body.culqiToken
    );
    res.json(Respuesta.ok(data, '¡Pago exitoso! La cita ha sido confirmada automáticamente.'));
});

/**
 * POST /api/culqi/pay-order/:id
 */
const payOrderCulqi = asyncHandler(async (req, res) => {
    const data = await culqiService.payOrderCulqi(
        req.params.id, req.user.id, req.body.culqiToken
    );
    res.json(Respuesta.ok(data, '¡Pago exitoso! El pedido ha sido confirmado automáticamente.'));
});

/**
 * GET /api/culqi/public-key
 */
const getPublicKey = (req, res) => {
    res.json(Respuesta.ok({ publicKey: culqiService.getPublicKey() }, 'Éxito'));
};

module.exports = { payAppointmentCulqi, payOrderCulqi, getPublicKey };
