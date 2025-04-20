import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User, AuthState, LearningProgress } from '@/types/user';
import { Platform } from 'react-native';
import 'react-native-get-random-values';

// API base URL - change this to your actual server URL
const API_BASE_URL = Platform.select({
  ios: 'http://172.20.10.3:3000/api',
  android: 'http://10.0.2.2:3000/api',
  web: 'http://localhost:3000/api',
}) || 'http://localhost:3000/api';

// For debugging network requests
console.log(`Using API URL: ${API_BASE_URL}`);

interface AuthStore extends AuthState {
  // Authentication
  login: (email: string, password: string) => Promise<void>;
  socialLogin: (provider: 'google' | 'apple') => Promise<void>;
  logout: () => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  initializeAuthListener: () => (() => void) | undefined;
  clearPersistedState: () => Promise<void>;
  token: string | null;
  autoLoginAttempted: boolean;

  // Onboarding status flags
  isOnboardingComplete: boolean;
  setOnboardingComplete: (isComplete: boolean) => void;

  // User profile
  setLearningStyle: (style: 'visual' | 'practical') => Promise<void>;
  setPreferredTopics: (topics: string[]) => Promise<void>;
  setKnowledgeLevel: (level: number) => Promise<void>;
  updateUser: (userData: Partial<User>) => Promise<void>;
  uploadAvatar: (file: FormData) => Promise<void>;
  connectGuardian: (guardianEmail: string) => Promise<void>;

  // Learning progress
  learningProgress: LearningProgress | null;
  fetchLearningProgress: () => Promise<void>;
  completeModule: (topicId: string, moduleId: string) => Promise<void>;
  completeLesson: (lessonId: string) => Promise<void>;
}

