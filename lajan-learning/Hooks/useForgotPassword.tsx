import { useState } from 'react';
import { auth } from '@/firebase/config';

export default function useForgotPassword() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sendPasswordResetEmail = async (email: string) => {
    setLoading(true);
    setError(null);
    
    try {
      // Send password reset email using Firebase
      await auth.sendPasswordResetEmail(email);
      return true;
    } catch (error: any) {
      console.error('Password reset error:', error);
      
      let errorMessage = 'Failed to send password reset email';
      if (error.code === 'auth/invalid-email') {
        errorMessage = 'Invalid email address';
      } else if (error.code === 'auth/user-not-found') {
        errorMessage = 'No user found with this email';
      }
      
      setError(errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  };

  return { sendPasswordResetEmail, loading, error };
}