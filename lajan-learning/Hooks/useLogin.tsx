import { useState } from "react";
import { useAuthStore } from "@/store/auth-store";

interface LoginValues {
  email: string;
  password: string;
}

const useLogin = () => {
  const { login, error: storeError, isLoading } = useAuthStore();
  const [error, setError] = useState<string | null>(null);

  const loginUser = async (values: LoginValues) => {
    try {
      // Clear any previous errors
      setError(null);
      
      // Call the login function from our store
      await login(values.email, values.password);
      
      // If there was an error in the store, update our local error state
      if (storeError) {
        setError(storeError);
      }
    } catch (err: any) {
      setError(err.message || "An error occurred during login.");
    }
  };

  return { loginUser, loading: isLoading, error: error || storeError };
};

export default useLogin;