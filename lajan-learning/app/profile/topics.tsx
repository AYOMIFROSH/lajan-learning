import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  SafeAreaView, 
  TouchableOpacity,
  FlatList
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { useProgressStore } from '@/store/progress-store';
import colors from '@/constants/colors';
import { 
  BookOpen, 
  CheckCircle, 
  Clock, 
  Award,
  ChevronRight,
  TrendingUp,
  PieChart,
  CreditCard,
  Landmark,
  FileText,
  Percent,
  ArrowLeft
} from 'lucide-react-native';
import { topics } from '@/mocks/topics';

export default function ProfileTopicsScreen() {
  const router = useRouter();
  const { progress } = useProgressStore();
  
  const getTopicIcon = (iconName: string) => {
    switch (iconName) {
      case 'trending-up':
        return <TrendingUp size={24} color={colors.primary} />;
      case 'pie-chart':
        return <PieChart size={24} color={colors.secondary} />;
      case 'credit-card':
        return <CreditCard size={24} color="#6C5CE7" />;
      case 'landmark':
        return <Landmark size={24} color="#00B894" />;
      case 'file-text':
        return <FileText size={24} color="#FF7675" />;
      case 'percent':
        return <Percent size={24} color="#FDCB6E" />;
      default:
        return <BookOpen size={24} color={colors.primary} />;
    }
  };
  
  const isTopicCompleted = (topicId: string) => {
    return progress?.topicsProgress[topicId]?.completed || false;
  };
  
  const getTopicProgress = (topicId: string) => {
    const topicProgress = progress?.topicsProgress[topicId];
    if (!topicProgress) return 0;
    
    const completedModules = topicProgress.completedModules?.length || 0;
    const topic = topics.find(t => t.id === topicId);
    const totalModules = topic?.modules?.length || 1;
    
    return (completedModules / totalModules) * 100;
  };
  
  const handleTopicPress = (topicId: string) => {
    router.push(`/topics/${topicId}`);
  };
  
  const handleGoBack = () => {
    router.back();
  };
  
  // Helper function to calculate total time for a topic
  const calculateTotalTime = (topicId: string): number => {
    const topic = topics.find(t => t.id === topicId);
    if (!topic || !topic.modules) return 0;
    
    return topic.modules.reduce((total, module) => {
      return total + (module.estimatedTime || 0);
    }, 0);
  };
  
  // Helper function to calculate total points for a topic
  const calculateTotalPoints = (topicId: string): number => {
    const topic = topics.find(t => t.id === topicId);
    if (!topic || !topic.modules) return 0;
    
    return topic.modules.reduce((total, module) => {
      return total + (module.points || 0);
    }, 0);
  };
  
  // Get all topics that the user has interacted with
  const userTopics = topics.filter(topic => 
    progress?.topicsProgress[topic.id]
  );
  
  // Count completed topics
  const completedTopicsCount = userTopics.filter(topic => 
    progress?.topicsProgress[topic.id]?.completed
  ).length;
  
  return (
    <SafeAreaView style={styles.safeArea}>
      <Stack.Screen 
        options={{ 
          title: 'My Topics',
          headerShown: false
        }} 
      />
      
      <View style={styles.header}>
        <TouchableOpacity onPress={handleGoBack} style={styles.backButton}>
          <ArrowLeft size={24} color={colors.dark} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Topics</Text>
        <View style={styles.spacer} />
      </View>
      
      <View style={styles.container}>
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <View style={styles.statIconContainer}>
              <BookOpen size={24} color={colors.primary} />
            </View>
            <Text style={styles.statValue}>
              {userTopics.length}
            </Text>
            <Text style={styles.statLabel}>Total Topics</Text>
          </View>
          
          <View style={styles.statCard}>
            <View style={[
              styles.statIconContainer,
              { backgroundColor: `${colors.success}20` }
            ]}>
              <CheckCircle size={24} color={colors.success} />
            </View>
            <Text style={styles.statValue}>
              {completedTopicsCount}
            </Text>
            <Text style={styles.statLabel}>Completed</Text>
          </View>
        </View>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>In Progress</Text>
          
          <FlatList
            data={userTopics.filter(topic => 
              !progress?.topicsProgress[topic.id].completed
            )}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.topicCard}
                onPress={() => handleTopicPress(item.id)}
                activeOpacity={0.7}
              >
                <View style={styles.topicHeader}>
                  <View style={[
                    styles.topicIconContainer,
                    { backgroundColor: `${item.color || colors.primary}20` }
                  ]}>
                    {getTopicIcon(item.icon)}
                  </View>
                  
                  <View style={styles.topicInfo}>
                    <Text style={styles.topicTitle}>{item.title}</Text>
                    
                    <View style={styles.topicProgressContainer}>
                      <View style={styles.topicProgressBar}>
                        <View 
                          style={[
                            styles.topicProgressFill,
                            { width: `${getTopicProgress(item.id)}%`, backgroundColor: item.color || colors.primary }
                          ]}
                        />
                      </View>
                      <Text style={styles.topicProgressText}>
                        {Math.round(getTopicProgress(item.id))}% complete
                      </Text>
                    </View>
                  </View>
                  
                  <ChevronRight size={20} color={colors.darkGray} />
                </View>
                
                <View style={styles.topicFooter}>
                  <View style={styles.topicDetail}>
                    <Clock size={16} color={colors.darkGray} />
                    <Text style={styles.topicDetailText}>
                      {calculateTotalTime(item.id)} min
                    </Text>
                  </View>
                  
                  <View style={styles.topicDetail}>
                    <Award size={16} color={colors.darkGray} />
                    <Text style={styles.topicDetailText}>
                      {calculateTotalPoints(item.id)} pts
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            )}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>
                  You don't have any topics in progress.
                </Text>
                <TouchableOpacity
                  style={styles.exploreButton}
                  onPress={() => router.push('/topics')}
                >
                  <Text style={styles.exploreButtonText}>Explore Topics</Text>
                </TouchableOpacity>
              </View>
            }
            style={styles.topicsList}
          />
        </View>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Completed</Text>
          
          <FlatList
            data={userTopics.filter(topic => 
              progress?.topicsProgress[topic.id]?.completed
            )}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[styles.topicCard, styles.completedTopicCard]}
                onPress={() => handleTopicPress(item.id)}
                activeOpacity={0.7}
              >
                <View style={styles.topicHeader}>
                  <View style={[
                    styles.topicIconContainer,
                    { backgroundColor: `${colors.success}20` }
                  ]}>
                    <CheckCircle size={24} color={colors.success} />
                  </View>
                  
                  <View style={styles.topicInfo}>
                    <Text style={styles.topicTitle}>{item.title}</Text>
                    <Text style={styles.completedText}>Completed</Text>
                  </View>
                  
                  <ChevronRight size={20} color={colors.darkGray} />
                </View>
                
                <View style={styles.topicFooter}>
                  <View style={styles.topicDetail}>
                    <Clock size={16} color={colors.darkGray} />
                    <Text style={styles.topicDetailText}>
                      {calculateTotalTime(item.id)} min
                    </Text>
                  </View>
                  
                  <View style={styles.topicDetail}>
                    <Award size={16} color={colors.darkGray} />
                    <Text style={styles.topicDetailText}>
                      {calculateTotalPoints(item.id)} pts
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            )}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>
                  You haven't completed any topics yet.
                </Text>
              </View>
            }
            style={styles.topicsList}
          />
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: colors.background,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.dark,
  },
  spacer: {
    width: 40, // Same width as back button for alignment
  },
  container: {
    flex: 1,
    padding: 16,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginHorizontal: 4,
    shadowColor: colors.dark,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
    borderWidth: 1,
    borderColor: colors.border,
  },
  statIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: `${colors.primary}20`,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.dark,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: colors.darkGray,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.dark,
    marginBottom: 16,
  },
  topicsList: {
    flex: 1,
  },
  topicCard: {
    backgroundColor: colors.card,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: colors.dark,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
  },
  completedTopicCard: {
    borderLeftWidth: 4,
    borderLeftColor: colors.success,
  },
  topicHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  topicIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  topicInfo: {
    flex: 1,
  },
  topicTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.dark,
    marginBottom: 8,
  },
  topicProgressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  topicProgressBar: {
    flex: 1,
    height: 4,
    backgroundColor: colors.gray,
    borderRadius: 2,
    marginRight: 8,
    overflow: 'hidden',
  },
  topicProgressFill: {
    height: '100%',
    borderRadius: 2,
  },
  topicProgressText: {
    fontSize: 12,
    color: colors.darkGray,
    width: 70,
  },
  completedText: {
    fontSize: 14,
    color: colors.success,
    fontWeight: '500',
  },
  topicFooter: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: colors.border,
    padding: 12,
  },
  topicDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  topicDetailText: {
    fontSize: 12,
    color: colors.darkGray,
    marginLeft: 4,
  },
  emptyContainer: {
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  emptyText: {
    fontSize: 16,
    color: colors.darkGray,
    textAlign: 'center',
    marginBottom: 16,
  },
  exploreButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: colors.primary,
    borderRadius: 8,
  },
  exploreButtonText: {
    fontSize: 14,
    color: colors.light,
    fontWeight: '500',
  },
});