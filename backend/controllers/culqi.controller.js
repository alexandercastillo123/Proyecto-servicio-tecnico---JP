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

/**
 * POST /api/culqi/webhook
 * Recibe notificaciones asíncronas de Culqi (charge.success, charge.failed, etc).
 * El body debe enviarse crudo (raw) para poder verificar la firma HMAC.
 */
const webhookCulqi = asyncHandler(async (req, res) => {
    const signature = req.headers['x-culqi-signature'] || req.headers['x-culqi-webhook-signature'];
    const timestamp = req.headers['x-culqi-timestamp'] || req.headers['x-culqi-webhook-timestamp'];
    const rawBody = req.body instanceof Buffer ? req.body.toString('utf8') : JSON.stringify(req.body);

    const result = await culqiService.handleWebhook(rawBody, signature, timestamp, req.body instanceof Buffer ? undefined : req.body);
    res.json(Respuesta.ok(result, 'Webhook procesado'));
});

module.exports = { payAppointmentCulqi, payOrderCulqi, getPublicKey, webhookCulqi };
