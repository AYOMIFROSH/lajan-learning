import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  RefreshControl
} from 'react-native';
import colors from '@/constants/colors';
import NotificationItem from '@/components/NotificationItem';
import Button from '@/components/Button';
import { Bell, Users, Share2 } from 'lucide-react-native';
import { useAuthStore } from '@/store/auth-store';
import { Platform } from 'react-native';

import { Notification } from '@/types/content';

// API base URL
const API_BASE_URL = Platform.select({
  ios: 'http://172.20.10.3:3000/api',
  android: 'http://10.0.2.2:3000/api',
  web: 'http://localhost:3000/api',
}) || 'http://localhost:3000/api';

type NotificationsTab = 'notifications' | 'multiplayer';

export default function NotificationsScreen() {
  const { token, user } = useAuthStore();
  const [activeTab, setActiveTab] = useState<NotificationsTab>('notifications');
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Fetch notifications when component mounts
  useEffect(() => {
    fetchNotifications();
  }, [token]);
  
  const fetchNotifications = async () => {
    if (!token) {
      setError('Authentication required');
      setLoading(false);
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`${API_BASE_URL}/notifications`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fetch notifications');
      }
      
      const data = await response.json();
      
      setNotifications(data.notifications);
    } catch (err) {
      console.error('Error fetching notifications:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch notifications');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };
  
  const handleRefresh = () => {
    setRefreshing(true);
    fetchNotifications();
  };
  
  const handleTabChange = (tab: NotificationsTab) => {
    setActiveTab(tab);
  };
  
  const handleNotificationPress = async (notification: Notification) => {
    if (!token) return;
    
    try {
      // Mark notification as read on server
      const response = await fetch(`${API_BASE_URL}/notifications/${notification.id}/read`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        console.error('Failed to mark notification as read');
        return;
      }
      
      // Update local state
      setNotifications(notifications.map(item => 
        item.id === notification.id ? { ...item, read: true } : item
      ));
      
      // Handle navigation based on notification type
      // In a real app, this would navigate to the relevant screen
      console.log(`Pressed notification: ${notification.title} (${notification.type})`);
      
      // Example navigation logic based on notification type
      // if (notification.type === 'lesson') {
      //   navigation.navigate('LessonDetail', { lessonId: notification.referenceId });
      // } else if (notification.type === 'achievement') {
      //   navigation.navigate('Achievements');
      // }
    } catch (err) {
      console.error('Error handling notification press:', err);
    }
  };
  
  const handleMarkAllAsRead = async () => {
    if (!token) return;
    
    try {
      setLoading(true);
      
      const response = await fetch(`${API_BASE_URL}/notifications/read-all`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to mark all notifications as read');
      }
      
      // Update local state
      setNotifications(notifications.map(item => ({ ...item, read: true })));
    } catch (err) {
      console.error('Error marking all notifications as read:', err);
    } finally {
      setLoading(false);
    }
  };
  
  const handleChallengePress = () => {
    // In a real app, this would open a friend selection modal
    console.log('Challenge a friend');
  };
  
  const handleSharePress = () => {
    // In a real app, this would open the share dialog
    console.log('Share app');
  };
  
  const renderNotificationsTab = () => (
    <View style={{ flex: 1 }}>
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
      
      <ScrollView 
        style={styles.tabContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[colors.primary]}
          />
        }
      >
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
      </ScrollView>
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
      <View style={styles.container}>
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
        
        {activeTab === 'notifications' ? renderNotificationsTab() : renderMultiplayerTab()}
      </View>
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
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.dark,
    marginBottom: 24,
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: colors.gray,
    borderRadius: 12,
    padding: 4,
    marginBottom: 24,
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
    flex: 1,
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
    flex: 1,
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