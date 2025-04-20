const { db } = require('../config');
const admin = require('firebase-admin');

/**
 * Create a notification for a user
 * @param {string} userId - The ID of the user to notify
 * @param {string} title - The notification title
 * @param {string} message - The notification message
 * @param {string} type - The notification type (lesson, friend, achievement, offering, guardian)
 * @param {string} referenceId - Optional ID of the related content (e.g., lessonId, moduleId)
 * @returns {Promise<object>} The created notification
 */
const createNotification = async (userId, title, message, type, referenceId = null) => {
  try {
    // Validate notification type
    const validTypes = ['lesson', 'friend', 'achievement', 'offering', 'guardian'];
    if (!validTypes.includes(type)) {
      throw new Error(`Invalid notification type. Must be one of: ${validTypes.join(', ')}`);
    }
    
    // Create the notification object
    const notification = {
      userId,
      title,
      message,
      type,
      read: false,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      referenceId
    };
    
    // Add to Firestore
    const docRef = await db.collection('Notifications').add(notification);
    
    // Return the created notification with its ID
    return {
      id: docRef.id,
      ...notification
    };
  } catch (error) {
    console.error('Error creating notification:', error);
    throw error;
  }
};

/**
 * Create achievement notification
 * @param {string} userId 
 * @param {string} achievementName 
 * @returns {Promise<object>}
 */
const createAchievementNotification = async (userId, achievementName) => {
  return createNotification(
    userId,
    'Achievement Unlocked',
    `Congratulations! You earned the "${achievementName}" badge.`,
    'achievement'
  );
};

/**
 * Create streak achievement notification
 * @param {string} userId 
 * @param {number} streakCount 
 * @returns {Promise<object>}
 */
const createStreakNotification = async (userId, streakCount) => {
  return createNotification(
    userId,
    'Streak Milestone',
    `Impressive! You've maintained a learning streak of ${streakCount} days.`,
    'achievement'
  );
};

/**
 * Create module completion notification
 * @param {string} userId 
 * @param {string} moduleName 
 * @param {string} moduleId 
 * @returns {Promise<object>}
 */
const createModuleCompletionNotification = async (userId, moduleName, moduleId) => {
  return createNotification(
    userId,
    'Module Completed',
    `Great job! You've completed the "${moduleName}" module.`,
    'lesson',
    moduleId
  );
};

/**
 * Create new content notification
 * @param {string} userId 
 * @param {string} contentType - 'lesson', 'module', etc.
 * @param {string} contentName 
 * @param {string} contentId 
 * @returns {Promise<object>}
 */
const createNewContentNotification = async (userId, contentType, contentName, contentId) => {
  return createNotification(
    userId,
    `New ${contentType} Available`,
    `Check out our new ${contentType} on ${contentName}!`,
    'lesson',
    contentId
  );
};

/**
 * Create streak reminder notification
 * @param {string} userId 
 * @returns {Promise<object>}
 */
const createStreakReminderNotification = async (userId) => {
  return createNotification(
    userId,
    'Streak Reminder',
    "Don't forget to complete today's lesson to maintain your streak!",
    'lesson'
  );
};

/**
 * Create financial offer notification
 * @param {string} userId 
 * @param {string} offerTitle 
 * @param {string} offerId 
 * @returns {Promise<object>}
 */
const createOfferingNotification = async (userId, offerTitle, offerId) => {
  return createNotification(
    userId,
    'New Financial Offer',
    `You've unlocked access to: ${offerTitle}`,
    'offering',
    offerId
  );
};

/**
 * Create friend request notification
 * @param {string} userId 
 * @param {string} friendName 
 * @param {string} friendId 
 * @returns {Promise<object>}
 */
const createFriendRequestNotification = async (userId, friendName, friendId) => {
  return createNotification(
    userId,
    'New Friend Request',
    `${friendName} wants to connect with you!`,
    'friend',
    friendId
  );
};

/**
 * Create guardian connection notification
 * @param {string} userId 
 * @param {string} guardianName 
 * @param {string} guardianId 
 * @returns {Promise<object>}
 */
const createGuardianConnectionNotification = async (userId, guardianName, guardianId) => {
  return createNotification(
    userId,
    'Guardian Connected',
    `${guardianName} is now connected to your account as a guardian.`,
    'guardian',
    guardianId
  );
};

/**
 * Bulk create notifications for multiple users
 * @param {string[]} userIds - Array of user IDs
 * @param {string} title - Notification title
 * @param {string} message - Notification message
 * @param {string} type - Notification type
 * @param {string} referenceId - Optional reference ID
 * @returns {Promise<object[]>} Array of created notifications
 */
const createBulkNotifications = async (userIds, title, message, type, referenceId = null) => {
  try {
    // Create a batch for better performance with multiple operations
    const batch = db.batch();
    const notificationRefs = [];
    
    // For each user, create a notification doc reference and add to batch
    for (const userId of userIds) {
      const notificationRef = db.collection('Notifications').doc();
      
      const notification = {
        userId,
        title,
        message,
        type,
        read: false,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        referenceId
      };
      
      batch.set(notificationRef, notification);
      
      // Store the reference and data for returning later
      notificationRefs.push({
        ref: notificationRef,
        data: notification
      });
    }
    
    // Commit the batch
    await batch.commit();
    
    // Return the created notifications with their IDs
    return notificationRefs.map(item => ({
      id: item.ref.id,
      ...item.data
    }));
  } catch (error) {
    console.error('Error creating bulk notifications:', error);
    throw error;
  }
};

/**
 * Delete old notifications for a user
 * @param {string} userId - User ID
 * @param {number} olderThanDays - Delete notifications older than this many days
 * @returns {Promise<number>} Number of deleted notifications
 */
const deleteOldNotifications = async (userId, olderThanDays = 30) => {
  try {
    // Calculate the cutoff date
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);
    
    // Query for old notifications
    const oldNotificationsSnapshot = await db.collection('Notifications')
      .where('userId', '==', userId)
      .where('createdAt', '<', cutoffDate)
      .get();
    
    if (oldNotificationsSnapshot.empty) {
      return 0;
    }
    
    // Delete in batch
    const batch = db.batch();
    
    oldNotificationsSnapshot.docs.forEach(doc => {
      batch.delete(doc.ref);
    });
    
    await batch.commit();
    
    return oldNotificationsSnapshot.size;
  } catch (error) {
    console.error('Error deleting old notifications:', error);
    throw error;
  }
};

/**
 * Count unread notifications for a user
 * @param {string} userId - User ID
 * @returns {Promise<number>} Number of unread notifications
 */
const countUnreadNotifications = async (userId) => {
  try {
    const unreadSnapshot = await db.collection('Notifications')
      .where('userId', '==', userId)
      .where('read', '==', false)
      .get();
    
    return unreadSnapshot.size;
  } catch (error) {
    console.error('Error counting unread notifications:', error);
    throw error;
  }
};

// Export utility functions
module.exports = {
  createNotification,
  createAchievementNotification,
  createStreakNotification,
  createModuleCompletionNotification,
  createNewContentNotification,
  createStreakReminderNotification,
  createOfferingNotification,
  createFriendRequestNotification,
  createGuardianConnectionNotification,
  createBulkNotifications,
  deleteOldNotifications,
  countUnreadNotifications
};