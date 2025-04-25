import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Image, 
  TouchableOpacity, 
  ScrollView, 
  KeyboardAvoidingView, 
  Platform, 
  Alert 
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuthStore } from '@/store/auth-store';
import colors from '@/constants/colors';
import Button from '@/components/Button';
import Input from '@/components/Input';
import SocialLoginButton from '@/components/SocialLoginButton';
import { Mail, Lock, User, ArrowLeft, Calendar } from 'lucide-react-native';

// Firebase imports - using React Native Firebase
import { firebase, firebaseAuth, firestoreDB } from '@/firebase/config';

type AuthMode = 'login' | 'register';

export default function AuthScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { 
    login, 
    register, 
    resetPassword, 
    signInWithGoogle, 
    signInWithApple, 
    error: storeError, 
    isLoading: storeLoading, 
    isAuthenticated, 
    user 
  } = useAuthStore();

  // Local state
  const [mode, setMode] = useState<AuthMode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [socialLoading, setSocialLoading] = useState<'google' | 'apple' | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Set mounted to true when component mounts
    setMounted(true);
    
    // If email was passed via params, set it
    if (params.email) {
      setEmail(params.email as string);
    }
  }, [params]);

  // Monitor authentication state to navigate when authenticated
  useEffect(() => {
    if (!mounted) return;
    
    // If user is authenticated, redirect to main app
    if (isAuthenticated && user) {
      router.replace('/(tabs)');
    }
  }, [isAuthenticated, user, router, mounted]);

  // Update local error state when store error changes
  useEffect(() => {
    if (storeError) {
      setLocalError(storeError);
      setSocialLoading(null);
    }
  }, [storeError]);

  const toggleMode = () => {
    setMode(mode === 'login' ? 'register' : 'login');
    // Clear fields and errors when toggling
    setEmail('');
    setPassword('');
    setName('');
    setAge('');
    setLocalError(null);
  };

  const handleBack = () => {
    router.back();
  };

  const handleSubmit = async () => {
    setLocalError(null);
    setIsSubmitting(true);
    
    try {
      if (mode === 'login') {
        if (!validateEmail(email)) {
          setLocalError('Please enter a valid email address');
          setIsSubmitting(false);
          return;
        }
        
        if (password.length < 6) {
          setLocalError('Password must be at least 6 characters');
          setIsSubmitting(false);
          return;
        }
        
        // Use the login method from auth store
        await login(email, password);
        // Navigation will be handled by auth listener
        
      } else {
        // Registration flow
        if (!validateEmail(email)) {
          setLocalError('Please enter a valid email address');
          setIsSubmitting(false);
          return;
        }
        
        if (password.length < 6) {
          setLocalError('Password must be at least 6 characters');
          setIsSubmitting(false);
          return;
        }
        
        if (name.length < 2) {
          setLocalError('Please enter your full name');
          setIsSubmitting(false);
          return;
        }
        
        if (!age || isNaN(Number(age)) || Number(age) <= 0) {
          setLocalError('Please enter a valid age');
          setIsSubmitting(false);
          return;
        }
        
        // Parse age to number
        const ageNumber = parseInt(age, 10);
        const isMinor = ageNumber < 18;
        
        // Use the register method from auth store with age information
        await register(email, password, name, ageNumber, isMinor);
        
        // Navigation will be handled by auth listener
      }
    } catch (error: any) {
      console.error('Auth error:', error);
      setLocalError(error.message || 'An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      setLocalError(null);
      setSocialLoading('google');
      await signInWithGoogle();
      // Navigation will be handled by auth listener
    } catch (error: any) {
      console.error('Google login error:', error);
      setLocalError(error.message || 'Failed to login with Google');
      setSocialLoading(null);
    }
  };

  const handleAppleLogin = async () => {
    try {
      setLocalError(null);
      setSocialLoading('apple');
      await signInWithApple();
      // Navigation will be handled by auth listener
    } catch (error: any) {
      console.error('Apple login error:', error);
      setLocalError(error.message || 'Failed to login with Apple');
      setSocialLoading(null);
    }
  };

  const validateEmail = (email: string): boolean => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  };

  const isFormValid = () => {
    if (mode === 'login') {
      return email.trim() !== '' && password.trim() !== '';
    } else {
      return email.trim() !== '' && 
             password.trim() !== '' && 
             name.trim() !== '' && 
             age.trim() !== '' && 
             !isNaN(Number(age));
    }
  };

  const handleForgotPassword = () => {
    if (!email.trim()) {
      setLocalError('Please enter your email first');
      return;
    }
    
    if (!validateEmail(email)) {
      setLocalError('Please enter a valid email address');
      return;
    }
    
    // Show confirmation alert
    Alert.alert(
      'Reset Password',
      `We'll send a password reset link to ${email}. Continue?`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Send',
          onPress: async () => {
            try {
              setLocalError(null);
              setIsSubmitting(true);
              
              // Use resetPassword from auth store
              await resetPassword(email);
              
              Alert.alert('Email Sent', 'Check your email for password reset instructions');
            } catch (error: any) {
              console.error('Password reset error:', error);
              setLocalError(error.message || 'Failed to send reset email');
            } finally {
              setIsSubmitting(false);
            }
          },
        },
      ]
    );
  };

  return (
    <LinearGradient
      colors={[colors.light, colors.background, colors.gray]}
      style={styles.container}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoidingView}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <TouchableOpacity style={styles.backButton} onPress={handleBack}>
            <ArrowLeft size={24} color={colors.dark} />
          </TouchableOpacity>

          <View style={styles.content}>
            <View style={styles.logoContainer}>
              <Image
                source={require('@/assets/images/Logo.png')}
                style={styles.logo}
                resizeMode="contain"
              />
            </View>

            <Text style={styles.title}>
              {mode === 'login' ? 'Welcome Back' : 'Create Account'}
            </Text>
            <Text style={styles.subtitle}>
              {mode === 'login'
                ? 'Sign in to continue your financial journey'
                : 'Start your financial education journey today'}
            </Text>

            <View style={styles.formContainer}>
              {/* Social Login Buttons */}
              <View style={styles.socialButtonsContainer}>
                <SocialLoginButton 
                  provider="google" 
                  onPress={handleGoogleLogin}
                  isLoading={socialLoading === 'google' || storeLoading}
                  disabled={isSubmitting || (storeLoading && socialLoading !== 'google')}
                />
                
                <SocialLoginButton 
                  provider="apple" 
                  onPress={handleAppleLogin}
                  isLoading={socialLoading === 'apple' || storeLoading}
                  disabled={isSubmitting || (storeLoading && socialLoading !== 'apple')}
                />
              </View>

              {/* Divider with "or" text */}
              <View style={styles.dividerContainer}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>or</Text>
                <View style={styles.dividerLine} />
              </View>

              {/* Email & Password Fields */}
              {mode === 'register' && (
                <>
                  <Input
                    label="Full Name"
                    placeholder="Enter your name"
                    value={name}
                    onChangeText={setName}
                    leftIcon={<User size={20} color={colors.darkGray} />}
                    autoCapitalize="words"
                  />
                  
                  <Input
                    label="Age"
                    placeholder="Enter your age"
                    value={age}
                    onChangeText={(text) => {
                      // Only allow numeric input
                      if (/^\d*$/.test(text)) {
                        setAge(text);
                      }
                    }}
                    keyboardType="numeric"
                    leftIcon={<Calendar size={20} color={colors.darkGray} />}
                  />
                </>
              )}

              <Input
                label="Email"
                placeholder="Enter your email"
                value={email}
                onChangeText={setEmail}
                leftIcon={<Mail size={20} color={colors.darkGray} />}
                keyboardType="email-address"
                autoCapitalize="none"
              />

              <Input
                label="Password"
                placeholder="Enter your password"
                value={password}
                onChangeText={setPassword}
                leftIcon={<Lock size={20} color={colors.darkGray} />}
                secureTextEntry
              />

              {localError && (
                <Text style={styles.errorText}>{localError}</Text>
              )}

              <Button
                title={mode === 'login' ? 'Sign In' : 'Create Account'}
                onPress={handleSubmit}
                variant="primary"
                size="large"
                disabled={!isFormValid() || storeLoading || isSubmitting}
                isLoading={isSubmitting || (storeLoading && !socialLoading)}
                style={styles.submitButton}
              />

              {mode === 'login' && (
                <TouchableOpacity onPress={handleForgotPassword} style={styles.forgotPasswordLink}>
                  <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity onPress={toggleMode} style={styles.toggleContainer}>
                <Text style={styles.toggleText}>
                  {mode === 'login'
                    ? "Don't have an account? Sign Up"
                    : "Already have an account? Sign In"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingVertical: 24,
  },
  backButton: {
    position: 'absolute',
    top: 40,
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
    marginTop: 40,
  },
  logoContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: colors.card,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: colors.dark,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: colors.border,
  },
  logo: {
    width: 80,
    top: 5,
    left: 3,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.dark,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: colors.darkGray,
    marginBottom: 32,
    textAlign: 'center',
  },
  formContainer: {
    width: '100%',
    maxWidth: 400,
  },
  socialButtonsContainer: {
    marginBottom: 24,
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.border,
  },
  dividerText: {
    marginHorizontal: 16,
    color: colors.darkGray,
    fontSize: 14,
  },
  errorText: {
    color: colors.error,
    marginBottom: 16,
    textAlign: 'center',
  },
  submitButton: {
    marginTop: 16,
  },
  forgotPasswordLink: {
    marginTop: 16,
    alignItems: 'center',
  },
  forgotPasswordText: {
    color: colors.primary,
    fontSize: 14,
  },
  toggleContainer: {
    marginTop: 24,
    alignItems: 'center',
  },
  toggleText: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '600',
  },
});