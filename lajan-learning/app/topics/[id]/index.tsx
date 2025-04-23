import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Alert
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { useAuthStore } from '@/store/auth-store';
import { useProgressStore } from '@/store/progress-store';
import colors from '@/constants/colors';
import Button from '@/components/Button';
import Card from '@/components/Card';
import { topics } from '@/mocks/topics';
import {
  Clock,
  BarChart,
  Award,
  ChevronRight,
  ArrowLeft,
  Lock
} from 'lucide-react-native';

// Helper function to check if this topic is today's recommended topic
const isRecommendedTopic = (topicId: string, userPreferredTopics: string[] = [], userPoints: number = 0): boolean => {
  // Get today's date and create a seed from it
  const today = new Date();
  const dateSeed = today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate();
  
  // Filter topics based on user's points
  const availableTopics = topics.filter(topic => 
    userPoints >= topic.requiredPoints
  );

  // If user has preferred topics, prioritize them
  let preferredAvailableTopics = availableTopics;
  if (userPreferredTopics && userPreferredTopics.length > 0) {
    preferredAvailableTopics = availableTopics.filter(topic => 
      userPreferredTopics.includes(topic.id)
    );
  }

  // Use preferred topics if available, otherwise fall back to all available topics
  const topicsToChooseFrom = preferredAvailableTopics.length > 0 
    ? preferredAvailableTopics 
    : availableTopics;
  
  // If no topics are available, return false
  if (topicsToChooseFrom.length === 0) {
    return false;
  }
  
  // Use the date seed to pick a topic for today
  const index = dateSeed % topicsToChooseFrom.length;
  const recommendedTopic = topicsToChooseFrom[index];
  
  return recommendedTopic.id === topicId;
};

