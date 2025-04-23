import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User, AuthState, LearningProgress } from '@/types/user';
import 'react-native-get-random-values';

// Firebase imports
import { firebase, firebaseAuth, firestoreDB } from '@/firebase/config';

interface AuthStore extends AuthState {
  // Authentication
  login: (email: string, password: string) => Promise<void>;
  socialLogin: (provider: 'google' | 'apple') => Promise<void>;
  logout: () => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<{ user: User; token: string; }>;
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

// Helper to map Firebase user to our User type
const mapFirebaseUser = async (firebaseUser: any): Promise<User> => {
  try {
    // Get additional user data from Firestore
    const userDoc = await firestoreDB.collection('users').doc(firebaseUser.uid).get();
    const userData = userDoc.data() || {};
    
    return {
      id: firebaseUser.uid,
      email: firebaseUser.email || '',
      name: firebaseUser.displayName || userData.name || '',
      avatar: firebaseUser.photoURL || userData.avatar || '',
      verified: firebaseUser.emailVerified,
      role: userData.role || 'user',
      learningStyle: userData.learningStyle,
      preferredTopics: userData.preferredTopics || [],
      knowledgeLevel: userData.knowledgeLevel,
      points: userData.points || 0,
      streak: userData.streak || 0,
      completedLessons: userData.completedLessons || [],
      guardianEmail: userData.guardianEmail,
      guardianConnected: userData.guardianConnected || false,
      createdAt: userData.createdAt || new Date().toISOString(),
      level: userData.level || 0,
      isMinor: userData.isMinor || false,
      lastActive: userData.lastActive || null,
    };
  } catch (error) {
    console.error('Error mapping Firebase user:', error);
    // Return minimal user object if Firestore fetch fails
    return {
      id: firebaseUser.uid,
      email: firebaseUser.email || '',
      name: firebaseUser.displayName || '',
      avatar: firebaseUser.photoURL || '',
      verified: firebaseUser.emailVerified,
      role: 'user',
      points: 0,
      completedLessons: [],
      createdAt: new Date().toISOString(),
      learningStyle: null,
      preferredTopics: [],
      knowledgeLevel: 0,
      streak: 0,
      guardianEmail: undefined,
      guardianConnected: false,
      level: 0,
      isMinor: false,
      lastActive: null,
    };
  }
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
        console.log('Initializing Firebase auth listener');

        // Mark that we've attempted auto-login
        set({ autoLoginAttempted: true, isLoading: true });

        // Set up Firebase auth state listener
        const unsubscribe = firebaseAuth.onAuthStateChanged(async (firebaseUser) => {
          if (firebaseUser) {
            try {
              console.log('User authenticated:', firebaseUser.uid);
              
              // Get ID token for API calls
              const token = await firebaseUser.getIdToken();
              
              // Map Firebase user to our User type
              const user = await mapFirebaseUser(firebaseUser);
              
              // Determine if onboarding is complete
              const userHasCompletedOnboarding = !!(
                user.learningStyle &&
                user.preferredTopics?.length > 0 &&
                user.knowledgeLevel !== undefined
              );
              
              set({
                user,
                token,
                isAuthenticated: firebaseUser.emailVerified,
                isLoading: false,
                error: null,
                isOnboardingComplete: userHasCompletedOnboarding,
              });
              
              // Fetch learning progress
              await get().fetchLearningProgress();
              
              // Initialize progress store with user ID and token
              if (user.id && token) {
                try {
                  // We need to get the progress store directly instead of using a hook
                  const progressStore = await import('./progress-store').then(m => m.useProgressStore);
                  await progressStore.getState().initializeProgress(user.id, token);
                } catch (error) {
                  console.error("Failed to initialize progress store:", error);
                }
              }
            } catch (error: any) {
              console.error('Error handling authenticated user:', error);
              set({
                error: error.message || 'Error processing authenticated user',
                isLoading: false
              });
            }
          } else {
            // User is signed out
            console.log('User is signed out');
            set({
              user: null,
              token: null,
              isAuthenticated: false,
              isLoading: false,
              error: null,
              isOnboardingComplete: false
            });
          }
        });

        return unsubscribe;
      },

