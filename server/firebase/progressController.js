const { db } = require('../config');
const admin = require('firebase-admin');
const {
    getLearningProgressByUserId,
    initializeLearningProgress,
    updateTopicProgress,
    completeModule,
    syncProgress,
    generateDailyRecommendations,
    updateStreak,
    updateRewards,
    addProgressHistory,
    addPoints,
    completeLesson,
    getUserWithProgress
  } = require('../firebaseModel/learningProgress');

// Import notification utilities with more explicit path
const {
  createModuleCompletionNotification,
  createStreakNotification,
  createAchievementNotification,
  createNotification  // Added direct notification creation function
} = require('../firebaseModel/notification');

// Get Learning Progress
exports.getLearningProgress = async (req, res) => {
    try {
        const userId = req.user.id;
        const progress = await getLearningProgressByUserId(userId);
        
        res.status(200).json({
            status: 'success',
            progress
        });
    } catch (error) {
        console.error('Error getting learning progress:', error);
        res.status(500).json({ 
            status: 'error',
            message: error.message || 'Failed to get learning progress' 
        });
    }
};

// Complete Module with enhanced notification logging
exports.completeModule = async (req, res) => {
    try {
        const userId = req.user.id;
        const { topicId, moduleId } = req.body;
        
        console.log(`Starting module completion for user: ${userId}, topic: ${topicId}, module: ${moduleId}`);
        
        if (!topicId || !moduleId) {
            return res.status(400).json({ 
                status: 'error',
                message: 'Topic ID and Module ID are required' 
            });
        }
        
        // Mark module as completed
        const progress = await completeModule(userId, topicId, moduleId);
        console.log(`Module marked as completed in database`);
        
        // Award points for completing module
        const pointsEarned = 5; // Default points for module completion
        await addPoints(userId, pointsEarned);
        console.log(`Added ${pointsEarned} points to user ${userId}`);
        
        // Update user streak
        const updatedProgress = await updateStreak(userId);
        console.log(`Updated streak: ${updatedProgress.streak} days`);
        
        // Get updated user data with progress
        const userWithProgress = await getUserWithProgress(userId);
        
        // Check for streak milestones (every 7 days)
        const streak = updatedProgress.streak || 0;
        if (streak % 7 === 0 && streak > 0) {
            try {
                console.log(`Creating streak notification for ${streak} day streak`);
                const streakNotification = await createStreakNotification(userId, streak);
                console.log('Successfully created streak notification:', streakNotification?.id || 'unknown ID');
            } catch (streakNotificationError) {
                console.error('Error creating streak notification:', streakNotificationError);
                // Fallback: Create streak notification directly
                try {
                    console.log('Attempting fallback streak notification creation');
                    const fallbackStreakNotification = await db.collection('Notifications').add({
                        userId,
                        title: "Streak Milestone",
                        message: `Impressive! You've maintained a learning streak of ${streak} days.`,
                        type: 'achievement',
                        read: false,
                        createdAt: admin.firestore.FieldValue.serverTimestamp()
                    });
                    console.log('Created fallback streak notification:', fallbackStreakNotification.id);
                } catch (fallbackError) {
                    console.error('Failed to create fallback streak notification:', fallbackError);
                }
            }
        }
        
        // Get module name for notification
        let moduleTitle = "Unknown Module";
        try {
            console.log(`Fetching module details for notification from Firestore`);
            const moduleDoc = await db.collection('Topics').doc(topicId)
                .collection('Modules').doc(moduleId).get();
            
            if (moduleDoc.exists) {
                const moduleData = moduleDoc.data();
                moduleTitle = moduleData.title || "Unknown Module";
                console.log(`Found module data: ${moduleTitle}`);
                
                // Create module completion notification
                console.log('Attempting to create module completion notification');
                try {
                    const notification = await createModuleCompletionNotification(userId, moduleTitle, moduleId);
                    console.log('Successfully created module completion notification:', notification?.id || 'unknown ID');
                } catch (notificationError) {
                    console.error('Error creating module completion notification via utility function:', notificationError);
                    
                    // Try direct notification creation
                    try {
                        console.log('Attempting direct notification creation');
                        const directNotification = await createNotification(
                            userId,
                            'Module Completed',
                            `Great job! You've completed the "${moduleTitle}" module.`,
                            'lesson',
                            moduleId
                        );
                        console.log('Successfully created direct notification:', directNotification?.id || 'unknown ID');
                    } catch (directError) {
                        console.error('Error creating direct notification:', directError);
                    }
                }
            } else {
                console.log(`Module document not found for ID: ${moduleId}`);
            }
        } catch (moduleError) {
            console.error('Error fetching module data:', moduleError);
        }
        
        // Final fallback: Create a simple notification directly with Firestore
        try {
            console.log('Creating final fallback notification directly with Firestore');
            const fallbackNotification = await db.collection('Notifications').add({
                userId,
                title: "Module Completed",
                message: `You've successfully completed the module: ${moduleTitle}!`,
                type: 'lesson',
                read: false,
                createdAt: admin.firestore.FieldValue.serverTimestamp(),
                referenceId: moduleId
            });
            console.log('Successfully created fallback notification with Firestore:', fallbackNotification.id);
        } catch (fallbackError) {
            console.error('Failed to create fallback notification with Firestore:', fallbackError);
        }
        
        res.status(200).json({
            status: 'success',
            message: 'Module completed successfully',
            progress: userWithProgress.learningProgress,
            pointsEarned
        });
    } catch (error) {
        console.error('Error completing module:', error);
        res.status(500).json({ 
            status: 'error',
            message: error.message || 'Failed to complete module' 
        });
    }
};

