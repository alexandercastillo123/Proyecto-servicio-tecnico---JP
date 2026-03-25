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
 * @route   GET /api/sucursales/:id/appointments
 * @desc    Get appointments linked to a store
 */
router.get('/:id/appointments', authenticate, sucursalesController.getStoreAppointments);

/**
 * @route   POST /api/sucursales/products
 * @desc    Add a product to a store
 */
router.post('/products', authenticate, sucursalesController.addStoreProduct);

/**
 * @route   PUT /api/sucursales/products/:id
 * @desc    Update a store product
 */
router.put('/products/:id', authenticate, sucursalesController.updateStoreProduct);

/**
 * @route   DELETE /api/sucursales/products/:id
 * @desc    Delete a store product
 */
router.delete('/products/:id', authenticate, sucursalesController.deleteStoreProduct);

/**
 * @route   POST /api/sucursales/orders
 * @desc    Create a new order for a product
 */
router.post('/orders', authenticate, sucursalesController.createOrder);

/**
 * @route   GET /api/sucursales/orders/my-orders
 * @desc    Get orders for the logged in client
 */
router.get('/orders/my-orders', authenticate, sucursalesController.getMyOrders);

/**
 * @route   GET /api/sucursales/orders/store/:id
 * @desc    Get orders for a specific store (for store owner)
 */
router.get('/orders/store/:id', authenticate, sucursalesController.getStoreOrders);

/**
 * @route   PATCH /api/sucursales/orders/:id/status
 * @desc    Update order status
 */
router.patch('/orders/:id/status', authenticate, sucursalesController.updateOrderStatus);

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
