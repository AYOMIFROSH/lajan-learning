import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  SafeAreaView,
  TouchableOpacity,
  ActivityIndicator
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { useProgressStore } from '@/store/progress-store';
import { useAuthStore } from '@/store/auth-store';
import colors from '@/constants/colors';
import Card from '@/components/Card';
import { 
  Award, 
  TrendingUp, 
  Calendar, 
  CheckCircle, 
  Clock,
  ChevronRight,
  AlertCircle
} from 'lucide-react-native';
import { firebase, firestoreDB } from '@/firebase/config';
import { createNotification } from '@/services/notifictaion-service';

// Point history item type
interface PointHistoryItem {
  id: string;
  title: string;
  points: number;
  date: string;
  type: 'module' | 'streak' | 'quiz' | 'achievement';
}

// Reward type
interface Reward {
  id: string;
  title: string;
  points: number;
  description: string;
  unlocked?: boolean;
}

export default function PointsScreen() {
  const router = useRouter();
  const { progress } = useProgressStore();
  const { user } = useAuthStore();
  
  const [pointHistory, setPointHistory] = useState<PointHistoryItem[]>([]);
  const [upcomingRewards, setUpcomingRewards] = useState<Reward[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Fetch point history and rewards from Firestore
  useEffect(() => {
    if (user?.id) {
      fetchPointHistory();
      fetchRewards();
    } else {
      setLoading(false);
      setError('User not authenticated');
    }
  }, [user?.id, progress?.totalPoints]);
  
  const fetchPointHistory = async () => {
    try {
      // Try to fetch point history from Firestore
      const historyRef = firestoreDB.collection('point_history')
        .where('userId', '==', user?.id)
        .orderBy('date', 'desc')
        .limit(10);
      
      const snapshot = await historyRef.get();
      
      if (snapshot.empty) {
        // If no history, generate based on progress data
        setPointHistory(generatePointHistory());
      } else {
        const history: PointHistoryItem[] = [];
        snapshot.forEach(doc => {
          const data = doc.data();
          history.push({
            id: doc.id,
            title: data.title,
            points: data.points,
            date: data.date,
            type: data.type
          });
        });
        setPointHistory(history);
      }
    } catch (error) {
      console.error('Error fetching point history:', error);
      // Generate from progress as fallback
      setPointHistory(generatePointHistory());
    }
  };
  
  const fetchRewards = async () => {
    try {
      setLoading(true);
      
      // Try to fetch rewards from Firestore
      const rewardsRef = firestoreDB.collection('rewards')
        .orderBy('points', 'asc');
      
      const snapshot = await rewardsRef.get();
      
      if (snapshot.empty) {
        // If no rewards in Firestore, use default rewards
        setUpcomingRewards(getDefaultRewards());
      } else {
        const rewards: Reward[] = [];
        snapshot.forEach(doc => {
          const data = doc.data();
          rewards.push({
            id: doc.id,
            title: data.title,
            points: data.points,
            description: data.description,
            unlocked: (progress?.totalPoints || 0) >= data.points
          });
        });
        setUpcomingRewards(rewards);
      }
      
      // Check if user has unlocked any new rewards
      checkForNewRewards();
    } catch (error) {
      console.error('Error fetching rewards:', error);
      // Use default rewards as fallback
      setUpcomingRewards(getDefaultRewards());
    } finally {
      setLoading(false);
    }
  };
  
  // Check if user has unlocked any new rewards and create notifications
  const checkForNewRewards = async () => {
    if (!user?.id || !progress?.totalPoints) return;
    
    try {
      const userDoc = await firestoreDB.collection('users').doc(user.id).get();
      const userData = userDoc.data();
      
      if (!userData) return;
      
      // Get last checked points
      const lastCheckedPoints = userData.lastCheckedPoints || 0;
      
      // If points have increased
      if (progress.totalPoints > lastCheckedPoints) {
        // Check which rewards were unlocked
        const rewardsRef = firestoreDB.collection('rewards')
          .where('points', '>', lastCheckedPoints)
          .where('points', '<=', progress.totalPoints)
          .orderBy('points', 'asc');
        
        const snapshot = await rewardsRef.get();
        
        if (!snapshot.empty) {
          // Create notifications for newly unlocked rewards
          snapshot.forEach(async (doc) => {
            const reward = doc.data();
            try {
              await createNotification(
                user.id,
                "New Reward Unlocked!",
                `You've unlocked "${reward.title}" with your points. Check it out in the Rewards section!`,
                'achievement'
              );
            } catch (err) {
              console.error('Error creating reward notification:', err);
            }
          });
        }
        
        // Update the lastCheckedPoints
        await firestoreDB.collection('users').doc(user.id).update({
          lastCheckedPoints: progress.totalPoints
        });
      }
    } catch (error) {
      console.error('Error checking for new rewards:', error);
    }
  };
  
  // Generate point history based on user progress if Firestore data not available
  const generatePointHistory = (): PointHistoryItem[] => {
    const history: PointHistoryItem[] = [];
    
    if (!progress) return history;
    
    // Add streak points
    if (progress.streak > 0) {
      history.push({
        id: 'streak-1',
        title: `${progress.streak} Day Streak`,
        points: Math.min(progress.streak * 5, 25),
        date: progress.lastCompletedDate || new Date().toISOString(),
        type: 'streak'
      });
    }
    
    // Add module completion points
    let moduleIndex = 0;
    Object.entries(progress.topicsProgress || {}).forEach(([topicId, topicProgress]) => {
      if (topicProgress.completedModules) {
        topicProgress.completedModules.slice(0, 3).forEach(moduleId => {
          moduleIndex++;
          history.push({
            id: `module-${moduleIndex}`,
            title: `Completed Module ${moduleId}`,
            points: 50,
            date: topicProgress.lastAttempt || new Date().toISOString(),
            type: 'module'
          });
        });
      }
    });
    
    // Sort by date (descending)
    return history.sort((a, b) => {
      return new Date(b.date).getTime() - new Date(a.date).getTime();
    }).slice(0, 10); // Limit to 10 items
  };
  
  // Default rewards if not in Firestore
  const getDefaultRewards = (): Reward[] => {
    const totalPoints = progress?.totalPoints || 0;
    
    return [
      {
        id: '1',
        title: 'Premium Investing Guide',
        points: 500,
        description: 'Unlock a comprehensive guide to investing for beginners',
        unlocked: totalPoints >= 500
      },
      {
        id: '2',
        title: 'Advanced Budgeting Tools',
        points: 750,
        description: 'Access to premium budgeting templates and calculators',
        unlocked: totalPoints >= 750
      },
      {
        id: '3',
        title: 'One-on-One Financial Coaching',
        points: 1000,
        description: '30-minute session with a financial expert',
        unlocked: totalPoints >= 1000
      }
    ];
  };
  
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };
  
  const getPointTypeIcon = (type: string) => {
    switch (type) {
      case 'module':
        return <CheckCircle size={20} color={colors.primary} />;
      case 'streak':
        return <Calendar size={20} color={colors.secondary} />;
      case 'quiz':
        return <Clock size={20} color={colors.info} />;
      case 'achievement':
        return <Award size={20} color={colors.success} />;
      default:
        return <Award size={20} color={colors.primary} />;
    }
  };
  
  // Calculate next reward
  const getNextRewardPoints = (): number => {
    const totalPoints = progress?.totalPoints || 0;
    const nextReward = upcomingRewards.find(reward => reward.points > totalPoints);
    return nextReward ? nextReward.points : 1000; // Default to 1000 if no next reward
  };
  
  const handleViewFullHistory = () => {
    // In a production app, this would navigate to a full history screen
    // For now, just log it
    console.log('View full points history');
  };
  
  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <Stack.Screen 
          options={{ 
            title: 'Points & Rewards',
            headerTitleStyle: {
              fontWeight: 'bold',
            },
          }} 
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading points data...</Text>
        </View>
      </SafeAreaView>
    );
  }
  
  if (error) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <Stack.Screen 
          options={{ 
            title: 'Points & Rewards',
            headerTitleStyle: {
              fontWeight: 'bold',
            },
          }} 
        />
        <View style={styles.errorContainer}>
          <AlertCircle size={48} color={colors.error} />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => {
              setLoading(true);
              setError(null);
              fetchPointHistory();
              fetchRewards();
            }}
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }
  
  const nextRewardPoints = getNextRewardPoints();
  const pointsUntilNextReward = nextRewardPoints - (progress?.totalPoints || 0);
  
  return (
    <SafeAreaView style={styles.safeArea}>
      <Stack.Screen 
        options={{ 
          title: 'Points & Rewards',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        }} 
      />
      
      <ScrollView style={styles.container}>
        <View style={styles.header}>
          <Card variant="elevated" style={styles.pointsCard}>
            <View style={styles.pointsCardContent}>
              <View style={styles.pointsIconContainer}>
                <Award size={32} color={colors.primary} />
              </View>
              
              <View style={styles.pointsInfo}>
                <Text style={styles.totalPointsLabel}>Total Points</Text>
                <Text style={styles.totalPointsValue}>{progress?.totalPoints || 0}</Text>
                
                <View style={styles.pointsProgress}>
                  <View 
                    style={[
                      styles.pointsProgressBar,
                      { width: `${Math.min(((progress?.totalPoints || 0) / nextRewardPoints) * 100, 100)}%` }
                    ]}
                  />
                </View>
                
                <Text style={styles.nextRewardText}>
                  {pointsUntilNextReward} points until next reward
                </Text>
              </View>
            </View>
          </Card>
          
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <View style={[
                styles.statIconContainer,
                { backgroundColor: `${colors.primary}20` }
              ]}>
                <TrendingUp size={20} color={colors.primary} />
              </View>
              <Text style={styles.statValue}>{progress?.streak || 0}</Text>
              <Text style={styles.statLabel}>Day Streak</Text>
            </View>
            
            <View style={styles.statDivider} />
            
            <View style={styles.statItem}>
              <View style={[
                styles.statIconContainer,
                { backgroundColor: `${colors.secondary}20` }
              ]}>
                <CheckCircle size={20} color={colors.secondary} />
              </View>
              <Text style={styles.statValue}>
                {Object.keys(progress?.topicsProgress || {}).length}
              </Text>
              <Text style={styles.statLabel}>Topics Done</Text>
            </View>
            
            <View style={styles.statDivider} />
            
            <View style={styles.statItem}>
              <View style={[
                styles.statIconContainer,
                { backgroundColor: `${colors.success}20` }
              ]}>
                <Award size={20} color={colors.success} />
              </View>
              <Text style={styles.statValue}>
                {upcomingRewards.filter(r => r.unlocked).length}
              </Text>
              <Text style={styles.statLabel}>Rewards</Text>
            </View>
          </View>
        </View>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Upcoming Rewards</Text>
          
          {upcomingRewards.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No rewards available yet</Text>
            </View>
          ) : (
            upcomingRewards.map(reward => (
              <Card key={reward.id} variant="outlined" style={styles.rewardCard}>
                <View style={styles.rewardCardContent}>
                  <View style={styles.rewardInfo}>
                    <Text style={styles.rewardTitle}>{reward.title}</Text>
                    <Text style={styles.rewardDescription}>{reward.description}</Text>
                  </View>
                  
                  <View style={[
                    styles.rewardPointsBadge,
                    reward.unlocked || (progress?.totalPoints || 0) >= reward.points 
                      ? styles.rewardPointsBadgeUnlocked 
                      : {}
                  ]}>
                    <Text style={[
                      styles.rewardPointsText,
                      reward.unlocked || (progress?.totalPoints || 0) >= reward.points 
                        ? styles.rewardPointsTextUnlocked 
                        : {}
                    ]}>
                      {reward.points} pts
                    </Text>
                  </View>
                </View>
              </Card>
            ))
          )}
        </View>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Points History</Text>
          
          {pointHistory.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No point history available yet</Text>
            </View>
          ) : (
            pointHistory.map(item => (
              <View key={item.id} style={styles.historyItem}>
                <View style={[
                  styles.historyItemIconContainer,
                  { backgroundColor: item.type === 'module' ? `${colors.primary}20` :
                                     item.type === 'streak' ? `${colors.secondary}20` :
                                     item.type === 'quiz' ? `${colors.info}20` :
                                     `${colors.success}20` }
                ]}>
                  {getPointTypeIcon(item.type)}
                </View>
                
                <View style={styles.historyItemContent}>
                  <Text style={styles.historyItemTitle}>{item.title}</Text>
                  <Text style={styles.historyItemDate}>{formatDate(item.date)}</Text>
                </View>
                
                <Text style={styles.historyItemPoints}>+{item.points}</Text>
              </View>
            ))
          )}
          
          {pointHistory.length > 0 && (
            <TouchableOpacity 
              style={styles.viewAllButton}
              onPress={handleViewFullHistory}
            >
              <Text style={styles.viewAllButtonText}>View Full History</Text>
              <ChevronRight size={16} color={colors.primary} />
            </TouchableOpacity>
          )}
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: colors.darkGray,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  errorText: {
    fontSize: 16,
    color: colors.error,
    textAlign: 'center',
    marginVertical: 16,
  },
  retryButton: {
    backgroundColor: colors.primary,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  retryButtonText: {
    color: colors.light,
    fontWeight: 'bold',
  },
  emptyContainer: {
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.card,
    borderRadius: 12,
  },
  emptyText: {
    fontSize: 16,
    color: colors.darkGray,
    textAlign: 'center',
  },
  header: {
    marginBottom: 24,
  },
  pointsCard: {
    marginBottom: 16,
  },
  pointsCardContent: {
    flexDirection: 'row',
    padding: 16,
    alignItems: 'center',
  },
  pointsIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: `${colors.primary}20`,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  pointsInfo: {
    flex: 1,
  },
  totalPointsLabel: {
    fontSize: 14,
    color: colors.darkGray,
    marginBottom: 4,
  },
  totalPointsValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.dark,
    marginBottom: 8,
  },
  pointsProgress: {
    height: 8,
    backgroundColor: colors.gray,
    borderRadius: 4,
    marginBottom: 8,
    overflow: 'hidden',
  },
  pointsProgressBar: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 4,
  },
  nextRewardText: {
    fontSize: 12,
    color: colors.darkGray,
  },
  statsRow: {
    flexDirection: 'row',
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
    flex: 1,
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
  statDivider: {
    width: 1,
    height: '100%',
    backgroundColor: colors.border,
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
  rewardCard: {
    marginBottom: 12,
  },
  rewardCardContent: {
    flexDirection: 'row',
    padding: 16,
    alignItems: 'center',
  },
  rewardInfo: {
    flex: 1,
  },
  rewardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.dark,
    marginBottom: 4,
  },
  rewardDescription: {
    fontSize: 14,
    color: colors.darkGray,
  },
  rewardPointsBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: colors.gray,
  },
  rewardPointsBadgeUnlocked: {
    backgroundColor: `${colors.success}20`,
  },
  rewardPointsText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.darkGray,
  },
  rewardPointsTextUnlocked: {
    color: colors.success,
  },
  historyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.light,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: colors.dark,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  historyItemIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  historyItemContent: {
    flex: 1,
  },
  historyItemTitle: {
    fontSize: 16,
    color: colors.dark,
    marginBottom: 4,
  },
  historyItemDate: {
    fontSize: 12,
    color: colors.darkGray,
  },
  historyItemPoints: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.success,
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
  },
  viewAllButtonText: {
    fontSize: 14,
    color: colors.primary,
    marginRight: 4,
  },
});