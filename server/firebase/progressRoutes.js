const express = require('express');
const router = express.Router();
const progressController = require('../firebase/progressController');
const { authenticate } = require('../firebase/firebaseMiddleware');

// Apply authentication middleware to all routes
router.use(authenticate);

// Get learning progress
router.get('/', progressController.getLearningProgress);

// Complete module
router.post('/module/complete', progressController.completeModule);

// Complete lesson
router.post('/lesson/complete', progressController.completeLesson);

// Add points
router.post('/points/add', progressController.addPoints);

// Update topic progress
router.put('/topic/:topicId', progressController.updateTopicProgress);

// Get user streak
router.get('/streak', progressController.getUserStreak);

// Update user streak
router.post('/streak/update', progressController.updateUserStreak);

// Initialize learning progress
router.post('/initialize', progressController.initializeLearningProgress);

// Sync progress between client and server
router.post('/sync', progressController.syncProgress);

// Get user rewards
router.get('/rewards', progressController.getUserRewards);

// Update rewards
router.post('/rewards/update', progressController.updateRewards);

// Add to progress history
router.post('/history/add', progressController.addProgressHistory);

// Get daily recommendations
router.get('/recommendations', progressController.getDailyRecommendations);

// Generate daily recommendations
router.post('/recommendations/generate', progressController.generateDailyRecommendations);

module.exports = router;