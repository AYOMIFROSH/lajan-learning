const { db } = require('../config');
const { getUserById, updateUser } = require('../firebaseModel/userModel');
const { getUserWithProgress } = require('../firebaseModel/learningProgress');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Get User Profile
exports.getUserProfile = async (req, res) => {
    try {
        const userId = req.user.id;
        const user = await getUserById(db, userId);
        
        res.status(200).json({
            status: 'success',
            user
        });
        
    } catch (error) {
        console.error('Error getting user profile:', error);
        res.status(500).json({ 
            status: 'error',
            message: error.message || 'Failed to get user profile' 
        });
    }
};

// Update Learning Style
exports.updateLearningStyle = async (req, res) => {
    console.log('Update payload:', req.body);

    try {
        console.log('Update payload:', req.body);

        const userId = req.user.id;
        const { style } = req.body;
        
        if (!style || (style !== 'visual' && style !== 'practical')) {
            return res.status(400).json({ 
                status: 'error',
                message: 'Invalid learning style. Must be "visual" or "practical".' 
            });
        }
        
        const updatedUser = await updateUser(db, userId, { learningStyle: style });
        
        res.status(200).json({
            status: 'success',
            message: 'Learning style updated successfully',
            user: updatedUser
        });
    } catch (error) {
        console.error('Error updating learning style:', error);
        res.status(500).json({ 
            status: 'error',
            message: error.message || 'Failed to update learning style' 
        });
    }
};

// Update Preferred Topics
exports.updatePreferredTopics = async (req, res) => {
    try {
        const userId = req.user.id;
        const { topics } = req.body;
        
        if (!Array.isArray(topics)) {
            return res.status(400).json({ 
                status: 'error',
                message: 'Topics must be an array' 
            });
        }
        
        const updatedUser = await updateUser(db, userId, { preferredTopics: topics });
        
        res.status(200).json({
            status: 'success',
            message: 'Preferred topics updated successfully',
            user: updatedUser
        });
    } catch (error) {
        console.error('Error updating preferred topics:', error);
        res.status(500).json({ 
            status: 'error',
            message: error.message || 'Failed to update preferred topics' 
        });
    }
};

// Update Knowledge Level
exports.updateKnowledgeLevel = async (req, res) => {
    try {
        const userId = req.user.id;
        const { level } = req.body;
        
        if (typeof level !== 'number' || level < 1 || level > 10) {
            return res.status(400).json({ 
                status: 'error',
                message: 'Knowledge level must be a number between 1 and 10' 
            });
        }
        
        const updatedUser = await updateUser(db, userId, { knowledgeLevel: level });
        
        res.status(200).json({
            status: 'success',
            message: 'Knowledge level updated successfully',
            user: updatedUser
        });
    } catch (error) {
        console.error('Error updating knowledge level:', error);
        res.status(500).json({ 
            status: 'error',
            message: error.message || 'Failed to update knowledge level' 
        });
    }
};

// Update User Profile
exports.updateUserProfile = async (req, res) => {
    try {
        const userId = req.user.id;
        const updateData = req.body;
        
        // Prevent updating sensitive fields
        delete updateData.email;
        delete updateData.password;
        delete updateData.role;
        delete updateData.verified;
        delete updateData.createdAt;
        
        const updatedUser = await updateUser(db, userId, updateData);
        
        res.status(200).json({
            status: 'success',
            message: 'Profile updated successfully',
            user: updatedUser
        });
    } catch (error) {
        console.error('Error updating user profile:', error);
        res.status(500).json({ 
            status: 'error',
            message: error.message || 'Failed to update user profile' 
        });
    }
};

// Connect Guardian Account
exports.connectGuardian = async (req, res) => {
    try {
        const userId = req.user.id;
        const { guardianEmail } = req.body;
        
        if (!guardianEmail || typeof guardianEmail !== 'string') {
            return res.status(400).json({ 
                status: 'error',
                message: 'Guardian email is required' 
            });
        }
        
        // Check if guardian email exists in the system
        const guardiansSnapshot = await db.collection('Users')
            .where('email', '==', guardianEmail)
            .get();
        
        if (guardiansSnapshot.empty) {
            // If guardian not found, we'll still store the email but set guardianConnected to false
            await updateUser(db, userId, { 
                guardianEmail, 
                guardianConnected: false 
            });
            
            // Send invitation email to guardian (implementation omitted)
            
            return res.status(200).json({
                status: 'success',
                message: 'Guardian invitation sent',
                user: { 
                    id: userId,
                    guardianEmail,
                    guardianConnected: false
                }
            });
        }
        
        // If guardian exists, connect immediately
        const updatedUser = await updateUser(db, userId, { 
            guardianEmail, 
            guardianConnected: true 
        });
        
        res.status(200).json({
            status: 'success',
            message: 'Guardian connected successfully',
            user: updatedUser
        });
    } catch (error) {
        console.error('Error connecting guardian:', error);
        res.status(500).json({ 
            status: 'error',
            message: error.message || 'Failed to connect guardian' 
        });
    }
};

// Configure storage for multer
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = path.join(__dirname, '../uploads');
        // Create directory if it doesn't exist
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        // Create a unique filename
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        cb(null, `avatar-${req.user.id}-${uniqueSuffix}${ext}`);
    }
});

// Create multer upload instance
const upload = multer({ 
    storage,
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB limit
    },
    fileFilter: (req, file, cb) => {
        // Accept only images
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Only image files are allowed'));
        }
    }
}).single('avatar');

// Upload Avatar
exports.uploadAvatar = (req, res) => {
    upload(req, res, async (err) => {
        if (err) {
            return res.status(400).json({ 
                status: 'error',
                message: err.message 
            });
        }
        
        if (!req.file) {
            return res.status(400).json({ 
                status: 'error',
                message: 'No file uploaded' 
            });
        }
        
        try {
            const userId = req.user.id;
            
            // In a production environment, you'd likely upload to cloud storage
            // For this example, we'll just use the local path
            const avatarUrl = `/uploads/${req.file.filename}`;
            
            const updatedUser = await updateUser(db, userId, { avatar: avatarUrl });
            
            res.status(200).json({
                status: 'success',
                message: 'Avatar uploaded successfully',
                user: updatedUser
            });
        } catch (error) {
            console.error('Error uploading avatar:', error);
            // Clean up the uploaded file on error
            if (req.file) {
                fs.unlinkSync(req.file.path);
            }
            res.status(500).json({ 
                status: 'error',
                message: error.message || 'Failed to upload avatar' 
            });
        }
    });
};

// Get User With Learning Progress
exports.getUserWithProgress = async (req, res) => {
    try {
        const userId = req.user.id;
        const userWithProgress = await getUserWithProgress(userId);
        
        res.status(200).json({
            status: 'success',
            data: userWithProgress
        });
    } catch (error) {
        console.error('Error getting user with progress:', error);
        res.status(500).json({ 
            status: 'error',
            message: error.message || 'Failed to get user with progress' 
        });
    }
};