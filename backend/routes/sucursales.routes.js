const express = require('express');
const router = express.Router();
const sucursalesController = require('../controllers/sucursales.controller');
const { authenticate } = require('../middleware/auth');
const upload = require('../middleware/upload');

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
 * @route   GET /api/sucursales/my-store
 * @desc    Get store for logged in user
 */
router.get('/my-store', authenticate, sucursalesController.getMyStore);

/**
 * @route   GET /api/sucursales/:id
 * @desc    Get store details
 */
router.get('/:id', sucursalesController.getStoreById);

/**
 * @route   GET /api/sucursales/:id/schedules
 * @desc    Get store schedules
 */
router.get('/:id/schedules', sucursalesController.getStoreSchedules);

/**
 * @route   GET /api/sucursales/:id/reviews
 * @desc    Get store reviews
 */
router.get('/:id/reviews', sucursalesController.getStoreReviews);

/**
 * @route   POST /api/sucursales/:id/reviews
 * @desc    Add review to a store
 */
router.post('/:id/reviews', authenticate, sucursalesController.addStoreReview);

/**
 * @route   PATCH /api/sucursales/:id/status
 * @desc    Update store status
 */
router.patch('/:id/status', authenticate, sucursalesController.updateStoreStatus);

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
 * @route   GET /api/sucursales/:id/products
 * @desc    Get products for a store
 */
router.get('/:id/products', sucursalesController.getStoreProducts);

/**
 * @route   POST /api/sucursales/products
 * @desc    Add a product to a store
 */
router.post('/products', authenticate, sucursalesController.addStoreProduct);

/**
 * @route   POST /api/sucursales/upload-image
 * @desc    Upload store image
 */
router.post('/upload-image', authenticate, upload.single('image'), sucursalesController.uploadStoreImage);

/**
 * @route   POST /api/sucursales/products/upload-image
 * @desc    Upload product image
 */
router.post('/products/upload-image', authenticate, upload.single('image'), sucursalesController.uploadProductImage);

module.exports = router;
