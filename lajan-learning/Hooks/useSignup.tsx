import { useState } from 'react';
import { firebaseAuth, firestoreDB } from '@/firebase/config';
import firebase from '@react-native-firebase/app';

interface SignupCredentials { email: string; password: string; Name: string; }

export default function useSignup() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const registerUser = async ({ email, password, Name }: SignupCredentials) => {
    setLoading(true);
    setError(null);
    try {
      const userCredential = await firebaseAuth.createUserWithEmailAndPassword(email, password);
      const firebaseUser = userCredential.user;
      await firebaseUser.updateProfile({ displayName: Name });
      await firestoreDB.collection('users').doc(firebaseUser.uid).set({
        email,
        name: Name,
        role: 'user',
        points: 0,
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      });
      await firebaseUser.sendEmailVerification();
      return true;
    } catch (err: any) {
      console.error('Registration error:', err);
      let errorMessage = 'Registration failed';
      switch (err.code) {
        case 'auth/email-already-in-use': errorMessage = 'This email is already in use'; break;
        case 'auth/invalid-email': errorMessage = 'Invalid email format'; break;
        case 'auth/weak-password': errorMessage = 'Password is too weak'; break;
        case 'auth/operation-not-allowed': errorMessage = 'Email/password accounts are not enabled'; break;
      }
      setError(errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  };

  return { registerUser, loading, error };
}
