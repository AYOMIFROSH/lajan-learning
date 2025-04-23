import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuthStore } from '@/store/auth-store';
import colors from '@/constants/colors';
import Button from '@/components/Button';

export default function LandingScreen() {
  const router = useRouter();
  const { isAuthenticated, user, autoLoginAttempted, isOnboardingComplete, initializeAuthListener } = useAuthStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Set up Firebase auth listener when the component mounts
    const unsubscribe = initializeAuthListener();
    setMounted(true);
    
    // Clean up the auth listener when component unmounts
    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, []);

  useEffect(() => {
    if (!mounted || !autoLoginAttempted) return;

    const getNextOnboardingStep = () => {
      if (!user?.learningStyle) {
        return '/onboarding'; // First onboarding step
      }
      if (!user?.preferredTopics || user.preferredTopics.length === 0) {
        return '/onboarding/topics'; // Second onboarding step
      }
      if (user?.knowledgeLevel === undefined) {
        return '/onboarding/knowledge-assessment'; // Third onboarding step
      }
      return '/(tabs)'; // Main app if onboarding is complete
    };

    const checkAuthAndNavigate = () => {
      // Small timeout to ensure state is fully updated
      const timer = setTimeout(() => {
        if (isAuthenticated && user?.verified) {
          const nextStep = getNextOnboardingStep();
          if (nextStep === '/(tabs)') {
            console.log("User is authenticated, verified, and onboarding is complete. Navigating to tabs");
            router.replace(nextStep);
          } else {
            console.log(`User is authenticated and verified, navigating to ${nextStep}`);
            router.replace(nextStep);
          }
        } else if (user && !user.verified) {
          console.log("User exists but is not verified, navigating to verification");
          router.replace({
            pathname: '/verification',
            params: { email: user.email }
          });
        } else {
          console.log("User is not authenticated, staying on landing page");
        }
      }, 100);

      return () => clearTimeout(timer);
    };

    checkAuthAndNavigate();
  }, [isAuthenticated, user, router, mounted, autoLoginAttempted, isOnboardingComplete]);

  const handleGetStarted = () => {
    router.push('/auth');
  };

  if (!autoLoginAttempted) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return (
    <LinearGradient
      colors={[colors.light, colors.background, colors.gray]}
      style={styles.container}
    >
      <View style={styles.content}>
        <View style={styles.logoContainer}>
          <Image
            source={require('@/assets/images/Logo.png')}
            style={styles.logo}
            resizeMode="contain"
          />
        </View>

        <Text style={styles.title}>Financial Education for All</Text>
        <Text style={styles.subtitle}>
          Learn how to manage your money, invest wisely, and secure your financial future
        </Text>

        <View style={styles.actionButtons}>
          <Button
            title="Get Started"
            onPress={handleGetStarted}
            variant="primary"
            size="large"
            style={styles.getStartedButton}
          />
        </View>

        {/* Feature highlights */}
        <View style={styles.features}>
          <FeatureItem icon="📚" title="Learn Financial Basics" />
          <FeatureItem icon="💡" title="Get Investment Tips" />
          <FeatureItem icon="📈" title="Track Your Progress" />
        </View>
      </View>
    </LinearGradient>
  );
}

function FeatureItem({ icon, title }: { icon: string; title: string }) {
  return (
    <View style={styles.featureItem}>
      <Text style={styles.featureIcon}>{icon}</Text>
      <Text style={styles.featureTitle}>{title}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  loadingText: {
    fontSize: 18,
    color: colors.darkGray,
    marginTop: 16,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  logoContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: colors.card,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 32,
    shadowColor: colors.dark,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: colors.border,
  },
  logo: {
    top: 5,
    width: 90,
    left: 3
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: colors.dark,
    marginBottom: 16,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: colors.darkGray,
    marginBottom: 32,
    textAlign: 'center',
    maxWidth: '80%',
  },
  actionButtons: {
    width: '100%',
    maxWidth: 400,
    marginBottom: 48,
  },
  getStartedButton: {
    marginBottom: 16,
  },
  features: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    maxWidth: 400,
  },
  featureItem: {
    alignItems: 'center',
    margin: 16,
    width: 80,
  },
  featureIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  featureTitle: {
    fontSize: 14,
    color: colors.dark,
    textAlign: 'center',
  },
});