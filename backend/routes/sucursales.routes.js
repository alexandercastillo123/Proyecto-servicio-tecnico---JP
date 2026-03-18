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

/**
 * @route   GET /api/sucursales/my-store
 * @desc    Get store for logged in user
 */
router.get('/my-store', authenticate, sucursalesController.getMyStore);

/**
 * @route   POST /api/sucursales
 * @desc    Create a store
 */
router.post('/', authenticate, sucursalesController.createStore);

/**
 * @route   PUT /api/sucursales/:id
 * @desc    Update a store
 */
router.put('/:id', authenticate, sucursalesController.updateStore);

/**
 * @route   DELETE /api/sucursales/:id
 * @desc    Delete a store
 */
router.delete('/:id', authenticate, sucursalesController.deleteStore);

/**
 * @route   PUT /api/sucursales/products/:id
 * @desc    Update a product in a store
 */
router.put('/products/:id', authenticate, sucursalesController.updateStoreProduct);

/**
 * @route   DELETE /api/sucursales/products/:id
 * @desc    Delete a product from a store
 */
router.delete('/products/:id', authenticate, sucursalesController.deleteStoreProduct);

module.exports = router;
