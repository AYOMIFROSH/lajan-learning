const express = require('express');
const contentController = require('../firebase/contentController');
const { authenticate } = require('../firebase/firebaseMiddleware');

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Content routes
router.get('/topics', contentController.getAllTopics);
router.get('/topics/:topicId', contentController.getTopicDetails);
router.get('/modules/:moduleId', contentController.getModuleDetails);
router.get('/lessons/:lessonId', contentController.getLessonContent);
router.get('/recommendations', contentController.getRecommendations);

module.exports = router;