import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Firebase imports
import { firebase, firestoreDB } from '@/firebase/config';

// Import topics data for completion checking
import { topics } from '@/mocks/topics';

// Import notification service
import { 
  createModuleCompletionNotification, 
  createTopicCompletionNotification, 
  createStreakMilestoneNotification,
  createPointsMilestoneNotification
} from '@/services/notifictaion-service';

// Define interfaces for better type safety
interface ModuleProgress {
  completed: boolean;
  score: number;
  lastAttempt: string;
}

interface TopicProgress {
  completed: boolean;
  score: number;
  lastAttempt: string;
  questionsAnswered: number;
  correctAnswers: number;
  modules?: Record<string, ModuleProgress>; 
  completedModules?: string[]; // Added for compatibility with server model
  fullyCompleted?: boolean; // Flag to track if all modules are completed
}

export interface LearningProgress {
  userId: string;
  topicsProgress: Record<string, TopicProgress>;
  streak: number;
  lastCompletedDate: string | null;
  totalPoints: number;
}

interface ProgressState {
  progress: LearningProgress | null;
  isLoading: boolean;
  error: string | null;
  isSyncing: boolean; // Add syncing state
}

interface ProgressStore extends ProgressState {
  initializeProgress: (userId: string, token: string | null) => Promise<void>;
  completeModule: (userId: string, topicId: string, moduleId: string, score: number, token: string | null) => Promise<void>;
  updateStreak: () => void;
  resetProgress: () => void;
  checkModuleCompletion: (topicId: string, moduleId: string) => boolean;
  wasModuleCompletedToday: (topicId: string, moduleId: string) => boolean;
  areAllModulesCompletedToday: (topicId: string, modules: any[]) => boolean;
  syncWithServer: (token: string) => Promise<void>; // Function to sync with Firestore
  fetchProgressFromServer: (userId: string, token: string) => Promise<void>; // Function to fetch from Firestore
  checkAndNotifyTopicCompletion: (userId: string, topicId: string, topicsProgress: Record<string, TopicProgress>) => Promise<void>; // Function to check and notify topic completion
}