const mapUserData = (userData: any) => {
  return {
    ...userData,
    name: userData.Name || userData.name || '', // Map Name to name
  };
};

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
      token: null,
      autoLoginAttempted: false,
      learningProgress: null,

      // Add new onboarding status flag
      isOnboardingComplete: false,

      setOnboardingComplete: (isComplete) => {
        set({ isOnboardingComplete: isComplete });
      },

      clearPersistedState: async () => {
        try {
          await AsyncStorage.removeItem('lajan-auth-storage');
          set({
            user: null,
            token: null,
            isAuthenticated: false,
            isLoading: false,
            error: null,
            autoLoginAttempted: true, // Mark that we've attempted login
            learningProgress: null,
            isOnboardingComplete: false // Reset onboarding flag
          });
          console.log('Persisted state cleared successfully');
        } catch (error) {
          console.error('Failed to clear persisted state:', error);
        }
      },

      initializeAuthListener: () => {
        // Check if there's a stored token and validate it if needed
        const checkAuthState = async () => {
          // If we've already attempted auto-login, don't try again
          if (get().autoLoginAttempted) {
            console.log("Auto-login already attempted, skipping");
            return;
          }

          set({ isLoading: true });
          try {
            // Try to restore auth state from persisted storage
            const storedData = await AsyncStorage.getItem('lajan-auth-storage');

            if (storedData) {
              const parsedData = JSON.parse(storedData);
              const userData = parsedData.state?.user;
              const storedToken = parsedData.state?.token;
              const onboardingComplete = parsedData.state?.isOnboardingComplete || false;

              if (userData && storedToken) {
                // Check if the token is still valid by making a request to the server
                const response = await fetch(`${API_BASE_URL}/auth/validate-token`, {
                  method: 'GET',
                  headers: {
                    'Authorization': `Bearer ${storedToken}`,
                    'Content-Type': 'application/json'
                  }
                });

                if (response.ok) {
                  // Token is valid, restore the session
                  set({
                    user: mapUserData(userData), // Map Name to name
                    token: storedToken,
                    isAuthenticated: userData.verified,
                    isLoading: false,
                    error: null,
                    autoLoginAttempted: true,
                    isOnboardingComplete: onboardingComplete
                  });

                  // Fetch learning progress
                  await get().fetchLearningProgress();

                  console.log('Auth session restored successfully');
                  return;
                } else {
                  // Token is invalid, clear persisted state
                  console.log('Stored token is invalid, clearing session');
                  await get().clearPersistedState();
                }
              } else {
                // No valid data found in storage
                await get().clearPersistedState();
              }
            } else {
              // No data in storage
              set({ autoLoginAttempted: true, isLoading: false });
            }
          } catch (error: any) {
            console.error('Error checking auth state:', error);
            // Start fresh by clearing any stored state on error
            await get().clearPersistedState();
            set({
              error: error.message || 'Failed to check auth state',
              isLoading: false,
              autoLoginAttempted: true
            });
          }
        };

        // Run immediately
        checkAuthState();

        // Return a no-op function since we don't have a real listener to unsubscribe from
        return () => { };
      },

      login: async (email, password) => {
        set({ isLoading: true, error: null });
        try {
          const response = await fetch(`${API_BASE_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password }),
          });

          const data = await response.json();

          if (!response.ok) {
            throw new Error(data.message || 'Login failed');
          }

          const userHasCompletedOnboarding = !!(
            data.user?.learningStyle &&
            data.user?.preferredTopics?.length > 0 &&
            data.user?.knowledgeLevel !== undefined
          );
          
          if (data.user && data.user.verified) {
            set({
              user: mapUserData(data.user), // Map Name to name
              token: data.token,
              isAuthenticated: true,
              isLoading: false,
              error: null,
              autoLoginAttempted: true,
              isOnboardingComplete: userHasCompletedOnboarding,
            });
            console.log("Onboarding complete:", userHasCompletedOnboarding);
            await get().fetchLearningProgress();
            
            // Initialize progress store with user ID and token
            if (data.user.id && data.token) {
              try {
                // We need to get the progress store directly instead of using a hook
                const progressStore = await import('./progress-store').then(m => m.useProgressStore);
                await progressStore.getState().initializeProgress(data.user.id, data.token);
              } catch (error) {
                console.error("Failed to initialize progress store:", error);
              }
            }
          } else {
            set({
              user: mapUserData(data.user), // Map Name to name
              token: data.token,
              isAuthenticated: false,
              isLoading: false,
              error: 'Please verify your email before logging in',
              autoLoginAttempted: true,
              isOnboardingComplete: false, 
            });
          }
        } catch (error: any) {
          console.error('Login error:', error);
          set({
            error: error.message || 'Invalid email or password',
            isLoading: false,
            autoLoginAttempted: true
          });
        }
      },

      socialLogin: async (provider) => {
        set({ isLoading: true, error: null });
        try {
          const response = await fetch(`${API_BASE_URL}/auth/social-login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ provider }),
          });

          const data = await response.json();

          if (!response.ok) {
            throw new Error(data.message || `Failed to login with ${provider}`);
          }

          set({
            user: data.user,
            token: data.token,
            isAuthenticated: true,
            isLoading: false,
            error: null,
            autoLoginAttempted: true
          });

          // Fetch learning progress
          await get().fetchLearningProgress();
          
          // Initialize progress store with user ID and token
          if (data.user.id && data.token) {
            try {
              const progressStore = await import('./progress-store').then(m => m.useProgressStore);
              await progressStore.getState().initializeProgress(data.user.id, data.token);
            } catch (error) {
              console.error("Failed to initialize progress store after social login:", error);
            }
          }
        } catch (error: any) {
          console.error(`${provider} login error:`, error);
          set({
            error: error.message || `Failed to login with ${provider}`,
            isLoading: false,
            autoLoginAttempted: true
          });
        }
      },

      logout: async () => {
        try {
          // Call logout endpoint if needed
          const token = get().token;
          if (token) {
            // Before logout, try to sync progress with server one last time
            try {
              const progressStore = await import('./progress-store').then(m => m.useProgressStore);
              await progressStore.getState().syncWithServer(token);
              console.log("Progress synced with server before logout");
            } catch (syncError) {
              console.warn('Failed to sync progress before logout:', syncError);
            }
            
            // Optional: Notify server about logout
            try {
              await fetch(`${API_BASE_URL}/auth/logout`, {
                method: 'POST',
                headers: {
                  'Authorization': `Bearer ${token}`,
                  'Content-Type': 'application/json'
                }
              });
            } catch (logoutError) {
              // Continue even if server logout fails
              console.warn('Server logout failed, continuing with client logout');
            }
          }
      
          // Reset progress store
          try {
            const progressStore = await import('./progress-store').then(m => m.useProgressStore);
            progressStore.getState().resetProgress();
          } catch (resetError) {
            console.warn('Failed to reset progress store:', resetError);
          }
      
          // Call clearPersistedState to handle the cleanup
          await get().clearPersistedState();
      
          console.log('Successfully logged out');
        } catch (error: any) {
          console.error('Logout error:', error);
          set({
            error: 'Failed to log out'
          });
      
          // Still try to clear state even if there was an error
          try {
            await get().clearPersistedState();
          } catch (clearError) {
            console.error('Failed to clear state after logout error:', clearError);
          }
          
          // Re-throw the error so the component can handle it
          throw error;
        }
      },
      

      register: async (email, password, name) => {
        set({ isLoading: true, error: null });
        try {
          const response = await fetch(`${API_BASE_URL}/auth/signup`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email,
              password,
              Name: name
            }),
          });

          const data = await response.json();

          if (!response.ok) {
            throw new Error(data.message || 'Registration failed');
          }

          // For registration, store the user data but don't set authenticated
          // until they verify their email
          set({
            user: mapUserData(data.user), // Map Name to name
            token: data.token,
            isAuthenticated: false, 
            isLoading: false,
            error: null,
            autoLoginAttempted: true,
            isOnboardingComplete: false 
          });

          return data;
        } catch (error: any) {
          console.error('Registration error:', error);
          set({
            error: error.message || 'Registration failed',
            isLoading: false,
            autoLoginAttempted: true
          });
          throw error;
        }
      },

      resetPassword: async (email) => {
        set({ isLoading: true, error: null });
        // call the public forgot-password endpoint instead
        const response = await fetch(`${API_BASE_URL}/auth/forgotpassword`,  {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email }),
        });
        const data = await response.json();
    
        if (!response.ok) {
          // set error state then throw so the component's catch block runs
          set({
            error: data.message || 'Failed to send password reset email',
            isLoading: false,
          });
          throw new Error(data.message || 'Failed to send password reset email');
        }
    
        // success
        set({ isLoading: false });
      },

      // User profile methods
      // In auth-store.tsx, setLearningStyle function
      setLearningStyle: async (style) => {
        const { user, token } = get();
        if (user && token) {
          try {
            set({ isLoading: true, error: null });
            const response = await fetch(`${API_BASE_URL}/user/learning-style`, {
              method: 'PUT',
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({ style }),
            });

            const data = await response.json();

            if (!response.ok) {
              throw new Error(data.message || 'Failed to update learning style');
            }

            // Important: Only update user data, don't set onboarding complete yet
            set({
              isLoading: false,
              user: { ...user, learningStyle: style }
              // Don't set isOnboardingComplete: true here - it should be set after knowledge level
            });
          } catch (error: any) {
            console.error('Error updating learning style:', error);
            set({
              error: error.message || 'Failed to update learning style',
              isLoading: false
            });
            throw error;
          }
        }
      },

      setPreferredTopics: async (topics) => {
        const { user, token } = get();
        if (user && token) {
          try {
            set({ isLoading: true, error: null });
            const response = await fetch(`${API_BASE_URL}/user/topics`, {
              method: 'PUT',
              headers: { 
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json' 
              },
              body: JSON.stringify({ topics }),
            });
      
            const data = await response.json();
            
            if (!response.ok) {
              throw new Error(data.message || 'Failed to update preferred topics');
            }
            
            // Only update user data, don't set onboarding complete yet
            console.log("Successfully saved topics, updating user data...");
            set({ 
              isLoading: false,
              user: { ...user, preferredTopics: topics }
              // Don't set isOnboardingComplete: true here
            });
          } catch (error: any) {
            console.error('Error updating preferred topics:', error);
            set({ 
              error: error.message || 'Failed to update preferred topics', 
              isLoading: false 
            });
            throw error;
          }
        }
      },
      
      setKnowledgeLevel: async (level) => {
        const { user, token } = get();
        if (user && token) {
          try {
            set({ isLoading: true, error: null });
            const response = await fetch(`${API_BASE_URL}/user/knowledge-level`, {
              method: 'PUT',
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({ level }),
            });

            const data = await response.json();

            if (!response.ok) {
              throw new Error(data.message || 'Failed to update knowledge level');
            }

            // This is the final step of the onboarding process, so mark onboarding as complete
            set({
              isLoading: false,
              user: { ...user, knowledgeLevel: level },
              isOnboardingComplete: true // Set onboarding complete when knowledge level is set
            });
          } catch (error: any) {
            console.error('Error updating knowledge level:', error);
            set({
              error: error.message || 'Failed to update knowledge level',
              isLoading: false
            });
            throw error;
          }
        }
      },

      updateUser: async (userData) => {
        const { user, token } = get();
        if (user && token) {
          try {
            set({ isLoading: true, error: null });
            const response = await fetch(`${API_BASE_URL}/user/update-profile`, {
              method: 'PUT',
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify(userData),
            });

            const data = await response.json();

            if (!response.ok) {
              throw new Error(data.message || 'Failed to update user profile');
            }

            set({
              isLoading: false,
              user: { ...user, ...userData }
            });
          } catch (error: any) {
            console.error('Error updating user profile:', error);
            set({
              error: error.message || 'Failed to update user profile',
              isLoading: false
            });
            throw error;
          }
        }
      },

      uploadAvatar: async (formData) => {
        const { user, token } = get();
        if (user && token) {
          try {
            set({ isLoading: true, error: null });
            const response = await fetch(`${API_BASE_URL}/user/avatar`, {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${token}`
                // Don't set Content-Type here, it will be set automatically with the boundary
              },
              body: formData
            });

            const data = await response.json();

            if (!response.ok) {
              throw new Error(data.message || 'Failed to upload avatar');
            }

            set({
              isLoading: false,
              user: { ...user, avatar: data.user.avatar }
            });
          } catch (error: any) {
            console.error('Error uploading avatar:', error);
            set({
              error: error.message || 'Failed to upload avatar',
              isLoading: false
            });
            throw error;
          }
        }
      },

      connectGuardian: async (guardianEmail) => {
        const { user, token } = get();
        if (user && token) {
          try {
            set({ isLoading: true, error: null });
            const response = await fetch(`${API_BASE_URL}/user/guardian`, {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({ guardianEmail }),
            });

            const data = await response.json();

            if (!response.ok) {
              throw new Error(data.message || 'Failed to connect guardian');
            }

            set({
              isLoading: false,
              user: {
                ...user,
                guardianEmail,
                guardianConnected: data.user.guardianConnected
              }
            });
          } catch (error: any) {
            console.error('Error connecting guardian:', error);
            set({
              error: error.message || 'Failed to connect guardian',
              isLoading: false
            });
            throw error;
          }
        }
      },

      // Learning progress methods
      fetchLearningProgress: async () => {
        const { token, user } = get();
        if (token) {
          try {
            set({ isLoading: true, error: null });
            const response = await fetch(`${API_BASE_URL}/progress`, {
              method: 'GET',
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
              }
            });

            const data = await response.json();

            if (!response.ok) {
              throw new Error(data.message || 'Failed to fetch learning progress');
            }

            set({
              isLoading: false,
              learningProgress: data.progress
            });
            
            // Also update the progress store with this data
            if (user && user.id && data.progress) {
              try {
                // Import and use the progress store
                const progressStore = await import('./progress-store').then(m => m.useProgressStore);
                const currentProgress = progressStore.getState().progress;
                
                // Only overwrite if we don't have progress yet or if userId matches
                if (!currentProgress || currentProgress.userId === user.id) {
                  progressStore.setState({ progress: data.progress });
                }
              } catch (error) {
                console.error("Failed to update progress store:", error);
              }
            }
          } catch (error: any) {
            console.error('Error fetching learning progress:', error);
            set({
              error: error.message || 'Failed to fetch learning progress',
              isLoading: false
            });
          }
        }
      },

      completeModule: async (topicId, moduleId) => {
        const { token, user } = get();
        if (token && user) {
          try {
            set({ isLoading: true, error: null });
            
            // Call server endpoint to complete module
            const response = await fetch(`${API_BASE_URL}/progress/module/complete`, {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({ topicId, moduleId }),
            });

            const data = await response.json();

            if (!response.ok) {
              throw new Error(data.message || 'Failed to complete module');
            }

            // Update user points and learning progress in auth store
            set({
              isLoading: false,
              learningProgress: data.progress,
              user: {
                ...user,
                points: (user.points || 0) + data.pointsEarned,
                streak: data.progress.streak
              }
            });
            
            // Also update the progress store
            try {
              // Import and use the progress store
              const progressStore = await import('./progress-store').then(m => m.useProgressStore);
              
              // Update local progress with the server response
              if (data.progress) {
                progressStore.setState({ progress: data.progress });
              } else {
                // If no progress in response, mark the module as completed in the progress store
                await progressStore.getState().completeModule(
                  user.id, 
                  topicId, 
                  moduleId, 
                  1.0, // Default perfect score
                  token
                );
              }
            } catch (error) {
              console.error("Failed to update progress store after completing module:", error);
            }
          } catch (error: any) {
            console.error('Error completing module:', error);
            set({
              error: error.message || 'Failed to complete module',
              isLoading: false
            });
            throw error;
          }
        }
      },

      completeLesson: async (lessonId) => {
        const { token, user } = get();
        if (token && user) {
          try {
            set({ isLoading: true, error: null });
            
            // Call server endpoint to complete lesson
            const response = await fetch(`${API_BASE_URL}/progress/lesson/complete`, {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({ lessonId }),
            });

            const data = await response.json();

            if (!response.ok) {
              throw new Error(data.message || 'Failed to complete lesson');
            }

            // Update user points, completed lessons, and learning progress in auth store
            set({
              isLoading: false,
              learningProgress: data.progress,
              user: {
                ...user,
                points: (user.points || 0) + data.pointsEarned,
                streak: data.user.streak,
                completedLessons: data.user.completedLessons || []
              }
            });
            
            // Also update the progress store
            try {
              // Import and use the progress store
              const progressStore = await import('./progress-store').then(m => m.useProgressStore);
              
              // Update local progress with the server response
              if (data.progress) {
                progressStore.setState({ progress: data.progress });
              }
              
              // Also sync with the server to ensure everything is up to date
              if (token) {
                await progressStore.getState().syncWithServer(token).catch(err => {
                  console.log("Error syncing progress after lesson completion:", err);
                });
              }
            } catch (error) {
              console.error("Failed to update progress store after completing lesson:", error);
            }
          } catch (error: any) {
            console.error('Error completing lesson:', error);
            set({
              error: error.message || 'Failed to complete lesson',
              isLoading: false
            });
            throw error;
          }
        }
      }
    }),
    {
      name: 'lajan-auth-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        // Only persist these fields
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
        isOnboardingComplete: state.isOnboardingComplete
      }),
    }
  )
);