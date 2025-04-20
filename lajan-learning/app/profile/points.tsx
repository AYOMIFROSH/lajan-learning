import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  SafeAreaView,
  TouchableOpacity
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { useProgressStore } from '@/store/progress-store';
import colors from '@/constants/colors';
import Card from '@/components/Card';
import { 
  Award, 
  TrendingUp, 
  Calendar, 
  CheckCircle, 
  Clock,
  ChevronRight
} from 'lucide-react-native';

export default function PointsScreen() {
  const router = useRouter();
  const { progress } = useProgressStore();
  
  // Mock point history data
  const pointHistory = [
    {
      id: '1',
      title: 'Completed Compound Interest Module',
      points: 50,
      date: '2023-05-15T10:30:00Z',
      type: 'module'
    },
    {
      id: '2',
      title: 'Daily Login Streak (7 days)',
      points: 25,
      date: '2023-05-14T09:15:00Z',
      type: 'streak'
    },
    {
      id: '3',
      title: 'Completed Budgeting Quiz',
      points: 30,
      date: '2023-05-12T14:45:00Z',
      type: 'quiz'
    },
    {
      id: '4',
      title: 'Completed Investing Basics Module',
      points: 45,
      date: '2023-05-10T11:20:00Z',
      type: 'module'
    },
    {
      id: '5',
      title: 'First Topic Completed',
      points: 100,
      date: '2023-05-08T16:30:00Z',
      type: 'achievement'
    }
  ];
  
  // Mock upcoming rewards
  const upcomingRewards = [
    {
      id: '1',
      title: 'Premium Investing Guide',
      points: 500,
      description: 'Unlock a comprehensive guide to investing for beginners'
    },
    {
      id: '2',
      title: 'Advanced Budgeting Tools',
      points: 750,
      description: 'Access to premium budgeting templates and calculators'
    },
    {
      id: '3',
      title: 'One-on-One Financial Coaching',
      points: 1000,
      description: '30-minute session with a financial expert'
    }
  ];
  
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
                      { width: `${Math.min(((progress?.totalPoints || 0) / 1000) * 100, 100)}%` }
                    ]}
                  />
                </View>
                
                <Text style={styles.nextRewardText}>
                  {1000 - (progress?.totalPoints || 0)} points until next reward
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
                {Math.floor((progress?.totalPoints || 0) / 100)}
              </Text>
              <Text style={styles.statLabel}>Rewards</Text>
            </View>
          </View>
        </View>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Upcoming Rewards</Text>
          
          {upcomingRewards.map(reward => (
            <Card key={reward.id} variant="outlined" style={styles.rewardCard}>
              <View style={styles.rewardCardContent}>
                <View style={styles.rewardInfo}>
                  <Text style={styles.rewardTitle}>{reward.title}</Text>
                  <Text style={styles.rewardDescription}>{reward.description}</Text>
                </View>
                
                <View style={[
                  styles.rewardPointsBadge,
                  (progress?.totalPoints || 0) >= reward.points 
                    ? styles.rewardPointsBadgeUnlocked 
                    : {}
                ]}>
                  <Text style={[
                    styles.rewardPointsText,
                    (progress?.totalPoints || 0) >= reward.points 
                      ? styles.rewardPointsTextUnlocked 
                      : {}
                  ]}>
                    {reward.points} pts
                  </Text>
                </View>
              </View>
            </Card>
          ))}
        </View>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Points History</Text>
          
          {pointHistory.map(item => (
            <View key={item.id} style={styles.historyItem}>
              <View style={styles.historyItemIconContainer}>
                {getPointTypeIcon(item.type)}
              </View>
              
              <View style={styles.historyItemContent}>
                <Text style={styles.historyItemTitle}>{item.title}</Text>
                <Text style={styles.historyItemDate}>{formatDate(item.date)}</Text>
              </View>
              
              <Text style={styles.historyItemPoints}>+{item.points}</Text>
            </View>
          ))}
          
          <TouchableOpacity 
            style={styles.viewAllButton}
            onPress={() => {
              // In a real app, this would navigate to a full history page
              alert('View full points history');
            }}
          >
            <Text style={styles.viewAllButtonText}>View Full History</Text>
            <ChevronRight size={16} color={colors.primary} />
          </TouchableOpacity>
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
    backgroundColor: colors.gray,
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