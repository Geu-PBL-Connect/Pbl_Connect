const express = require('express');
const router = express.Router();
const { protect, restrictTo } = require('../middlewares/authMiddleware');
const notificationController = require('../controllers/notificationController');

// All notification routes are protected
router.use(protect);

// Get my notifications
router.get('/', notificationController.getMyNotifications);

// Mark notification as read
router.put('/:id/read', notificationController.markAsRead);

// Send notification (Restricted to Admin / CTO)
router.post('/', restrictTo('ADMIN', 'SUPER_ADMIN', 'CTO'), notificationController.sendNotification);

module.exports = router;