// Complete Lesson with enhanced notification logging
exports.completeLesson = async (req, res) => {
    try {
        const userId = req.user.id;
        const { lessonId } = req.body;
        
        console.log(`Starting lesson completion for user: ${userId}, lesson: ${lessonId}`);
        
        if (!lessonId) {
            return res.status(400).json({ 
                status: 'error',
                message: 'Lesson ID is required' 
            });
        }
        
        // Mark lesson as completed and award points
        const userWithProgress = await completeLesson(userId, lessonId);
        console.log('Lesson marked as completed in database');
        
        // Points awarded for lesson completion (hardcoded for simplicity)
        const pointsEarned = 10;
        console.log(`Added ${pointsEarned} points to user ${userId}`);
        
        // Check if we need to award any achievements based on lesson completion count
        const completedLessons = userWithProgress.user.completedLessons?.length || 0;
        console.log(`User has completed ${completedLessons} lessons total`);
        
        // Helper function for creating achievement notifications with better error handling
        const createAchievementWithLogging = async (achievementName) => {
            try {
                console.log(`Creating "${achievementName}" achievement notification`);
                const notification = await createAchievementNotification(userId, achievementName);
                console.log(`Successfully created achievement notification: ${notification?.id || 'unknown ID'}`);
                return true;
            } catch (achievementError) {
                console.error(`Error creating "${achievementName}" achievement notification:`, achievementError);
                
                // Try fallback direct creation
                try {
                    console.log(`Creating fallback "${achievementName}" achievement notification`);
                    const fallbackNotification = await db.collection('Notifications').add({
                        userId,
                        title: 'Achievement Unlocked',
                        message: `Congratulations! You earned the "${achievementName}" badge.`,
                        type: 'achievement',
                        read: false,
                        createdAt: admin.firestore.FieldValue.serverTimestamp()
                    });
                    console.log(`Created fallback achievement notification: ${fallbackNotification.id}`);
                    return true;
                } catch (fallbackError) {
                    console.error(`Failed to create fallback "${achievementName}" achievement notification:`, fallbackError);
                    return false;
                }
            }
        };
        
        // Create achievement notifications based on milestone counts
        if (completedLessons === 1) {
            await createAchievementWithLogging("First Lesson");
        } else if (completedLessons === 5) {
            await createAchievementWithLogging("Getting Started");
        } else if (completedLessons === 10) {
            await createAchievementWithLogging("Financial Explorer");
        } else if (completedLessons === 25) {
            await createAchievementWithLogging("Financial Expert");
        } else if (completedLessons === 50) {
            await createAchievementWithLogging("Financial Guru");
        }
        
        // Create a generic lesson completion notification
        try {
            console.log('Creating lesson completion notification');
            const lessonNotification = await createNotification(
                userId,
                'Lesson Completed',
                'Great job! You completed another lesson and earned points!',
                'lesson',
                lessonId
            );
            console.log(`Created lesson completion notification: ${lessonNotification?.id || 'unknown ID'}`);
        } catch (lessonNotifError) {
            console.error('Error creating lesson completion notification:', lessonNotifError);
            
            // Fallback to direct creation
            try {
                console.log('Creating fallback lesson completion notification');
                const fallbackLessonNotif = await db.collection('Notifications').add({
                    userId,
                    title: 'Lesson Completed',
                    message: 'Great job! You completed another lesson and earned points!',
                    type: 'lesson',
                    read: false,
                    createdAt: admin.firestore.FieldValue.serverTimestamp(),
                    referenceId: lessonId
                });
                console.log(`Created fallback lesson notification: ${fallbackLessonNotif.id}`);
            } catch (fallbackError) {
                console.error('Failed to create fallback lesson notification:', fallbackError);
            }
        }
        
        res.status(200).json({
            status: 'success',
            message: 'Lesson completed successfully',
            user: userWithProgress.user,
            progress: userWithProgress.learningProgress,
            pointsEarned
        });
    } catch (error) {
        console.error('Error completing lesson:', error);
        res.status(500).json({ 
            status: 'error',
            message: error.message || 'Failed to complete lesson' 
        });
    }
};

