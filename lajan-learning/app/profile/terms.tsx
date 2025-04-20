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
import { FileText } from 'lucide-react-native';

export default function TermsOfServiceScreen() {
  return (
    <SafeAreaView style={styles.safeArea}>
      <Stack.Screen 
        options={{ 
          title: 'Terms of Service',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        }} 
      />
      
      <ScrollView style={styles.container}>
        <View style={styles.header}>
          <View style={styles.iconContainer}>
            <FileText size={32} color={colors.primary} />
          </View>
          <Text style={styles.title}>Terms of Service</Text>
          <Text style={styles.subtitle}>
            Last updated: May 15, 2023
          </Text>
        </View>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>1. Acceptance of Terms</Text>
          <Text style={styles.paragraph}>
            By accessing or using the Financial Education App ("the App"), you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use the App.
          </Text>
        </View>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>2. Description of Service</Text>
          <Text style={styles.paragraph}>
            The App provides educational content and tools related to financial literacy and management. We reserve the right to modify, suspend, or discontinue any aspect of the service at any time.
          </Text>
        </View>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>3. User Accounts</Text>
          <Text style={styles.paragraph}>
            To access certain features of the App, you must create an account. You are responsible for maintaining the confidentiality of your account information and for all activities that occur under your account.
          </Text>
          
          <Text style={styles.subSectionTitle}>3.1 Account Requirements</Text>
          <Text style={styles.paragraph}>
            • You must provide accurate and complete information when creating your account.
          </Text>
          <Text style={styles.paragraph}>
            • You must be at least 13 years old to create an account. Users under 18 must have parental consent.
          </Text>
          <Text style={styles.paragraph}>
            • You are responsible for updating your account information to keep it current.
          </Text>
          
          <Text style={styles.subSectionTitle}>3.2 Account Security</Text>
          <Text style={styles.paragraph}>
            • You are responsible for safeguarding your password.
          </Text>
          <Text style={styles.paragraph}>
            • You agree to notify us immediately of any unauthorized use of your account.
          </Text>
          <Text style={styles.paragraph}>
            • We reserve the right to terminate accounts that violate our terms.
          </Text>
        </View>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>4. User Conduct</Text>
          <Text style={styles.paragraph}>
            You agree not to use the App to:
          </Text>
          
          <Text style={styles.paragraph}>
            • Violate any applicable laws or regulations
          </Text>
          <Text style={styles.paragraph}>
            • Impersonate any person or entity
          </Text>
          <Text style={styles.paragraph}>
            • Engage in any activity that interferes with or disrupts the App
          </Text>
          <Text style={styles.paragraph}>
            • Attempt to gain unauthorized access to the App or its systems
          </Text>
          <Text style={styles.paragraph}>
            • Use the App for any fraudulent or illegal purpose
          </Text>
        </View>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>5. Intellectual Property</Text>
          <Text style={styles.paragraph}>
            All content, features, and functionality of the App, including but not limited to text, graphics, logos, icons, and software, are owned by us or our licensors and are protected by copyright, trademark, and other intellectual property laws.
          </Text>
        </View>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>6. Subscription and Payments</Text>
          <Text style={styles.paragraph}>
            • Some features of the App may require a paid subscription.
          </Text>
          <Text style={styles.paragraph}>
            • Subscription fees are charged on a recurring basis until canceled.
          </Text>
          <Text style={styles.paragraph}>
            • You can cancel your subscription at any time through your account settings.
          </Text>
          <Text style={styles.paragraph}>
            • No refunds will be provided for partial subscription periods.
          </Text>
        </View>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>7. Disclaimer of Warranties</Text>
          <Text style={styles.paragraph}>
            THE APP IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED. WE DO NOT WARRANT THAT THE APP WILL BE UNINTERRUPTED OR ERROR-FREE.
          </Text>
        </View>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>8. Limitation of Liability</Text>
          <Text style={styles.paragraph}>
            IN NO EVENT SHALL WE BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES ARISING OUT OF OR RELATED TO YOUR USE OF THE APP.
          </Text>
        </View>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>9. Educational Content Disclaimer</Text>
          <Text style={styles.paragraph}>
            The content provided in the App is for educational purposes only and should not be construed as financial advice. We recommend consulting with a qualified financial professional before making any financial decisions.
          </Text>
        </View>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>10. Changes to Terms</Text>
          <Text style={styles.paragraph}>
            We reserve the right to modify these Terms of Service at any time. We will notify users of any material changes by posting the new Terms on the App and updating the "Last updated" date.
          </Text>
        </View>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>11. Governing Law</Text>
          <Text style={styles.paragraph}>
            These Terms shall be governed by and construed in accordance with the laws of the United States, without regard to its conflict of law provisions.
          </Text>
        </View>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>12. Contact Information</Text>
          <Text style={styles.paragraph}>
            If you have any questions about these Terms, please contact us at:
          </Text>
          <Text style={styles.paragraph}>
            terms@financialedu.app
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