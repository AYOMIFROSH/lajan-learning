import { useState } from 'react';
import { auth } from '@/firebase/config';

export default function useLogin() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loginUser = async (credentials: { email: string; password: string }) => {
    setLoading(true);
    setError(null);
    
    try {
      const { email, password } = credentials;
      const userCredential = await auth.signInWithEmailAndPassword(email, password);
      
      // Check if email is verified
      if (!userCredential.user.emailVerified) {
        setError('Please verify your email before logging in');
        setLoading(false);
        return false;
      }
      
      return true;
    } catch (error: any) {
      console.error('Login error:', error);
      
      let errorMessage = 'Invalid email or password';
      if (error.code === 'auth/invalid-credential') {
        errorMessage = 'Invalid email or password';
      } else if (error.code === 'auth/user-disabled') {
        errorMessage = 'This account has been disabled';
      } else if (error.code === 'auth/user-not-found') {
        errorMessage = 'No account found with this email';
      } else if (error.code === 'auth/wrong-password') {
        errorMessage = 'Incorrect password';
      } else if (error.code === 'auth/too-many-requests') {
        errorMessage = 'Too many failed login attempts. Please try again later or reset your password';
      }
      
      setError(errorMessage);
      setLoading(false);
      return false;
    } finally {
      setLoading(false);
    }
  };

  return { loginUser, loading, error };
}
