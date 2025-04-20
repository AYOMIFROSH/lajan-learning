import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  SafeAreaView,
  TouchableOpacity,
  Linking,
  Alert
} from 'react-native';
import { Stack } from 'expo-router';
import colors from '@/constants/colors';
import { 
  HelpCircle, 
  Mail, 
  MessageCircle, 
  FileText, 
  ChevronRight,
  ExternalLink
} from 'lucide-react-native';

// FAQ data
const faqs = [
  {
    id: '1',
    question: 'How do I reset my password?',
    answer: 'Go to the Profile tab, tap on "Reset Password", and follow the instructions to reset your password via email.'
  },
  {
    id: '2',
    question: 'How do points work?',
    answer: 'You earn points by completing modules, quizzes, and maintaining daily streaks. Points can be used to unlock premium content and features.'
  },
  {
    id: '3',
    question: 'Can I use the app offline?',
    answer: 'Some features are available offline, but you need an internet connection to sync your progress and access the latest content.'
  },
  {
    id: '4',
    question: 'How do I connect a guardian account?',
    answer: 'If you\'re under 18, you can connect a guardian account from your Profile page. The guardian will be able to monitor your learning progress.'
  },
  {
    id: '5',
    question: 'How do I cancel my subscription?',
    answer: 'Go to the Profile tab, tap on "Subscription", and select "Cancel Subscription". Your access will continue until the end of your billing period.'
  }
];

export default function HelpScreen() {
  const [expandedFaq, setExpandedFaq] = React.useState<string | null>(null);
  
  const toggleFaq = (id: string) => {
    if (expandedFaq === id) {
      setExpandedFaq(null);
    } else {
      setExpandedFaq(id);
    }
  };
  
  const handleEmailSupport = () => {
    Linking.openURL('mailto:support@financialedu.app')
      .catch(() => {
        Alert.alert(
          "Email Error",
          "Could not open email client. Please send an email to support@financialedu.app",
          [{ text: "OK" }]
        );
      });
  };
  
  const handleChatSupport = () => {
    Alert.alert(
      "Live Chat Support",
      "This feature is not available in the demo version.",
      [{ text: "OK" }]
    );
  };
  
  const handleVisitHelp = () => {
    Linking.openURL('https://financialedu.app/help')
      .catch(() => {
        Alert.alert(
          "Browser Error",
          "Could not open the help center. Please visit financialedu.app/help in your browser.",
          [{ text: "OK" }]
        );
      });
  };
  
  return (
    <SafeAreaView style={styles.safeArea}>
      <Stack.Screen 
        options={{ 
          title: 'Help & Support',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        }} 
      />
      
      <ScrollView style={styles.container}>
        <View style={styles.header}>
          <View style={styles.iconContainer}>
            <HelpCircle size={32} color={colors.primary} />
          </View>
          <Text style={styles.title}>How can we help you?</Text>
          <Text style={styles.subtitle}>
            Find answers to common questions or contact our support team
          </Text>
        </View>
        
        <View style={styles.supportOptionsContainer}>
          <TouchableOpacity 
            style={styles.supportOption}
            onPress={handleEmailSupport}
          >
            <View style={[
              styles.supportIconContainer,
              { backgroundColor: `${colors.primary}20` }
            ]}>
              <Mail size={24} color={colors.primary} />
            </View>
            <Text style={styles.supportOptionText}>Email Support</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.supportOption}
            onPress={handleChatSupport}
          >
            <View style={[
              styles.supportIconContainer,
              { backgroundColor: `${colors.secondary}20` }
            ]}>
              <MessageCircle size={24} color={colors.secondary} />
            </View>
            <Text style={styles.supportOptionText}>Live Chat</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.supportOption}
            onPress={handleVisitHelp}
          >
            <View style={[
              styles.supportIconContainer,
              { backgroundColor: `${colors.info}20` }
            ]}>
              <FileText size={24} color={colors.info} />
            </View>
            <Text style={styles.supportOptionText}>Help Center</Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Frequently Asked Questions</Text>
          
          {faqs.map((faq) => (
            <View key={faq.id} style={styles.faqItem}>
              <TouchableOpacity 
                style={styles.faqQuestion}
                onPress={() => toggleFaq(faq.id)}
              >
                <Text style={styles.faqQuestionText}>{faq.question}</Text>
                <ChevronRight 
                  size={20} 
                  color={colors.darkGray} 
                  style={[
                    styles.faqIcon,
                    expandedFaq === faq.id && styles.faqIconExpanded
                  ]} 
                />
              </TouchableOpacity>
              
              {expandedFaq === faq.id && (
                <View style={styles.faqAnswer}>
                  <Text style={styles.faqAnswerText}>{faq.answer}</Text>
                </View>
              )}
            </View>
          ))}
        </View>
        
        <View style={styles.additionalHelpContainer}>
          <Text style={styles.additionalHelpTitle}>Need more help?</Text>
          
          <TouchableOpacity 
            style={styles.additionalHelpLink}
            onPress={handleVisitHelp}
          >
            <Text style={styles.additionalHelpLinkText}>
              Visit our comprehensive Help Center
            </Text>
            <ExternalLink size={16} color={colors.primary} />
          </TouchableOpacity>
          
          <Text style={styles.supportHoursText}>
            Our support team is available Monday-Friday, 9am-5pm EST
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
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: colors.darkGray,
    textAlign: 'center',
    marginHorizontal: 24,
  },
  supportOptionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  supportOption: {
    flex: 1,
    alignItems: 'center',
    padding: 16,
    backgroundColor: colors.light,
    borderRadius: 12,
    marginHorizontal: 4,
    shadowColor: colors.dark,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  supportIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  supportOptionText: {
    fontSize: 14,
    color: colors.dark,
    textAlign: 'center',
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
  faqItem: {
    backgroundColor: colors.light,
    borderRadius: 12,
    marginBottom: 12,
    overflow: 'hidden',
    shadowColor: colors.dark,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  faqQuestion: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  faqQuestionText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    color: colors.dark,
  },
  faqIcon: {
    transform: [{ rotate: '0deg' }],
  },
  faqIconExpanded: {
    transform: [{ rotate: '90deg' }],
  },
  faqAnswer: {
    padding: 16,
    paddingTop: 0,
    backgroundColor: colors.light,
  },
  faqAnswerText: {
    fontSize: 14,
    color: colors.darkGray,
    lineHeight: 20,
  },
  additionalHelpContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  additionalHelpTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.dark,
    marginBottom: 12,
  },
  additionalHelpLink: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  additionalHelpLinkText: {
    fontSize: 14,
    color: colors.primary,
    marginRight: 4,
  },
  supportHoursText: {
    fontSize: 12,
    color: colors.darkGray,
    textAlign: 'center',
  },
});