import firebase from '@react-native-firebase/app';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import Constants from 'expo-constants';
import storage from '@react-native-firebase/storage';

// Type guard to check if the extra property exists
const hasExtra = (obj: any): obj is { extra: Record<string, any> } => {
  return obj && obj.extra && typeof obj.extra === 'object';
};

// Get config from Constants
// Get config from Constants
let extraConfig = {};
if (hasExtra(Constants.expoConfig)) {
  extraConfig = Constants.expoConfig.extra;
} else {
  // If expoConfig is not available, provide a fallback
  console.warn('Constants.expoConfig is not available. Make sure your Expo SDK is up to date.');
  extraConfig = {};
}

// Firebase configuration using environment variables
const firebaseConfig = {
  apiKey: (extraConfig as any)?.FIREBASE_API_KEY,
  authDomain: (extraConfig as any)?.FIREBASE_AUTH_DOMAIN, 
  projectId: (extraConfig as any)?.FIREBASE_PROJECT_ID,
  storageBucket: (extraConfig as any)?.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: (extraConfig as any)?.FIREBASE_MESSAGING_SENDER_ID,
  appId: (extraConfig as any)?.FIREBASE_APP_ID
};

// Log warning if any config values are missing
if (!firebaseConfig.apiKey || !firebaseConfig.projectId || !firebaseConfig.appId) {
  console.warn(
    "Firebase configuration is incomplete. Make sure your .env file is set up correctly and app.config.ts is loading the variables."
  );
}

// Initialize Firebase if it hasn't been initialized yet
if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
  console.log("Firebase initialized successfully for iOS");
}

// Export the modules
export { firebase };
export const firestoreDB = firestore();
export const firebaseAuth = auth();


