import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  RefreshControl,
  Alert,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import colors from '@/constants/colors';
import NotificationItem from '@/components/NotificationItem';
import Button from '@/components/Button';
import { Bell, Users, Share2 } from 'lucide-react-native';
import { useAuthStore } from '@/store/auth-store';
import { useProgressStore } from '@/store/progress-store';
import { useRouter } from 'expo-router';
import { firebase, firestoreDB } from '@/firebase/config';

import { Notification } from '@/types/content';
import { topics } from '@/mocks/topics';

type NotificationsTab = 'notifications' | 'multiplayer';

export default function NotificationsScreen() {
  const { token, user } = useAuthStore();
  const { progress } = useProgressStore();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<NotificationsTab>('notifications');
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Fetch notifications when component mounts
  useEffect(() => {
    fetchNotifications();
  }, [token, progress]);
  
  const fetchNotifications = async () => {
    if (!user || !user.id) {
      setError('Authentication required');
      setLoading(false);
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      // Get notifications from Firestore instead of API
      const notificationsRef = firestoreDB.collection('notifications')
        .where('userId', '==', user.id)
        .orderBy('createdAt', 'desc')
        .limit(50);
      
      const snapshot = await notificationsRef.get();
      
      if (snapshot.empty) {
        // Generate initial notifications based on user progress
        const generatedNotifications = generateInitialNotifications();
        setNotifications(generatedNotifications);
      } else {
        const fetchedNotifications: Notification[] = [];
        snapshot.forEach(doc => {
          fetchedNotifications.push({
            id: doc.id,
            ...doc.data() as Omit<Notification, 'id'>
          });
        });
        setNotifications(fetchedNotifications);
      }
    } catch (err) {
      console.error('Error fetching notifications:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch notifications');
      
      // Generate placeholder notifications if there's an error
      const generatedNotifications = generateInitialNotifications();
      setNotifications(generatedNotifications);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };
  
  // Generate initial notifications based on user progress
  const generateInitialNotifications = (): Notification[] => {
    // Same implementation as before
    const initialNotifications: Notification[] = [];
    const now = new Date();
    
    // Welcome notification
    initialNotifications.push({
      id: 'welcome',
      userId: user?.id || '',
      title: 'Welcome to Lajan Learning',
      message: 'Start your financial education journey by exploring topics and completing modules!',
      type: 'lesson',
      read: false,
      createdAt: new Date(now.getTime() - 86400000).toISOString(), // 1 day ago
      referenceId: ''
    });
    
    // Add streak notification if user has a streak
    if (progress && progress.streak > 1) {
      initialNotifications.push({
        id: 'streak',
        userId: user?.id || '',
        title: `${progress.streak} Day Streak!`,
        message: `You've maintained your learning streak for ${progress.streak} days. Keep it up!`,
        type: 'achievement',
        read: false,
        createdAt: new Date(now.getTime() - 3600000).toISOString(), // 1 hour ago
        referenceId: ''
      });
    }
    
    // Check for completed modules
    if (progress && progress.topicsProgress) {
      // Get completed topics and modules
      Object.entries(progress.topicsProgress).forEach(([topicId, topicProgress]) => {
        const topic = topics.find(t => t.id === topicId);
        if (!topic) return;
        
        // Add notification for each completed topic
        if (topicProgress.completed) {
          initialNotifications.push({
            id: `topic-${topicId}`,
            userId: user?.id || '',
            title: `Topic Completed: ${topic.title}`,
            message: `Congratulations! You've completed the ${topic.title} topic and earned points.`,
            type: 'achievement',
            read: false,
            createdAt: new Date(now.getTime() - 43200000).toISOString(), // 12 hours ago
            referenceId: topicId
          });
        }
        
        // Add notifications for recently completed modules
        if (topicProgress.completedModules && topicProgress.completedModules.length > 0) {
          const recentModule = topic.modules.find(m => 
            m.id === topicProgress.completedModules?.[topicProgress.completedModules.length - 1]
          );
          
          if (recentModule) {
            initialNotifications.push({
              id: `module-${recentModule.id}`,
              userId: user?.id || '',
              title: `Module Completed: ${recentModule.title}`,
              message: `You've finished learning about ${recentModule.title}. Great job!`,
              type: 'lesson',
              read: false,
              createdAt: new Date(now.getTime() - 7200000).toISOString(), // 2 hours ago
              referenceId: recentModule.id
            });
          }
        }
      });
    }
    
    // Points milestone if user has points
    if (user && user.points > 0) {
      // Find closest milestone (100, 250, 500, 1000, etc.)
      const milestones = [100, 250, 500, 1000, 2500, 5000, 10000];
      for (let i = milestones.length - 1; i >= 0; i--) {
        if (user.points >= milestones[i]) {
          initialNotifications.push({
            id: `points-${milestones[i]}`,
            userId: user.id,
            title: `Points Milestone: ${milestones[i]}`,
            message: `Congratulations! You've earned over ${milestones[i]} points in your learning journey!`,
            type: 'achievement',
            read: false,
            createdAt: new Date(now.getTime() - 172800000).toISOString(), // 2 days ago
            referenceId: ''
          });
          break;
        }
      }
    }
    
    // Add a notification about multiplayer mode
    initialNotifications.push({
      id: 'multiplayer-intro',
      userId: user?.id || '',
      title: 'Challenge Friends in Multiplayer',
      message: 'Test your financial knowledge against friends in fun quiz battles. Try multiplayer mode now!',
      type: 'friend',
      read: false,
      createdAt: new Date(now.getTime() - 259200000).toISOString(), // 3 days ago
      referenceId: ''
    });
    
    return initialNotifications;
  };
  
  const handleRefresh = () => {
    setRefreshing(true);
    fetchNotifications();
  };
  
  const handleTabChange = (tab: NotificationsTab) => {
    setActiveTab(tab);
  };
  
  const handleNotificationPress = async (notification: Notification) => {
    // Same implementation as before
    if (!user || !user.id) return;
    
    try {
      // Mark notification as read in Firestore if it's a real notification
      if (notification.id !== 'welcome' && notification.id !== 'streak' && 
          !notification.id.startsWith('topic-') && !notification.id.startsWith('module-') &&
          !notification.id.startsWith('points-') && notification.id !== 'multiplayer-intro') {
        await firestoreDB.collection('notifications').doc(notification.id).update({
          read: true
        });
      }
      
      // Update local state
      setNotifications(notifications.map(item => 
        item.id === notification.id ? { ...item, read: true } : item
      ));
      
      // Handle navigation based on notification type
      if (notification.type === 'lesson' && notification.referenceId) {
        // Extract topic id and module id if available
        const moduleIdMatch = notification.referenceId.match(/^([a-z-]+)-(\d+)$/);
        if (moduleIdMatch) {
          const topicId = moduleIdMatch[1];
          const moduleId = notification.referenceId;
          router.push(`/topics/${topicId}/modules/${moduleId}`);
        } else {
          // If no module match, try to navigate to topic
          const topic = topics.find(t => t.id === notification.referenceId);
          if (topic) {
            router.push(`/topics/${topic.id}`);
          }
        }
      } else if (notification.type === 'achievement') {
        // Navigate to profile or achievements section
        router.push('/profile');
      } else if (notification.type === 'friend') {
        // Switch to multiplayer tab
        setActiveTab('multiplayer');
      }
    } catch (err) {
      console.error('Error handling notification press:', err);
      Alert.alert('Error', 'Failed to update notification status');
    }
  };
  
  const handleMarkAllAsRead = async () => {
    // Same implementation as before
    if (!user || !user.id) return;
    
    try {
      setLoading(true);
      
      // Get all unread notifications
      const unreadNotifications = notifications.filter(notification => !notification.read);
      
      // Update each real notification in Firestore
      const updatePromises = unreadNotifications.map(notification => {
        if (notification.id !== 'welcome' && notification.id !== 'streak' && 
            !notification.id.startsWith('topic-') && !notification.id.startsWith('module-') &&
            !notification.id.startsWith('points-') && notification.id !== 'multiplayer-intro') {
          return firestoreDB.collection('notifications').doc(notification.id).update({
            read: true
          });
        }
        return Promise.resolve();
      });
      
      await Promise.all(updatePromises);
      
      // Update local state
      setNotifications(notifications.map(item => ({ ...item, read: true })));
    } catch (err) {
      console.error('Error marking all notifications as read:', err);
      Alert.alert('Error', 'Failed to mark all notifications as read');
    } finally {
      setLoading(false);
    }
  };
  
  const handleChallengePress = () => {
    Alert.alert(
      'Challenge a Friend',
      'Select a friend to challenge to a financial knowledge quiz!',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Invite Friends', 
          onPress: () => console.log('Invite friends to use the app')
        }
      ]
    );
  };
  
  const handleSharePress = async () => {
    Alert.alert(
      'Share App',
      'Share Lajan Learning with your friends and learn together!',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Share', 
          onPress: () => console.log('Share app functionality would go here')
        }
      ]
    );
  };
  
  const renderNotificationsTab = () => (
    <View style={styles.notificationsTabContainer}>
      {notifications.length > 0 && (
        <View style={styles.notificationActions}>
          <TouchableOpacity 
            style={styles.markAllButton}
            onPress={handleMarkAllAsRead}
            disabled={loading || !notifications.some(n => !n.read)}
          >
            <Text style={[
              styles.markAllText,
              (!notifications.some(n => !n.read)) && styles.disabledText
            ]}>
              Mark all as read
            </Text>
          </TouchableOpacity>
        </View>
      )}
      
      {loading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : error ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity 
            style={styles.retryButton}
            onPress={fetchNotifications}
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : notifications.length > 0 ? (
        notifications.map(notification => (
          <NotificationItem
            key={notification.id}
            notification={notification}
            onPress={handleNotificationPress}
          />
        ))
      ) : (
        <View style={styles.emptyState}>
          <Bell size={48} color={colors.darkGray} />
          <Text style={styles.emptyStateTitle}>No Notifications</Text>
          <Text style={styles.emptyStateText}>
            You don't have any notifications yet. Complete lessons to get updates!
          </Text>
        </View>
      )}
    </View>
  );
  
  const renderMultiplayerTab = () => (
    <View style={styles.multiplayerContainer}>
      <View style={styles.multiplayerCard}>
        <View style={styles.multiplayerIconContainer}>
          <Users size={32} color={colors.primary} />
        </View>
        <Text style={styles.multiplayerTitle}>Challenge a Friend</Text>
        <Text style={styles.multiplayerDescription}>
          Test your financial knowledge against a friend in a fun quiz battle!
        </Text>
        <Button
          title="Challenge a Friend"
          onPress={handleChallengePress}
          variant="primary"
          style={styles.challengeButton}
        />
      </View>
      
      <View style={styles.divider} />
      
      <View style={styles.shareContainer}>
        <Text style={styles.shareTitle}>Invite Friends</Text>
        <Text style={styles.shareDescription}>
          Share Lajan Learning with your friends and learn together!
        </Text>
        <Button
          title="Share App"
          onPress={handleSharePress}
          variant="outline"
          icon={<Share2 size={20} color={colors.primary} />}
          iconPosition="left"
          style={styles.shareButton}
        />
      </View>
      
      <View style={styles.leaderboardPreview}>
        <Text style={styles.leaderboardTitle}>Leaderboard Preview</Text>
        <Text style={styles.leaderboardDescription}>
          Challenge friends to see who can earn the most points!
        </Text>
        
        <View style={styles.leaderboardItem}>
          <Text style={styles.leaderboardRank}>1</Text>
          <View style={styles.leaderboardAvatar}>
            <Text style={styles.leaderboardAvatarText}>
              {user?.name ? user.name.substring(0, 2).toUpperCase() : 'YS'}
            </Text>
          </View>
          <Text style={styles.leaderboardName}>{user?.name || 'You'}</Text>
          <Text style={styles.leaderboardPoints}>{user?.points || 0} pts</Text>
        </View>
        
        <View style={styles.leaderboardItem}>
          <Text style={styles.leaderboardRank}>2</Text>
          <View style={[styles.leaderboardAvatar, { backgroundColor: colors.secondary }]}>
            <Text style={styles.leaderboardAvatarText}>JD</Text>
          </View>
          <Text style={styles.leaderboardName}>Invite a friend</Text>
          <Text style={styles.leaderboardPoints}>-</Text>
        </View>
      </View>
    </View>
  );
  
  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView 
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
      >
        <Text style={styles.title}>Activity</Text>
        
        <View style={styles.tabsContainer}>
          <TouchableOpacity
            style={[
              styles.tab,
              activeTab === 'notifications' && styles.activeTab
            ]}
            onPress={() => handleTabChange('notifications')}
          >
            <Bell 
              size={20} 
              color={activeTab === 'notifications' ? colors.primary : colors.darkGray} 
            />
            <Text 
              style={[
                styles.tabText,
                activeTab === 'notifications' && styles.activeTabText
              ]}
            >
              Notifications
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[
              styles.tab,
              activeTab === 'multiplayer' && styles.activeTab
            ]}
            onPress={() => handleTabChange('multiplayer')}
          >
            <Users 
              size={20} 
              color={activeTab === 'multiplayer' ? colors.primary : colors.darkGray} 
            />
            <Text 
              style={[
                styles.tabText,
                activeTab === 'multiplayer' && styles.activeTabText
              ]}
            >
              Multiplayer
            </Text>
          </TouchableOpacity>
        </View>
        
        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.scrollViewContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={[colors.primary]}
            />
          }
        >
          {activeTab === 'notifications' ? renderNotificationsTab() : renderMultiplayerTab()}
        </ScrollView>
      </KeyboardAvoidingView>
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
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.dark,
    marginBottom: 24,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: colors.gray,
    borderRadius: 12,
    padding: 4,
    marginBottom: 16,
    marginHorizontal: 16,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
  },
  activeTab: {
    backgroundColor: colors.light,
    shadowColor: colors.dark,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  tabText: {
    fontSize: 14,
    color: colors.darkGray,
    marginLeft: 8,
  },
  activeTabText: {
    color: colors.primary,
    fontWeight: '500',
  },
  scrollView: {
    flex: 1,
  },
  scrollViewContent: {
    paddingHorizontal: 16,
    paddingBottom: 24, // Add padding at the bottom for better scrolling
  },
  notificationsTabContainer: {
    paddingTop: 8,
  },
  tabContent: {
    flex: 1,
  },
  notificationActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: 8,
  },
  markAllButton: {
    paddingVertical: 4,
    paddingHorizontal: 10,
  },
  markAllText: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '500',
  },
  disabledText: {
    color: colors.darkGray,
    opacity: 0.5,
  },
  loadingContainer: {
    paddingVertical: 24,
    alignItems: 'center',
  },
  errorContainer: {
    alignItems: 'center',
    padding: 24,
  },
  errorText: {
    fontSize: 16,
    color: colors.error,
    marginBottom: 16,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: colors.primary,
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  retryButtonText: {
    color: colors.light,
    fontWeight: 'bold',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    minHeight: 300,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.dark,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 16,
    color: colors.darkGray,
    textAlign: 'center',
    lineHeight: 24,
  },
  multiplayerContainer: {
    paddingTop: 8,
  },
  multiplayerCard: {
    backgroundColor: colors.light,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    shadowColor: colors.dark,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    marginBottom: 24,
  },
  multiplayerIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: `${colors.primary}20`,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  multiplayerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.dark,
    marginBottom: 8,
  },
  multiplayerDescription: {
    fontSize: 16,
    color: colors.darkGray,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 24,
  },
  challengeButton: {
    width: '100%',
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: 24,
  },
  shareContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  shareTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.dark,
    marginBottom: 8,
  },
  shareDescription: {
    fontSize: 16,
    color: colors.darkGray,
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 24,
  },
  shareButton: {
    minWidth: 200,
  },
  leaderboardPreview: {
    backgroundColor: colors.light,
    borderRadius: 16,
    padding: 16,
    shadowColor: colors.dark,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    marginBottom: 24, // Add margin at the bottom
  },
  leaderboardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.dark,
    marginBottom: 8,
  },
  leaderboardDescription: {
    fontSize: 14,
    color: colors.darkGray,
    marginBottom: 16,
  },
  leaderboardItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  leaderboardRank: {
    width: 24,
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.dark,
  },
  leaderboardAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  leaderboardAvatarText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.light,
  },
  leaderboardName: {
    flex: 1,
    fontSize: 16,
    color: colors.dark,
  },
  leaderboardPoints: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.primary,
  },
  
});