      login: async (email, password) => {
        set({ isLoading: true, error: null });
        try {
          // Sign in with Firebase
          const userCredential = await firebaseAuth.signInWithEmailAndPassword(email, password);
          const firebaseUser = userCredential.user;
          
          // If email not verified, send verification email again
          if (!firebaseUser.emailVerified) {
            await firebaseUser.sendEmailVerification();
            set({
              error: 'Please verify your email before logging in',
              isLoading: false,
              autoLoginAttempted: true
            });
            return;
          }
          
          // Get ID token for API calls
          const token = await firebaseUser.getIdToken();
          
          // Map Firebase user to our User type
          const user = await mapFirebaseUser(firebaseUser);
          
          // Determine if onboarding is complete
          const userHasCompletedOnboarding = !!(
            user.learningStyle &&
            user.preferredTopics?.length > 0 &&
            user.knowledgeLevel !== undefined
          );
          
          set({
            user,
            token,
            isAuthenticated: true,
            isLoading: false,
            error: null,
            autoLoginAttempted: true,
            isOnboardingComplete: userHasCompletedOnboarding,
          });
          
          console.log("Onboarding complete:", userHasCompletedOnboarding);
          await get().fetchLearningProgress();
          
          // Initialize progress store with user ID and token
          if (user.id && token) {
            try {
              const progressStore = await import('./progress-store').then(m => m.useProgressStore);
              await progressStore.getState().initializeProgress(user.id, token);
            } catch (error) {
              console.error("Failed to initialize progress store:", error);
            }
          }
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
          
          set({
            error: errorMessage,
            isLoading: false,
            autoLoginAttempted: true
          });
        }
      },

      logout: async () => {
        try {
          // Before logout, try to sync progress
          try {
            const token = get().token;
            const progressStore = await import('./progress-store').then(m => m.useProgressStore);
            if (token) {
              await progressStore.getState().syncWithServer(token);
              console.log("Progress synced before logout");
            }
          } catch (syncError) {
            console.warn('Failed to sync progress before logout:', syncError);
          }
          
          // Sign out from Firebase
          await firebaseAuth.signOut();
          
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
          set({ error: 'Failed to log out' });
          
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
          // Create user with Firebase
          const userCredential = await firebaseAuth.createUserWithEmailAndPassword(email, password);
          const firebaseUser = userCredential.user;
          
          // Update profile with displayName
          await firebaseUser.updateProfile({ displayName: name });
          
          // Create user document in Firestore
          await firestoreDB.collection('users').doc(firebaseUser.uid).set({
            email,
            name,
            role: 'user',
            points: 0,
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
          });
          
          // Send verification email
          await firebaseUser.sendEmailVerification();
          
          // Get ID token
          const token = await firebaseUser.getIdToken();
          
          // Map Firebase user to our User type
          const user = await mapFirebaseUser(firebaseUser);
          
          // For registration, store the user data but don't set authenticated
          // until they verify their email
          set({
            user,
            token,
            isAuthenticated: false, 
            isLoading: false,
            error: null,
            autoLoginAttempted: true,
            isOnboardingComplete: false 
          });
          
          return { user, token };
        } catch (error: any) {
          console.error('Registration error:', error);
          let errorMessage = 'Registration failed';
          
          if (error.code === 'auth/email-already-in-use') {
            errorMessage = 'This email is already in use';
          } else if (error.code === 'auth/invalid-email') {
            errorMessage = 'Invalid email format';
          } else if (error.code === 'auth/weak-password') {
            errorMessage = 'Password is too weak';
          } else if (error.code === 'auth/operation-not-allowed') {
            errorMessage = 'Email/password accounts are not enabled';
          }
          
          set({
            error: errorMessage,
            isLoading: false,
            autoLoginAttempted: true
          });
          throw new Error(errorMessage);
        }
      },

      resetPassword: async (email) => {
        set({ isLoading: true, error: null });
        try {
          await firebaseAuth.sendPasswordResetEmail(email);
          set({ isLoading: false });
        } catch (error: any) {
          console.error('Reset password error:', error);
          let errorMessage = 'Failed to send password reset email';
          
          if (error.code === 'auth/invalid-email') {
            errorMessage = 'Invalid email address';
          } else if (error.code === 'auth/user-not-found') {
            errorMessage = 'No user found with this email';
          }
          
          set({
            error: errorMessage,
            isLoading: false,
          });
          throw new Error(errorMessage);
        }
      },
      
      // Placeholder stubs for other methods
      socialLogin: async () => {
        throw new Error('Social login not yet implemented for React Native');
      },
      
      setLearningStyle: async () => {
        throw new Error('Not yet implemented');
      },
      
      setPreferredTopics: async () => {
        throw new Error('Not yet implemented');
      },
      
      setKnowledgeLevel: async () => {
        throw new Error('Not yet implemented');
      },
      
      updateUser: async () => {
        throw new Error('Not yet implemented');
      },
      
      uploadAvatar: async () => {
        throw new Error('Not yet implemented');
      },
      
      connectGuardian: async () => {
        throw new Error('Not yet implemented');
      },
      
      fetchLearningProgress: async () => {
        // This will be implemented when we update the progress store
        console.log('Fetching learning progress');
      },
      
      completeModule: async () => {
        throw new Error('Not yet implemented');
      },
      
      completeLesson: async () => {
        throw new Error('Not yet implemented');
      },
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