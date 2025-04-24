import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  SafeAreaView,
  TouchableOpacity,
  Image,
  ActivityIndicator
} from 'react-native';
import { Stack } from 'expo-router';
import { useAuthStore } from '@/store/auth-store';
import { useProgressStore } from '@/store/progress-store';
import colors from '@/constants/colors';
import { Platform } from 'react-native';
import { 
  Trophy, 
  Medal, 
  Award, 
  Users,
  Filter
} from 'lucide-react-native';
import { firebase, firestoreDB } from '@/firebase/config';

// Define user type
interface LeaderboardUser {
  id: string;
  name: string;
  points: number;
  avatar: string;
  streak: number;
  topicsCompleted: number;
}

type LeaderboardFilter = 'all' | 'friends' | 'weekly';

export default function LeaderboardScreen() {
  const { user } = useAuthStore();
  const { progress } = useProgressStore();
  const [filter, setFilter] = useState<LeaderboardFilter>('all');
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Fetch leaderboard data from Firestore
  useEffect(() => {
    fetchLeaderboardData();
  }, [filter, user?.id]);

  const fetchLeaderboardData = async () => {
    if (!user?.id) {
      setError('Authentication required');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      // Different queries based on filter type
      let usersRef;
      
      if (filter === 'weekly') {
        // Get users active in the last week (7 days)
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
        
        usersRef = firestoreDB.collection('users')
          .where('lastActive', '>=', oneWeekAgo.toISOString())
          .orderBy('lastActive', 'desc')
          .orderBy('points', 'desc')
          .limit(50);
      } else if (filter === 'friends') {
        // For friends filter, we need to get user's friends
        // If you don't have a friends system yet, we can use a basic one
        const userDoc = await firestoreDB.collection('users').doc(user.id).get();
        const userData = userDoc.data();
        const friendIds = userData?.friends || [];
        
        if (friendIds.length > 0) {
          usersRef = firestoreDB.collection('users')
            .where(firebase.firestore.FieldPath.documentId(), 'in', friendIds)
            .orderBy('points', 'desc');
        } else {
          // If no friends, return empty array
          setLeaderboardData([]);
          setLoading(false);
          return;
        }
      } else {
        // All time - simple points sorting
        usersRef = firestoreDB.collection('users')
          .orderBy('points', 'desc')
          .limit(50);
      }
      
      const snapshot = await usersRef.get();
      
      if (snapshot.empty) {
        setLeaderboardData([]);
        setLoading(false);
        return;
      }
      
      // Map Firestore data to our leaderboard format
      const users: LeaderboardUser[] = [];
      
      snapshot.forEach(doc => {
        const userData = doc.data();
        users.push({
          id: doc.id,
          name: userData.name || 'User',
          points: userData.points || 0,
          avatar: userData.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(userData.name || 'User')}`,
          streak: userData.streak || 0,
          topicsCompleted: userData.completedLessons?.length || 0
        });
      });
      
      // Make sure current user is included if not already
      if (!users.some(leaderboardUser => leaderboardUser.id === user.id)) {
        // Add current user with correct data
        users.push({
          id: user.id,
          name: user.name || 'You',
          points: user.points || 0,
          avatar: user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name || 'You')}`,
          streak: user.streak || 0,
          topicsCompleted: user.completedLessons?.length || 0
        });
        
        // Re-sort by points
        users.sort((a, b) => b.points - a.points);
      }
      
      setLeaderboardData(users);
    } catch (err) {
      console.error('Error fetching leaderboard:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch leaderboard');
      
      // Create fallback data with current user
      if (user) {
        const fallbackData: LeaderboardUser[] = [
          {
            id: user.id,
            name: user.name || 'You',
            points: user.points || 0,
            avatar: user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name || 'You')}`,
            streak: user.streak || 0,
            topicsCompleted: user.completedLessons?.length || 0
          }
        ];
        setLeaderboardData(fallbackData);
      }
    } finally {
      setLoading(false);
    }
  };
  
  // Find user's position in the leaderboard
  const userPosition = leaderboardData.findIndex(item => item.id === user?.id) + 1 || 0;
  
  const getFilteredData = () => {
    // Return available data (filtering already handled in fetch)
    return leaderboardData;
  };
  
  const renderLeaderboardItem = ({ item, index }: { item: LeaderboardUser, index: number }) => {
    const isCurrentUser = user?.id === item.id;
    const isTopThree = index < 3;
    
    return (
      <View style={[
        styles.leaderboardItem,
        isCurrentUser && styles.currentUserItem
      ]}>
        <View style={styles.rankContainer}>
          {isTopThree ? (
            <View style={[
              styles.medalContainer,
              index === 0 ? styles.goldMedal : 
              index === 1 ? styles.silverMedal : 
              styles.bronzeMedal
            ]}>
              <Medal size={16} color={colors.light} />
            </View>
          ) : (
            <Text style={styles.rankText}>{index + 1}</Text>
          )}
        </View>
        
        <Image
          source={{ uri: item.avatar }}
          style={styles.avatar}
          defaultSource={require('@/assets/images/favicon.png')}
        />
        
        <View style={styles.userInfo}>
          <Text style={[
            styles.userName,
            isCurrentUser && styles.currentUserText
          ]}>
            {item.name} {isCurrentUser && '(You)'}
          </Text>
          
          <View style={styles.userStats}>
            <View style={styles.statItem}>
              <Trophy size={12} color={colors.darkGray} />
              <Text style={styles.statText}>{item.points} pts</Text>
            </View>
            
            <View style={styles.statDivider} />
            
            <View style={styles.statItem}>
              <Award size={12} color={colors.darkGray} />
              <Text style={styles.statText}>{item.topicsCompleted}</Text>
            </View>
          </View>
        </View>
        
        <Text style={styles.pointsText}>{item.points}</Text>
      </View>
    );
  };
  
  const renderHeader = () => (
    <View style={styles.header}>
      <View style={styles.filterContainer}>
        <TouchableOpacity
          style={[
            styles.filterButton,
            filter === 'all' && styles.activeFilterButton
          ]}
          onPress={() => setFilter('all')}
        >
          <Text style={[
            styles.filterText,
            filter === 'all' && styles.activeFilterText
          ]}>
            All Time
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[
            styles.filterButton,
            filter === 'weekly' && styles.activeFilterButton
          ]}
          onPress={() => setFilter('weekly')}
        >
          <Text style={[
            styles.filterText,
            filter === 'weekly' && styles.activeFilterText
          ]}>
            This Week
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[
            styles.filterButton,
            filter === 'friends' && styles.activeFilterButton
          ]}
          onPress={() => setFilter('friends')}
        >
          <Text style={[
            styles.filterText,
            filter === 'friends' && styles.activeFilterText
          ]}>
            Friends
          </Text>
        </TouchableOpacity>
      </View>
      
      <View style={styles.topThreeContainer}>
        {leaderboardData.slice(0, 3).map((user, index) => (
          <View 
            key={user.id} 
            style={[
              styles.topUserContainer,
              index === 0 ? styles.firstPlaceContainer : 
              index === 1 ? styles.secondPlaceContainer : 
              styles.thirdPlaceContainer
            ]}
          >
            <View style={styles.topUserRank}>
              <Text style={styles.topUserRankText}>{index + 1}</Text>
            </View>
            
            <Image
              source={{ uri: user.avatar }}
              style={[
                styles.topUserAvatar,
                index === 0 ? styles.firstPlaceAvatar : 
                index === 1 ? styles.secondPlaceAvatar : 
                styles.thirdPlaceAvatar
              ]}
              defaultSource={require('@/assets/images/favicon.png')}
            />
            
            <Text style={styles.topUserName} numberOfLines={1}>
              {user.name}
            </Text>
            
            <Text style={styles.topUserPoints}>
              {user.points} pts
            </Text>
          </View>
        ))}
      </View>
      
      <View style={styles.leaderboardHeader}>
        <Text style={styles.leaderboardTitle}>Leaderboard</Text>
        <View style={styles.leaderboardHeaderRight}>
          <Filter size={16} color={colors.darkGray} />
          <Text style={styles.sortText}>Sort by points</Text>
        </View>
      </View>
    </View>
  );
  
  const renderFooter = () => (
    <View style={styles.footer}>
      <View style={styles.yourRankContainer}>
        <Users size={20} color={colors.primary} />
        <Text style={styles.yourRankText}>
          Your Rank: {userPosition > 0 ? userPosition : 'N/A'} {userPosition > 0 ? `of ${leaderboardData.length}` : ''}
        </Text>
      </View>
    </View>
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyText}>
        {error ? error : filter === 'friends' ? 'No friends added yet' : 'No leaderboard data available'}
      </Text>
      {error && (
        <TouchableOpacity 
          style={styles.retryButton}
          onPress={fetchLeaderboardData}
        >
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      )}
    </View>
  );
  
  return (
    <SafeAreaView style={styles.safeArea}>
      <Stack.Screen 
        options={{ 
          title: 'Leaderboard',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        }} 
      />
      
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading leaderboard...</Text>
        </View>
      ) : (
        <FlatList
          data={getFilteredData()}
          renderItem={renderLeaderboardItem}
          keyExtractor={(item) => item.id}
          ListHeaderComponent={renderHeader}
          ListFooterComponent={leaderboardData.length > 0 ? renderFooter : null}
          ListEmptyComponent={renderEmpty}
          contentContainerStyle={styles.listContent}
          refreshing={loading}
          onRefresh={fetchLeaderboardData}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  listContent: {
    padding: 16,
    flexGrow: 1,
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
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    minHeight: 300,
  },
  emptyText: {
    fontSize: 16,
    color: colors.darkGray,
    textAlign: 'center',
    marginBottom: 16,
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
  header: {
    marginBottom: 16,
  },
  filterContainer: {
    flexDirection: 'row',
    marginBottom: 24,
    backgroundColor: colors.gray,
    borderRadius: 8,
    padding: 4,
  },
  filterButton: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 6,
  },
  activeFilterButton: {
    backgroundColor: colors.light,
    shadowColor: colors.dark,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  filterText: {
    fontSize: 14,
    color: colors.darkGray,
  },
  activeFilterText: {
    color: colors.primary,
    fontWeight: 'bold',
  },
  topThreeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: 24,
    height: 180,
  },
  topUserContainer: {
    alignItems: 'center',
    justifyContent: 'flex-end',
    flex: 1,
  },
  firstPlaceContainer: {
    height: '100%',
  },
  secondPlaceContainer: {
    height: '85%',
  },
  thirdPlaceContainer: {
    height: '70%',
  },
  topUserRank: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    top: 0,
    right: 0,
    zIndex: 1,
  },
  topUserRankText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: colors.light,
  },
  topUserAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginBottom: 8,
    borderWidth: 2,
  },
  firstPlaceAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderColor: '#FFD700', // Gold
  },
  secondPlaceAvatar: {
    borderColor: '#C0C0C0', // Silver
  },
  thirdPlaceAvatar: {
    borderColor: '#CD7F32', // Bronze
  },
  topUserName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.dark,
    marginBottom: 4,
    textAlign: 'center',
    width: '100%',
  },
  topUserPoints: {
    fontSize: 12,
    color: colors.primary,
    fontWeight: 'bold',
  },
  leaderboardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  leaderboardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.dark,
  },
  leaderboardHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sortText: {
    fontSize: 12,
    color: colors.darkGray,
    marginLeft: 4,
  },
  leaderboardItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.light,
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    shadowColor: colors.dark,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  currentUserItem: {
    backgroundColor: `${colors.primary}10`,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  rankContainer: {
    width: 30,
    alignItems: 'center',
  },
  rankText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.darkGray,
  },
  medalContainer: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  goldMedal: {
    backgroundColor: '#FFD700', // Gold
  },
  silverMedal: {
    backgroundColor: '#C0C0C0', // Silver
  },
  bronzeMedal: {
    backgroundColor: '#CD7F32', // Bronze
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.dark,
    marginBottom: 4,
  },
  currentUserText: {
    color: colors.primary,
    fontWeight: 'bold',
  },
  userStats: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statText: {
    fontSize: 12,
    color: colors.darkGray,
    marginLeft: 4,
  },
  statDivider: {
    width: 1,
    height: 12,
    backgroundColor: colors.border,
    marginHorizontal: 8,
  },
  pointsText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.primary,
  },
  footer: {
    marginTop: 16,
    marginBottom: 40,
  },
  yourRankContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.light,
    borderRadius: 12,
    padding: 16,
    shadowColor: colors.dark,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  yourRankText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.dark,
    marginLeft: 8,
  },
});