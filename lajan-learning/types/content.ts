export interface Topic {
  id: string;
  title: string;
  description: string;
  icon: string;
  color: string;
  requiredPoints: number;
  modules: Module[];
}

export interface Module {
  id: string;
  topicId: string; 
  title: string;
  description: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimatedTime: string;
  points: number;
  questions: any[];
  content?: string;
  completed?: boolean;
}

export interface Offering {
  id: string;
  title: string;
  description: string;
  provider: string;
  category: 'investing' | 'banking' | 'credit';
  image: string;
  link: string;
  requiredPoints: number;
}

export interface CardItem {
  id: string;
  title: string;
  description: string;
  color?: string;
  icon?: string;
  requiredPoints?: number;
  // Optional fields that may be in either type
  image?: string;
  provider?: string;
  category?: string;
  link?: string;
  modules?: Module[];
  prerequisites?: string[];
  level?: 'beginner' | 'intermediate' | 'advanced';
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'lesson' | 'friend' | 'achievement' | 'offering' | 'guardian';
  read: boolean;
  createdAt: string;
  referenceId?: string; // Added referenceId property
}

export interface Progress {
  userId: string;
  streak: number;
  totalPoints: number;
  lastActivity: string;
  topicsProgress: {
    [topicId: string]: {
      progress: number;
      completed: boolean;
      modules: {
        [moduleId: string]: {
          completed: boolean;
          score?: number;
        };
      };
    };
  };
}

export interface FinancialTerm {
  id: string;
  term: string;
  definition: string;
  category: string;
  relatedTopic?: string;
}