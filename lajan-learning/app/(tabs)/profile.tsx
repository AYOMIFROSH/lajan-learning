import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Image,
  Alert,
  Platform,
  ActivityIndicator,
  Modal
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/store/auth-store';
import { useProgressStore } from '@/store/progress-store';
import colors from '@/constants/colors';
import Button from '@/components/Button';
import {
  User,
  Settings,
  Award,
  BookOpen,
  Trophy,
  CreditCard,
  LogOut,
  ChevronRight,
  Edit,
  Shield,
  Lock,
  Bell,
  Calendar
} from 'lucide-react-native';
import { firebase, firestoreDB } from '@/firebase/config';

export default function ProfileScreen() {
  const router = useRouter();
  const { user, logout, connectGuardian } = useAuthStore();
  const { progress, resetProgress } = useProgressStore();
  const [loggingOut, setLoggingOut] = useState(false);
  const [unreadNotifications, setUnreadNotifications] = useState(0);

  // Fetch unread notification count
  useEffect(() => {
    if (user?.id) {
      const fetchUnreadCount = async () => {
        try {
          // Get notifications from Firestore
          const notificationsRef = firestoreDB.collection('notifications')
            .where('userId', '==', user.id)
            .where('read', '==', false);
          
          const snapshot = await notificationsRef.get();
          setUnreadNotifications(snapshot.size);
        } catch (error) {
          console.error('Error fetching notification count:', error);
          // Use default unread count based on progress data as fallback
          if (progress) {
            // Count potential unread notifications based on completed modules
            let count = 0;
            Object.entries(progress.topicsProgress || {}).forEach(([topicId, topicProgress]) => {
              if (topicProgress.completedModules && topicProgress.completedModules.length > 0) {
                count += 1; // Count one notification per topic with completions
              }
            });
            
            // Add one for streak if applicable
            if (progress.streak > 1) {
              count += 1;
            }
            
            setUnreadNotifications(count);
          }
        }
      };

      fetchUnreadCount();
    }
  }, [user?.id, progress]);

  const handleLogout = async () => {
    try {
      setLoggingOut(true); // Show loading only for logout
      await logout();
      resetProgress();
      router.replace('/auth');
    } catch (error) {
      setLoggingOut(false);
      console.error('Logout error:', error);
      Alert.alert('Logout Failed', 'There was a problem logging out. Please try again.');
    }
  };

  const handleEditProfile = () => {
    router.push('/profile/edit');
  };

  const handleNavigateToNotifications = () => {
    router.push('/(tabs)/notifications');
  };

  const handleConnectGuardian = () => {
    // In a real app, this would open a form to enter guardian email
    if (user) {
      if (Platform.OS === 'web') {
        const email = prompt("Enter the email address of your parent or guardian:");
        if (email && email.includes('@')) {
          connectGuardian(email);
        } else if (email) {
          Alert.alert("Invalid Email", "Please enter a valid email address.");
        }
      } else {
        Alert.prompt(
          "Connect Guardian",
          "Enter the email address of your parent or guardian:",
          [
            {
              text: "Cancel",
              style: "cancel"
            },
            {
              text: "Connect",
              onPress: (email) => {
                if (email && email.includes('@')) {
                  connectGuardian(email);
                } else {
                  Alert.alert("Invalid Email", "Please enter a valid email address.");
                }
              }
            }
          ],
          "plain-text"
        );
      }
    }
  };

  const confirmLogout = () => {
    Alert.alert(
      "Sign Out",
      "Are you sure you want to sign out?",
      [
        {
          text: "Cancel",
          style: "cancel"
        },
        {
          text: "Sign Out",
          onPress: handleLogout,
          style: "destructive"
        }
      ]
    );
  };

  const handleResetPassword = () => {
    router.push('/profile/reset-password');
  };

  const handleNavigateToPoints = () => {
    router.push('/profile/points');
  };

  const handleNavigateToTopics = () => {
    router.push('/profile/topics');
  };

  const handleNavigateToLeaderboard = () => {
    router.push('/profile/leaderboard');
  };

  const handleNavigateToSubscription = () => {
    router.push('/profile/subscription');
  };

  const handleNavigateToSettings = () => {
    router.push('/profile/settings');
  };

  // Logout loading modal - only shows during logout
  const LogoutLoadingModal = () => (
    <Modal
      transparent={true}
      visible={loggingOut}
      animationType="fade"
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.modalText}>Signing out...</Text>
        </View>
      </View>
    </Modal>
  );

  // Display badges for user profile
  const renderUserBadges = () => {
    const badges: JSX.Element[] = [];
    
    // Learning style badge
    if (user?.learningStyle) {
      badges.push(
        <View key="learningStyle" style={styles.userBadge}>
          <Text style={styles.userBadgeText}>
            {user.learningStyle === 'visual' ? 'Visual Learner' : 'Practical Learner'}
          </Text>
        </View>
      );
    }
    
    // Age badge - only show for minors (for privacy of adults)
    if (user?.isMinor) {
      badges.push(
        <View key="age" style={[styles.userBadge, { backgroundColor: `${colors.info}20` }]}>
          <Text style={[styles.userBadgeText, { color: colors.info }]}>
            Under 18
          </Text>
        </View>
      );
    }
    
    return badges.length > 0 ? (
      <View style={styles.userBadgesContainer}>
        {badges}
      </View>
    ) : null;
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Render logout loading modal */}
      <LogoutLoadingModal />
      <ScrollView style={styles.container} contentInsetAdjustmentBehavior="automatic">
        <View style={styles.header}>
          <View style={styles.profileInfo}>
            {/* Profile avatar would go here if implemented */}
            <View style={styles.userInfo}>
              <Text style={styles.userName}>{user?.name || 'User'}</Text>
              <Text style={styles.userEmail}>{user?.email || 'user@example.com'}</Text>
              
              {/* Display user badges */}
              {renderUserBadges()}
              
              {/* Display age if available */}
              {user?.age && (
                <View style={styles.ageContainer}>
                  <Calendar size={16} color={colors.darkGray} />
                  <Text style={styles.ageText}>{user.age} years old</Text>
                </View>
              )}
            </View>
          </View>
          
          {/* Bio section displayed below profile info */}
          {user?.bio && user.bio.trim() !== '' ? (
            <View style={styles.bioContainer}>
              <Text style={styles.bioTitle}>About Me</Text>
              <Text style={styles.userBio}>{user.bio}</Text>
            </View>
          ) : (
            <TouchableOpacity 
              style={styles.emptyBioContainer} 
              onPress={handleEditProfile}
            >
              <Text style={styles.emptyBioText}>Tap to add your bio...</Text>
            </TouchableOpacity>
          )}

          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{progress?.streak || 0}</Text>
              <Text style={styles.statLabel}>Day Streak</Text>
            </View>

            <View style={styles.statDivider} />

            <View style={styles.statItem}>
              <Text style={styles.statValue}>{progress?.totalPoints || 0}</Text>
              <Text style={styles.statLabel}>Points</Text>
            </View>

            <View style={styles.statDivider} />

            <View style={styles.statItem}>
              <Text style={styles.statValue}>
                {Object.keys(progress?.topicsProgress || {}).length}
              </Text>
              <Text style={styles.statLabel}>Topics</Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>

          {/* Notifications Menu Item */}
          <TouchableOpacity style={styles.menuItem} onPress={handleNavigateToNotifications}>
            <View style={[
              styles.menuIconContainer,
              { backgroundColor: `${colors.info}20` }
            ]}>
              <Bell size={20} color={colors.info} />
            </View>
            <Text style={styles.menuItemText}>Notifications</Text>
            <View style={styles.menuItemRight}>
              {unreadNotifications > 0 && (
                <View style={styles.notificationBadge}>
                  <Text style={styles.notificationBadgeText}>
                    {unreadNotifications > 99 ? '99+' : unreadNotifications}
                  </Text>
                </View>
              )}
              <ChevronRight size={20} color={colors.darkGray} />
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem} onPress={handleEditProfile}>
            <View style={styles.menuIconContainer}>
              <User size={20} color={colors.primary} />
            </View>
            <Text style={styles.menuItemText}>Manage Profile</Text>
            <ChevronRight size={20} color={colors.darkGray} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem} onPress={handleResetPassword}>
            <View style={[
              styles.menuIconContainer,
              { backgroundColor: `${colors.warning}20` }
            ]}>
              <Lock size={20} color={colors.warning} />
            </View>
            <Text style={styles.menuItemText}>Reset Password</Text>
            <ChevronRight size={20} color={colors.darkGray} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem} onPress={handleNavigateToPoints}>
            <View style={[
              styles.menuIconContainer,
              { backgroundColor: `${colors.secondary}20` }
            ]}>
              <Award size={20} color={colors.secondary} />
            </View>
            <Text style={styles.menuItemText}>Total Points</Text>
            <View style={styles.menuItemRight}>
              <Text style={styles.menuItemValue}>{progress?.totalPoints || 0}</Text>
              <ChevronRight size={20} color={colors.darkGray} />
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem} onPress={handleNavigateToTopics}>
            <View style={[
              styles.menuIconContainer,
              { backgroundColor: `${colors.info}20` }
            ]}>
              <BookOpen size={20} color={colors.info} />
            </View>
            <Text style={styles.menuItemText}>Topics Completed</Text>
            <View style={styles.menuItemRight}>
              <Text style={styles.menuItemValue}>
                {Object.keys(progress?.topicsProgress || {}).length}
              </Text>
              <ChevronRight size={20} color={colors.darkGray} />
            </View>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>App</Text>

          <TouchableOpacity style={styles.menuItem} onPress={handleNavigateToLeaderboard}>
            <View style={[
              styles.menuIconContainer,
              { backgroundColor: `${colors.success}20` }
            ]}>
              <Trophy size={20} color={colors.success} />
            </View>
            <Text style={styles.menuItemText}>Leaderboard</Text>
            <ChevronRight size={20} color={colors.darkGray} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem} onPress={handleNavigateToSubscription}>
            <View style={[
              styles.menuIconContainer,
              { backgroundColor: `${colors.warning}20` }
            ]}>
              <CreditCard size={20} color={colors.warning} />
            </View>
            <Text style={styles.menuItemText}>Subscription</Text>
            <View style={styles.menuItemRight}>
              <Text style={styles.menuItemValue}>Free</Text>
              <ChevronRight size={20} color={colors.darkGray} />
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem} onPress={handleNavigateToSettings}>
            <View style={[
              styles.menuIconContainer,
              { backgroundColor: `${colors.darkGray}20` }
            ]}>
              <Settings size={20} color={colors.darkGray} />
            </View>
            <Text style={styles.menuItemText}>Settings</Text>
            <ChevronRight size={20} color={colors.darkGray} />
          </TouchableOpacity>
        </View>

        {/* Show Guardian section for minors or those with already connected guardians */}
        {(user?.isMinor || user?.guardianEmail) && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Guardian</Text>

            <View style={styles.guardianCard}>
              <View style={styles.guardianIconContainer}>
                <Shield size={24} color={colors.light} />
              </View>

              <View style={styles.guardianContent}>
                <Text style={styles.guardianTitle}>
                  {user.guardianConnected ? 'Guardian Connected' : 'Connect a Guardian'}
                </Text>

                <Text style={styles.guardianDescription}>
                  {user.guardianConnected
                    ? `Your guardian (${user.guardianEmail}) has access to your learning progress.`
                    : 'Connect a parent or guardian to monitor your financial education journey.'}
                </Text>

                {!user.guardianConnected && (
                  <Button
                    title="Connect Guardian"
                    variant="primary"
                    style={styles.guardianButton}
                    onPress={handleConnectGuardian}
                  />
                )}
              </View>
            </View>
          </View>
        )}

        <View style={styles.logoutContainer}>
          <Button
            title="Sign Out"
            onPress={confirmLogout}
            variant="outline"
            icon={<LogOut size={20} color={colors.primary} />}
            iconPosition="left"
            style={styles.logoutButton}
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
  // Modal styles for logout loading
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: colors.card,
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    minWidth: 200,
  },
  modalText: {
    marginTop: 16,
    fontSize: 16,
    color: colors.dark,
    fontWeight: '500',
  },
  header: {
    marginBottom: 24,
  },
  profileInfo: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 16,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 2,
    borderColor: colors.primary,
  },
  editAvatarButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  userInfo: {
    flex: 1,
    justifyContent: 'flex-start',
  },
  userName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.dark,
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: colors.darkGray,
    marginBottom: 8,
  },
  userBadgesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 8,
  },
  userBadge: {
    backgroundColor: `${colors.primary}20`,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 8,
    marginBottom: 8,
  },
  userBadgeText: {
    fontSize: 12,
    color: colors.primary,
    fontWeight: '500',
  },
  ageContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  ageText: {
    fontSize: 14,
    color: colors.darkGray,
    marginLeft: 6,
  },
  bioContainer: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  bioTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.dark,
    marginBottom: 6,
  },
  userBio: {
    fontSize: 14,
    color: colors.darkGray,
    lineHeight: 20,
  },
  emptyBioContainer: {
    backgroundColor: `${colors.primary}10`,
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: `${colors.primary}30`,
    alignItems: 'center',
  },
  emptyBioText: {
    fontSize: 14,
    color: colors.primary,
    fontStyle: 'italic',
  },
  learningStyleBadge: {
    alignSelf: 'flex-start',
    backgroundColor: `${colors.primary}20`,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  learningStyleText: {
    fontSize: 12,
    color: colors.primary,
    fontWeight: '500',
  },
  statsRow: {
    flexDirection: 'row',
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    shadowColor: colors.dark,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
    borderWidth: 1,
    borderColor: colors.border,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
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
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: colors.dark,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
    borderWidth: 1,
    borderColor: colors.border,
  },
  menuIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: `${colors.primary}20`,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  menuItemText: {
    flex: 1,
    fontSize: 16,
    color: colors.dark,
  },
  menuItemRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuItemValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.primary,
    marginRight: 8,
  },
  guardianCard: {
    flexDirection: 'row',
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    shadowColor: colors.dark,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
    borderWidth: 1,
    borderColor: colors.border,
  },
  guardianIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  guardianContent: {
    flex: 1,
  },
  guardianTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.dark,
    marginBottom: 8,
  },
  guardianDescription: {
    fontSize: 14,
    color: colors.darkGray,
    marginBottom: 16,
    lineHeight: 20,
  },
  guardianButton: {
    alignSelf: 'flex-start',
  },
  logoutContainer: {
    marginBottom: 40,
  },
  logoutButton: {
    alignSelf: 'center',
  },
  notificationBadge: {
    backgroundColor: colors.error,
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
    minWidth: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  notificationBadgeText: {
    color: colors.light,
    fontSize: 12,
    fontWeight: 'bold',
  },
});