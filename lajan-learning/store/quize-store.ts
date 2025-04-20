import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type QuizDifficultyLevel = 'all' | 'beginner' | 'intermediate' | 'advanced';

interface QuizState {
  difficultyLevel: QuizDifficultyLevel;
  setDifficultyLevel: (level: QuizDifficultyLevel) => void;
}

export const useQuizStore = create<QuizState>()(
  persist(
    (set) => ({
      difficultyLevel: 'all',
      
      setDifficultyLevel: (level) => {
        console.log(`Setting quiz difficulty level to: ${level}`);
        set({ difficultyLevel: level });
      },
    }),
    {
      name: 'lajan-quiz-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);