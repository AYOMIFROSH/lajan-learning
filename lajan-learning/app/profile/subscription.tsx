import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  SafeAreaView,
  TouchableOpacity,
  Alert
} from 'react-native';
import { Stack } from 'expo-router';
import colors from '@/constants/colors';
import Button from '@/components/Button';
import Card from '@/components/Card';
import { 
  CreditCard, 
  Check, 
  X, 
  Shield, 
  Zap, 
  BookOpen,
  Award,
  Users
} from 'lucide-react-native';

export default function SubscriptionScreen() {
  const handleSubscribe = (plan: string) => {
    Alert.alert(
      "Subscribe to Plan",
      `This would initiate the subscription process for the ${plan} plan. This feature is not available in the demo version.`,
      [{ text: "OK" }]
    );
  };
  
  const handleCurrentPlan = () => {
    // This is a no-op function for the current plan button
    Alert.alert(
      "Current Plan",
      "You are already on the Free plan.",
      [{ text: "OK" }]
    );
  };
  
  return (
    <SafeAreaView style={styles.safeArea}>
      <Stack.Screen 
        options={{ 
          title: 'Subscription',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        }} 
      />
      
      <ScrollView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Choose Your Plan</Text>
          <Text style={styles.subtitle}>
            Upgrade to unlock premium features and accelerate your financial education journey
          </Text>
        </View>
        
        <View style={styles.currentPlanContainer}>
          <View style={styles.currentPlanHeader}>
            <Text style={styles.currentPlanTitle}>Current Plan</Text>
            <View style={styles.currentPlanBadge}>
              <Text style={styles.currentPlanBadgeText}>Free</Text>
            </View>
          </View>
          
          <Text style={styles.currentPlanDescription}>
            You're currently on the Free plan. Upgrade to access premium features.
          </Text>
        </View>
        
        <View style={styles.plansContainer}>
          <Card variant="outlined" style={styles.planCard}>
            <View style={styles.planHeader}>
              <Text style={styles.planName}>Free</Text>
              <Text style={styles.planPrice}>$0</Text>
              <Text style={styles.planPeriod}>Forever</Text>
            </View>
            
            <View style={styles.planFeatures}>
              <View style={styles.featureItem}>
                <Check size={16} color={colors.success} />
                <Text style={styles.featureText}>Basic financial terms</Text>
              </View>
              
              <View style={styles.featureItem}>
                <Check size={16} color={colors.success} />
                <Text style={styles.featureText}>Limited topics access</Text>
              </View>
              
              <View style={styles.featureItem}>
                <Check size={16} color={colors.success} />
                <Text style={styles.featureText}>Progress tracking</Text>
              </View>
              
              <View style={styles.featureItem}>
                <X size={16} color={colors.error} />
                <Text style={[styles.featureText, styles.disabledFeatureText]}>
                  Advanced financial modules
                </Text>
              </View>
              
              <View style={styles.featureItem}>
                <X size={16} color={colors.error} />
                <Text style={[styles.featureText, styles.disabledFeatureText]}>
                  Personalized learning path
                </Text>
              </View>
              
              <View style={styles.featureItem}>
                <X size={16} color={colors.error} />
                <Text style={[styles.featureText, styles.disabledFeatureText]}>
                  Expert financial insights
                </Text>
              </View>
            </View>
            
            <Button
              title="Current Plan"
              variant="outline"
              style={styles.planButton}
              disabled={true}
              onPress={handleCurrentPlan}
            />
          </Card>
          
          <Card variant="elevated" style={styles.planCard}>
            <View style={styles.recommendedBadge}>
              <Text style={styles.recommendedText}>Recommended</Text>
            </View>
            
            <View style={styles.planHeader}>
              <Text style={styles.planName}>Premium</Text>
              <Text style={styles.planPrice}>$4.99</Text>
              <Text style={styles.planPeriod}>per month</Text>
            </View>
            
            <View style={styles.planFeatures}>
              <View style={styles.featureItem}>
                <Check size={16} color={colors.success} />
                <Text style={styles.featureText}>All free features</Text>
              </View>
              
              <View style={styles.featureItem}>
                <Check size={16} color={colors.success} />
                <Text style={styles.featureText}>Full access to all topics</Text>
              </View>
              
              <View style={styles.featureItem}>
                <Check size={16} color={colors.success} />
                <Text style={styles.featureText}>Personalized learning path</Text>
              </View>
              
              <View style={styles.featureItem}>
                <Check size={16} color={colors.success} />
                <Text style={styles.featureText}>Advanced financial tools</Text>
              </View>
              
              <View style={styles.featureItem}>
                <Check size={16} color={colors.success} />
                <Text style={styles.featureText}>Ad-free experience</Text>
              </View>
              
              <View style={styles.featureItem}>
                <X size={16} color={colors.error} />
                <Text style={[styles.featureText, styles.disabledFeatureText]}>
                  1-on-1 financial coaching
                </Text>
              </View>
            </View>
            
            <Button
              title="Subscribe"
              variant="primary"
              style={styles.planButton}
              onPress={() => handleSubscribe('Premium')}
            />
          </Card>
          
          <Card variant="outlined" style={styles.planCard}>
            <View style={styles.planHeader}>
              <Text style={styles.planName}>Pro</Text>
              <Text style={styles.planPrice}>$9.99</Text>
              <Text style={styles.planPeriod}>per month</Text>
            </View>
            
            <View style={styles.planFeatures}>
              <View style={styles.featureItem}>
                <Check size={16} color={colors.success} />
                <Text style={styles.featureText}>All Premium features</Text>
              </View>
              
              <View style={styles.featureItem}>
                <Check size={16} color={colors.success} />
                <Text style={styles.featureText}>1-on-1 financial coaching</Text>
              </View>
              
              <View style={styles.featureItem}>
                <Check size={16} color={colors.success} />
                <Text style={styles.featureText}>Exclusive investment insights</Text>
              </View>
              
              <View style={styles.featureItem}>
                <Check size={16} color={colors.success} />
                <Text style={styles.featureText}>Priority customer support</Text>
              </View>
              
              <View style={styles.featureItem}>
                <Check size={16} color={colors.success} />
                <Text style={styles.featureText}>Custom financial reports</Text>
              </View>
              
              <View style={styles.featureItem}>
                <Check size={16} color={colors.success} />
                <Text style={styles.featureText}>Family account sharing</Text>
              </View>
            </View>
            
            <Button
              title="Subscribe"
              variant="outline"
              style={styles.planButton}
              onPress={() => handleSubscribe('Pro')}
            />
          </Card>
        </View>
        
        <View style={styles.benefitsSection}>
          <Text style={styles.benefitsSectionTitle}>Why Upgrade?</Text>
          
          <View style={styles.benefitItem}>
            <View style={[
              styles.benefitIconContainer,
              { backgroundColor: `${colors.primary}20` }
            ]}>
              <BookOpen size={24} color={colors.primary} />
            </View>
            
            <View style={styles.benefitContent}>
              <Text style={styles.benefitTitle}>Complete Learning Experience</Text>
              <Text style={styles.benefitDescription}>
                Access all financial modules and learning materials without restrictions
              </Text>
            </View>
          </View>
          
          <View style={styles.benefitItem}>
            <View style={[
              styles.benefitIconContainer,
              { backgroundColor: `${colors.secondary}20` }
            ]}>
              <Zap size={24} color={colors.secondary} />
            </View>
            
            <View style={styles.benefitContent}>
              <Text style={styles.benefitTitle}>Accelerated Learning</Text>
              <Text style={styles.benefitDescription}>
                Learn faster with personalized recommendations and advanced tools
              </Text>
            </View>
          </View>
          
          <View style={styles.benefitItem}>
            <View style={[
              styles.benefitIconContainer,
              { backgroundColor: `${colors.success}20` }
            ]}>
              <Award size={24} color={colors.success} />
            </View>
            
            <View style={styles.benefitContent}>
              <Text style={styles.benefitTitle}>Exclusive Rewards</Text>
              <Text style={styles.benefitDescription}>
                Earn special badges and unlock premium financial resources
              </Text>
            </View>
          </View>
          
          <View style={styles.benefitItem}>
            <View style={[
              styles.benefitIconContainer,
              { backgroundColor: `${colors.info}20` }
            ]}>
              <Users size={24} color={colors.info} />
            </View>
            
            <View style={styles.benefitContent}>
              <Text style={styles.benefitTitle}>Community Access</Text>
              <Text style={styles.benefitDescription}>
                Connect with like-minded learners and financial experts
              </Text>
            </View>
          </View>
        </View>
        
        <View style={styles.securityNote}>
          <Shield size={20} color={colors.darkGray} />
          <Text style={styles.securityNoteText}>
            Secure payments processed by Stripe. Cancel anytime.
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
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.dark,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: colors.darkGray,
    lineHeight: 22,
  },
  currentPlanContainer: {
    backgroundColor: colors.light,
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    shadowColor: colors.dark,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  currentPlanHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  currentPlanTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.dark,
  },
  currentPlanBadge: {
    backgroundColor: colors.gray,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  currentPlanBadgeText: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.darkGray,
  },
  currentPlanDescription: {
    fontSize: 14,
    color: colors.darkGray,
    lineHeight: 20,
  },
  plansContainer: {
    marginBottom: 24,
  },
  planCard: {
    marginBottom: 16,
    position: 'relative',
    overflow: 'hidden',
  },
  recommendedBadge: {
    position: 'absolute',
    top: 12,
    right: 0,
    backgroundColor: colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderTopLeftRadius: 4,
    borderBottomLeftRadius: 4,
    zIndex: 1,
  },
  recommendedText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: colors.light,
  },
  planHeader: {
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  planName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.dark,
    marginBottom: 8,
  },
  planPrice: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: 4,
  },
  planPeriod: {
    fontSize: 14,
    color: colors.darkGray,
  },
  planFeatures: {
    padding: 16,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  featureText: {
    fontSize: 14,
    color: colors.dark,
    marginLeft: 12,
  },
  disabledFeatureText: {
    color: colors.darkGray,
    textDecorationLine: 'line-through',
  },
  planButton: {
    marginHorizontal: 16,
    marginBottom: 16,
  },
  benefitsSection: {
    marginBottom: 24,
  },
  benefitsSectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.dark,
    marginBottom: 16,
  },
  benefitItem: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  benefitIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  benefitContent: {
    flex: 1,
  },
  benefitTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.dark,
    marginBottom: 4,
  },
  benefitDescription: {
    fontSize: 14,
    color: colors.darkGray,
    lineHeight: 20,
  },
  securityNote: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.light,
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
  },
  securityNoteText: {
    fontSize: 14,
    color: colors.darkGray,
    marginLeft: 12,
  },
});