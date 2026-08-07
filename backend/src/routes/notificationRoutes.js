const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middlewares/auth');
const notificationController = require('../controllers/notificationController');

// All notification routes are protected
router.use(protect);

// Get my notifications
router.get('/', notificationController.getMyNotifications);

// Mark notification as read
router.put('/:id/read', notificationController.markAsRead);

// Send Notification (Admin only)
router.post('/send', authorize('ADMIN', 'SUPER_ADMIN'), notificationController.sendNotification);

module.exports = router;