// Sync Progress - Enhanced version to handle client-server synchronization
exports.syncProgress = async (req, res) => {
    try {
        const userId = req.user.id;
        const localProgress = req.body;
        
        // Validate that the userId in the progress matches the authenticated user
        if (localProgress.userId !== userId) {
            return res.status(400).json({
                status: 'error',
                message: 'User ID mismatch in progress data'
            });
        }
        
        // Get the current server-side progress
        let serverProgress = await getLearningProgressByUserId(userId);
        
        // If no server progress exists yet, just use the client progress
        if (!serverProgress || Object.keys(serverProgress).length === 0) {
            console.log('No server progress found, using client progress');
            const progress = await syncProgress(userId, localProgress);
            return res.status(200).json({ status: 'success', progress });
        }
        
        // Merge progress data intelligently
        const mergedProgress = await mergeProgress(serverProgress, localProgress);
        
        // Save the merged progress back to the server
        const finalProgress = await syncProgress(userId, mergedProgress);
        
        res.status(200).json({ 
            status: 'success', 
            message: 'Progress synchronized successfully',
            progress: finalProgress 
        });
    } catch (err) {
        console.error('Error syncing progress:', err);
        res.status(500).json({ status: 'error', message: err.message });
    }
};

// Helper function to merge client and server progress data
async function mergeProgress(serverProgress, clientProgress) {
    // Start with server progress as base
    const mergedProgress = { ...serverProgress };
    
    // Take the higher streak value
    mergedProgress.streak = Math.max(serverProgress.streak || 0, clientProgress.streak || 0);
    
    // Take the most recent lastCompletedDate
    if (serverProgress.lastCompletedDate && clientProgress.lastCompletedDate) {
        const serverDate = new Date(serverProgress.lastCompletedDate);
        const clientDate = new Date(clientProgress.lastCompletedDate);
        mergedProgress.lastCompletedDate = serverDate > clientDate ? 
            serverProgress.lastCompletedDate : clientProgress.lastCompletedDate;
    } else {
        mergedProgress.lastCompletedDate = serverProgress.lastCompletedDate || clientProgress.lastCompletedDate;
    }
    
    // Take the higher totalPoints value
    mergedProgress.totalPoints = Math.max(serverProgress.totalPoints || 0, clientProgress.totalPoints || 0);
    
    // Merge topic progress
    mergedProgress.topicsProgress = mergedProgress.topicsProgress || {};
    
    // Process each topic in client progress
    Object.keys(clientProgress.topicsProgress || {}).forEach(topicId => {
        const clientTopic = clientProgress.topicsProgress[topicId];
        const serverTopic = serverProgress.topicsProgress && serverProgress.topicsProgress[topicId];
        
        if (!serverTopic) {
            // If topic doesn't exist on server, add it from client
            mergedProgress.topicsProgress[topicId] = clientTopic;
        } else {
            // Merge topic data
            // Create a merged topic
            const mergedTopic = { ...serverTopic };
            
            // Take the most recent lastAttempt
            if (serverTopic.lastAttempt && clientTopic.lastAttempt) {
                const serverDate = new Date(serverTopic.lastAttempt);
                const clientDate = new Date(clientTopic.lastAttempt);
                mergedTopic.lastAttempt = serverDate > clientDate ? 
                    serverTopic.lastAttempt : clientTopic.lastAttempt;
            } else {
                mergedTopic.lastAttempt = serverTopic.lastAttempt || clientTopic.lastAttempt;
            }
            
            // Take higher score
            mergedTopic.score = Math.max(serverTopic.score || 0, clientTopic.score || 0);
            
            // Sum questions and correct answers
            mergedTopic.questionsAnswered = (serverTopic.questionsAnswered || 0) + (clientTopic.questionsAnswered || 0);
            mergedTopic.correctAnswers = (serverTopic.correctAnswers || 0) + (clientTopic.correctAnswers || 0);
            
            // Merge modules data
            if (clientTopic.modules) {
                mergedTopic.modules = mergedTopic.modules || {};
                
                // Process each module in client data
                Object.keys(clientTopic.modules).forEach(moduleId => {
                    const clientModule = clientTopic.modules[moduleId];
                    const serverModule = serverTopic.modules && serverTopic.modules[moduleId];
                    
                    if (!serverModule) {
                        // If module doesn't exist on server, add it from client
                        mergedTopic.modules[moduleId] = clientModule;
                    } else {
                        // Merge module data
                        const mergedModule = { ...serverModule };
                        
                        // Take the completed status (if either is true, result is true)
                        mergedModule.completed = serverModule.completed || clientModule.completed;
                        
                        // Take the higher score
                        mergedModule.score = Math.max(serverModule.score || 0, clientModule.score || 0);
                        
                        // Take the most recent lastAttempt
                        if (serverModule.lastAttempt && clientModule.lastAttempt) {
                            const serverDate = new Date(serverModule.lastAttempt);
                            const clientDate = new Date(clientModule.lastAttempt);
                            mergedModule.lastAttempt = serverDate > clientDate ? 
                                serverModule.lastAttempt : clientModule.lastAttempt;
                        } else {
                            mergedModule.lastAttempt = serverModule.lastAttempt || clientModule.lastAttempt;
                        }
                        
                        // Update merged topic with merged module
                        mergedTopic.modules[moduleId] = mergedModule;
                    }
                });
            }
            
            // Merge completedModules arrays (unique values only)
            if (clientTopic.completedModules || serverTopic.completedModules) {
                const serverModules = serverTopic.completedModules || [];
                const clientModules = clientTopic.completedModules || [];
                mergedTopic.completedModules = [...new Set([...serverModules, ...clientModules])];
            }
            
            // Update merged progress with merged topic
            mergedProgress.topicsProgress[topicId] = mergedTopic;
        }
    });
    
    // Make sure we're not missing any topics that might be on the server but not in client data
    Object.keys(serverProgress.topicsProgress || {}).forEach(topicId => {
        if (!clientProgress.topicsProgress || !clientProgress.topicsProgress[topicId]) {
            mergedProgress.topicsProgress[topicId] = serverProgress.topicsProgress[topicId];
        }
    });
    
    // Set updatedAt timestamp
    mergedProgress.updatedAt = new Date().toISOString();
    
    return mergedProgress;
}

