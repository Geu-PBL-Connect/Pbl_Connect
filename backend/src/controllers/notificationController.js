const prisma = require('../config/db');

// @desc    Get user notifications
// @route   GET /api/notifications
// @access  Private
const getMyNotifications = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const notifications = await prisma.notificationRecipient.findMany({
      where: { userId },
      include: {
        notification: true
      },
      orderBy: { notification: { createdAt: 'desc' } }
    });

    res.json(notifications);
  } catch (error) {
    next(error);
  }
};

// @desc    Mark notification as read
// @route   PUT /api/notifications/:id/read
// @access  Private
const markAsRead = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const notif = await prisma.notificationRecipient.update({
      where: { id, userId },
      data: { isRead: true, readAt: new Date() }
    });

    res.json({ message: "Marked as read", notification: notif });
  } catch (error) {
    next(error);
  }
};

// @desc    Send notification (Admin/System)
// @route   POST /api/notifications
// @access  Private/Admin
const sendNotification = async (req, res, next) => {
  try {
    const { title, message, type, recipientRoles } = req.body;
    
    // Create the core notification
    const notification = await prisma.notification.create({
      data: {
        title,
        message,
        type: type || 'INFORMATION',
        senderId: req.user.id
      }
    });

    // Find recipients based on roles (if provided)
    let users = [];
    if (recipientRoles && recipientRoles.length > 0) {
      users = await prisma.user.findMany({
        where: { role: { in: recipientRoles } },
        select: { id: true }
      });
    } else {
      // Send to all users if no roles specified (Broadcast)
      users = await prisma.user.findMany({ select: { id: true } });
    }

    // Create NotificationRecipient entries
    if (users.length > 0) {
      const recipientData = users.map(u => ({
        notificationId: notification.id,
        userId: u.id
      }));
      await prisma.notificationRecipient.createMany({ data: recipientData });
    }

    res.status(201).json({ message: `Notification sent to ${users.length} users.`, notification });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getMyNotifications,
  markAsRead,
  sendNotification
};
