import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  SafeAreaView,
  Switch,
  TouchableOpacity,
  Alert,
  Platform
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { useAuthStore } from '@/store/auth-store';
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
  LogOut
} from 'lucide-react-native';

export default function SettingsScreen() {
  const router = useRouter();
  const { logout } = useAuthStore();
  
  const [notifications, setNotifications] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [biometricLogin, setBiometricLogin] = useState(true);
  
  const handleLogout = async () => {
    try {
      await logout();
      router.replace('/');
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
          onPress: () => {
            Alert.alert(
              "Account Deletion",
              "This feature is not available in the demo version.",
              [{ text: "OK" }]
            );
          },
          style: "destructive"
        }
      ]
    );
  };
  
  const handleLanguagePress = () => {
    Alert.alert(
      "Language Settings",
      "This feature is not available in the demo version.",
      [{ text: "OK" }]
    );
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
              onValueChange={setNotifications}
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
              onValueChange={setDarkMode}
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
              onValueChange={setBiometricLogin}
              trackColor={{ false: colors.gray, true: `${colors.success}80` }}
              thumbColor={biometricLogin ? colors.success : colors.light}
              ios_backgroundColor={colors.gray}
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