// Add Points
exports.addPoints = async (req, res) => {
    try {
        const userId = req.user.id;
        const { points, reason } = req.body;
        
        if (!points || typeof points !== 'number' || points <= 0) {
            return res.status(400).json({ 
                status: 'error',
                message: 'Points must be a positive number' 
            });
        }
        
        // Add points to user's account
        await addPoints(userId, points);
        
        // Log the points transaction (optional implementation)
        await db.collection('PointsTransactions').add({
            userId,
            points,
            reason: reason || 'Manual addition',
            timestamp: admin.firestore.FieldValue.serverTimestamp()
        });
        
        // Get updated user data with progress
        const userWithProgress = await getUserWithProgress(userId);
        
        // Create a points added notification
        try {
            console.log(`Creating points added notification (${points} points)`);
            await createNotification(
                userId,
                'Points Added',
                `You've earned ${points} points${reason ? ` for ${reason}` : ''}!`,
                'achievement'
            );
            console.log('Points notification created successfully');
        } catch (notifError) {
            console.error('Error creating points notification:', notifError);
            
            // Fallback direct creation
            try {
                await db.collection('Notifications').add({
                    userId,
                    title: 'Points Added',
                    message: `You've earned ${points} points${reason ? ` for ${reason}` : ''}!`,
                    type: 'achievement',
                    read: false,
                    createdAt: admin.firestore.FieldValue.serverTimestamp()
                });
            } catch (fallbackError) {
                console.error('Failed to create fallback points notification:', fallbackError);
            }
        }
        
        res.status(200).json({
            status: 'success',
            message: 'Points added successfully',
            user: userWithProgress.user,
            progress: userWithProgress.learningProgress
        });
    } catch (error) {
        console.error('Error adding points:', error);
        res.status(500).json({ 
            status: 'error',
            message: error.message || 'Failed to add points' 
        });
    }
};

