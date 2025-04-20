import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuthStore } from '@/store/auth-store';
import colors from '@/constants/colors';
import Button from '@/components/Button';
import { Check, DollarSign, Briefcase, CreditCard, PiggyBank, TrendingUp, Building, Landmark, Coins } from 'lucide-react-native';

interface Topic {
  id: string;
  title: string;
  icon: React.ReactNode;
  description: string;
}

export default function TopicsSelectionScreen() {
  const router = useRouter();
  const { setPreferredTopics, user } = useAuthStore();

  const topics: Topic[] = [
    {
      id: 'budgeting',
      title: 'Budgeting',
      icon: <DollarSign size={24} color={colors.primary} />,
      description: 'Learn to create and manage a personal budget'
    },
    {
      id: 'saving',
      title: 'Saving',
      icon: <PiggyBank size={24} color={colors.primary} />,
      description: 'Strategies for saving money and building an emergency fund'
    },
    {
      id: 'investing',
      title: 'Investing',
      icon: <TrendingUp size={24} color={colors.primary} />,
      description: 'Introduction to stocks, bonds, and investment strategies'
    },
    {
      id: 'credit',
      title: 'Credit & Debt',
      icon: <CreditCard size={24} color={colors.primary} />,
      description: 'Understanding credit scores and managing debt responsibly'
    },
    {
      id: 'career',
      title: 'Career & Income',
      icon: <Briefcase size={24} color={colors.primary} />,
      description: 'Career planning and income growth strategies'
    },
    {
      id: 'banking',
      title: 'Banking',
      icon: <Building size={24} color={colors.primary} />,
      description: 'Banking basics and financial services'
    },
    {
      id: 'taxes',
      title: 'Taxes',
      icon: <Landmark size={24} color={colors.primary} />,
      description: 'Understanding taxes and tax planning'
    },
    {
      id: 'entrepreneurship',
      title: 'Entrepreneurship',
      icon: <Coins size={24} color={colors.primary} />,
      description: 'Starting and running a small business'
    },
  ];

  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const toggleTopic = (topicId: string) => {
    setSelectedTopics(prev => {
      if (prev.includes(topicId)) {
        return prev.filter(id => id !== topicId);
      } else {
        return [...prev, topicId];
      }
    });
  };

  // In TopicsSelectionScreen.tsx, add this at the top level
  useEffect(() => {
    console.log("Topics screen mounted, current selected topics:", selectedTopics);

    // On unmount, log navigation
    return () => {
      console.log("Topics screen unmounting, navigating to next screen");
    };
  }, []);

  // Remove or comment out the router.replace('/onboarding/knowledge-assessment') in handleContinue
  const handleContinue = async () => {
    if (selectedTopics.length > 0) {
      setIsLoading(true);
  
      try {
        await setPreferredTopics(selectedTopics);
  
        // Determine the next step
        const nextStep = user?.knowledgeLevel === undefined
          ? '/onboarding/knowledge-assessment'
          : '/(tabs)'; // Default to main tabs if onboarding is complete
  
        console.log(`Topics saved, navigating to ${nextStep}`);
        router.replace(nextStep);
      } catch (error) {
        console.error('Error saving topic preferences:', error);
      } finally {
        setIsLoading(false);
      }
    }
  };

  return (
    <View style={styles.mainContainer}>
      <LinearGradient
        colors={[colors.light, '#F0F8FF']}
        style={styles.container}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.content}>
            <View style={styles.progressContainer}>
              <View style={styles.progressBar}>
                <View style={[styles.progressIndicator, { width: '66%' }]} />
              </View>
              <Text style={styles.progressText}>Step 2 of 3</Text>
            </View>

            <Text style={styles.title}>What topics interest you?</Text>
            <Text style={styles.subtitle}>
              Select the financial topics you'd like to learn about
            </Text>

            <View style={styles.topicsGrid}>
              {topics.map(topic => (
                <TouchableOpacity
                  key={topic.id}
                  style={[
                    styles.topicCard,
                    selectedTopics.includes(topic.id) && styles.selectedTopicCard
                  ]}
                  onPress={() => toggleTopic(topic.id)}
                  activeOpacity={0.7}
                >
                  <View style={styles.topicHeader}>
                    <View style={styles.topicIconContainer}>
                      {topic.icon}
                    </View>
                    {selectedTopics.includes(topic.id) && (
                      <View style={styles.checkmarkContainer}>
                        <Check size={16} color={colors.light} />
                      </View>
                    )}
                  </View>
                  <Text style={styles.topicTitle}>{topic.title}</Text>
                  <Text style={styles.topicDescription}>{topic.description}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </ScrollView>

        <Image
          source={{ uri: 'https://images.unsplash.com/photo-1579621970795-87facc2f976d?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60' }}
          style={styles.backgroundImage}
          resizeMode="contain"
        />
      </LinearGradient>

      {/* Fixed position button at the bottom */}
      <View style={styles.buttonContainer}>
        <Button
          title="Continue"
          onPress={handleContinue}
          variant="primary"
          size="large"
          disabled={selectedTopics.length === 0}
          isLoading={isLoading}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    position: 'relative',
  },
  container: {
    flex: 1,
    position: 'relative',
  },
  scrollContent: {
    flexGrow: 1,
    paddingVertical: 24,
    paddingBottom: 100, // Add padding to account for fixed button
  },
  content: {
    flex: 1,
    padding: 24,
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
    marginBottom: 32,
  },
  topicsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 32,
  },
  topicCard: {
    width: '48%',
    backgroundColor: colors.light,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: colors.dark,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedTopicCard: {
    borderColor: colors.primary,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  topicHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  topicIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: `${colors.primary}15`,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkmarkContainer: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  topicTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.dark,
    marginBottom: 4,
  },
  topicDescription: {
    fontSize: 12,
    color: colors.darkGray,
    lineHeight: 16,
  },
  buttonContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.05)',
    zIndex: 10,
  },
  backgroundImage: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    width: 200,
    height: 200,
    opacity: 0.1,
    zIndex: -1,
  },
});