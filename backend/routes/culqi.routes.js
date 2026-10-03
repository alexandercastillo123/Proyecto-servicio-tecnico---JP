const express = require('express');
const router = express.Router();
const culqiController = require('../controllers/culqi.controller');
const { authenticate } = require('../middleware/auth');

/**
 * @route   GET /api/culqi/public-key
 * @desc    Obtener la public key de Culqi para el frontend
 */
router.get('/public-key', culqiController.getPublicKey);

/**
 * @route   POST /api/culqi/pay-appointment/:id
 * @desc    Pagar una cita con Culqi (TEST MODE)
 */
router.post('/pay-appointment/:id', authenticate, culqiController.payAppointmentCulqi);

/**
 * @route   POST /api/culqi/pay-order/:id
 * @desc    Pagar un pedido de tienda con Culqi (TEST MODE)
 */
router.post('/pay-order/:id', authenticate, culqiController.payOrderCulqi);

module.exports = router;
