const express = require('express');
const authController = require('../firebase/authController'); 
const path = require('path');
const {db} = require('../config')

const router = express.Router();

// Signup - Login - Users routes
router.post('/signup', authController.signup);
router.post('/login', authController.login);

// Email verification route
router.get('/verify/:userId/:uniqueString', authController.verifyEmail);

// Forgot Password
router.post('/forgotpassword', authController.forgotPassword);

// Serve Reset Password Page
// Serve Reset Password Page
router.get('/reset-password/:token', async (req, res) => {
    const { token } = req.params;

    try {
        // Check if there's any user with a valid resetTokenExpiry
        const usersRef = db.collection('Users');
        const userSnapshot = await usersRef
            .where('resetTokenExpiry', '>', Date.now())  // Only one inequality filter now
            .get();

        if (userSnapshot.empty) {
            // If no valid token is found, serve the success page with a failure message
            return res.sendFile(path.join(__dirname, '../views/reset-success.html'));
        }

        // If valid, render the reset-password form
        res.render('reset-password', { token });

    } catch (error) {
        console.error('Error verifying reset link:', error.message);
        res.status(500).json({ message: 'An error occurred. Please try again.' });
    }
});

// Reset Password
router.post('/reset-password/:token', authController.resetPassword);


module.exports = router;
