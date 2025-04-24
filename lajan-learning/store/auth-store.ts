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
      verified: true, // Always set verified to true
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
      verified: true, // Always set verified to true
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
                isAuthenticated: true, // Always set authenticated to true
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
          
          // No email verification check - all users are considered verified

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

          // Create user document in Firestore with verified set to true
          await firestoreDB.collection('users').doc(firebaseUser.uid).set({
            email,
            name,
            role: 'user',
            points: 0,
            verified: true, // Set verified to true by default
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
          });

          // No email verification needed

          // Get ID token
          const token = await firebaseUser.getIdToken();

          // Map Firebase user to our User type
          const user = await mapFirebaseUser(firebaseUser);

          // Set user as authenticated immediately
          set({
            user,
            token,
            isAuthenticated: true, // Set authenticated to true immediately
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

      // Implementation for setLearningStyle
      setLearningStyle: async (style: 'visual' | 'practical') => {
        const { user } = get();
        set({ isLoading: true, error: null });

        try {
          if (!user || !user.id) {
            throw new Error('No authenticated user found');
          }

          // Update in Firestore
          await firestoreDB.collection('users').doc(user.id).update({
            learningStyle: style,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
          });

          // Update local state
          const updatedUser = {
            ...user,
            learningStyle: style
          };
          
          // Check if onboarding is now complete
          const onboardingComplete = !!(
            style && 
            updatedUser.preferredTopics?.length > 0 &&
            updatedUser.knowledgeLevel !== undefined
          );

          set({
            user: updatedUser,
            isLoading: false,
            isOnboardingComplete: onboardingComplete
          });

          console.log(`Learning style set to ${style}, onboarding complete: ${onboardingComplete}`);
          return;
        } catch (error: any) {
          console.error('Error setting learning style:', error);
          set({
            error: error.message || 'Failed to set learning style',
            isLoading: false
          });
          throw error;
        }
      },

      // Implementation for setPreferredTopics
      setPreferredTopics: async (topics: string[]) => {
        const { user } = get();
        set({ isLoading: true, error: null });

        try {
          if (!user || !user.id) {
            throw new Error('No authenticated user found');
          }

          // Update in Firestore
          await firestoreDB.collection('users').doc(user.id).update({
            preferredTopics: topics,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
          });

          // Update local state
          const updatedUser = {
            ...user,
            preferredTopics: topics
          };
          
          // Check if onboarding is now complete
          const onboardingComplete = !!(
            updatedUser.learningStyle && 
            topics.length > 0 &&
            updatedUser.knowledgeLevel !== undefined
          );

          set({
            user: updatedUser,
            isLoading: false,
            isOnboardingComplete: onboardingComplete
          });

          console.log(`Preferred topics set: ${topics.join(', ')}, onboarding complete: ${onboardingComplete}`);
          return;
        } catch (error: any) {
          console.error('Error setting preferred topics:', error);
          set({
            error: error.message || 'Failed to set preferred topics',
            isLoading: false
          });
          throw error;
        }
      },

      // Implementation for setKnowledgeLevel
      setKnowledgeLevel: async (level: number) => {
        const { user } = get();
        set({ isLoading: true, error: null });

        try {
          if (!user || !user.id) {
            throw new Error('No authenticated user found');
          }

          // Update in Firestore
          await firestoreDB.collection('users').doc(user.id).update({
            knowledgeLevel: level,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
          });

          // Update local state with the new knowledge level
          const updatedUser = {
            ...user,
            knowledgeLevel: level
          };

          // Determine if onboarding is now complete
          const onboardingComplete = !!(
            updatedUser.learningStyle &&
            updatedUser.preferredTopics?.length > 0 &&
            updatedUser.knowledgeLevel !== undefined
          );

          set({
            user: updatedUser,
            isLoading: false,
            isOnboardingComplete: onboardingComplete
          });

          console.log(`Knowledge level set to ${level}, onboarding complete: ${onboardingComplete}`);
          return;
        } catch (error: any) {
          console.error('Error setting knowledge level:', error);
          set({
            error: error.message || 'Failed to set knowledge level',
            isLoading: false
          });
          throw error;
        }
      },

      // Implementation for updateUser
      updateUser: async (userData: Partial<User>) => {
        const { user } = get();
        set({ isLoading: true, error: null });

        try {
          if (!user || !user.id) {
            throw new Error('No authenticated user found');
          }

          // Create an object with only the allowed fields to update
          const allowedFields = ['name', 'bio', 'learningStyle', 'preferredTopics', 'knowledgeLevel', 'isMinor'];
          const sanitizedData: Record<string, any> = {};

          // Only include fields that are in the allowedFields array
          Object.keys(userData).forEach(key => {
            if (allowedFields.includes(key) && key in userData) {
              sanitizedData[key] = userData[key as keyof typeof userData];
            }
          });

          // Add timestamp
          sanitizedData.updatedAt = firebase.firestore.FieldValue.serverTimestamp();

          // Update in Firestore
          await firestoreDB.collection('users').doc(user.id).update(sanitizedData);

          // Update local state
          const updatedUser = { ...user, ...sanitizedData };

          set({
            user: updatedUser,
            isLoading: false
          });

          console.log('User profile updated successfully');
          return;
        } catch (error: any) {
          console.error('Error updating user profile:', error);
          set({
            error: error.message || 'Failed to update user profile',
            isLoading: false
          });
          throw error;
        }
      },

      // Simplified uploadAvatar without using Firebase Storage
      uploadAvatar: async (file: FormData) => {
        const { user } = get();
        set({ isLoading: true, error: null });

        try {
          if (!user || !user.id) {
            throw new Error('No authenticated user found');
          }

          // For now, we'll just log the request since we're not using Firebase Storage
          console.log('Avatar upload requested - Storage functionality disabled');
          
          // Just return without actually uploading
          set({ isLoading: false });
          
          // You can implement a different avatar upload approach later if needed
          return;
        } catch (error: any) {
          console.error('Error handling avatar:', error);
          set({
            error: error.message || 'Failed to handle avatar',
            isLoading: false
          });
          throw error;
        }
      },

      // Implementation for connectGuardian
      connectGuardian: async (guardianEmail: string) => {
        const { user } = get();
        set({ isLoading: true, error: null });

        try {
          if (!user || !user.id) {
            throw new Error('No authenticated user found');
          }

          // First check if the guardian email is registered
          const guardianQuery = await firestoreDB
            .collection('users')
            .where('email', '==', guardianEmail)
            .get();

          if (guardianQuery.empty) {
            throw new Error('No user found with this email');
          }

          // Update the user's guardian information
          await firestoreDB.collection('users').doc(user.id).update({
            guardianEmail: guardianEmail,
            guardianConnected: false, // Will be set to true when guardian confirms
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
          });

          // Create a guardian request document
          await firestoreDB.collection('guardianRequests').add({
            userId: user.id,
            userName: user.name,
            guardianEmail: guardianEmail,
            status: 'pending',
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
          });

          // Update local state
          set({
            user: {
              ...user,
              guardianEmail: guardianEmail,
              guardianConnected: false
            },
            isLoading: false
          });

          console.log('Guardian connection request sent');
          return;
        } catch (error: any) {
          console.error('Error connecting guardian:', error);
          set({
            error: error.message || 'Failed to connect guardian',
            isLoading: false
          });
          throw error;
        }
      },

      // Implementation for fetchLearningProgress
      fetchLearningProgress: async () => {
        const { user } = get();
        set({ isLoading: true, error: null });

        try {
          if (!user || !user.id) {
            console.log('No authenticated user found for fetching progress');
            set({ isLoading: false, learningProgress: null });
            return;
          }

          // Fetch from Firestore
          const progressDoc = await firestoreDB
            .collection('progress')
            .doc(user.id)
            .get();

          if (!progressDoc.exists) {
            console.log('No progress found for user, initializing empty progress');
            set({
              isLoading: false,
              learningProgress: {
                userId: user.id,
                topicsProgress: {},
                streak: 0,
                lastCompletedDate: null,
                totalPoints: 0
              }
            });
            return;
          }

          const progressData = progressDoc.data() as LearningProgress;

          set({
            isLoading: false,
            learningProgress: progressData
          });

          console.log('Learning progress fetched successfully');
          return;
        } catch (error: any) {
          console.error('Error fetching learning progress:', error);
          set({
            error: error.message || 'Failed to fetch learning progress',
            isLoading: false
          });
        }
      },

      // Implementation for completeModule
      completeModule: async (topicId: string, moduleId: string) => {
        const { user, token } = get();

        try {
          if (!user || !user.id) {
            throw new Error('No authenticated user found');
          }

          // Use the progress store to track module completion
          const progressStore = await import('./progress-store').then(m => m.useProgressStore);

          // Standard score for now, could be parameterized later
          const score = 1.0;

          // Complete the module in the progress store
          await progressStore.getState().completeModule(user.id, topicId, moduleId, score, token);

          // Refresh our learning progress
          await get().fetchLearningProgress();

          console.log(`Module ${moduleId} completed successfully`);
        } catch (error: any) {
          console.error('Error completing module:', error);
          throw error;
        }
      },

      // Implementation for completeLesson
      completeLesson: async (lessonId: string) => {
        const { user } = get();
        set({ isLoading: true, error: null });

        try {
          if (!user || !user.id) {
            throw new Error('No authenticated user found');
          }

          // Check if lesson is already completed
          if (user.completedLessons && user.completedLessons.includes(lessonId)) {
            set({ isLoading: false });
            return;
          }

          // Create updated completedLessons array
          const completedLessons = [...(user.completedLessons || []), lessonId];

          // Update in Firestore
          await firestoreDB.collection('users').doc(user.id).update({
            completedLessons,
            points: firebase.firestore.FieldValue.increment(10), // Award 10 points for lesson completion
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
          });

          // Update local state
          set({
            user: {
              ...user,
              completedLessons,
              points: (user.points || 0) + 10
            },
            isLoading: false
          });

          console.log(`Lesson ${lessonId} completed successfully`);
          return;
        } catch (error: any) {
          console.error('Error completing lesson:', error);
          set({
            error: error.message || 'Failed to complete lesson',
            isLoading: false
          });
          throw error;
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