const admin = require('firebase-admin');
const { db } = require('../config');

// Validate learning progress data
const validateLearningProgressData = (data) => {
    if (!data.userId || typeof data.userId !== 'string') {
        throw new Error('Invalid userId');
    }

    if (typeof data.topicsProgress !== 'object') {
        throw new Error('Invalid topicsProgress structure');
    }

    if (typeof data.streak !== 'number') {
        throw new Error('Invalid streak');
    }

    if (data.lastCompletedDate !== null && typeof data.lastCompletedDate !== 'string' && !(data.lastCompletedDate instanceof Date)) {
        throw new Error('Invalid lastCompletedDate');
    }

    if (typeof data.totalPoints !== 'number') {
        throw new Error('Invalid totalPoints');
    }
};

// Get learning progress for a user
const getLearningProgressByUserId = async (userId) => {
    const progressDoc = await db.collection('LearningProgress').doc(userId).get();
    
    if (!progressDoc.exists) {
        await initializeLearningProgress(userId);
        return {
            userId,
            topicsProgress: {},
            streak: 0,
            lastCompletedDate: null,
            totalPoints: 0
        };
    }
    
    return { id: progressDoc.id, ...progressDoc.data() };
};

// Initialize learning progress for a new user
const initializeLearningProgress = async (userId) => {
    const progressData = {
        userId,
        topicsProgress: {},
        streak: 0,
        lastCompletedDate: null,
        totalPoints: 0,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };
    
    await db.collection('LearningProgress').doc(userId).set(progressData);
    return progressData;
};

// Update topic progress for a user
const updateTopicProgress = async (userId, topicId, progressData) => {
    // Validate progress data
    if (!progressData || typeof progressData !== 'object') {
        throw new Error('Invalid topic progress data');
    }

    // Ensure the progress doc exists
    const progressRef = db.collection('LearningProgress').doc(userId);
    const progressDoc = await progressRef.get();
    
    if (!progressDoc.exists) {
        await initializeLearningProgress(userId);
    }

    // Handle both formats of module storage (modules object and completedModules array)
    let completedModules = progressData.completedModules || [];
    
    // If there's a modules object, extract completed modules
    if (progressData.modules) {
        Object.entries(progressData.modules).forEach(([moduleId, moduleData]) => {
            if (moduleData.completed && !completedModules.includes(moduleId)) {
                completedModules.push(moduleId);
            }
        });
    }

    // Create the update object for this specific topic
    const updateData = {
        [`topicsProgress.${topicId}`]: {
            completed: progressData.completed ?? false,
            score: progressData.score ?? 0,
            lastAttempt: progressData.lastAttempt ?? admin.firestore.FieldValue.serverTimestamp(),
            questionsAnswered: progressData.questionsAnswered ?? 0,
            correctAnswers: progressData.correctAnswers ?? 0,
            completedModules: completedModules,
            // Only include modules if it exists in the input
            ...(progressData.modules && { modules: progressData.modules })
        },
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };

    await progressRef.update(updateData);
    return getLearningProgressByUserId(userId);
};

// Mark a module as completed within a topic
const completeModule = async (userId, topicId, moduleId) => {
    const progressRef = db.collection('LearningProgress').doc(userId);
    const progressDoc = await progressRef.get();
    
    if (!progressDoc.exists) {
        await initializeLearningProgress(userId);
    }
    
    const progressData = progressDoc.data() || { topicsProgress: {} };
    const topicProgress = progressData.topicsProgress[topicId] || {
        completed: false,
        score: 0,
        lastAttempt: new Date().toISOString(),
        questionsAnswered: 0,
        correctAnswers: 0,
        completedModules: []
    };
    
    // Add moduleId to completed modules if not already present
    if (!topicProgress.completedModules) {
        topicProgress.completedModules = [];
    }
    
    if (!topicProgress.completedModules.includes(moduleId)) {
        topicProgress.completedModules.push(moduleId);
    }
    
    // Also add to modules object if it exists
    if (topicProgress.modules) {
        topicProgress.modules = {
            ...topicProgress.modules,
            [moduleId]: {
                completed: true,
                score: 1.0, // Default perfect score
                lastAttempt: new Date().toISOString()
            }
        };
    }
    
    // Update the topic progress in Firestore
    return updateTopicProgress(userId, topicId, topicProgress);
};

