import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User, AuthState, LearningProgress } from '@/types/user';
import 'react-native-get-random-values';
import { Platform } from 'react-native';

// Firebase imports
import { firebase, firebaseAuth, firestoreDB, firebaseStorage } from '@/firebase/config';
import auth from '@react-native-firebase/auth';

// Google Sign-In
import { GoogleSignin } from '@react-native-google-signin/google-signin';

// Apple Authentication (iOS only)
import { appleAuth } from '@invertase/react-native-apple-authentication';

// Initialize Google Sign-In
GoogleSignin.configure({
  webClientId: '<<YOUR_WEB_CLIENT_ID>>', // Replace with your web client ID from Firebase console
});

interface AuthStore extends AuthState {
  // Authentication
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  register: (email: string, password: string, name: string, age?: number, isMinor?: boolean) => Promise<{ user: User; token: string; }>;
  resetPassword: (email: string) => Promise<void>;
  initializeAuthListener: () => (() => void) | undefined;
  clearPersistedState: () => Promise<void>;
  token: string | null;
  autoLoginAttempted: boolean;
  needsAgeInput: boolean;
  setNeedsAgeInput: (value: boolean) => void;
  updateUserAge: (age: number) => Promise<void>;
  
  // Social Authentication
  signInWithGoogle: () => Promise<void>;
  signInWithApple: () => Promise<void>;

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
      isMinor: userData.isMinor === undefined ? undefined : userData.isMinor,
      age: userData.age,
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
      isMinor: undefined,
      age: undefined,
      lastActive: null,
    };
  }
};

