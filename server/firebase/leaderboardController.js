const { db } = require('../config');
const admin = require('firebase-admin');

// Utility to get totalPoints for a user from LearningProgress
async function getTotalPoints(userId) {
  try {
    const progressDoc = await db.collection('LearningProgress').doc(userId).get();
    return progressDoc.exists ? progressDoc.data().totalPoints || 0 : 0;
  } catch (error) {
    console.error(`Error fetching totalPoints for user ${userId}:`, error);
    return 0;
  }
}

// Get all users sorted by totalPoints (all-time leaderboard)
exports.getAllTimeLeaderboard = async (req, res) => {
  try {
    // Fetch top 50 user profiles by points (ordering only for ID selection)
    const usersSnapshot = await db.collection('Users')
      .orderBy('points', 'desc')
      .limit(50)
      .get();

    if (usersSnapshot.empty) {
      return res.status(200).json({ status: 'success', users: [] });
    }

    // Fetch totalPoints and map user data
    const users = await Promise.all(
      usersSnapshot.docs.map(async doc => {
        const userData = doc.data();
        const totalPoints = await getTotalPoints(doc.id);
        return {
          id: doc.id,
          name: userData.name || userData.Name,
          points: totalPoints,
          avatar: userData.avatar || null,
          streak: userData.streak || 0,
          completedLessons: userData.completedLessons || []
        };
      })
    );

    // Sort by totalPoints descending
    users.sort((a, b) => b.points - a.points);

    res.status(200).json({ status: 'success', users });
  } catch (error) {
    console.error('Error fetching all-time leaderboard:', error);
    res.status(500).json({ status: 'error', message: error.message || 'Failed to fetch leaderboard' });
  }
};

// Get weekly leaderboard (users with activity in the last 7 days)
exports.getWeeklyLeaderboard = async (req, res) => {
  try {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const usersSnapshot = await db.collection('Users')
      .where('lastActive', '>=', sevenDaysAgo)
      .get();

    if (usersSnapshot.empty) {
      return res.status(200).json({ status: 'success', users: [] });
    }

    // Fetch totalPoints and map user data
    let users = await Promise.all(
      usersSnapshot.docs.map(async doc => {
        const userData = doc.data();
        const totalPoints = await getTotalPoints(doc.id);
        return {
          id: doc.id,
          name: userData.name || userData.Name,
          points: totalPoints,
          avatar: userData.avatar || null,
          streak: userData.streak || 0,
          completedLessons: userData.completedLessons || []
        };
      })
    );

    // Sort by streak then by points
    users.sort((a, b) => {
      if (b.streak !== a.streak) {
        return b.streak - a.streak;
      }
      return b.points - a.points;
    });

    users = users.slice(0, 50);
    res.status(200).json({ status: 'success', users });
  } catch (error) {
    console.error('Error fetching weekly leaderboard:', error);
    res.status(500).json({ status: 'error', message: error.message || 'Failed to fetch weekly leaderboard' });
  }
};

// Get friends leaderboard
exports.getFriendsLeaderboard = async (req, res) => {
  try {
    const userId = req.user.id;
    const userDoc = await db.collection('Users').doc(userId).get();

    if (!userDoc.exists) {
      return res.status(404).json({ status: 'error', message: 'User not found' });
    }

    const userData = userDoc.data();
    const friends = userData.friends || [];

    if (friends.length === 0) {
      return res.status(200).json({ status: 'success', users: [] });
    }

    // Fetch friend profiles and their totalPoints
    const friendProfiles = await Promise.all(
      friends.map(async friendId => {
        const doc = await db.collection('Users').doc(friendId).get();
        if (!doc.exists) return null;
        const friendData = doc.data();
        const totalPoints = await getTotalPoints(friendId);
        return {
          id: friendId,
          name: friendData.name || friendData.Name,
          points: totalPoints,
          avatar: friendData.avatar || null,
          streak: friendData.streak || 0,
          completedLessons: friendData.completedLessons || []
        };
      })
    );

    // Filter out nulls and add current user
    const users = friendProfiles.filter(u => u).concat([
      {
        id: userId,
        name: userData.name || userData.Name,
        points: await getTotalPoints(userId),
        avatar: userData.avatar || null,
        streak: userData.streak || 0,
        completedLessons: userData.completedLessons || []
      }
    ]);

    // Sort by totalPoints descending
    users.sort((a, b) => b.points - a.points);

    res.status(200).json({ status: 'success', users });
  } catch (error) {
    console.error('Error fetching friends leaderboard:', error);
    res.status(500).json({ status: 'error', message: error.message || 'Failed to fetch friends leaderboard' });
  }
};

// Fallback: Get top 5 users by totalPoints
exports.getTopFiveLeaderboard = async (req, res) => {
  try {
    const usersSnapshot = await db.collection('Users')
      .orderBy('points', 'desc')
      .limit(5)
      .get();

    if (usersSnapshot.empty) {
      return res.status(200).json({ status: 'success', users: [] });
    }

    const users = await Promise.all(
      usersSnapshot.docs.map(async doc => {
        const userData = doc.data();
        const totalPoints = await getTotalPoints(doc.id);
        return {
          id: doc.id,
          name: userData.name || userData.Name,
          points: totalPoints,
          avatar: userData.avatar || null,
          streak: userData.streak || 0,
          completedLessons: userData.completedLessons || []
        };
      })
    );

    // Sort by totalPoints descending
    users.sort((a, b) => b.points - a.points);

    res.status(200).json({ status: 'success', users });
  } catch (error) {
    console.error('Error fetching top five leaderboard:', error);
    res.status(500).json({ status: 'error', message: error.message || 'Failed to fetch top five leaderboard' });
  }
};
