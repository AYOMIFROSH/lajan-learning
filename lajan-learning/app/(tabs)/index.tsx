import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  SafeAreaView
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/store/auth-store';
import { useProgressStore } from '@/store/progress-store';
import colors from '@/constants/colors';
import Button from '@/components/Button';
import Card from '@/components/Card';
import ProgressBar from '@/components/ProgressBar';
import TopicCard from '@/components/TopicCard';
import QRCodeModal from '@/components/QRCodeModal';
import { offerings } from '@/mocks/offerings';
import { topics } from '@/mocks/topics';
import {
  QrCode,
  Flame,
  Award,
  Play,
  CheckCircle
} from 'lucide-react-native';

type LessonFilter = 'today' | 'all';

// Enhanced helper function to get a recommended topic for today - ensures new users ALWAYS get a topic
const getRecommendedTopicForToday = (userPreferredTopics: string[] = [], userPoints: number = 0) => {
  // Get today's date and create a seed from it
  const today = new Date();
  const dateSeed = today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate();
  
  // Check if topics array exists and has elements
  if (!topics || topics.length === 0) {
    console.error("No topics available in the system");
    return null;
  }
  
  // First, get all topics with required points less than or equal to user's points
  const availableTopics = topics.filter(topic => userPoints >= (topic.requiredPoints || 0));

  // If user has preferred topics, find which of those are available based on points
  let preferredAvailableTopics: typeof topics = [];
  if (userPreferredTopics && userPreferredTopics.length > 0) {
    preferredAvailableTopics = availableTopics.filter(topic => 
      userPreferredTopics.includes(topic.id)
    );
  }

  // Use preferred topics if available, otherwise fall back to all available topics
  let topicsToChooseFrom = preferredAvailableTopics.length > 0 
    ? preferredAvailableTopics 
    : availableTopics;
  
  // If no topics are available based on points, fallback to the intro/beginner topics
  if (topicsToChooseFrom.length === 0) {
    console.log("User doesn't have enough points for any topics, finding beginner topic");
    
    // Find topics with lowest required points (typically 0 for beginner topics)
    const pointsRequirements = topics.map(t => t.requiredPoints || 0);
    const lowestPointsRequired = Math.min(...pointsRequirements);
    console.log("Lowest points required:", lowestPointsRequired);
    
    const beginnerTopics = topics.filter(t => (t.requiredPoints || 0) === lowestPointsRequired);
    console.log("Found beginner topics:", beginnerTopics.length);
    
    // If we found beginner topics, use them, otherwise use the whole topics array as a last resort
    topicsToChooseFrom = beginnerTopics.length > 0 ? beginnerTopics : topics;
  }
  
  // Use the date seed to pick a topic for today
  const index = dateSeed % topicsToChooseFrom.length;
  const selectedTopic = topicsToChooseFrom[index];
  
  console.log("Selected topic for today:", selectedTopic?.title);
  return selectedTopic;
};

