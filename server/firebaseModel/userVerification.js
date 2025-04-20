const admin = require('firebase-admin');
const { db } = require('../config');  

// User verification function
const createUserVerification = async (userId, uniqueString, expiresAt) => {
    const userVerificationRef = db.collection('userVerifications').doc(userId); 

    // Set the verification document in Firestore
    await userVerificationRef.set({
        userId: userId,
        uniqueString: uniqueString,
        createdAt: admin.firestore.FieldValue.serverTimestamp(), 
        expiresAt: admin.firestore.Timestamp.fromDate(new Date(expiresAt)),
    });
};

// Get user verification by userId
const getUserVerificationByUserId = async (userId) => {
    const userVerificationRef = db.collection('userVerifications').doc(userId);
    const doc = await userVerificationRef.get();

    if (!doc.exists) {
        throw new Error('Verification record not found');
    }

    return doc.data();
};

module.exports = { createUserVerification, getUserVerificationByUserId };

  