export const useProgressStore = create<ProgressStore>()(
  persist(
    (set, get) => ({
      progress: null,
      isLoading: false,
      error: null,
      isSyncing: false,

      initializeProgress: async (userId, token) => {
        const { progress } = get();
        set({ isLoading: true });
        
        try {
          if (!progress) {
            console.log("Initializing progress for user:", userId);
            
            // Try to get progress from Firestore first
            if (token) {
              try {
                await get().fetchProgressFromServer(userId, token);
                console.log("Progress fetched from Firestore");
                set({ isLoading: false });
                return;
              } catch (error) {
                console.error("Failed to fetch progress from Firestore, initializing locally", error);
              }
            }
            
            // If Firestore fetch fails or no token, initialize locally
            set({
              progress: {
                userId,
                topicsProgress: {},
                streak: 0,
                lastCompletedDate: null,
                totalPoints: 0,
              },
              isLoading: false
            });
          } else if (progress.totalPoints === undefined) {
            // If progress exists but totalPoints is undefined, set it to 0
            console.log("Fixing progress object - adding totalPoints");
            const updatedProgress = {
              ...progress,
              totalPoints: 0
            };
            
            set({
              progress: updatedProgress,
              isLoading: false
            });
            
            // Sync this fix with Firestore if token exists
            if (token) {
              try {
                await get().syncWithServer(token);
              } catch (error) {
                console.error("Failed to sync progress fix with Firestore", error);
              }
            }
          } else if (progress.userId !== userId) {
            // If the user ID doesn't match, reinitialize the progress
            console.log("User ID mismatch, reinitializing progress");
            
            // Try to get progress from Firestore for the new user
            if (token) {
              try {
                await get().fetchProgressFromServer(userId, token);
                console.log("Progress fetched from Firestore for new user");
                set({ isLoading: false });
                return;
              } catch (error) {
                console.error("Failed to fetch progress for new user, initializing locally", error);
              }
            }
            
            // If Firestore fetch fails or no token, initialize locally
            set({
              progress: {
                userId,
                topicsProgress: {},
                streak: 0,
                lastCompletedDate: null,
                totalPoints: 0,
              },
              isLoading: false
            });
          } else {
            // User ID matches, just make sure progress is synced
            if (token) {
              try {
                await get().syncWithServer(token);
              } catch (error) {
                console.error("Failed to sync existing progress with Firestore", error);
              }
            }
            set({ isLoading: false });
          }
        } catch (error) {
          console.error("Error initializing progress:", error);
          set({ 
            error: error instanceof Error ? error.message : "Failed to initialize progress",
            isLoading: false 
          });
        }
      },

      // Helper function to check if a topic is fully completed and create notification
      checkAndNotifyTopicCompletion: async (userId: string, topicId: string, topicsProgress: Record<string, TopicProgress>) => {
        try {
          // Find the topic in our topics data
          const topic = topics.find(t => t.id === topicId);
          if (!topic) return;
          
          // Get the user's progress for this topic
          const topicProgress = topicsProgress[topicId];
          if (!topicProgress || !topicProgress.completedModules) return;
          
          // Check if all modules are completed
          const allModulesCompleted = topic.modules.every(module => 
            topicProgress.completedModules?.includes(module.id)
          );
          
          if (allModulesCompleted) {
            // Check if we've already marked this topic as fully completed before
            const isNewTopicCompletion = !topicProgress.fullyCompleted;
            
            if (isNewTopicCompletion) {
              // Mark the topic as fully completed
              topicsProgress[topicId].fullyCompleted = true;
              
              // Create topic completion notification
              await createTopicCompletionNotification(userId, topicId);
            }
          }
        } catch (error) {
          console.error("Error checking topic completion:", error);
        }
      },

      // Enhanced completeModule function to track last attempt with timestamp, sync with Firestore, and create notifications
      completeModule: async (userId: string, topicId: string, moduleId: string, score: number, token: string | null) => {
        console.log("Completing module:", { userId, topicId, moduleId, score });
        set({ isLoading: true, error: null });
        
        const { progress } = get();
        
        try {
          if (!progress) {
            console.log("No progress found, initializing");
            // Initialize progress first if it doesn't exist
            const newProgress = {
              userId,
              topicsProgress: {
                [topicId]: {
                  completed: true,
                  score: score,
                  lastAttempt: new Date().toISOString(),
                  questionsAnswered: 1,
                  correctAnswers: score > 0.7 ? 1 : 0,
                  modules: {
                    [moduleId]: {
                      completed: true,
                      score,
                      lastAttempt: new Date().toISOString(),
                    }
                  },
                  completedModules: [moduleId] // Server-compatible field
                }
              },
              streak: 1,
              lastCompletedDate: new Date().toISOString(),
              totalPoints: 50, // Award points for first module
            };
            
            set({ progress: newProgress, isLoading: false });
            
            // Save to Firestore
            if (token) {
              try {
                // Save to Firestore
                await firestoreDB.collection('progress').doc(userId).set(newProgress);
                
                // Also update user points
                const userDoc = await firestoreDB.collection('users').doc(userId).get();
                
                if (userDoc.exists) {
                  const userData = userDoc.data();
                  const newPoints = (userData?.points || 0) + 50;
                  
                  await firestoreDB.collection('users').doc(userId).update({
                    points: newPoints,
                    streak: 1,
                    updatedAt: firebase.firestore.FieldValue.serverTimestamp()
                  });
                  
                  // Create notification for first module completion
                  await createModuleCompletionNotification(userId, topicId, moduleId, score);
                  
                  // Check for points milestone
                  await createPointsMilestoneNotification(userId, newPoints);
                }
              } catch (error) {
                console.error("Failed to save new progress to Firestore", error);
              }
            }
            return;
          }
          
          if (progress.userId === userId) {
            const topicsProgress = { ...progress.topicsProgress };
            
            if (!topicsProgress[topicId]) {
              // Initialize topic progress if it doesn't exist
              topicsProgress[topicId] = {
                completed: false,
                score: 0,
                lastAttempt: new Date().toISOString(),
                questionsAnswered: 0,
                correctAnswers: 0,
                modules: {},
                completedModules: [] // Server-compatible field
              };
            }
            
            // Ensure modules object exists
            if (!topicsProgress[topicId].modules) {
              topicsProgress[topicId].modules = {};
            }
            
            // Ensure completedModules array exists
            if (!topicsProgress[topicId].completedModules) {
              topicsProgress[topicId].completedModules = [];
            }
            
            // Check if module is already completed
            const isNewCompletion = !topicsProgress[topicId].completedModules.includes(moduleId);
            let pointsEarned = isNewCompletion ? 50 : 0;
            
            // Update specific module progress with current timestamp
            const currentTimestamp = new Date().toISOString();
            topicsProgress[topicId].modules = {
              ...topicsProgress[topicId].modules,
              [moduleId]: {
                completed: true,
                score,
                lastAttempt: currentTimestamp,
              }
            };
            
            // Add moduleId to completedModules if not already there
            if (isNewCompletion) {
              topicsProgress[topicId].completedModules.push(moduleId);
              
              // Create notification for new module completion
              try {
                await createModuleCompletionNotification(userId, topicId, moduleId, score);
              } catch (error) {
                console.error("Failed to create module completion notification:", error);
              }
            }
            
            // Update topic overall progress
            topicsProgress[topicId] = {
              ...topicsProgress[topicId],
              score: Math.max(topicsProgress[topicId].score, score),
              lastAttempt: currentTimestamp,
              questionsAnswered: topicsProgress[topicId].questionsAnswered + 1,
              correctAnswers: topicsProgress[topicId].correctAnswers + (score > 0.7 ? 1 : 0),
              completed: true, // For now, mark topic completed when any module is completed
            };
            
            // Award points (50 per module)
            const totalPoints = (progress.totalPoints || 0) + pointsEarned;
            
            // Update last completed date for streak calculation
            const lastCompletedDate = currentTimestamp;
            
            const updatedProgress = {
              ...progress,
              topicsProgress,
              totalPoints,
              lastCompletedDate,
            };
            
            set({
              progress: updatedProgress,
              isLoading: false
            });
            
            // Update streak
            get().updateStreak();
            
            // Check if topic is fully completed
            await get().checkAndNotifyTopicCompletion(userId, topicId, topicsProgress);
            
            // Save to Firestore
            if (token) {
              try {
                // Save progress to Firestore
                await firestoreDB.collection('progress').doc(userId).set(updatedProgress);
                
                // Update user points if new completion
                if (pointsEarned > 0) {
                  const userDoc = await firestoreDB.collection('users').doc(userId).get();
                  
                  if (userDoc.exists) {
                    const userData = userDoc.data();
                    const newPoints = (userData?.points || 0) + pointsEarned;
                    
                    await firestoreDB.collection('users').doc(userId).update({
                      points: newPoints,
                      streak: updatedProgress.streak,
                      updatedAt: firebase.firestore.FieldValue.serverTimestamp()
                    });
                    
                    // Check for points milestone
                    await createPointsMilestoneNotification(userId, newPoints);
                  }
                }
                
                // Check for streak milestone
                if (updatedProgress.streak === 3 || 
                    updatedProgress.streak === 7 || 
                    updatedProgress.streak === 14 || 
                    updatedProgress.streak === 30 || 
                    updatedProgress.streak === 60 || 
                    updatedProgress.streak === 100 || 
                    updatedProgress.streak % 100 === 0) {
                  await createStreakMilestoneNotification(userId, updatedProgress.streak);
                }
              } catch (error) {
                console.error("Failed to save updated progress to Firestore", error);
              }
            }
            
            console.log("Module completed successfully");
          } else {
            console.error("User ID mismatch:", { 
              expectedUserId: progress.userId, 
              providedUserId: userId 
            });
            set({ 
              error: "User ID mismatch when completing module",
              isLoading: false
            });
          }
        } catch (error) {
          console.error("Error completing module:", error);
          set({ 
            error: error instanceof Error ? error.message : "Failed to complete module",
            isLoading: false 
          });
        }
      },
      
      // Check if a module has been completed at all
      checkModuleCompletion: (topicId, moduleId) => {
        const { progress } = get();
        
        if (!progress || !progress.topicsProgress || !progress.topicsProgress[topicId]) {
          return false;
        }
        
        const topicProgress = progress.topicsProgress[topicId];
        
        // Check if this specific module is completed
        if (topicProgress.modules && topicProgress.modules[moduleId]) {
          return topicProgress.modules[moduleId].completed;
        }
        
        // Check if it's in the completedModules array
        if (topicProgress.completedModules && topicProgress.completedModules.includes(moduleId)) {
          return true;
        }
        
        // Fallback to overall topic completion
        return topicProgress.completed;
      },

      // Function to check if module was completed today
      wasModuleCompletedToday: (topicId, moduleId) => {
        const { progress } = get();
        
        if (!progress || !progress.topicsProgress || !progress.topicsProgress[topicId]) {
          return false;
        }
        
        const topicProgress = progress.topicsProgress[topicId];
        
        if (!topicProgress.modules || !topicProgress.modules[moduleId] || !topicProgress.modules[moduleId].completed) {
          return false;
        }
        
        // Check if the last attempt was today
        const lastAttempt = new Date(topicProgress.modules[moduleId].lastAttempt);
        const today = new Date();
        
        return (
          lastAttempt.getDate() === today.getDate() &&
          lastAttempt.getMonth() === today.getMonth() &&
          lastAttempt.getFullYear() === today.getFullYear()
        );
      },

      // Function to check if all modules in a topic were completed today
      areAllModulesCompletedToday: (topicId, modules) => {
        const { progress } = get();
        
        if (!progress || !progress.topicsProgress || !progress.topicsProgress[topicId]) {
          return false;
        }
        
        const topicProgress = progress.topicsProgress[topicId];
        
        if (!topicProgress.modules) {
          return false;
        }
        
        // Check if every module in the list is completed today
        return modules.every(module => {
          if (!topicProgress.modules || !topicProgress.modules[module.id] || !topicProgress.modules[module.id].completed) {
            return false;
          }
          
          // Check if it was completed today
          const lastAttempt = new Date(topicProgress.modules[module.id].lastAttempt);
          const today = new Date();
          
          return (
            lastAttempt.getDate() === today.getDate() &&
            lastAttempt.getMonth() === today.getMonth() &&
            lastAttempt.getFullYear() === today.getFullYear()
          );
        });
      },

      updateStreak: () => {
        const { progress } = get();
        
        if (progress && progress.lastCompletedDate) {
          const lastDate = new Date(progress.lastCompletedDate);
          const today = new Date();
          
          // Reset date times to compare just the dates
          lastDate.setHours(0, 0, 0, 0);
          today.setHours(0, 0, 0, 0);
          
          // Calculate difference in days
          const diffTime = today.getTime() - lastDate.getTime();
          const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
          
          let streak = progress.streak || 0;
          
          if (diffDays === 1) {
            // Consecutive day, increase streak
            streak += 1;
          } else if (diffDays > 1) {
            // Streak broken
            streak = 1;
          } else if (diffDays === 0) {
            // Same day, don't change streak
            // But ensure it's at least 1
            streak = Math.max(1, streak);
          }
          
          set({
            progress: {
              ...progress,
              streak,
            }
          });
          
          console.log("Updated streak:", streak);
        }
      },

      resetProgress: () => {
        console.log("Resetting progress");
        set({ progress: null });
      },
      
      // Function to sync progress with Firestore
      syncWithServer: async (token: string) => {
        const { progress, isSyncing } = get();
        
        if (!progress || isSyncing) {
          return;
        }
        
        try {
          set({ isSyncing: true });
          
          console.log("Syncing progress with Firestore...");
          
          // Save progress to Firestore
          await firestoreDB.collection('progress').doc(progress.userId).set(progress);
          
          console.log("Progress synced successfully");
          set({ isSyncing: false });
        } catch (error) {
          console.error("Error syncing progress with Firestore:", error);
          set({ 
            error: error instanceof Error ? error.message : "Failed to sync progress with Firestore",
            isSyncing: false 
          });
        }
      },
      
      // Function to fetch progress from Firestore
      fetchProgressFromServer: async (userId: string, token: string) => {
        try {
          set({ isLoading: true, error: null });
          
          console.log("Fetching progress from Firestore...");
          
          // Get progress from Firestore
          const progressDoc = await firestoreDB.collection('progress').doc(userId).get();
          
          if (progressDoc.exists) {
            const progressData = progressDoc.data() as LearningProgress;
            
            console.log("Progress fetched successfully");
            
            // Update local progress with Firestore data
            set({
              progress: progressData,
              isLoading: false
            });
          } else {
            // No progress found, create a new one
            const newProgress: LearningProgress = {
              userId,
              topicsProgress: {},
              streak: 0,
              lastCompletedDate: null,
              totalPoints: 0
            };
            
            // Save to Firestore
            await firestoreDB.collection('progress').doc(userId).set(newProgress);
            
            set({
              progress: newProgress,
              isLoading: false
            });
          }
        } catch (error) {
          console.error("Error fetching progress from Firestore:", error);
          set({ 
            error: error instanceof Error ? error.message : "Failed to fetch progress from Firestore",
            isLoading: false 
          });
          throw error; // Re-throw so caller can handle it
        }
      }
    }),
    {
      name: 'lajan-progress-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);