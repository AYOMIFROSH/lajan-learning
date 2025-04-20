const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');
require('dotenv').config(); 

if (!process.env.FIREBASE_CREDENTIALS) {
  throw new Error('FIREBASE_CREDENTIALS environment variable is not set.');
}

// Build the absolute path to the credentials file
const credentialsPath = path.resolve(__dirname, process.env.FIREBASE_CREDENTIALS);
const serviceAccount = JSON.parse(fs.readFileSync(credentialsPath, 'utf8'));

// Initialize Firebase Admin SDK
let firebaseApp;

if (!firebaseApp) {
  firebaseApp = admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId: serviceAccount.project_id
  });
}

const db = admin.firestore();

// Function to add a user (using Admin SDK)
const addUser = async (data) => {
  try {
    console.log('Adding user to Firestore with data:', data);
    const usersRef = db.collection('Users');
    const userRef = await usersRef.add(data);
    console.log("User added successfully with ID:", userRef.id);
    return userRef;  
  } catch (error) {
    console.error("Error adding user:", error);
    throw error;
  }
};

module.exports = { db, addUser };
