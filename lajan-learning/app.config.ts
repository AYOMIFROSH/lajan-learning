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
    ],
  } as ExpoConfig & { eas: { projectId: string } };
  
};
