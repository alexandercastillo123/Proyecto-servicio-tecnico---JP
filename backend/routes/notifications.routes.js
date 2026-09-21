const express = require('express');
const router = express.Router();
const notificationsController = require('../controllers/notifications.controller');
const { authenticate } = require('../middleware/auth');

router.get('/settings', authenticate, notificationsController.getSettings);
router.put('/settings', authenticate, notificationsController.updateSettings);
router.get('/', authenticate, notificationsController.getNotifications);
router.put('/:id/read', authenticate, notificationsController.markAsRead);
router.post('/token', authenticate, notificationsController.saveToken);

module.exports = router;
