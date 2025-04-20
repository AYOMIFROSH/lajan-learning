import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Image, SafeAreaView, TouchableOpacity, Alert } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import colors from '@/constants/colors';
import Button from '@/components/Button';
import { Mail, ArrowLeft, RefreshCw } from 'lucide-react-native';
import useResendVerification from '@/Hooks/useResendVerification';

export default function VerificationScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [email, setEmail] = useState<string>('');
  const { resendVerificationEmail, isLoading, error, isResent } = useResendVerification();
  const [countdown, setCountdown] = useState(0);

  // Get email from navigation params
  useEffect(() => {
    if (params.email) {
      setEmail(params.email as string);
    }
  }, [params]);

  // Handle countdown for resend button
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const handleBackToLogin = () => {
    router.push('/auth');
  };

  const handleResendVerification = async () => {
    if (countdown > 0) return;
    
    if (!email) {
      Alert.alert('Error', 'Email address is missing. Please go back to the login screen.');
      return;
    }
    
    const success = await resendVerificationEmail(email);
    if (success) {
      Alert.alert('Success', 'Verification email has been resent. Please check your inbox.');
      setCountdown(60); // Start 60 second countdown
    } else if (error) {
      Alert.alert('Error', error);
    }
  };

  return (
    <LinearGradient
      colors={[colors.light, colors.background, colors.gray]}
      style={styles.container}
    >
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.content}>
          <View style={styles.iconContainer}>
            <Mail size={80} color={colors.primary} />
          </View>
          
          <Text style={styles.title}>Verify Your Email</Text>
          <Text style={styles.description}>
            We've sent a verification link to your email address. Please check your inbox and click the link to verify your account.
          </Text>
          
          <View style={styles.infoBox}>
            <Text style={styles.infoText}>
              The verification link will expire in 6 hours. If you don't see the email, please check your spam folder.
            </Text>
          </View>
          
          <TouchableOpacity 
            style={styles.resendContainer} 
            onPress={handleResendVerification}
            disabled={countdown > 0 || isLoading}
          >
            <RefreshCw 
              size={16} 
              color={countdown > 0 ? colors.darkGray : colors.primary} 
              style={isLoading ? styles.spinIcon : {}}
            />
            <Text style={[
              styles.resendText, 
              countdown > 0 ? styles.disabledText : {}
            ]}>
              {countdown > 0 
                ? `Resend Email (${countdown}s)` 
                : 'Resend Verification Email'}
            </Text>
          </TouchableOpacity>
          
          <View style={styles.buttonContainer}>
            <Button
              title="Back to Login"
              onPress={handleBackToLogin}
              variant="primary"
              icon={<ArrowLeft size={18} color={colors.light} />}
              iconPosition="left"
              fullWidth
            />
          </View>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  iconContainer: {
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: `${colors.primary}20`,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 32,
    shadowColor: colors.dark,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.dark,
    marginBottom: 16,
    textAlign: 'center',
  },
  description: {
    fontSize: 16,
    color: colors.darkGray,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 24,
    maxWidth: '85%',
  },
  infoBox: {
    backgroundColor: `${colors.primary}10`,
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
  },
  infoText: {
    fontSize: 14,
    color: colors.darkGray,
    lineHeight: 20,
  },
  resendContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 32,
    padding: 10,
  },
  resendText: {
    color: colors.primary,
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '500',
  },
  disabledText: {
    color: colors.darkGray,
  },
  spinIcon: {
    transform: [{ rotate: '45deg' }],
  },
  buttonContainer: {
    width: '100%',
    maxWidth: 300,
  },
});