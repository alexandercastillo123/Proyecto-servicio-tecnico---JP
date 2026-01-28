const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const messagesController = require('../controllers/messages.controller');
const { authenticate } = require('../middleware/auth');
const validate = require('../middleware/validation');

/**
 * @route   GET /api/messages/conversations
 * @desc    Get list of user conversations
 * @access  Private
 */
router.get('/conversations', authenticate, messagesController.getConversations);

/**
 * @route   GET /api/messages/:otherUserId
 * @desc    Get messages with specific user
 * @access  Private
 */
router.get('/:otherUserId', authenticate, messagesController.getMessages);

/**
 * @route   POST /api/messages
 * @desc    Send text message
 * @access  Private
 */
router.post(
    '/',
    authenticate,
    [
        body('receiverId').isInt().withMessage('Valid receiver ID is required'),
        body('messageText').notEmpty().withMessage('Message text is required'),
        body('appointmentId').optional().isInt()
    ],
    validate,
    messagesController.sendMessage
);

/**
 * @route   POST /api/messages/offer
 * @desc    Send service offer
 * @access  Private (Tech only via controller validation)
 */
router.post(
    '/offer',
    authenticate,
    [
        body('receiverId').isInt().withMessage('Valid receiver ID is required'),
        body('offerPrice').isFloat({ min: 0 }).withMessage('Valid offer price is required'),
        body('messageText').optional().isString(),
        body('appointmentId').optional().isInt()
    ],
    validate,
    messagesController.sendOffer
);

/**
 * @route   PUT /api/messages/offer/:id/accept
 * @desc    Accept service offer
 * @access  Private
 */
router.put('/offer/:id/accept', authenticate, messagesController.acceptOffer);

/**
 * @route   PUT /api/messages/offer/:id/reject
 * @desc    Reject service offer
 * @access  Private
 */
router.put('/offer/:id/reject', authenticate, messagesController.rejectOffer);

/**
 * @route   PUT /api/messages/offer/:id/cancel
 * @desc    Cancel service offer (sender only)
 * @access  Private
 */
router.put('/offer/:id/cancel', authenticate, messagesController.cancelOffer);

/**
 * @route   PUT /api/messages/:id/read
 * @desc    Mark message as read
 * @access  Private
 */
router.put('/:id/read', authenticate, messagesController.markAsRead);

module.exports = router;
