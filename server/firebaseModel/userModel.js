const admin = require('firebase-admin');
const validateUserData = (data) => {
    // Validate Name
    if (typeof data.Name !== 'string' || data.Name.trim() === '') {
        throw new Error('Invalid Name');
    }

    // Validate email
    if (typeof data.email !== 'string' || !/\S+@\S+\.\S+/.test(data.email)) {
        throw new Error('Invalid email');
    }

    // Ensure role is set to 'user' by default if not provided
    if (!data.role) {
        data.role = 'user';
    } else if (typeof data.role !== 'string') {
        throw new Error('Invalid role');
    }

    // Validate password
    if (typeof data.password !== 'string' || data.password.length < 6) {
        throw new Error('Invalid password');
    }

    // Validate verified flag and set default to false if not provided
    if (typeof data.verified !== 'boolean') {
        data.verified = false;
    }

    // Validate learningStyle (must be empty or one of the allowed values)
    if (data.learningStyle !== undefined && data.learningStyle !== 'visual' && data.learningStyle !== 'practical') {
        throw new Error('Invalid learning style');
    }

    // Validate preferredTopics (must be an array or empty)
    if (!data.preferredTopics) {
        data.preferredTopics = []; // Default empty topics array
    } else if (!Array.isArray(data.preferredTopics)) {
        throw new Error('Invalid preferred topics');
    }

    // Validate knowledgeLevel (must be undefined or a valid number)
    if (data.knowledgeLevel !== undefined && typeof data.knowledgeLevel !== 'number') {
        throw new Error('Invalid knowledge level');
    }

    // Validate points
    if (typeof data.points !== 'number') {
        data.points = 0; // Default points
    }

    // Validate streak
    if (typeof data.streak !== 'number') {
        data.streak = 0; // Default streak
    }

    // Validate completedLessons
    if (!data.completedLessons) {
        data.completedLessons = []; // Default empty completed lessons array
    } else if (!Array.isArray(data.completedLessons)) {
        throw new Error('Invalid completed lessons');
    }

    if (data.level !== undefined && typeof data.level !== 'number') {
        throw new Error('Invalid level');
    }

    // Validate isMinor
    if (typeof data.isMinor !== 'boolean') {
        data.isMinor = false; // Default is not a minor
    }

    // Validate guardianConnected
    if (typeof data.guardianConnected !== 'boolean') {
        data.guardianConnected = false; // Default not connected to guardian
    }

    // Set timestamps if not provided
    if (!data.createdAt) {
        data.createdAt = admin.firestore.FieldValue.serverTimestamp();
    }

    if (!data.lastActive) {
        data.lastActive = admin.firestore.FieldValue.serverTimestamp();
    }

    // Optional fields validation
    if (data.avatar !== undefined && typeof data.avatar !== 'string') {
        throw new Error('Invalid avatar URL');
    }

    if (data.bio !== undefined && typeof data.bio !== 'string') {
        throw new Error('Invalid bio');
    }

    if (data.guardianEmail !== undefined && typeof data.guardianEmail !== 'string') {
        throw new Error('Invalid guardian email');
    }

    if (data.gmailToken && typeof data.gmailToken !== 'object') {
        throw new Error('Invalid gmailToken');
    }

    if (data.resetToken && typeof data.resetToken !== 'string') {
        throw new Error('Invalid resetToken');
    }

    if (data.resetTokenExpiry && !(data.resetTokenExpiry instanceof Date) && typeof data.resetTokenExpiry !== 'number') {
        throw new Error('Invalid resetTokenExpiry');
    }
};

// Create a new user document in Firestore
const createUser = async (db, userData) => {
    validateUserData(userData);
    
    // Add timestamps if not present
    if (!userData.createdAt) {
        userData.createdAt = admin.firestore.FieldValue.serverTimestamp();
    }
    if (!userData.lastActive) {
        userData.lastActive = admin.firestore.FieldValue.serverTimestamp();
    }
    
    const usersRef = db.collection('Users');
    const userDoc = await usersRef.add(userData);
    
    // Initialize learning progress for this user
    await initializeLearningProgress(db, userDoc.id);
    
    return userDoc;
};

// Get user by ID
const getUserById = async (db, userId) => {
    const userDoc = await db.collection('Users').doc(userId).get();
    if (!userDoc.exists) {
        throw new Error('User not found');
    }
    return { id: userDoc.id, ...userDoc.data() };
};

// Get user by email
const getUserByEmail = async (db, email) => {
    const usersSnapshot = await db.collection('Users')
        .where('email', '==', email)
        .limit(1)
        .get();
    
    if (usersSnapshot.empty) {
        return null;
    }
    
    const userDoc = usersSnapshot.docs[0];
    return { id: userDoc.id, ...userDoc.data() };
};

// Update user data
const updateUser = async (db, userId, userData) => {
    // Don't override these fields accidentally
    delete userData.password;
    delete userData.email;
    delete userData.verified;
    delete userData.createdAt;
    delete userData.role;
    
    // Update last active timestamp
    userData.lastActive = admin.firestore.FieldValue.serverTimestamp();
    
    await db.collection('Users').doc(userId).update(userData);
    return await getUserById(db, userId);
};

// Initialize learning progress for a new user
const initializeLearningProgress = async (db, userId) => {
    const learningProgressData = {
        userId,
        topicsProgress: {},
        streak: 0,
        lastCompletedDate: null,
        totalPoints: 0,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };
    
    await db.collection('LearningProgress').doc(userId).set(learningProgressData);
};

module.exports = { 
    validateUserData, 
    createUser, 
    getUserById, 
    getUserByEmail, 
    updateUser,
    initializeLearningProgress
};