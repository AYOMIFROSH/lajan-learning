export interface User {
  id: string;
  email: string;
  name: string;
  verified: boolean;
  role: 'user'
  password?: string
  avatar?: string;
  bio?: string; 
  learningStyle: 'visual' | 'practical' | null;
  preferredTopics: string[];
  knowledgeLevel: number;
  points: number;
  streak: number;
  completedLessons: string[];
  level: number;
  isMinor: boolean | undefined;
  age?: number; // Added age field
  guardianEmail?: string;
  guardianConnected: boolean;
  createdAt: string;
  lastActive: string | null;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isOnboardingComplete: boolean; 
  isLoading: boolean;
  error: string | null;
  needsAgeInput: boolean; // Added flag to track if we need to show age input popup
}

export interface LearningProgress {
  userId: string;
  topicsProgress: {
    [topicId: string]: {
      completed: boolean;
      score: number;
      lastAttempt: string;
      questionsAnswered: number;
      correctAnswers: number;
      completedModules?: string[]; 
    }
  };
  streak: number;
  lastCompletedDate: string | null;
  totalPoints: number;
}