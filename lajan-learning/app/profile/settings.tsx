import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  SafeAreaView,
  Switch,
  TouchableOpacity,
  Alert,
  Platform,
  ActivityIndicator
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { useAuthStore } from '@/store/auth-store';
import { useProgressStore } from '@/store/progress-store';
import colors from '@/constants/colors';
import Button from '@/components/Button';
import { 
  Bell, 
  Moon, 
  Globe, 
  Shield, 
  HelpCircle, 
  FileText, 
  Trash2,
  ChevronRight,
  LogOut,
  Settings as SettingsIcon
} from 'lucide-react-native';
import { firebase, firestoreDB } from '@/firebase/config';
import * as LocalAuthentication from 'expo-local-authentication';

// Note: To use this, you need to install the expo-notifications package:
// npx expo install expo-notifications

export default function SettingsScreen() {
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const { resetProgress } = useProgressStore();
  
  const [notifications, setNotifications] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [biometricLogin, setBiometricLogin] = useState(true);
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [loading, setLoading] = useState(true);
  
  // Fetch user settings from Firestore
  useEffect(() => {
    const fetchUserSettings = async () => {
      if (!user?.id) {
        setLoading(false);
        return;
      }
      
      try {
        // Check if biometric authentication is available
        const biometricSupport = await LocalAuthentication.hasHardwareAsync();
        setBiometricAvailable(biometricSupport);
        
        // Get user settings from Firestore
        const userSettingsDoc = await firestoreDB.collection('user_settings').doc(user.id).get();
        
        if (userSettingsDoc.exists) {
          const settingsData = userSettingsDoc.data();
          setNotifications(settingsData?.pushNotifications ?? true);
          setDarkMode(settingsData?.darkMode ?? false);
          setBiometricLogin(settingsData?.biometricLogin ?? biometricSupport);
        } else {
          // Create default settings document if it doesn't exist
          const defaultSettings = {
            pushNotifications: true,
            darkMode: false,
            biometricLogin: biometricSupport,
            language: 'en'
          };
          
          await firestoreDB.collection('user_settings').doc(user.id).set(defaultSettings);
        }
      } catch (error) {
        console.error('Error fetching user settings:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchUserSettings();
  }, [user?.id]);
  
  // Handle notification toggle
  const handleNotificationToggle = async (value: boolean) => {
    setNotifications(value);
    
    if (!user?.id) return;
    
    try {
      // Update Firestore setting
      await firestoreDB.collection('user_settings').doc(user.id).update({
        pushNotifications: value
      });
      
      if (value) {
        // For a real implementation, you would request permissions here
        // Since expo-notifications isn't installed, we'll just simulate this
        
        // Simulate permission request with regular Alert
        const permissionGranted = await new Promise<boolean>(resolve => {
          Alert.alert(
            'Allow Notifications',
            'Would you like to receive notifications for module completions and achievements?',
            [
              { text: 'Don\'t Allow', onPress: () => resolve(false) },
              { text: 'Allow', onPress: () => resolve(true) }
            ]
          );
        });
        
        if (!permissionGranted) {
          // If permission denied, revert the toggle
          setNotifications(false);
          await firestoreDB.collection('user_settings').doc(user.id).update({
            pushNotifications: false
          });
          
          Alert.alert(
            'Permission Required',
            'Please enable notifications in your device settings to receive updates.',
            [{ text: 'OK' }]
          );
        }
      }
    } catch (error) {
      console.error('Error updating notification settings:', error);
      // Revert toggle on error
      setNotifications(!value);
    }
  };
  
  // Handle dark mode toggle
  const handleDarkModeToggle = async (value: boolean) => {
    setDarkMode(value);
    
    if (!user?.id) return;
    
    try {
      // Update Firestore setting
      await firestoreDB.collection('user_settings').doc(user.id).update({
        darkMode: value
      });
      
      // In a real app, you would apply the theme change here
      // For now, just log it
      console.log('Dark mode:', value ? 'enabled' : 'disabled');
    } catch (error) {
      console.error('Error updating dark mode settings:', error);
      // Revert toggle on error
      setDarkMode(!value);
    }
  };
  
  // Handle biometric login toggle
  const handleBiometricToggle = async (value: boolean) => {
    if (!biometricAvailable) {
      Alert.alert(
        'Not Available',
        'Biometric authentication is not available on this device.',
        [{ text: 'OK' }]
      );
      return;
    }
    
    setBiometricLogin(value);
    
    if (!user?.id) return;
    
    try {
      // Update Firestore setting
      await firestoreDB.collection('user_settings').doc(user.id).update({
        biometricLogin: value
      });
    } catch (error) {
      console.error('Error updating biometric settings:', error);
      // Revert toggle on error
      setBiometricLogin(!value);
    }
  };
  
  const handleLogout = async () => {
    try {
      await logout();
      resetProgress();
      router.replace('/auth');
    } catch (error) {
      console.error('Logout error:', error);
      Alert.alert('Logout Failed', 'There was a problem logging out. Please try again.');
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
  
  const confirmDeleteAccount = () => {
    Alert.alert(
      "Delete Account",
      "Are you sure you want to delete your account? This action cannot be undone.",
      [
        {
          text: "Cancel",
          style: "cancel"
        },
        {
          text: "Delete",
          onPress: async () => {
            if (!user?.id) return;
            
            try {
              setLoading(true);
              
              // Delete user data from Firestore collections
              const batch = firestoreDB.batch();
              
              // Delete user settings
              batch.delete(firestoreDB.collection('user_settings').doc(user.id));
              
              // Delete user progress
              batch.delete(firestoreDB.collection('progress').doc(user.id));
              
              // Delete user notifications
              const notificationsRef = await firestoreDB.collection('notifications')
                .where('userId', '==', user.id)
                .get();
              
              notificationsRef.forEach(doc => {
                batch.delete(doc.ref);
              });
              
              // Delete point history
              const pointHistoryRef = await firestoreDB.collection('point_history')
                .where('userId', '==', user.id)
                .get();
              
              pointHistoryRef.forEach(doc => {
                batch.delete(doc.ref);
              });
              
              // Commit the batch operation
              await batch.commit();
              
              // Delete Firebase Auth user
              const currentUser = firebase.auth().currentUser;
              if (currentUser) {
                await currentUser.delete();
              }
              
              // Reset local state and navigate to auth
              await logout();
              resetProgress();
              router.replace('/auth');
            } catch (error) {
              console.error('Error deleting account:', error);
              Alert.alert(
                "Error",
                "There was a problem deleting your account. Please try again.",
                [{ text: "OK" }]
              );
              setLoading(false);
            }
          },
          style: "destructive"
        }
      ]
    );
  };
  
  const handleLanguagePress = () => {
    Alert.alert(
      "Language Settings",
      "Select your preferred language",
      [
        { text: "English", onPress: () => updateLanguage('en') },
        { text: "Spanish", onPress: () => updateLanguage('es') },
        { text: "French", onPress: () => updateLanguage('fr') },
        { text: "Cancel", style: "cancel" }
      ]
    );
  };
  
  const updateLanguage = async (language: string) => {
    if (!user?.id) return;
    
    try {
      await firestoreDB.collection('user_settings').doc(user.id).update({
        language
      });
      
      Alert.alert(
        "Language Updated",
        "You'll need to restart the app for all changes to take effect.",
        [{ text: "OK" }]
      );
    } catch (error) {
      console.error('Error updating language:', error);
      Alert.alert("Error", "Failed to update language. Please try again.");
    }
  };
  
  const handleHelpPress = () => {
    router.push('/profile/help');
  };
  
  const handlePrivacyPress = () => {
    router.push('/profile/privacy');
  };
  
  const handleTermsPress = () => {
    router.push('/profile/terms');
  };
  
  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <Stack.Screen 
          options={{ 
            title: 'Settings',
            headerTitleStyle: {
              fontWeight: 'bold',
            },
          }} 
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading settings...</Text>
        </View>
      </SafeAreaView>
    );
  }
  
  return (
    <SafeAreaView style={styles.safeArea}>
      <Stack.Screen 
        options={{ 
          title: 'Settings',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        }} 
      />
      
      <ScrollView style={styles.container}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Preferences</Text>
          
          <View style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <View style={[
                styles.settingIconContainer,
                { backgroundColor: `${colors.primary}20` }
              ]}>
                <Bell size={20} color={colors.primary} />
              </View>
              <Text style={styles.settingText}>Push Notifications</Text>
            </View>
            <Switch
              value={notifications}
              onValueChange={handleNotificationToggle}
              trackColor={{ false: colors.gray, true: `${colors.primary}80` }}
              thumbColor={notifications ? colors.primary : colors.light}
              ios_backgroundColor={colors.gray}
            />
          </View>
          
          <View style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <View style={[
                styles.settingIconContainer,
                { backgroundColor: `${colors.secondary}20` }
              ]}>
                <Moon size={20} color={colors.secondary} />
              </View>
              <Text style={styles.settingText}>Dark Mode</Text>
            </View>
            <Switch
              value={darkMode}
              onValueChange={handleDarkModeToggle}
              trackColor={{ false: colors.gray, true: `${colors.secondary}80` }}
              thumbColor={darkMode ? colors.secondary : colors.light}
              ios_backgroundColor={colors.gray}
            />
          </View>
          
          <TouchableOpacity style={styles.settingItem} onPress={handleLanguagePress}>
            <View style={styles.settingLeft}>
              <View style={[
                styles.settingIconContainer,
                { backgroundColor: `${colors.info}20` }
              ]}>
                <Globe size={20} color={colors.info} />
              </View>
              <Text style={styles.settingText}>Language</Text>
            </View>
            <View style={styles.settingRight}>
              <Text style={styles.settingValue}>English</Text>
              <ChevronRight size={20} color={colors.darkGray} />
            </View>
          </TouchableOpacity>
        </View>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Security</Text>
          
          <View style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <View style={[
                styles.settingIconContainer,
                { backgroundColor: `${colors.success}20` }
              ]}>
                <Shield size={20} color={colors.success} />
              </View>
              <Text style={styles.settingText}>Biometric Login</Text>
            </View>
            <Switch
              value={biometricLogin}
              onValueChange={handleBiometricToggle}
              trackColor={{ false: colors.gray, true: `${colors.success}80` }}
              thumbColor={biometricLogin ? colors.success : colors.light}
              ios_backgroundColor={colors.gray}
              disabled={!biometricAvailable}
            />
          </View>
        </View>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Support</Text>
          
          <TouchableOpacity style={styles.settingItem} onPress={handleHelpPress}>
            <View style={styles.settingLeft}>
              <View style={[
                styles.settingIconContainer,
                { backgroundColor: `${colors.warning}20` }
              ]}>
                <HelpCircle size={20} color={colors.warning} />
              </View>
              <Text style={styles.settingText}>Help & Support</Text>
            </View>
            <ChevronRight size={20} color={colors.darkGray} />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.settingItem} onPress={handlePrivacyPress}>
            <View style={styles.settingLeft}>
              <View style={[
                styles.settingIconContainer,
                { backgroundColor: `${colors.darkGray}20` }
              ]}>
                <FileText size={20} color={colors.darkGray} />
              </View>
              <Text style={styles.settingText}>Privacy Policy</Text>
            </View>
            <ChevronRight size={20} color={colors.darkGray} />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.settingItem} onPress={handleTermsPress}>
            <View style={styles.settingLeft}>
              <View style={[
                styles.settingIconContainer,
                { backgroundColor: `${colors.darkGray}20` }
              ]}>
                <FileText size={20} color={colors.darkGray} />
              </View>
              <Text style={styles.settingText}>Terms of Service</Text>
            </View>
            <ChevronRight size={20} color={colors.darkGray} />
          </TouchableOpacity>
        </View>
        
        <View style={styles.dangerSection}>
          <TouchableOpacity 
            style={styles.dangerButton}
            onPress={confirmDeleteAccount}
          >
            <Trash2 size={20} color={colors.error} />
            <Text style={styles.dangerButtonText}>Delete Account</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.logoutButton}
            onPress={confirmLogout}
          >
            <LogOut size={20} color={colors.primary} />
            <Text style={styles.logoutButtonText}>Sign Out</Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.versionContainer}>
          <Text style={styles.versionText}>Version 1.0.0</Text>
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
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.dark,
    marginBottom: 16,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  settingText: {
    fontSize: 16,
    color: colors.dark,
  },
  settingRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingValue: {
    fontSize: 16,
    color: colors.darkGray,
    marginRight: 8,
  },
  dangerSection: {
    marginBottom: 24,
  },
  dangerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: `${colors.error}10`,
    borderWidth: 1,
    borderColor: colors.error,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  dangerButtonText: {
    fontSize: 16,
    color: colors.error,
    fontWeight: '500',
    marginLeft: 8,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.light,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 16,
  },
  logoutButtonText: {
    fontSize: 16,
    color: colors.primary,
    fontWeight: '500',
    marginLeft: 8,
  },
  versionContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  versionText: {
    fontSize: 14,
    color: colors.darkGray,
  },
});