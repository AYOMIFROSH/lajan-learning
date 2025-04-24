// app/verification.tsx
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import colors from '@/constants/colors';
import Button from '@/components/Button';
import { Mail, ArrowLeft } from 'lucide-react-native';
import { useAuthStore } from '@/store/auth-store';

// Use the Firebase Auth instance from our config
import { firebaseAuth } from '@/firebase/config';

export default function VerificationScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { user, isAuthenticated } = useAuthStore();
  const [email, setEmail] = useState('');
  const [resendDisabled, setResendDisabled] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [isResending, setIsResending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (params.email) setEmail(params.email as string);
    else if (user?.email) setEmail(user.email);
  }, [params, user]);

  useEffect(() => {
    if (isAuthenticated && user?.verified) router.replace('/(tabs)');
  }, [isAuthenticated, user, router]);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else if (countdown === 0 && resendDisabled) {
      setResendDisabled(false);
    }
  }, [countdown, resendDisabled]);

  const handleBack = () => router.replace('/auth');

  const handleResendVerification = async () => {
    if (resendDisabled) return;
    setIsResending(true);
    setError(null);
    try {
      if (!firebaseAuth.currentUser) {
        Alert.prompt(
          'Enter Password',
          'Please enter your password to resend verification email',
          [
            { text: 'Cancel', onPress: () => setIsResending(false), style: 'cancel' },
            {
              text: 'Submit',
              onPress: async (password) => {
                if (!password) {
                  setError('Password is required');
                  setIsResending(false);
                  return;
                }
                try {
                  const userCredential = await firebaseAuth.signInWithEmailAndPassword(email, password);
                  await userCredential.user.sendEmailVerification();
                  Alert.alert('Verification Email Sent', 'Please check your email and click the verification link.');
                  setResendDisabled(true);
                  setCountdown(60);
                } catch (err: any) {
                  console.error('Error sending verification:', err);
                  let errorMessage = 'Failed to send verification email';
                  if (err.code === 'auth/invalid-credential') errorMessage = 'Incorrect password';
                  else if (err.code === 'auth/too-many-requests') errorMessage = 'Too many attempts. Please try again later.';
                  setError(errorMessage);
                } finally {
                  setIsResending(false);
                }
              }
            }
          ],
          'secure-text'
        );
      } else {
        await firebaseAuth.currentUser.sendEmailVerification();
        Alert.alert('Verification Email Sent', 'Please check your email and click the verification link.');
        setResendDisabled(true);
        setCountdown(60);
      }
    } catch (err: any) {
      console.error('Error in resend flow:', err);
      setError('Failed to resend verification email. Please try again later.');
    } finally {
      setIsResending(false);
    }
  };

  const handleCheckVerification = async () => {
    try {
      if (firebaseAuth.currentUser) {
        const currentEmail = firebaseAuth.currentUser.email;
        await firebaseAuth.signOut();
        if (currentEmail) {
          Alert.prompt(
            'Confirm Verification',
            'Please enter your password to check verification status',
            [
              { text: 'Cancel', onPress: () => {}, style: 'cancel' },
              {
                text: 'Submit',
                onPress: async (password) => {
                  if (!password) {
                    setError('Password is required');
                    return;
                  }
                  try {
                    const userCredential = await firebaseAuth.signInWithEmailAndPassword(currentEmail, password);
                    if (userCredential.user.emailVerified) {
                      Alert.alert('Success!', 'Your email has been verified. You can now log in.', [
                        { text: 'OK', onPress: () => router.replace('/(tabs)') }
                      ]);
                    } else {
                      Alert.alert('Not Verified', 'Your email has not been verified yet. Please check your inbox and click the verification link.');
                    }
                  } catch (err: any) {
                    console.error('Error checking verification:', err);
                    let errorMessage = 'Failed to check verification status';
                    if (err.code === 'auth/invalid-credential') errorMessage = 'Incorrect password';
                    setError(errorMessage);
                  }
                }
              }
            ],
            'secure-text'
          );
        }
      } else {
        Alert.alert('Sign In Required', 'Please sign in to check your verification status', [
          { text: 'OK', onPress: () => router.replace('/auth') }
        ]);
      }
    } catch (err) {
      console.error('Error in verification check:', err);
      setError('Failed to check verification status. Please try again.');
    }
  };

  const handleChangeEmail = () => router.replace('/auth');

  return (
    <LinearGradient colors={[colors.light, colors.background, colors.gray]} style={styles.container}>
      <TouchableOpacity style={styles.backButton} onPress={handleBack}>
        <ArrowLeft size={24} color={colors.dark} />
      </TouchableOpacity>
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <Mail size={70} color={colors.primary} />
        </View>
        <Text style={styles.title}>Verify Your Email</Text>
        <Text style={styles.emailText}>We've sent a verification link to:</Text>
        <Text style={styles.emailHighlight}>{email}</Text>
        <Text style={styles.description}>Please check your inbox and click the verification link to activate your account. If you don't see the email, check your spam folder.</Text>
        {error && <Text style={styles.errorText}>{error}</Text>}
        <Button title="I've Verified My Email" onPress={handleCheckVerification} variant="primary" size="large" style={styles.verifyButton} />
        <TouchableOpacity onPress={handleResendVerification} disabled={resendDisabled || isResending} style={styles.resendLink}>
          <Text style={[styles.resendText, (resendDisabled || isResending) && styles.disabledText]}>{isResending ? 'Sending...' : resendDisabled ? `Resend in ${countdown}s` : 'Resend Verification Email'}</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={handleChangeEmail} style={styles.changeEmailLink}>
          <Text style={styles.changeEmailText}>Change Email Address</Text>
        </TouchableOpacity>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backButton: {
    position: 'absolute',
    top: 60,
    left: 20,
    zIndex: 10,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.card,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: colors.dark,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: colors.border,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: colors.background,
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
    marginBottom: 24,
    textAlign: 'center',
  },
  emailText: {
    fontSize: 16,
    color: colors.darkGray,
    marginBottom: 8,
    textAlign: 'center',
  },
  emailHighlight: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: 24,
    textAlign: 'center',
  },
  description: {
    fontSize: 16,
    color: colors.darkGray,
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
  },
  verifyButton: {
    marginBottom: 16,
    width: '100%',
    maxWidth: 400,
  },
  resendLink: {
    marginBottom: 16,
    padding: 8,
  },
  resendText: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: '600',
  },
  disabledText: {
    color: colors.darkGray,
    opacity: 0.7,
  },
  changeEmailLink: {
    padding: 8,
  },
  changeEmailText: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: '600',
  },
  errorText: {
    color: colors.error,
    marginBottom: 16,
    textAlign: 'center',
  },
});