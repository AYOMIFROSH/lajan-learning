import { useState } from "react";
import { useAuthStore } from "@/store/auth-store";

const useForgotPassword = () => {
  const { resetPassword, error: storeError, isLoading } = useAuthStore();
  const [error, setError] = useState<string | null>(null);
  const [isEmailSent, setIsEmailSent] = useState<boolean>(false);

  const sendPasswordResetEmail = async (email: string) => {
    try {
      // Clear any previous errors
      setError(null);
      setIsEmailSent(false);
      
      // Call the resetPassword function from our store
      await resetPassword(email);
      
      // Check if there was an error in the store
      if (storeError) {
        setError(storeError);
        return false;
      }
      
      // Set email sent flag to true if successful
      setIsEmailSent(true);
      return true;
    } catch (error: any) {
      console.error("Password reset error:", error.message);
      setError(error.message || "Failed to send password reset email");
      return false;
    }
  };

  return { 
    loading: isLoading, 
    error: error || storeError, 
    sendPasswordResetEmail,
    isEmailSent 
  };
};

export default useForgotPassword;