const express = require('express');
const router = express.Router();
const sucursalesController = require('../controllers/sucursales.controller');
const { authenticate } = require('../middleware/auth');

/**
 * @route   GET /api/sucursales
 * @desc    Get all active stores
 */
router.get('/', sucursalesController.getStores);

/**
 * @route   GET /api/sucursales/nearby
 * @desc    Get stores near location
 */
router.get('/nearby', sucursalesController.getNearbyStores);

/**
 * @route   GET /api/sucursales/:id
 * @desc    Get store details
 */
router.get('/:id', sucursalesController.getStoreById);

/**
 * @route   GET /api/sucursales/:id/products
 * @desc    Get products for a store
 */
router.get('/:id/products', sucursalesController.getStoreProducts);

/**
 * @route   POST /api/sucursales/products
 * @desc    Add a product to a store
 */
router.post('/products', sucursalesController.addStoreProduct);

module.exports = router;
