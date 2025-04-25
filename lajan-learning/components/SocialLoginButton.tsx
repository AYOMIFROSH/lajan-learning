import React from 'react';
import { 
  TouchableOpacity, 
  Text, 
  StyleSheet, 
  ActivityIndicator,
  Platform
} from 'react-native';
import colors from '@/constants/colors';

type SocialProvider = 'google' | 'apple';

interface SocialLoginButtonProps {
  provider: SocialProvider;
  onPress: () => void;
  isLoading?: boolean;
  disabled?: boolean;
}

export default function SocialLoginButton({
  provider,
  onPress,
  isLoading = false,
  disabled = false
}: SocialLoginButtonProps) {
  // Only show Apple button on iOS devices
  if (provider === 'apple' && Platform.OS !== 'ios') {
    return null;
  }

  return (
    <TouchableOpacity
      style={[
        styles.button,
        provider === 'google' ? styles.googleButton : styles.appleButton,
        disabled && styles.disabledButton
      ]}
      onPress={onPress}
      disabled={disabled || isLoading}
    >
      {isLoading ? (
        <ActivityIndicator size="small" color={provider === 'google' ? colors.primary : colors.light} />
      ) : (
        <Text
          style={[
            styles.buttonText,
            provider === 'google' ? styles.googleText : styles.appleText
          ]}
        >
          {provider === 'google' 
            ? 'Continue with Google' 
            : 'Continue with Apple'}
        </Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    marginBottom: 12,
    width: '100%',
    shadowColor: colors.dark,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  googleButton: {
    backgroundColor: colors.light,
    borderWidth: 1,
    borderColor: colors.border,
  },
  appleButton: {
    backgroundColor: colors.dark,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  googleText: {
    color: colors.darkGray,
  },
  appleText: {
    color: colors.light,
  },
  disabledButton: {
    opacity: 0.6,
  },
});