// Update Topic Progress
exports.updateTopicProgress = async (req, res) => {
    try {
        const userId = req.user.id;
        const { topicId, progressData } = req.body;
        
        if (!topicId || !progressData) {
            return res.status(400).json({ 
                status: 'error',
                message: 'Topic ID and progress data are required' 
            });
        }
        
        // Update the topic progress
        const updatedProgress = await updateTopicProgress(userId, topicId, progressData);
        
        res.status(200).json({
            status: 'success',
            message: 'Topic progress updated successfully',
            progress: updatedProgress
        });
    } catch (error) {
        console.error('Error updating topic progress:', error);
        res.status(500).json({ 
            status: 'error',
            message: error.message || 'Failed to update topic progress' 
        });
    }
};

// Get User Streak
exports.getUserStreak = async (req, res) => {
    try {
        const userId = req.user.id;
        const progress = await getLearningProgressByUserId(userId);
        
        res.status(200).json({
            status: 'success',
            streak: progress.streak,
            lastCompletedDate: progress.lastCompletedDate
        });
    } catch (error) {
        console.error('Error getting user streak:', error);
        res.status(500).json({ 
            status: 'error',
            message: error.message || 'Failed to get user streak' 
        });
    }
};

// Update User Streak
exports.updateUserStreak = async (req, res) => {
    try {
        const userId = req.user.id;
        
        // Update the streak
        const progress = await updateStreak(userId);
        
        // Create streak update notification if streak > 1
        if (progress.streak > 1) {
            try {
                console.log(`Creating streak update notification (${progress.streak} days)`);
                await createNotification(
                    userId,
                    'Streak Updated',
                    `You're on a ${progress.streak}-day learning streak. Keep it up!`,
                    'achievement'
                );
                console.log('Streak update notification created successfully');
            } catch (notifError) {
                console.error('Error creating streak update notification:', notifError);
            }
        }
        
        res.status(200).json({
            status: 'success',
            message: 'Streak updated successfully',
            streak: progress.streak,
            lastCompletedDate: progress.lastCompletedDate
        });
    } catch (error) {
        console.error('Error updating user streak:', error);
        res.status(500).json({ 
            status: 'error',
            message: error.message || 'Failed to update user streak' 
        });
    }
};

