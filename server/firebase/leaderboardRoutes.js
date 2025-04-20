const express = require('express');
const router = express.Router();
const leaderboardController = require('../firebase/leaderboardController');
const { authenticate } = require('../firebase/firebaseMiddleware');

// Apply authentication middleware to all routes
router.use(authenticate);

// Get all-time leaderboard (default)
router.get('/', leaderboardController.getAllTimeLeaderboard);

// Get weekly leaderboard
router.get('/weekly', leaderboardController.getWeeklyLeaderboard);

// Get friends leaderboard
router.get('/friends', leaderboardController.getFriendsLeaderboard);

// Get top 5 users (fallback for friends if no friend system exists)
router.get('/top-five', leaderboardController.getTopFiveLeaderboard);

module.exports = router;