// Sync progress from client to server
const syncProgress = async (userId, clientProgress) => {
    try {
        // Validate the progress data
        validateLearningProgressData(clientProgress);
        
        // Make sure userId matches
        if (clientProgress.userId !== userId) {
            throw new Error('User ID mismatch in progress data');
        }
        
        // Make sure we have updatedAt timestamp
        const updatedProgress = {
            ...clientProgress,
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        };
        
        // Get the reference to the progress document
        const progressRef = db.collection('LearningProgress').doc(userId);
        
        // Check if document exists
        const progressDoc = await progressRef.get();
        
        if (!progressDoc.exists) {
            // If document doesn't exist, create it
            await progressRef.set({
                ...updatedProgress,
                createdAt: admin.firestore.FieldValue.serverTimestamp()
            });
        } else {
            // If document exists, update it
            await progressRef.set(updatedProgress, { merge: true });
        }
        
        // Return the updated data
        return getLearningProgressByUserId(userId);
    } catch (error) {
        console.error('Error syncing progress:', error);
        throw error;
    }
};

// Update user streak
// Update user streak
const updateStreak = async (userId) => {
    try {
      const progressRef = db.collection('LearningProgress').doc(userId);
      const progressDoc = await progressRef.get();
      
      if (!progressDoc.exists) {
        throw new Error('Learning progress not found');
      }
      
      const progress = progressDoc.data();
      const today = new Date();
      today.setHours(0, 0, 0, 0); // Reset time to start of day
      
      let newStreak = progress.streak || 0;
      const lastCompletedDate = progress.lastCompletedDate ? new Date(progress.lastCompletedDate) : null;
      
      if (lastCompletedDate) {
        lastCompletedDate.setHours(0, 0, 0, 0); // Reset time to start of day
        
        // Calculate days difference
        const diffTime = today.getTime() - lastCompletedDate.getTime();
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays === 1) {
          // Consecutive day, increase streak
          newStreak += 1;
          console.log(`Incrementing streak from ${progress.streak} to ${newStreak}`);
        } else if (diffDays > 1) {
          // Streak broken, reset to 1
          newStreak = 1;
          console.log(`Streak broken (${diffDays} days gap). Resetting to 1`);
        } else if (diffDays === 0) {
          // Same day, don't change streak
          console.log(`Already completed something today. Keeping streak at ${newStreak}`);
        }
      } else {
        // First activity, start streak at 1
        newStreak = 1;
        console.log(`First activity. Setting streak to 1`);
      }
      
      // Update in database
      await progressRef.update({ 
        streak: newStreak,
        lastCompletedDate: admin.firestore.FieldValue.serverTimestamp()
      });
      
      return { ...progress, streak: newStreak, lastCompletedDate: new Date().toISOString() };
    } catch (error) {
      console.error('Error updating streak:', error);
      throw error;
    }
  };

