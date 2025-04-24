import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, ScrollView, BackHandler } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuthStore } from '@/store/auth-store';
import colors from '@/constants/colors';
import Button from '@/components/Button';
import { Eye, BookOpen, BarChart, PieChart, TrendingUp, Lightbulb, Briefcase, FileText } from 'lucide-react-native';

export default function LearningStyleScreen() {
  const router = useRouter();
  const { setLearningStyle, isAuthenticated, user } = useAuthStore();
  
  const [selectedStyle, setSelectedStyle] = useState<'visual' | 'practical' | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
useEffect(() => {
  // If not authenticated, redirect to landing
  if (!isAuthenticated || !user) {
    console.log('Not authenticated in learning style screen, redirecting to landing');
    router.replace('/');
  }
  // Don't add navigation to other screens here - let AuthBridge handle that
}, [isAuthenticated, user, router]);
  
  // Prevent hardware back button from exiting onboarding
  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      // Don't allow going back from the first onboarding screen
      return true; // Prevent default back behavior
    });

    return () => backHandler.remove();
  }, []);

  const handleStyleSelect = (style: 'visual' | 'practical') => {
    setSelectedStyle(style);
  };

  // In LearningStyleScreen.tsx
const handleContinue = async () => {
  if (selectedStyle) {
    setIsLoading(true);
    
    try {
      // Set the learning style in the auth store
      await setLearningStyle(selectedStyle);
      
      // Add a small delay to ensure state updates are processed
      setTimeout(() => {
        // Use replace instead of push to prevent navigation stack issues
        router.replace('/onboarding/topics');
      }, 300);
    } catch (error) {
      console.error('Error during onboarding:', error);
    } finally {
      setIsLoading(false);
    }
  }
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
              <View style={[styles.progressIndicator, { width: '33%' }]} />
            </View>
            <Text style={styles.progressText}>Step 1 of 3</Text>
          </View>
          
          <Text style={styles.title}>How do you learn best?</Text>
          <Text style={styles.subtitle}>
            We'll personalize your learning experience based on your preference
          </Text>
          
          <View style={styles.optionsContainer}>
            <TouchableOpacity
              style={[
                styles.optionCard,
                selectedStyle === 'visual' && styles.selectedCard
              ]}
              onPress={() => handleStyleSelect('visual')}
              activeOpacity={0.7}
            >
              <View style={[
                styles.iconContainer,
                { backgroundColor: `${colors.primary}20` }
              ]}>
                <Eye size={32} color={colors.primary} />
              </View>
              <Text style={styles.optionTitle}>Visual Learner</Text>
              <Text style={styles.optionDescription}>
                I learn best through charts, graphs, and visual representations
              </Text>
              
              {selectedStyle === 'visual' && (
                <View style={styles.exampleContainer}>
                  <Text style={styles.exampleTitle}>You'll see content like:</Text>
                  <View style={styles.visualExamples}>
                    <View style={styles.exampleItem}>
                      <BarChart size={24} color={colors.primary} />
                      <Text style={styles.exampleText}>Charts</Text>
                    </View>
                    <View style={styles.exampleItem}>
                      <PieChart size={24} color={colors.primary} />
                      <Text style={styles.exampleText}>Graphs</Text>
                    </View>
                    <View style={styles.exampleItem}>
                      <TrendingUp size={24} color={colors.primary} />
                      <Text style={styles.exampleText}>Trends</Text>
                    </View>
                  </View>
                </View>
              )}
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[
                styles.optionCard,
                selectedStyle === 'practical' && styles.selectedCard
              ]}
              onPress={() => handleStyleSelect('practical')}
              activeOpacity={0.7}
            >
              <View style={[
                styles.iconContainer,
                { backgroundColor: `${colors.secondary}20` }
              ]}>
                <BookOpen size={32} color={colors.secondary} />
              </View>
              <Text style={styles.optionTitle}>Practical Learner</Text>
              <Text style={styles.optionDescription}>
                I learn best through real-world scenarios and practical examples
              </Text>
              
              {selectedStyle === 'practical' && (
                <View style={styles.exampleContainer}>
                  <Text style={styles.exampleTitle}>You'll see content like:</Text>
                  <View style={styles.visualExamples}>
                    <View style={styles.exampleItem}>
                      <Briefcase size={24} color={colors.secondary} />
                      <Text style={styles.exampleText}>Case Studies</Text>
                    </View>
                    <View style={styles.exampleItem}>
                      <Lightbulb size={24} color={colors.secondary} />
                      <Text style={styles.exampleText}>Scenarios</Text>
                    </View>
                    <View style={styles.exampleItem}>
                      <FileText size={24} color={colors.secondary} />
                      <Text style={styles.exampleText}>Stories</Text>
                    </View>
                  </View>
                </View>
              )}
            </TouchableOpacity>
          </View>
          
          <Button
            title="Continue"
            onPress={handleContinue}
            variant="primary"
            size="large"
            disabled={!selectedStyle}
            isLoading={isLoading}
            style={styles.continueButton}
          />
        </View>
      </ScrollView>
      
      {/* <Image
        source={{ uri: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60' }}
        style={styles.backgroundImage}
        resizeMode="contain"
      /> */}
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
  optionsContainer: {
    marginBottom: 40,
  },
  optionCard: {
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
  selectedCard: {
    borderColor: colors.primary,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  optionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.dark,
    marginBottom: 8,
  },
  optionDescription: {
    fontSize: 14,
    color: colors.darkGray,
    lineHeight: 20,
    marginBottom: 16,
  },
  exampleContainer: {
    backgroundColor: colors.gray,
    borderRadius: 12,
    padding: 16,
    marginTop: 8,
  },
  exampleTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.dark,
    marginBottom: 12,
  },
  visualExamples: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  exampleItem: {
    alignItems: 'center',
  },
  exampleText: {
    fontSize: 12,
    color: colors.darkGray,
    marginTop: 4,
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