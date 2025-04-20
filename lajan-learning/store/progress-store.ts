import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// API base URL - change this to your actual server URL
const API_BASE_URL = Platform.select({
  ios: 'http://172.20.10.3:3000/api',
  android: 'http://10.0.2.2:3000/api',
  web: 'http://localhost:3000/api',
}) || 'http://localhost:3000/api';

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
  syncWithServer: (token: string) => Promise<void>; // New function to sync with server
  fetchProgressFromServer: (userId: string, token: string) => Promise<void>; // New function to fetch from server
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
            
            // Try to get progress from server first
            if (token) {
              try {
                await get().fetchProgressFromServer(userId, token);
                console.log("Progress fetched from server");
                set({ isLoading: false });
                return;
              } catch (error) {
                console.error("Failed to fetch progress from server, initializing locally", error);
              }
            }
            
            // If server fetch fails or no token, initialize locally
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
            
            // Sync this fix with server if token exists
            if (token) {
              try {
                await get().syncWithServer(token);
              } catch (error) {
                console.error("Failed to sync progress fix with server", error);
              }
            }
          } else if (progress.userId !== userId) {
            // If the user ID doesn't match, reinitialize the progress
            console.log("User ID mismatch, reinitializing progress");
            
            // Try to get progress from server for the new user
            if (token) {
              try {
                await get().fetchProgressFromServer(userId, token);
                console.log("Progress fetched from server for new user");
                set({ isLoading: false });
                return;
              } catch (error) {
                console.error("Failed to fetch progress for new user, initializing locally", error);
              }
            }
            
            // If server fetch fails or no token, initialize locally
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
                console.error("Failed to sync existing progress with server", error);
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

      // Enhanced completeModule function to track last attempt with timestamp and sync with server
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
            
            // Sync with server if token exists
            if (token) {
              try {
                await get().syncWithServer(token);
                
                // Also call the server's completeModule endpoint to ensure proper server-side logic is run
                await fetch(`${API_BASE_URL}/progress/module/complete`, {
                  method: 'POST',
                  headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                  },
                  body: JSON.stringify({ topicId, moduleId }),
                });
              } catch (error) {
                console.error("Failed to sync new progress with server", error);
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
            if (!topicsProgress[topicId].completedModules.includes(moduleId)) {
              topicsProgress[topicId].completedModules.push(moduleId);
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
            const totalPoints = (progress.totalPoints || 0) + 50;
            
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
            
            // Sync with server if token exists
            if (token) {
              try {
                await get().syncWithServer(token);
                
                // Also call the server's completeModule endpoint to ensure proper server-side logic is run
                await fetch(`${API_BASE_URL}/progress/module/complete`, {
                  method: 'POST',
                  headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                  },
                  body: JSON.stringify({ topicId, moduleId }),
                });
              } catch (error) {
                console.error("Failed to sync updated progress with server", error);
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

      // New function to check if module was completed today
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

      // New function to check if all modules in a topic were completed today
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
      
      // New function to sync progress with server
      syncWithServer: async (token: string) => {
        const { progress, isSyncing } = get();
        
        if (!progress || isSyncing) {
          return;
        }
        
        try {
          set({ isSyncing: true });
          
          console.log("Syncing progress with server...");
          
          const response = await fetch(`${API_BASE_URL}/progress/sync`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(progress),
          });
          
          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to sync progress with server');
          }
          
          const data = await response.json();
          
          console.log("Progress synced successfully");
          
          // Update local progress with the server version in case there are any differences
          if (data.progress) {
            set({
              progress: data.progress,
              isSyncing: false
            });
          } else {
            set({ isSyncing: false });
          }
        } catch (error) {
          console.error("Error syncing progress with server:", error);
          set({ 
            error: error instanceof Error ? error.message : "Failed to sync progress with server",
            isSyncing: false 
          });
        }
      },
      
      // New function to fetch progress from server
      fetchProgressFromServer: async (userId: string, token: string) => {
        try {
          set({ isLoading: true, error: null });
          
          console.log("Fetching progress from server...");
          
          const response = await fetch(`${API_BASE_URL}/progress`, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          });
          
          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to fetch progress from server');
          }
          
          const data = await response.json();
          
          if (!data.progress) {
            throw new Error('No progress data returned from server');
          }
          
          console.log("Progress fetched successfully");
          
          // Update local progress with server data
          set({
            progress: data.progress,
            isLoading: false
          });
        } catch (error) {
          console.error("Error fetching progress from server:", error);
          set({ 
            error: error instanceof Error ? error.message : "Failed to fetch progress from server",
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