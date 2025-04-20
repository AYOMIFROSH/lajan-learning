const express = require('express');
const { google } = require('googleapis');
const { db } = require('../config');  // Firebase connection
require('dotenv').config();

const router = express.Router();

const oauth2Client = new google.auth.OAuth2(
    process.env.CLIENT_ID,
    process.env.CLIENT_SECRET,
    'http://localhost:3000/api/google/callback' 
);

router.get('/google/callback', async (req, res) => {
    console.log('Callback route was hit'); 
    const { code, state } = req.query;

    if (!code || !state) {
        console.error('Missing code or state in callback.');
        return res.status(400).json({ status: 'error', message: 'Authorization code or state missing.' });
    }

    try {
        const { userId } = JSON.parse(state); // Decode state
        if (!userId) {
            console.error('State does not contain userId.');
            throw new Error('Invalid state: Missing userId.');
        }

        // Exchange authorization code for tokens
        const tokenResponse = await oauth2Client.getToken(code);
        const { tokens } = tokenResponse;

        if (!tokens || !tokens.refresh_token) {
            console.error('No refresh token returned by Google.');
            throw new Error('Google did not return a refresh token.');
        }

        // Fetch the user from Firestore
        const userRef = db.collection('Users').doc(userId);
        const userDoc = await userRef.get();

        if (!userDoc.exists) {
            console.error('User not found.');
            return res.status(404).json({ status: 'error', message: 'User not found.' });
        }

        // Save the tokens in Firestore
        const user = userDoc.data();
        user.gmailToken = {
            clientId: process.env.CLIENT_ID,
            clientSecret: process.env.CLIENT_SECRET,
            refresh_token: tokens.refresh_token,
        };

        await userRef.update({ gmailToken: user.gmailToken });

        console.log('Refresh token saved successfully for user:', userId);

        // Redirect the user to the frontend
        res.redirect(`http://localhost:5173/${user.role}?authSuccess=true`);
    } catch (error) {
        console.error('Error in Google callback:', error.message, error.stack);
        res.status(500).json({ status: 'error', message: error.message });
    }
});

module.exports = router;