// Initialize progress
exports.initializeLearningProgress = async (req, res) => {
    try {
        const userId = req.user.id;
        const progress = await initializeLearningProgress(userId);
        
        // Create welcome notification
        try {
            console.log('Creating welcome notification');
            await createNotification(
                userId,
                'Welcome to Lajan Learning!',
                'Track your progress, earn points, and build your financial knowledge!',
                'lesson'
            );
            console.log('Welcome notification created successfully');
        } catch (notifError) {
            console.error('Error creating welcome notification:', notifError);
        }
        
        res.status(201).json({ status: 'success', progress });
    } catch (err) {
        console.error('Error initializing progress:', err);
        res.status(500).json({ status: 'error', message: err.message });
    }
};
  
// Fetch rewards
exports.getUserRewards = async (req, res) => {
    try {
        const userId = req.user.id;
        const { rewards } = await getLearningProgressByUserId(userId);
        res.status(200).json({ status: 'success', rewards });
    } catch (err) {
        console.error('Error fetching rewards:', err);
        res.status(500).json({ status: 'error', message: err.message });
    }
};
  
// Update rewards
exports.updateRewards = async (req, res) => {
    try {
        const userId = req.user.id;
        const updated = await updateRewards(userId);
        
        // Create rewards update notification if rewards changed
        try {
            console.log('Creating rewards update notification');
            await createNotification(
                userId,
                'Rewards Updated',
                'You have new rewards available! Check them out in your rewards section.',
                'offering'
            );
            console.log('Rewards update notification created successfully');
        } catch (notifError) {
            console.error('Error creating rewards update notification:', notifError);
        }
        
        res.status(200).json({ status: 'success', rewards: updated });
    } catch (err) {
        console.error('Error updating rewards:', err);
        res.status(500).json({ status: 'error', message: err.message });
    }
};
  
// Add to progress history
exports.addProgressHistory = async (req, res) => {
    try {
        const userId = req.user.id;
        const { action, details } = req.body;
        const history = await addProgressHistory(userId, action, details);
        res.status(201).json({ status: 'success', history });
    } catch (err) {
        console.error('Error adding history:', err);
        res.status(500).json({ status: 'error', message: err.message });
    }
};
  
// Fetch daily recommendations
exports.getDailyRecommendations = async (req, res) => {
    try {
        const userId = req.user.id;
        const recs = (await getLearningProgressByUserId(userId)).dailyRecommendations;
        res.status(200).json({ status: 'success', recommendations: recs });
    } catch (err) {
        console.error('Error fetching recommendations:', err);
        res.status(500).json({ status: 'error', message: err.message });
    }
};
  
// Generate daily recommendations
exports.generateDailyRecommendations = async (req, res) => {
    try {
        const userId = req.user.id;
        const recs = await generateDailyRecommendations(userId);
        
        // Create recommendations notification
        try {
            console.log('Creating daily recommendations notification');
            await createNotification(
                userId,
                'Daily Recommendations Ready',
                'Check out today\'s personalized learning recommendations!',
                'lesson'
            );
            console.log('Recommendations notification created successfully');
        } catch (notifError) {
            console.error('Error creating recommendations notification:', notifError);
        }
        
        res.status(201).json({ status: 'success', recommendations: recs });
    } catch (err) {
        console.error('Error generating recommendations:', err);
        res.status(500).json({ status: 'error', message: err.message });
    }
};