export default function HomeScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { progress } = useProgressStore();

  const [lessonFilter, setLessonFilter] = useState<LessonFilter>('today');
  const [qrModalVisible, setQrModalVisible] = useState(false);
  const [recommendedTopic, setRecommendedTopic] = useState<any>(null);
  const [allModulesCompleted, setAllModulesCompleted] = useState(false);

  // Set recommended topic based on user's preferred topics and points
  useEffect(() => {
    // Even if user or progress is null, we should still try to get a recommended topic
    const userPreferredTopics = user?.preferredTopics || [];
    const userPoints = progress?.totalPoints || 0;
    
    // Get recommended topic (this should ALWAYS return a topic for new users)
    const topic = getRecommendedTopicForToday(userPreferredTopics, userPoints);
    setRecommendedTopic(topic);
    
    // If we have a topic and progress data, check if modules are completed
    if (topic && progress) {
      const { areAllModulesCompletedToday } = useProgressStore.getState();
      const completed = areAllModulesCompletedToday(topic.id, topic.modules);
      setAllModulesCompleted(completed);
    } else {
      // If no progress data, modules can't be completed
      setAllModulesCompleted(false);
    }
  }, [user, progress]);

  const handleStartLearning = () => {
    router.push('/topics');
  };

  const handleTopicPress = (topicId: string) => {
    router.push(`/topics/${topicId}`);
  };

  const handleShareQRCode = () => {
    // Open the QR code modal
    setQrModalVisible(true);
  };

  // Filter topics based on user's points
  const availableTopics = offerings
    .filter(topic => !progress || progress.totalPoints >= topic.requiredPoints)
    .slice(0, 4); 
  
  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container}>
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Welcome back,</Text>
            <Text style={styles.userName}>{user?.name || 'Learner'}</Text>
          </View>

          <TouchableOpacity
            style={styles.qrButton}
            onPress={handleShareQRCode}
          >
            <QrCode size={24} color={colors.primary} />
          </TouchableOpacity>
        </View>

        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Flame size={24} color={colors.secondary} />
            <Text style={styles.statValue}>{progress?.streak || 0}</Text>
            <Text style={styles.statLabel}>Day Streak</Text>
          </View>

          <View style={styles.statCard}>
            <Award size={24} color={colors.primary} />
            <Text style={styles.statValue}>{progress?.totalPoints || 0}</Text>
            <Text style={styles.statLabel}>Points</Text>
          </View>
        </View>

        <View style={styles.lessonSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Your Lessons</Text>

            <View style={styles.filterContainer}>
              <TouchableOpacity
                style={[
                  styles.filterButton,
                  lessonFilter === 'today' && styles.activeFilterButton
                ]}
                onPress={() => setLessonFilter('today')}
              >
                <Text
                  style={[
                    styles.filterText,
                    lessonFilter === 'today' && styles.activeFilterText
                  ]}
                >
                  Today
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.filterButton,
                  lessonFilter === 'all' && styles.activeFilterButton
                ]}
                onPress={() => setLessonFilter('all')}
              >
                <Text
                  style={[
                    styles.filterText,
                    lessonFilter === 'all' && styles.activeFilterText
                  ]}
                >
                  All Lessons
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {lessonFilter === 'today' ? (
            <Card variant="elevated" style={styles.todayLessonCard}>
              {recommendedTopic ? (
                <View style={styles.todayLessonContent}>
                  <View>
                    <Text style={styles.todayLessonTitle}>
                      Today's Recommended Lesson
                    </Text>
                    <Text style={styles.todayLessonSubtitle}>
                      {recommendedTopic.title}
                    </Text>
                    <Text style={styles.todayLessonDescription}>
                      {recommendedTopic.description}
                    </Text>
                  </View>

                  <Image
                    source={{ uri: 'https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60' }}
                    style={styles.todayLessonImage}
                    resizeMode="contain"
                  />
                </View>
              ) : (
                <View style={styles.todayLessonContent}>
                  <View>
                    <Text style={styles.todayLessonTitle}>
                      Today's Recommended Lesson
                    </Text>
                    <Text style={styles.todayLessonSubtitle}>
                      Loading Recommendations...
                    </Text>
                    <Text style={styles.todayLessonDescription}>
                      Please wait while we prepare today's lesson
                    </Text>
                  </View>

                  <Image
                    source={{ uri: 'https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60' }}
                    style={styles.todayLessonImage}
                    resizeMode="contain"
                  />
                </View>
              )}

              {recommendedTopic && (
                allModulesCompleted ? (
                  <Button
                    title="Lesson Completed for Today"
                    disabled={true}
                    onPress={() => {}}
                    variant="primary"
                    icon={<CheckCircle size={16} color={colors.light} />}
                    iconPosition="right"
                  />
                ) : (
                  <Button
                    title="Start Lesson"
                    onPress={() => handleTopicPress(recommendedTopic.id)}
                    variant="primary"
                    icon={<Play size={16} color={colors.light} />}
                    iconPosition="right"
                  />
                )
              )}

              {!recommendedTopic && (
                <Button
                  title="Check For Lessons"
                  onPress={() => {
                    // Force refresh the recommended topic
                    const userPreferredTopics = user?.preferredTopics || [];
                    const userPoints = progress?.totalPoints || 0;
                    const topic = getRecommendedTopicForToday(userPreferredTopics, userPoints);
                    setRecommendedTopic(topic);
                  }}
                  variant="primary"
                  icon={<Play size={16} color={colors.light} />}
                  iconPosition="right"
                />
              )}
            </Card>
          ) : (
            <View>
              {availableTopics.map(topic => (
                <TopicCard
                  key={topic.id}
                  topic={topic}
                  onPress={handleTopicPress}
                />
              ))}

              {availableTopics.length === 0 && (
                <Text style={styles.noLessonsText}>
                  No lessons available yet. Start learning to unlock more!
                </Text>
              )}
            </View>
          )}
        </View>

        <View style={styles.learningPathSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Your Learning Path</Text>
            <TouchableOpacity onPress={() => router.push('/topics')}>
              <Text style={styles.seeAllText}>See All</Text>
            </TouchableOpacity>
          </View>

          <Card variant="outlined" style={styles.learningPathCard}>
            <View style={styles.pathProgress}>
              <Text style={styles.pathProgressText}>
                {Math.round((progress?.totalPoints || 0) / 10)}% Complete
              </Text>
              <ProgressBar
                progress={(progress?.totalPoints || 0) / 1000}
                height={8}
                progressColor={colors.primary}
              />
            </View>

            <View style={styles.pathMilestones}>
              {offerings.slice(0, 4).map((topic, index) => (
                <View key={topic.id} style={styles.pathMilestone}>
                  <View
                    style={[
                      styles.milestoneIcon,
                      (progress?.totalPoints || 0) >= topic.requiredPoints && styles.completedMilestone
                    ]}
                  >
                    <Text style={styles.milestoneNumber}>{index + 1}</Text>
                  </View>
                  <Text style={styles.milestoneName}>{topic.title}</Text>
                </View>
              ))}
            </View>

            <Button
              title="Start Learning"
              onPress={handleStartLearning}
              variant="primary"
              fullWidth
              style={styles.startLearningButton}
            />
          </Card>
        </View>
      </ScrollView>

      {/* QR Code Modal */}
      <QRCodeModal
        visible={qrModalVisible}
        onClose={() => setQrModalVisible(false)}
        userData={user}
      />
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  greeting: {
    fontSize: 16,
    color: colors.darkGray,
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.dark,
  },
  qrButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: `${colors.primary}20`,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statsContainer: {
    flexDirection: 'row',
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    marginRight: 12,
    alignItems: 'center',
    shadowColor: colors.dark,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: colors.border,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.dark,
    marginVertical: 4,
  },
  statLabel: {
    fontSize: 12,
    color: colors.darkGray,
  },
  shareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${colors.primary}20`,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  shareText: {
    color: colors.primary,
    fontWeight: '500',
    marginLeft: 4,
  },
  lessonSection: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.dark,
  },
  filterContainer: {
    flexDirection: 'row',
    backgroundColor: colors.gray,
    borderRadius: 20,
    padding: 4,
  },
  filterButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  activeFilterButton: {
    backgroundColor: colors.card,
    shadowColor: colors.dark,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  filterText: {
    fontSize: 12,
    color: colors.darkGray,
  },
  activeFilterText: {
    color: colors.dark,
    fontWeight: '500',
  },
  todayLessonCard: {
    marginBottom: 16,
  },
  todayLessonContent: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  todayLessonTitle: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '500',
    marginBottom: 4,
  },
  todayLessonSubtitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.dark,
    marginBottom: 8,
  },
  todayLessonDescription: {
    fontSize: 14,
    color: colors.darkGray,
    maxWidth: 200,
  },
  todayLessonImage: {
    width: 80,
    height: 80,
    marginLeft: 'auto',
  },
  noLessonsText: {
    textAlign: 'center',
    color: colors.darkGray,
    padding: 24,
  },
  learningPathSection: {
    marginBottom: 24,
  },
  seeAllText: {
    color: colors.primary,
    fontWeight: '500',
  },
  learningPathCard: {
    padding: 20,
  },
  pathProgress: {
    marginBottom: 24,
  },
  pathProgressText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.dark,
    marginBottom: 8,
  },
  pathMilestones: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  pathMilestone: {
    alignItems: 'center',
  },
  milestoneIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.gray,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  completedMilestone: {
    backgroundColor: colors.primary,
  },
  milestoneNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.dark,
  },
  milestoneName: {
    fontSize: 12,
    color: colors.darkGray,
    textAlign: 'center',
    maxWidth: 70,
  },
  startLearningButton: {
    marginTop: 8,
  }
});