// Helper to create or update user document in Firestore
const createOrUpdateUserInFirestore = async (firebaseUser: any, additionalData = {}) => {
  try {
    const userRef = firestoreDB.collection('users').doc(firebaseUser.uid);
    const userDoc = await userRef.get();
    
    if (userDoc.exists) {
      // User exists, update last login
      await userRef.update({
        lastActive: firebase.firestore.FieldValue.serverTimestamp(),
        updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
        ...additionalData
      });
    } else {
      // New user, create document
      await userRef.set({
        email: firebaseUser.email || '',
        name: firebaseUser.displayName || '',
        avatar: firebaseUser.photoURL || '',
        role: 'user',
        points: 0,
        verified: true,
        completedLessons: [],
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
        lastActive: firebase.firestore.FieldValue.serverTimestamp(),
        ...additionalData
      });
    }
  } catch (error) {
    console.error('Error creating/updating user in Firestore:', error);
    throw error;
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
      needsAgeInput: false,

      // Add new onboarding status flag
      isOnboardingComplete: false,

      setNeedsAgeInput: (value) => {
        set({ needsAgeInput: value });
      },

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
            isOnboardingComplete: false, // Reset onboarding flag
            needsAgeInput: false
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

              // Check if age is not set, and we need to show age input popup
              const needsToInputAge = user.age === undefined;

              set({
                user,
                token,
                isAuthenticated: true, // Always set authenticated to true
                isLoading: false,
                error: null,
                isOnboardingComplete: userHasCompletedOnboarding,
                needsAgeInput: needsToInputAge
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
              isOnboardingComplete: false,
              needsAgeInput: false
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

          // Check if age is not set, and we need to show age input popup
          const needsToInputAge = user.age === undefined;

          set({
            user,
            token,
            isAuthenticated: true,
            isLoading: false,
            error: null,
            autoLoginAttempted: true,
            isOnboardingComplete: userHasCompletedOnboarding,
            needsAgeInput: needsToInputAge
          });

          console.log("Onboarding complete:", userHasCompletedOnboarding);
          console.log("Needs age input:", needsToInputAge);
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

      // Sign in with Google
      signInWithGoogle: async () => {
        set({ isLoading: true, error: null });
        try {
          // Check if your device supports Google Play
          await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
          
          // Get the user ID token
          await GoogleSignin.signIn();
          const { idToken } = await GoogleSignin.getTokens();
          
          // Create a Google credential with the token
          const googleCredential = auth.GoogleAuthProvider.credential(idToken);
          
          // Sign-in the user with the credential
          const userCredential = await auth().signInWithCredential(googleCredential);
          const firebaseUser = userCredential.user;
          
          // Create or update user in Firestore
          await createOrUpdateUserInFirestore(firebaseUser);
          
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
          
          // Check if age is not set, and we need to show age input popup
          const needsToInputAge = user.age === undefined;
          
          set({
            user,
            token,
            isAuthenticated: true,
            isLoading: false,
            error: null,
            autoLoginAttempted: true,
            isOnboardingComplete: userHasCompletedOnboarding,
            needsAgeInput: needsToInputAge
          });
          
          console.log("Google Sign-in successful, onboarding complete:", userHasCompletedOnboarding);
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
          console.error('Google Sign-in error:', error);
          let errorMessage = 'Failed to sign in with Google';
          
          if (error.code === 'SIGN_IN_CANCELLED') {
            errorMessage = 'Google sign in was cancelled';
          } else if (error.code === 'PLAY_SERVICES_NOT_AVAILABLE') {
            errorMessage = 'Google Play Services not available or outdated';
          }
          
          set({
            error: errorMessage,
            isLoading: false,
            autoLoginAttempted: true
          });
        }
      },
      
      // Sign in with Apple (iOS only)
      signInWithApple: async () => {
        set({ isLoading: true, error: null });
        
        // Only available on iOS
        if (Platform.OS !== 'ios') {
          set({
            error: 'Apple Sign-In is only available on iOS devices',
            isLoading: false
          });
          return;
        }
        
        try {
          // Start the Apple authentication flow
          const appleAuthRequestResponse = await appleAuth.performRequest({
            requestedOperation: appleAuth.Operation.LOGIN,
            requestedScopes: [appleAuth.Scope.EMAIL, appleAuth.Scope.FULL_NAME]
          });
          
          // Ensure Apple returned a user identityToken
          if (!appleAuthRequestResponse.identityToken) {
            throw new Error('Apple Sign-In failed - no identity token returned');
          }
          
          // Create a Firebase credential from the response
          const { identityToken, nonce } = appleAuthRequestResponse;
          const appleCredential = auth.AppleAuthProvider.credential(identityToken, nonce);
          
          // Sign in with the credential
          const userCredential = await auth().signInWithCredential(appleCredential);
          const firebaseUser = userCredential.user;
          
          // Apple may not always return the user's name, so we need to handle this case
          let name = firebaseUser.displayName || '';
          
          // If we have the full name from the Apple response and the user doesn't already have a name set
          if (appleAuthRequestResponse.fullName && (!name || name === '')) {
            const { givenName, familyName } = appleAuthRequestResponse.fullName;
            name = [givenName, familyName].filter(Boolean).join(' ');
            
            // Update the user's profile with the name if it was provided
            if (name && name !== '') {
              await firebaseUser.updateProfile({ displayName: name });
            }
          }
          
          // Create or update user in Firestore
          await createOrUpdateUserInFirestore(firebaseUser, { 
            name: name || 'Apple User' // Provide a default name if none is available
          });
          
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
          
          // Check if age is not set, and we need to show age input popup
          const needsToInputAge = user.age === undefined;
          
          set({
            user,
            token,
            isAuthenticated: true,
            isLoading: false,
            error: null,
            autoLoginAttempted: true,
            isOnboardingComplete: userHasCompletedOnboarding,
            needsAgeInput: needsToInputAge
          });
          
          console.log("Apple Sign-in successful, onboarding complete:", userHasCompletedOnboarding);
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
          console.error('Apple Sign-in error:', error);
          let errorMessage = 'Failed to sign in with Apple';
          
          if (error.code === 'ERR_CANCELED') {
            errorMessage = 'Apple sign in was cancelled';
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

          // Sign out from Google if user was signed in with Google
          try {
            const isSignedInWithGoogle = !!(await GoogleSignin.getCurrentUser());
            if (isSignedInWithGoogle) {
              await GoogleSignin.signOut();
            }
          } catch (googleError) {
            console.warn('Google Sign-out error:', googleError);
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

      register: async (email, password, name, age, isMinor) => {
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
            age: age || null,
            isMinor: isMinor !== undefined ? isMinor : null,
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
            isOnboardingComplete: false,
            needsAgeInput: false
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

      // New method to update user age
      updateUserAge: async (age) => {
        const { user } = get();
        set({ isLoading: true, error: null });

        try {
          if (!user || !user.id) {
            throw new Error('No authenticated user found');
          }

          // Calculate if the user is a minor (under 18)
          const isMinor = age < 18;

          // Update in Firestore
          await firestoreDB.collection('users').doc(user.id).update({
            age: age,
            isMinor: isMinor,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
          });

          // Update local state
          const updatedUser = {
            ...user,
            age: age,
            isMinor: isMinor
          };

          set({
            user: updatedUser,
            isLoading: false,
            needsAgeInput: false
          });

          console.log(`User age updated to ${age}, isMinor: ${isMinor}`);
          return;
        } catch (error: any) {
          console.error('Error updating user age:', error);
          set({
            error: error.message || 'Failed to update user age',
            isLoading: false
          });
          throw error;
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
          const allowedFields = ['name', 'bio', 'learningStyle', 'preferredTopics', 'knowledgeLevel', 'isMinor', 'age'];
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
        isOnboardingComplete: state.isOnboardingComplete,
        needsAgeInput: state.needsAgeInput
      }),
    }
  )
);