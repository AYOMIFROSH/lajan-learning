import 'dotenv/config';
import { ExpoConfig, ConfigContext } from '@expo/config';

export default ({ config }: ConfigContext): ExpoConfig => {
  // pull in everything from app.json
  const base = require('./app.json').expo as ExpoConfig;

  return {
    ...base,
  
    extra: {
      ...base.extra,
      FIREBASE_API_KEY: process.env.FIREBASE_API_KEY,
      FIREBASE_AUTH_DOMAIN: process.env.FIREBASE_AUTH_DOMAIN,
      FIREBASE_PROJECT_ID: process.env.FIREBASE_PROJECT_ID,
      FIREBASE_STORAGE_BUCKET: process.env.FIREBASE_STORAGE_BUCKET,
      FIREBASE_MESSAGING_SENDER_ID: process.env.FIREBASE_MESSAGING_SENDER_ID,
      FIREBASE_APP_ID: process.env.FIREBASE_APP_ID,
      GOOGLE_WEB_CLIENT_ID: process.env.GOOGLE_WEB_CLIENT_ID, // Add for Google Sign-In
    },
  
    eas: {
      projectId: 'affe61a5-2482-4e43-8b9f-3589e3dfd86e',
    },
  
    plugins: [
      'expo-router',
      [
        '@react-native-firebase/app',
        {
          apiKey: process.env.FIREBASE_API_KEY,
          appId: process.env.FIREBASE_APP_ID,
          messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
          projectId: process.env.FIREBASE_PROJECT_ID,
          storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
        },
      ],
      '@react-native-google-signin/google-signin', // Add for Google Sign-In
      '@invertase/react-native-apple-authentication', // Add for Apple Sign-In
    ],
    
    // Update iOS config to include Apple Sign-In
    ios: {
      ...base.ios,
      supportsTablet: true,
      bundleIdentifier: "com.quinceybernard.lajanlearning",
      googleServicesFile: "./GoogleService-Info.plist",
      infoPlist: {
        ...((base.ios as any)?.infoPlist || {}),
        ITSAppUsesNonExemptEncryption: false,
        CFBundleURLTypes: [
          {
            CFBundleURLSchemes: [
              "com.googleusercontent.apps.YOUR_GOOGLE_CLIENT_ID" // Replace with your Google Client ID
            ]
          }
        ],
        // Add required capabilities for Apple Sign-In
        UIBackgroundModes: ["remote-notification"],
        // For Sign in with Apple
        NSFaceIDUsageDescription: "Allow $(PRODUCT_NAME) to use Face ID to authenticate you",
      },
      // Add Apple Sign-In entitlement
      entitlements: {
        "com.apple.developer.applesignin": ["Default"]
      }
    },
    
    // Update Android config for Google Sign-In
    android: {
      ...base.android,
      adaptiveIcon: {
        foregroundImage: "./assets/images/adaptive-icon.png",
        backgroundColor: "#ffffff"
      },
      package: "com.quinceybernard.lajanlearning", // Make sure the package name matches iOS bundle ID
      googleServicesFile: "./google-services.json"
    }
  } as ExpoConfig & { eas: { projectId: string } };
};