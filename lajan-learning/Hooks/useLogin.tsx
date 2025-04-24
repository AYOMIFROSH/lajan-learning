import { useState } from 'react';
import { firebaseAuth } from '@/firebase/config';

export default function useLogin() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loginUser = async ({ email, password }: { email: string; password: string }) => {
    setLoading(true);
    setError(null);
    try {
      const userCredential = await firebaseAuth.signInWithEmailAndPassword(email, password);
      if (!userCredential.user.emailVerified) {
        setError('Please verify your email before logging in');
        return false;
      }
      return true;
    } catch (err: any) {
      console.error('Login error:', err);
      let errorMessage = 'Invalid email or password';
      switch (err.code) {
        case 'auth/user-disabled': errorMessage = 'This account has been disabled'; break;
        case 'auth/user-not-found': errorMessage = 'No account found with this email'; break;
        case 'auth/wrong-password': errorMessage = 'Incorrect password'; break;
        case 'auth/too-many-requests': errorMessage = 'Too many failed login attempts. Please try again later or reset your password'; break;
      }
      setError(errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  };

  return { loginUser, loading, error };
}