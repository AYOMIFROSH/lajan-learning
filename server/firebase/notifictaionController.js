const { db } = require('../config');
const admin = require('firebase-admin');

// Get user notifications
exports.getUserNotifications = async (req, res) => {
  try {
    const userId = req.user.id;

    // Query notifications for this specific user
    // In getUserNotifications function
    const notificationsSnapshot = await db.collection('Notifications')
      .where('userId', '==', userId)
      .get();

    // Sort manually in memory
    const notifications = notificationsSnapshot.docs
      .map(doc => ({
        id: doc.id,
        ...doc.data()
      }))
      .sort((a, b) => {
        // Sort by createdAt in descending order
        const dateA = a.createdAt instanceof Date ? a.createdAt : new Date(a.createdAt);
        const dateB = b.createdAt instanceof Date ? b.createdAt : new Date(b.createdAt);
        return dateB - dateA;
      })
      .slice(0, 50); // Limit to 50 results

    res.status(200).json({
      status: 'success',
      notifications
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({
      status: 'error',
      message: error.message || 'Failed to fetch notifications'
    });
  }
};

// Mark notification as read
exports.markNotificationAsRead = async (req, res) => {
  try {
    const userId = req.user.id;
    const { notificationId } = req.params;

    // First, ensure the notification belongs to this user
    const notificationDoc = await db.collection('Notifications').doc(notificationId).get();

    if (!notificationDoc.exists) {
      return res.status(404).json({
        status: 'error',
        message: 'Notification not found'
      });
    }

    const notificationData = notificationDoc.data();

    if (notificationData.userId !== userId) {
      return res.status(403).json({
        status: 'error',
        message: 'You do not have permission to access this notification'
      });
    }

    // Update the notification as read
    await db.collection('Notifications').doc(notificationId).update({
      read: true,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    res.status(200).json({
      status: 'success',
      message: 'Notification marked as read'
    });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({
      status: 'error',
      message: error.message || 'Failed to mark notification as read'
    });
  }
};

// Mark all notifications as read
exports.markAllNotificationsAsRead = async (req, res) => {
  try {
    const userId = req.user.id;

    // Find all unread notifications for this user
    const unreadNotificationsSnapshot = await db.collection('Notifications')
      .where('userId', '==', userId)
      .where('read', '==', false)
      .get();

    if (unreadNotificationsSnapshot.empty) {
      return res.status(200).json({
        status: 'success',
        message: 'No unread notifications found'
      });
    }

    // Create a batch to update all notifications at once
    const batch = db.batch();

    unreadNotificationsSnapshot.docs.forEach(doc => {
      batch.update(doc.ref, {
        read: true,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
    });

    await batch.commit();

    res.status(200).json({
      status: 'success',
      message: `Marked ${unreadNotificationsSnapshot.size} notifications as read`
    });
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    res.status(500).json({
      status: 'error',
      message: error.message || 'Failed to mark all notifications as read'
    });
  }
};

// Create a notification (admin or system use)
exports.createNotification = async (req, res) => {
  try {
    const { userId, title, message, type } = req.body;

    // Check for required fields
    if (!userId || !title || !message || !type) {
      return res.status(400).json({
        status: 'error',
        message: 'Missing required fields: userId, title, message, and type are required'
      });
    }

    // Validate notification type
    const validTypes = ['lesson', 'friend', 'achievement', 'offering', 'guardian'];
    if (!validTypes.includes(type)) {
      return res.status(400).json({
        status: 'error',
        message: `Invalid notification type. Must be one of: ${validTypes.join(', ')}`
      });
    }

    // Create the notification
    const notification = {
      userId,
      title,
      message,
      type,
      read: false,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    };

    const docRef = await db.collection('Notifications').add(notification);

    res.status(201).json({
      status: 'success',
      message: 'Notification created successfully',
      notification: {
        id: docRef.id,
        ...notification
      }
    });
  } catch (error) {
    console.error('Error creating notification:', error);
    res.status(500).json({
      status: 'error',
      message: error.message || 'Failed to create notification'
    });
  }
};

// Delete a notification
exports.deleteNotification = async (req, res) => {
  try {
    const userId = req.user.id;
    const { notificationId } = req.params;

    // First, ensure the notification belongs to this user
    const notificationDoc = await db.collection('Notifications').doc(notificationId).get();

    if (!notificationDoc.exists) {
      return res.status(404).json({
        status: 'error',
        message: 'Notification not found'
      });
    }

    const notificationData = notificationDoc.data();

    if (notificationData.userId !== userId) {
      return res.status(403).json({
        status: 'error',
        message: 'You do not have permission to delete this notification'
      });
    }

    // Delete the notification
    await db.collection('Notifications').doc(notificationId).delete();

    res.status(200).json({
      status: 'success',
      message: 'Notification deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting notification:', error);
    res.status(500).json({
      status: 'error',
      message: error.message || 'Failed to delete notification'
    });
  }
};