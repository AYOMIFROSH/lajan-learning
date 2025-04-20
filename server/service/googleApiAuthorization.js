const { google } = require('googleapis');
require('dotenv').config();

const SCOPE = [
    'https://www.googleapis.com/auth/gmail.readonly',
    'https://www.googleapis.com/auth/gmail.send',
];

const oauth2Client = new google.auth.OAuth2(
    process.env.CLIENT_ID,
    process.env.CLIENT_SECRET,
    'http://localhost:3000/api/google/callback' 
);

async function authorize(userId) {
    try {
        const state = JSON.stringify({ userId }); 
        const authUrl = oauth2Client.generateAuthUrl({
            scope: SCOPE,
            state,
            access_type: 'offline',
            prompt: 'consent',
        });

        return authUrl;
    } catch (err) {
        console.error('Error generating authorization URL:', err.message);
        throw new Error('Failed to generate authorization URL.');
    }
}

module.exports = authorize;