export default function TopicDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuthStore();
  const { progress, initializeProgress } = useProgressStore();

  const [topic, setTopic] = useState<typeof topics[0] | null>(null);
  const [isRecommended, setIsRecommended] = useState(false);

  useEffect(() => {
    // Initialize progress if not already done
    if (user && !progress) {
      const { token } = useAuthStore.getState();
      initializeProgress(user?.id || 'guest-user', token);
    }

    // Find the topic and check if it's today's recommended topic
    const foundTopic = topics.find(t => String(t.id).trim() === String(id).trim());

    if (foundTopic) {
      setTopic(foundTopic);
      
      // Check if this is today's recommended topic
      if (user && progress) {
        const recommended = isRecommendedTopic(
          foundTopic.id,
          user.preferredTopics,
          progress.totalPoints || 0
        );
        setIsRecommended(recommended);
      }
    }
  }, [id, user, progress, initializeProgress]);

  const handleModulePress = (moduleId: string) => {
    if (!topic) return;
    
    // Check if this is a recommended topic module that was completed today
    // Use the wasModuleCompletedToday function from our progress store
    const { wasModuleCompletedToday } = useProgressStore.getState();
    if (isRecommended && wasModuleCompletedToday(topic.id, moduleId)) {
      Alert.alert(
        "Module Locked",
        "You've already completed this module today. Come back tomorrow for new lessons!",
        [{ text: "OK", onPress: () => console.log("OK Pressed") }]
      );
      return;
    }
    
    router.replace(`/topics/${topic.id}/modules/${moduleId}`);
  };

  const getModuleDifficultyLabel = (difficulty: string | undefined) => {
    switch (difficulty) {
      case 'beginner':
        return 'Level 1';
      case 'intermediate':
        return 'Level 2';
      case 'advanced':
        return 'Level 3';
      default:
        return 'Level 1'; 
    }
  };

  const isModuleCompleted = (moduleId: string) => {
    if (!progress || !progress.topicsProgress || !topic) {
      return false;
    }

    const topicProgress = progress.topicsProgress[topic.id];
    if (!topicProgress) {
      return false;
    }

    // If using the updated progress store with modules tracking
    if (topicProgress.modules && topicProgress.modules[moduleId]) {
      return topicProgress.modules[moduleId].completed;
    }

    // Fallback to overall topic completion
    return topicProgress.completed;
  };

  if (!topic) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.container}>
          <Text style={styles.errorText}>Topic not found for ID: {id}</Text>
          <Button
            title="Go Back"
            onPress={() => router.back()}
            variant="primary"
            icon={<ArrowLeft size={20} color={colors.light} />}
            iconPosition="left"
          />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <Stack.Screen
        options={{
          title: topic.title,
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        }}
      />

      <ScrollView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.description}>{topic.description}</Text>

          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <View style={[
                styles.statIconContainer,
                { backgroundColor: `${colors.primary}20` }
              ]}>
                <BarChart size={20} color={colors.primary} />
              </View>
              <Text style={styles.statValue}>{topic.modules.length}</Text>
              <Text style={styles.statLabel}>Modules</Text>
            </View>

            <View style={styles.statItem}>
              <View style={[
                styles.statIconContainer,
                { backgroundColor: `${colors.secondary}20` }
              ]}>
                <Clock size={20} color={colors.secondary} />
              </View>
              <Text style={styles.statValue}>
                {topic.modules.reduce((acc, module) => acc + parseInt(String(module.estimatedTime)), 0)}
              </Text>
              <Text style={styles.statLabel}>Minutes</Text>
            </View>

            <View style={styles.statItem}>
              <View style={[
                styles.statIconContainer,
                { backgroundColor: `${colors.success}20` }
              ]}>
                <Award size={20} color={colors.success} />
              </View>
              <Text style={styles.statValue}>
                {topic.modules.reduce((acc, module) => acc + module.points, 0)}
              </Text>
              <Text style={styles.statLabel}>Points</Text>
            </View>
          </View>
        </View>

        <View style={styles.modulesContainer}>
          <Text style={styles.sectionTitle}>Modules</Text>

          {topic.modules.map((module, index) => {
            const isCompleted = isModuleCompleted(module.id);
            // Use the wasModuleCompletedToday function from our progress store
            const { wasModuleCompletedToday } = useProgressStore.getState();
            const isCompletedToday = isRecommended && wasModuleCompletedToday(topic.id, module.id);
            
            return (
              <Card
                key={module.id}
                variant="outlined"
                style={[
                  styles.moduleCard,
                  isCompleted ? styles.completedModuleCard : null,
                  isCompletedToday ? styles.lockedModuleCard : null
                ]}
              >
                <TouchableOpacity
                  style={styles.moduleCardContent}
                  onPress={() => handleModulePress(module.id)}
                  disabled={isCompletedToday}
                >
                  <View style={styles.moduleHeader}>
                    <View style={styles.moduleNumberContainer}>
                      {isCompletedToday ? (
                        <Lock size={16} color={colors.darkGray} />
                      ) : (
                        <Text style={styles.moduleNumber}>{index + 1}</Text>
                      )}
                    </View>

                    <View style={styles.moduleInfo}>
                      <Text style={[
                        styles.moduleTitle,
                        isCompletedToday ? styles.lockedModuleText : null
                      ]}>
                        {module.title}
                      </Text>
                      <Text style={[
                        styles.moduleDescription,
                        isCompletedToday ? styles.lockedModuleText : null
                      ]}>
                        {module.description}
                      </Text>
                    </View>

                    <ChevronRight size={20} color={isCompletedToday ? colors.gray : colors.darkGray} />
                  </View>

                  <View style={styles.moduleFooter}>
                    <View style={styles.moduleDetail}>
                      <Clock size={16} color={isCompletedToday ? colors.gray : colors.darkGray} />
                      <Text style={[
                        styles.moduleDetailText,
                        isCompletedToday ? styles.lockedModuleText : null
                      ]}>
                        {module.estimatedTime} min
                      </Text>
                    </View>

                    <View style={styles.moduleDetail}>
                      <Award size={16} color={isCompletedToday ? colors.gray : colors.darkGray} />
                      <Text style={[
                        styles.moduleDetailText,
                        isCompletedToday ? styles.lockedModuleText : null
                      ]}>
                        {module.points} pts
                      </Text>
                    </View>

                    <View style={[
                      styles.difficultyBadge,
                      // Use topic.level as fallback if module.difficulty is undefined
                      (module.difficulty || topic.level) === 'beginner'
                        ? styles.beginnerBadge
                        : (module.difficulty || topic.level) === 'intermediate'
                          ? styles.intermediateBadge
                          : styles.advancedBadge
                    ]}>
                      <Text style={styles.difficultyText}>
                        {getModuleDifficultyLabel(module.difficulty || topic.level)}
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>
              </Card>
            );
          })}
        </View>

        <View style={styles.learningPathContainer}>
          <Text style={styles.sectionTitle}>Learning Path</Text>
          <Text style={styles.learningPathDescription}>
            Complete all modules in this topic to earn {topic.modules.reduce((acc, module) => acc + module.points, 0)} points and unlock more advanced topics.
          </Text>

          <Button
            title="Start Learning"
            onPress={() => handleModulePress(topic.modules[0].id)}
            variant="primary"
            style={styles.startLearningButton}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    flex: 1,
    padding: 16,
  },
  header: {
    marginBottom: 24,
  },
  description: {
    fontSize: 16,
    color: colors.darkGray,
    marginBottom: 24,
    lineHeight: 24,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: colors.light,
    borderRadius: 12,
    padding: 16,
    shadowColor: colors.dark,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  statItem: {
    alignItems: 'center',
  },
  statIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.dark,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: colors.darkGray,
  },
  modulesContainer: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.dark,
    marginBottom: 16,
  },
  moduleCard: {
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: colors.gray,
  },
  completedModuleCard: {
    borderLeftColor: colors.success,
  },
  lockedModuleCard: {
    borderLeftColor: colors.gray,
    opacity: 0.7,
  },
  moduleCardContent: {
    padding: 0,
  },
  moduleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  moduleNumberContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.gray,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  moduleNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.dark,
  },
  moduleInfo: {
    flex: 1,
  },
  moduleTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.dark,
    marginBottom: 4,
  },
  moduleDescription: {
    fontSize: 14,
    color: colors.darkGray,
  },
  lockedModuleText: {
    color: colors.gray,
  },
  moduleFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  moduleDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  moduleDetailText: {
    fontSize: 12,
    color: colors.darkGray,
    marginLeft: 4,
  },
  difficultyBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginLeft: 'auto',
  },
  beginnerBadge: {
    backgroundColor: `${colors.success}20`,
  },
  intermediateBadge: {
    backgroundColor: `${colors.warning}20`,
  },
  advancedBadge: {
    backgroundColor: `${colors.error}20`,
  },
  difficultyText: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.dark,
  },
  learningPathContainer: {
    backgroundColor: colors.light,
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    shadowColor: colors.dark,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  learningPathDescription: {
    fontSize: 14,
    color: colors.darkGray,
    marginBottom: 16,
    lineHeight: 20,
  },
  startLearningButton: {
    alignSelf: 'center',
  },
  errorText: {
    fontSize: 18,
    color: colors.darkGray,
    textAlign: 'center',
    marginBottom: 24,
  },
});