// Add points to user's total
const addPoints = async (userId, points) => {
    if (typeof points !== 'number' || points <= 0) {
        throw new Error('Points must be a positive number');
    }
    
    const progressRef = db.collection('LearningProgress').doc(userId);
    const userRef = db.collection('Users').doc(userId);
    
    // Transaction to update both learning progress and user document
    await db.runTransaction(async (transaction) => {
        const [progressDoc, userDoc] = await Promise.all([
            transaction.get(progressRef),
            transaction.get(userRef)
        ]);
        
        if (!progressDoc.exists || !userDoc.exists) {
            throw new Error('User or learning progress not found');
        }
        
        const progressData = progressDoc.data();
        const userData = userDoc.data();
        
        const newTotalPoints = (progressData.totalPoints || 0) + points;
        const newUserPoints = (userData.points || 0) + points;
        
        // Calculate new level based on points
        // Example: level up every 100 points
        const newLevel = Math.floor(newUserPoints / 100) + 1;
        
        transaction.update(progressRef, {
            totalPoints: newTotalPoints,
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
        
        transaction.update(userRef, {
            points: newUserPoints,
            level: newLevel,
            lastActive: admin.firestore.FieldValue.serverTimestamp()
        });
    });
    
    // Get the updated learning progress
    return getLearningProgressByUserId(userId);
};

// Mark a lesson as completed
const completeLesson = async (userId, lessonId) => {
    const userRef = db.collection('Users').doc(userId);
    const userDoc = await userRef.get();
    
    if (!userDoc.exists) {
        throw new Error('User not found');
    }
    
    const userData = userDoc.data();
    const completedLessons = userData.completedLessons || [];
    
    // Add lesson to completed lessons if not already present
    if (!completedLessons.includes(lessonId)) {
        completedLessons.push(lessonId);
        
        await userRef.update({
            completedLessons,
            lastActive: admin.firestore.FieldValue.serverTimestamp()
        });
        
        // Update streak and add points for completing a lesson
        await updateStreak(userId);
        await addPoints(userId, 10); // Award 10 points for completing a lesson
    }
    
    return getUserWithProgress(userId);
};

// Get user with learning progress
const getUserWithProgress = async (userId) => {
    const [user, progress] = await Promise.all([
        db.collection('Users').doc(userId).get(),
        getLearningProgressByUserId(userId)
    ]);
    
    if (!user.exists) {
        throw new Error('User not found');
    }
    
    return {
        user: { id: user.id, ...user.data() },
        learningProgress: progress
    };
};

const updateRewards = async (userId) => {
    const progressRef = db.collection('LearningProgress').doc(userId);
    const progressDoc = await progressRef.get();
  
    if (!progressDoc.exists) {
      throw new Error('User progress not found.');
    }
  
    const progressData = progressDoc.data();
    const newBadges = [...(progressData.rewards?.badges || [])];
    const newLevel = Math.floor(progressData.totalPoints / 100) + 1;
  
    if (newLevel === 2 && !newBadges.includes('Beginner')) {
      newBadges.push('Beginner');
    }
    if (newLevel === 5 && !newBadges.includes('Intermediate')) {
      newBadges.push('Intermediate');
    }
  
    await progressRef.update({
      rewards: {
        badges: newBadges,
        level: newLevel,
      },
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
  
    return { badges: newBadges, level: newLevel };
  };

  const addProgressHistory = async (userId, action, details) => {
    const progressRef = db.collection('LearningProgress').doc(userId);
    const progressDoc = await progressRef.get();
  
    if (!progressDoc.exists) {
      throw new Error('User progress not found.');
    }
  
    const progressData = progressDoc.data();
    const newHistory = [
      ...(progressData.progressHistory || []),
      {
        date: new Date().toISOString(),
        action,
        details,
      },
    ];
  
    await progressRef.update({
      progressHistory: newHistory,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
  
    return newHistory;
  };

  const generateDailyRecommendations = async (userId) => {
    const progressRef = db.collection('LearningProgress').doc(userId);
    const progressDoc = await progressRef.get();
  
    if (!progressDoc.exists) {
      throw new Error('User progress not found.');
    }
  
    const topics = await db.collection('Topics').get();
    const topicList = topics.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  
    const shuffledTopics = topicList.sort(() => Math.random() - 0.5).slice(0, 3);
  
    const recommendations = shuffledTopics.map((topic) => ({
      topicId: topic.id,
      moduleId: topic.modules[0]?.id,
    }));
  
    await progressRef.update({
      dailyRecommendations: recommendations,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
  
    return recommendations;
  };

module.exports = {
    validateLearningProgressData,
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
};