import { useState } from "react";
import { Platform } from 'react-native';

// API base URL - change this to your actual server URL
const API_BASE_URL = Platform.select({
  ios: 'http://172.20.10.3:3000/api',
  android: 'http://10.0.2.2:3000/api',
  web: 'http://localhost:3000/api',
}) || 'http://localhost:3000/api';

const useResendVerification = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isResent, setIsResent] = useState(false);

  const resendVerificationEmail = async (email: string) => {
    if (!email) {
      setError('Email is required');
      return false;
    }

    setIsLoading(true);
    setError(null);
    setIsResent(false);

    try {
      const response = await fetch(`${API_BASE_URL}/auth/resend-verification`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to resend verification email');
      }

      setIsResent(true);
      setIsLoading(false);
      return true;
    } catch (error: any) {
      console.error('Error resending verification email:', error);
      setError(error.message || 'Failed to resend verification email');
      setIsLoading(false);
      return false;
    }
  };

  return {
    resendVerificationEmail,
    isLoading,
    error,
    isResent,
  };
};

export default useResendVerification;