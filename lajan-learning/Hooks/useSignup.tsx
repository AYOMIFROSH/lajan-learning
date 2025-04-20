import { useState } from "react";
import { useAuthStore } from "@/store/auth-store";

interface RegisterValues {
  Name: string;
  email: string;
  password: string;
}

const UseRegister = () => {
  const { register, error: storeError, isLoading } = useAuthStore();
  const [error, setError] = useState<string | null>(null);
  const [isRegistered, setIsRegistered] = useState<boolean>(false);

  const registeruser = async (values: RegisterValues) => {
    try {
      // Clear any previous errors
      setError(null);
      setIsRegistered(false);
      
      // Call the register function from our store
      await register(values.email, values.password, values.Name);
      
      // Check if there was an error in the store
      if (storeError) {
        setError(storeError);
        return false;
      }
      
      // Set registered flag to true if successful
      setIsRegistered(true);
      return true;
    } catch (error: any) {
      console.error("Registration error:", error.message);
      setError(error.message || "An error occurred during registration");
      return false;
    }
  };

  return { 
    loading: isLoading, 
    error: error || storeError, 
    registeruser,
    isRegistered 
  };
};

export default UseRegister;