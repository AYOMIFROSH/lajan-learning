const express = require('express');
const { db } = require('../config');  
const authorize = require('../service/googleApiAuthorization');
const { sendEmail } = require('../service/gmailApiServices');

const router = express.Router();

// Email Generation Route (existing)
// This route is used when no Gmail token is found.
router.post('/email/generate', async (req, res) => {
  const userId = req.user.id; 

  try {
    // Fetch the user from Firestore
    const userRef = db.collection('Users').doc(userId);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      return res.status(404).json({ message: 'User not found.' });
    }

    const user = userDoc.data();
    const refreshToken = user.gmailToken?.refresh_token;

    if (!refreshToken) {
      console.log('No Gmail token found. Redirecting to authorization.');
      const authUrl = await authorize(userId); 
      return res.status(401).json({ redirect: authUrl });
    }

    // Optionally save any data or perform additional logic
    await userRef.update({ lastChecked: new Date() });

    return res.status(200).json({ message: 'Email sent successfully!' });
  } catch (error) {
    console.error('Error sending email:', error.message);
    return res.status(500).json({ message: 'Failed to send email.' });
  }
});

// New Email Sending Route
router.post('/email/send', async (req, res) => {
  const userId = req.user.id;
  const { subject, content, toEmail } = req.body;

  // Ensure required fields are provided
  if (!subject || !content || !toEmail) {
    return res.status(400).json({ message: "Subject, content, and recipient email (toEmail) are required." });
  }

  try {
    // Fetch the user from Firestore
    const userRef = db.collection('Users').doc(userId);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      return res.status(404).json({ message: 'User not found.' });
    }

    const user = userDoc.data();
    const refreshToken = user.gmailToken?.refresh_token;

    // If token not available, trigger generate route
    if (!refreshToken) {
      console.log('No Gmail token found. Redirecting to authorization.');
      const authUrl = await authorize(userId);
      return res.status(401).json({ redirect: authUrl });
    }

    // Use gmailApiServices.sendEmail to send the email
    const result = await sendEmail(refreshToken, content, subject, toEmail);

    // Optionally update the user's document (e.g., lastEmailSent timestamp)
    await userRef.update({ lastEmailSent: new Date() });

    return res.status(200).json({ message: 'Email sent successfully!', data: result });
  } catch (error) {
    console.error('Error sending email:', error.message);
    return res.status(500).json({ message: 'Failed to send email.' });
  }
});

// Email Status Route (existing)
router.get('/email/status', async (req, res) => {
  try {
    const userId = req.user.id; 

    // Fetch user from Firestore
    const userRef = db.collection('Users').doc(userId);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      return res.status(404).json({ isConnected: false });
    }

    const user = userDoc.data();
    const isConnected = !!user.gmailToken?.refresh_token;

    res.status(200).json({ isConnected });
  } catch (error) {
    console.error('Error checking connection status:', error.message);
    res.status(500).json({ isConnected: false });
  }
});

module.exports = router;
