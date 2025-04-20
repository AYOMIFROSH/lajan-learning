import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import AsyncStorage from '@react-native-async-storage/async-storage';

type AuthContextType = {
  token: string | null;
  isAuthenticated: boolean;
  userData: any;
  userRole: any;
  isVerified: boolean;
  login: (newToken: string, newData: any) => void;
  logout: () => Promise<void>;  
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

type AuthProviderProps = {
  children: ReactNode;
  initialState?: Partial<AuthContextType>;
};

export const AuthProvider = ({ children, initialState }: AuthProviderProps) => {
  const [token, setToken] = useState<string | null>(initialState?.token || null);
  const [userData, setUserData] = useState<any>(initialState?.userData || null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(initialState?.isAuthenticated || false);
  const [userRole, setUserRole] = useState<string | null>(initialState?.userRole || null);
  const [isVerified, setIsVerified] = useState<boolean>(initialState?.isVerified || false);

  useEffect(() => {
    // Only load from AsyncStorage if no initial state was provided
    if (!initialState) {
      const loadUserData = async () => {
        try {
          const jsonValue = await AsyncStorage.getItem('user_data');
          if (jsonValue) {
            const storedData = JSON.parse(jsonValue);
            const { userToken, user } = storedData;
            setToken(userToken);
            setUserData(user);
            setIsAuthenticated(true);
            setUserRole(user?.role);
            setIsVerified(user?.verified); 
          }
        } catch (e) {
          console.error('Failed to load user data from storage', e);
        }
      };
      
      loadUserData();
    }
  }, [initialState]);

  // Update state when initialState changes
  useEffect(() => {
    if (initialState) {
      if (initialState.token !== undefined) setToken(initialState.token);
      if (initialState.userData !== undefined) setUserData(initialState.userData);
      if (initialState.isAuthenticated !== undefined) setIsAuthenticated(initialState.isAuthenticated);
      if (initialState.userRole !== undefined) setUserRole(initialState.userRole);
      if (initialState.isVerified !== undefined) setIsVerified(initialState.isVerified);
    }
  }, [initialState]);

  const login = initialState?.login || ((newToken: string, newData: any) => {
    // Store data in AsyncStorage
    const storeUserData = async () => {
      try {
        const jsonValue = JSON.stringify({ userToken: newToken, user: newData });
        await AsyncStorage.setItem('user_data', jsonValue);
      } catch (e) {
        console.error('Failed to save user data to storage', e);
      }
    };
    
    storeUserData();
    
    // Update state
    setToken(newToken);
    setUserData(newData);
    setIsAuthenticated(true);
    setUserRole(newData?.role);
    setIsVerified(newData?.verified); 
  });

  // If a custom logout function is provided in initialState, use it,
  // otherwise use our default implementation
  const logout = async () => {
    if (initialState?.logout) {
      try {
        await initialState.logout();
        return Promise.resolve();
      } catch (e) {
        console.error('Failed to logout', e);
        return Promise.reject(e);
      }
    } else {
      // Default logout implementation
      try {
        // Remove data from AsyncStorage
        await AsyncStorage.removeItem('user_data');
        
        // Update state
        setToken(null);
        setUserData(null);
        setIsAuthenticated(false);
        setUserRole(null);
        setIsVerified(false);
        
        return Promise.resolve();
      } catch (e) {
        console.error('Failed to remove user data from storage', e);
        return Promise.reject(e);
      }
    }
  };

  try {
    return (
      <AuthContext.Provider
        value={{
          token,
          isAuthenticated,
          userData,
          userRole,
          isVerified,
          login,
          logout,
        }}
      >
        {children}
      </AuthContext.Provider>
    );
  } catch (error) {
    console.error("Error rendering AuthProvider:", error);
    return null;
  }
};

// Custom hook to use the auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};