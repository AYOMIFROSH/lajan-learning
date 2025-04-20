const express = require('express');
const router = express.Router();
const notificationController = require('../firebase/notifictaionController');
const { authenticate } = require('../firebase/firebaseMiddleware');

// Apply authentication middleware to all routes
router.use(authenticate);

// Get all notifications for the logged-in user
router.get('/', notificationController.getUserNotifications);

// Mark a specific notification as read
router.put('/:notificationId/read', notificationController.markNotificationAsRead);

// Mark all notifications as read
router.put('/read-all', notificationController.markAllNotificationsAsRead);

// Delete a notification
router.delete('/:notificationId', notificationController.deleteNotification);

// Only accessible by admin users
router.post('/', notificationController.createNotification);

module.exports = router;