import { ReactNode, useEffect, useState } from "react";
import { useAuthStore } from "@/store/auth-store";
import { AuthProvider } from "@/AuthContext/useContext";
import { View, Text } from "react-native"; 
import { useRouter } from "expo-router";
import { useProgressStore } from "@/store/progress-store";

type AuthBridgeProps = {
  children: ReactNode;
};

/**
 * AuthBridge component that synchronizes the Zustand auth store with the React Context
 * This allows existing components that use the useAuth hook to continue working
 * while new components can use the more powerful useAuthStore
 */
const AuthBridge = ({ children }: AuthBridgeProps) => {
  const { user, token, isAuthenticated, logout, initializeAuthListener } = useAuthStore();
  const { initializeProgress } = useProgressStore();
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  // Clear any potentially invalid state on initial mount
  useEffect(() => {
    const clearInvalidState = async () => {
      try {
        console.log("Auth initialization started");
      } catch (error: any) {
        console.error("Error during auth initialization:", error);
        setError(error.message || "Auth initialization failed");
      }
    };
    
    clearInvalidState();
  }, []);

  // Initialize auth listener
  useEffect(() => {
    console.log("Setting up auth listener");
    const unsubscribe = initializeAuthListener();
    setIsInitialized(true);
    
    return () => {
      console.log("Cleaning up auth listener");
      if (typeof unsubscribe === 'function') {
        unsubscribe();
      }
    };
  }, [initializeAuthListener]);

  // Initialize progress store when authentication state changes
  useEffect(() => {
    if (isInitialized && isAuthenticated && user && token) {
      // Initialize progress for authenticated user
      console.log("Initializing progress for authenticated user:", user.id);
      initializeProgress(user.id, token).catch(err => {
        console.error("Failed to initialize progress:", err);
      });
    }
  }, [isAuthenticated, user, token, isInitialized, initializeProgress]);

  // Watch for authentication state changes
  useEffect(() => {
    if (isInitialized && !isAuthenticated) {
      // If user is not authenticated, redirect to login
      console.log("User is not authenticated, redirecting to login");
      router.replace('/');
    }
  }, [isAuthenticated, isInitialized, router]);

  // Create the bridged login function that will be passed to AuthProvider
  const bridgedLogin = (newToken: string, newData: any) => {
    // This function won't be called directly anymore since we're using Zustand
    // But we keep it for compatibility with existing code
    console.log("Using bridged login - consider migrating to useAuthStore directly");
  };
  
  // Create a modified logout function that passes to the store's logout
  const handleLogout = async () => {
    try {
      await logout();
      // Navigation will happen in the useEffect watching isAuthenticated
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  // If there's an error, show it properly wrapped in a Text component
  if (error) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text style={{ color: 'red' }}>Error: {error}</Text>
      </View>
    );
  }

  return (
    <AuthProvider 
      initialState={{
        token: token,
        isAuthenticated: isAuthenticated,
        userData: user,
        userRole: user?.role || null,
        isVerified: user?.verified || false,
        login: bridgedLogin,
        logout: handleLogout
      }}
    >
      {children}
    </AuthProvider>
  );
};

export default AuthBridge;