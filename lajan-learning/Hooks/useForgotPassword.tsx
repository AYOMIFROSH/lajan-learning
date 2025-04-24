import { useState } from 'react';
import { firebaseAuth } from '@/firebase/config';

export default function useForgotPassword() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sendPasswordResetEmail = async (email: string) => {
    setLoading(true);
    setError(null);
    try {
      await firebaseAuth.sendPasswordResetEmail(email);
      return true;
    } catch (err: any) {
      console.error('Password reset error:', err);
      let errorMessage = 'Failed to send password reset email';
      if (err.code === 'auth/invalid-email') errorMessage = 'Invalid email address';
      else if (err.code === 'auth/user-not-found') errorMessage = 'No user found with this email';
      setError(errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  };

  return { sendPasswordResetEmail, loading, error };
}
