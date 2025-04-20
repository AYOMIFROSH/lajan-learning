import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  SafeAreaView
} from 'react-native';
import { Stack } from 'expo-router';
import colors from '@/constants/colors';
import { Shield } from 'lucide-react-native';

export default function PrivacyPolicyScreen() {
  return (
    <SafeAreaView style={styles.safeArea}>
      <Stack.Screen 
        options={{ 
          title: 'Privacy Policy',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        }} 
      />
      
      <ScrollView style={styles.container}>
        <View style={styles.header}>
          <View style={styles.iconContainer}>
            <Shield size={32} color={colors.primary} />
          </View>
          <Text style={styles.title}>Privacy Policy</Text>
          <Text style={styles.subtitle}>
            Last updated: May 15, 2023
          </Text>
        </View>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>1. Introduction</Text>
          <Text style={styles.paragraph}>
            Welcome to Financial Education App ("we," "our," or "us"). We are committed to protecting your privacy and ensuring you have a positive experience on our app. This policy outlines our data handling practices.
          </Text>
        </View>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>2. Information We Collect</Text>
          <Text style={styles.paragraph}>
            We collect information that you provide directly to us, such as when you create an account, complete your profile, or interact with our features.
          </Text>
          
          <Text style={styles.subSectionTitle}>2.1 Personal Information</Text>
          <Text style={styles.paragraph}>
            • Name and contact information (email address, phone number)
          </Text>
          <Text style={styles.paragraph}>
            • Account credentials (username, password)
          </Text>
          <Text style={styles.paragraph}>
            • Profile information (age, education level, financial interests)
          </Text>
          
          <Text style={styles.subSectionTitle}>2.2 Usage Information</Text>
          <Text style={styles.paragraph}>
            • Learning progress and activity
          </Text>
          <Text style={styles.paragraph}>
            • Interactions with content and features
          </Text>
          <Text style={styles.paragraph}>
            • Time spent on different modules
          </Text>
          
          <Text style={styles.subSectionTitle}>2.3 Device Information</Text>
          <Text style={styles.paragraph}>
            • Device type and model
          </Text>
          <Text style={styles.paragraph}>
            • Operating system
          </Text>
          <Text style={styles.paragraph}>
            • IP address
          </Text>
        </View>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>3. How We Use Your Information</Text>
          <Text style={styles.paragraph}>
            We use the information we collect for various purposes, including:
          </Text>
          
          <Text style={styles.paragraph}>
            • Providing and improving our services
          </Text>
          <Text style={styles.paragraph}>
            • Personalizing your learning experience
          </Text>
          <Text style={styles.paragraph}>
            • Communicating with you about your account and our services
          </Text>
          <Text style={styles.paragraph}>
            • Analyzing usage patterns to improve our app
          </Text>
          <Text style={styles.paragraph}>
            • Ensuring the security of our services
          </Text>
        </View>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>4. Sharing Your Information</Text>
          <Text style={styles.paragraph}>
            We may share your information with:
          </Text>
          
          <Text style={styles.paragraph}>
            • Service providers who perform services on our behalf
          </Text>
          <Text style={styles.paragraph}>
            • Guardian accounts (for users under 18, with consent)
          </Text>
          <Text style={styles.paragraph}>
            • Legal authorities when required by law
          </Text>
          <Text style={styles.paragraph}>
            • Business partners (only with your explicit consent)
          </Text>
        </View>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>5. Your Rights and Choices</Text>
          <Text style={styles.paragraph}>
            You have certain rights regarding your personal information:
          </Text>
          
          <Text style={styles.paragraph}>
            • Access and update your information through your account settings
          </Text>
          <Text style={styles.paragraph}>
            • Request deletion of your account and associated data
          </Text>
          <Text style={styles.paragraph}>
            • Opt-out of marketing communications
          </Text>
          <Text style={styles.paragraph}>
            • Control app permissions (camera, notifications, etc.)
          </Text>
        </View>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>6. Data Security</Text>
          <Text style={styles.paragraph}>
            We implement appropriate technical and organizational measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction.
          </Text>
        </View>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>7. Children's Privacy</Text>
          <Text style={styles.paragraph}>
            Our app is designed for users of all ages, including children under 13. For users under 13, we require parental consent and offer additional privacy protections in compliance with the Children's Online Privacy Protection Act (COPPA).
          </Text>
        </View>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>8. Changes to This Policy</Text>
          <Text style={styles.paragraph}>
            We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Last updated" date.
          </Text>
        </View>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>9. Contact Us</Text>
          <Text style={styles.paragraph}>
            If you have any questions about this Privacy Policy, please contact us at:
          </Text>
          <Text style={styles.paragraph}>
            privacy@financialedu.app
          </Text>
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
    alignItems: 'center',
    marginBottom: 24,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: `${colors.primary}20`,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.dark,
    marginBottom: 8,
  },
  subtitle: {
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
    marginBottom: 12,
  },
  subSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.dark,
    marginTop: 12,
    marginBottom: 8,
  },
  paragraph: {
    fontSize: 14,
    color: colors.darkGray,
    marginBottom: 8,
    lineHeight: 20,
  },
});