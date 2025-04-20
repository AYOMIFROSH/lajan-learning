import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuthStore } from '@/store/auth-store';
import { useProgressStore } from '@/store/progress-store';
import colors from '@/constants/colors';
import Button from '@/components/Button';
import { Star } from 'lucide-react-native';

export default function KnowledgeAssessmentScreen() {
  const router = useRouter();
  const { user, setKnowledgeLevel } = useAuthStore();
  const { initializeProgress } = useProgressStore();
  
  const [selectedLevel, setSelectedLevel] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  const knowledgeLevels = [
    {
      level: 1,
      title: 'Beginner',
      description: 'I\'m new to financial concepts and want to learn the basics'
    },
    {
      level: 2,
      title: 'Intermediate',
      description: 'I understand some financial concepts but want to deepen my knowledge'
    },
    {
      level: 3,
      title: 'Advanced',
      description: 'I have good financial knowledge and want to learn advanced concepts'
    }
  ];
  
  const handleLevelSelect = (level: number) => {
    setSelectedLevel(level);
  };
  
  // In KnowledgeAssessmentScreen.tsx
const handleContinue = async () => {
  if (selectedLevel !== null) {
    setIsLoading(true);
    
    try {
      // Save knowledge level to auth store - this should set isOnboardingComplete to true
      await setKnowledgeLevel(selectedLevel);
      
      // Make sure we have a user ID to initialize progress with
      const userId = user?.id || '1';
      const userToken = useAuthStore.getState().token; // Retrieve token from auth store
      
      // Initialize the progress for this user
      initializeProgress(userId, userToken || null);
      
      // Don't navigate here - let AuthBridge handle it based on isOnboardingComplete
      console.log("Knowledge level set, onboarding complete");
    } catch (error) {
      console.error('Error during knowledge assessment:', error);
    } finally {
      setIsLoading(false);
    }
  }
};
  
  const renderStars = (count: number, filled: number) => {
    return Array(count).fill(0).map((_, index) => (
      <Star
        key={index}
        size={24}
        color={index < filled ? colors.secondary : colors.gray}
        fill={index < filled ? colors.secondary : 'transparent'}
      />
    ));
  };
  
  return (
    <LinearGradient
      colors={[colors.light, '#F0F8FF']}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.content}>
          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <View style={[styles.progressIndicator, { width: '100%' }]} />
            </View>
            <Text style={styles.progressText}>Step 3 of 3</Text>
          </View>
          
          <Text style={styles.title}>Rate your financial knowledge</Text>
          <Text style={styles.subtitle}>
            This helps us tailor content to your experience level
          </Text>
          
          <View style={styles.levelsContainer}>
            {knowledgeLevels.map(item => (
              <TouchableOpacity
                key={item.level}
                style={[
                  styles.levelCard,
                  selectedLevel === item.level && styles.selectedLevelCard
                ]}
                onPress={() => handleLevelSelect(item.level)}
                activeOpacity={0.7}
              >
                <View style={styles.levelHeader}>
                  <Text style={styles.levelTitle}>{item.title}</Text>
                  <View style={styles.starsContainer}>
                    {renderStars(3, item.level)}
                  </View>
                </View>
                <Text style={styles.levelDescription}>{item.description}</Text>
              </TouchableOpacity>
            ))}
          </View>
          
          <Button
            title="Start Learning"
            onPress={handleContinue}
            variant="primary"
            size="large"
            disabled={selectedLevel === null}
            isLoading={isLoading}
            style={styles.continueButton}
          />
        </View>
      </ScrollView>
      
      <Image
        source={{ uri: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60' }}
        style={styles.backgroundImage}
        resizeMode="contain"
      />
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingVertical: 24,
  },
  content: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
  },
  progressContainer: {
    marginBottom: 32,
  },
  progressBar: {
    height: 8,
    backgroundColor: colors.gray,
    borderRadius: 4,
    marginBottom: 8,
    overflow: 'hidden',
  },
  progressIndicator: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 4,
  },
  progressText: {
    fontSize: 14,
    color: colors.darkGray,
    textAlign: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.dark,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: colors.darkGray,
    textAlign: 'center',
    marginBottom: 40,
  },
  levelsContainer: {
    marginBottom: 40,
  },
  levelCard: {
    backgroundColor: colors.light,
    borderRadius: 16,
    padding: 24,
    marginBottom: 16,
    shadowColor: colors.dark,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedLevelCard: {
    borderColor: colors.primary,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  levelHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  levelTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.dark,
  },
  starsContainer: {
    flexDirection: 'row',
  },
  levelDescription: {
    fontSize: 14,
    color: colors.darkGray,
    lineHeight: 20,
  },
  continueButton: {
    alignSelf: 'center',
    width: '100%',
    maxWidth: 300,
  },
  backgroundImage: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 200,
    height: 200,
    opacity: 0.1,
  },
});