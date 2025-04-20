const express = require('express');
const userController = require('../firebase/userController');
const { authenticate } = require('../firebase/firebaseMiddleware');

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// User profile routes
router.get('/profile', userController.getUserProfile);
router.put('/update-profile', userController.updateUserProfile);
router.put('/learning-style', userController.updateLearningStyle);
router.put('/topics', userController.updatePreferredTopics);
router.put('/knowledge-level', userController.updateKnowledgeLevel);
router.post('/guardian', userController.connectGuardian);
router.post('/avatar', userController.uploadAvatar);
router.get('/with-progress', userController.getUserWithProgress);

module.exports = router;