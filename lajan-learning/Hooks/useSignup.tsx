import { useState } from 'react';
import { auth, db } from '@/firebase/config';
import firebase from '@react-native-firebase/app';

interface SignupCredentials {
  email: string;
  password: string;
  Name: string;
}

export default function useSignup() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const registeruser = async (credentials: SignupCredentials) => {
    setLoading(true);
    setError(null);
    
    try {
      const { email, password, Name } = credentials;
      
      // Create user with Firebase
      const userCredential = await auth.createUserWithEmailAndPassword(email, password);
      const firebaseUser = userCredential.user;
      
      // Set display name
      await firebaseUser.updateProfile({
        displayName: Name
      });
      
      // Create user document in Firestore
      await db.collection('users').doc(firebaseUser.uid).set({
        email,
        name: Name,
        role: 'user',
        points: 0,
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      });
      
      // Send verification email
      await firebaseUser.sendEmailVerification();
      
      return true;
    } catch (error: any) {
      console.error('Registration error:', error);
      
      let errorMessage = 'Registration failed';
      if (error.code === 'auth/email-already-in-use') {
        errorMessage = 'This email is already in use';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'Invalid email format';
      } else if (error.code === 'auth/weak-password') {
        errorMessage = 'Password is too weak';
      } else if (error.code === 'auth/operation-not-allowed') {
        errorMessage = 'Email/password accounts are not enabled';
      }
      
      setError(errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  };

  return { registeruser, loading, error };
}