import React from 'react';
import { 
  TouchableOpacity, 
  Text, 
  StyleSheet, 
  ActivityIndicator,
  ViewStyle,
  TextStyle,
  TouchableOpacityProps
} from 'react-native';
import colors from '@/constants/colors';
import { LinearGradient } from 'expo-linear-gradient';

interface ButtonProps extends TouchableOpacityProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'text';
  size?: 'small' | 'medium' | 'large';
  isLoading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  fullWidth?: boolean;
}

const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'medium',
  isLoading = false,
  disabled = false,
  style,
  textStyle,
  icon,
  iconPosition = 'left',
  fullWidth = false,
  ...props
}) => {
  const getButtonStyle = (): ViewStyle => {
    let buttonStyle: ViewStyle = {};
    
    // Size styles
    switch (size) {
      case 'small':
        buttonStyle = { ...buttonStyle, ...styles.buttonSmall };
        break;
      case 'large':
        buttonStyle = { ...buttonStyle, ...styles.buttonLarge };
        break;
      default:
        buttonStyle = { ...buttonStyle, ...styles.buttonMedium };
    }
    
    // Variant styles (for outline and text variants)
    switch (variant) {
      case 'outline':
        buttonStyle = {
          ...buttonStyle,
          ...styles.buttonOutline,
          borderColor: disabled ? colors.darkGray : colors.primary,
        };
        break;
      case 'text':
        buttonStyle = {
          ...buttonStyle,
          ...styles.buttonText,
        };
        break;
    }
    
    // Full width
    if (fullWidth) {
      buttonStyle = { ...buttonStyle, ...styles.fullWidth };
    }
    
    // Disabled state
    if (disabled) {
      buttonStyle = { ...buttonStyle, opacity: 0.6 };
    }
    
    return buttonStyle;
  };
  
  const getTextStyle = (): TextStyle => {
    let textStyleObj: TextStyle = { ...styles.buttonLabel };
    
    // Size-specific text styles
    switch (size) {
      case 'small':
        textStyleObj = { ...textStyleObj, ...styles.buttonLabelSmall };
        break;
      case 'large':
        textStyleObj = { ...textStyleObj, ...styles.buttonLabelLarge };
        break;
    }
    
    // Variant-specific text styles
    switch (variant) {
      case 'primary':
        textStyleObj = { ...textStyleObj, color: colors.light };
        break;
      case 'secondary':
        textStyleObj = { ...textStyleObj, color: colors.dark };
        break;
      case 'outline':
        textStyleObj = { ...textStyleObj, color: disabled ? colors.darkGray : colors.primary };
        break;
      case 'text':
        textStyleObj = { ...textStyleObj, color: disabled ? colors.darkGray : colors.primary };
        break;
    }
    
    return textStyleObj;
  };
  
  const renderContent = () => {
    if (isLoading) {
      return (
        <ActivityIndicator 
          size="small" 
          color={variant === 'primary' ? colors.light : colors.primary} 
        />
      );
    }
    
    const textComponent = (
      <Text style={[getTextStyle(), textStyle]}>
        {title}
      </Text>
    );
    
    if (!icon) return textComponent;
    
    return (
      <>
        {iconPosition === 'left' && icon}
        {textComponent}
        {iconPosition === 'right' && icon}
      </>
    );
  };
  
  // For primary and secondary variants, use LinearGradient
  if (variant === 'primary' || variant === 'secondary') {
    // Fix: Explicitly define the gradient colors as a tuple with at least two strings
    const gradientColors: [string, string] = variant === 'primary' 
      ? [colors.primary, colors.tertiary] 
      : [colors.secondary, colors.primary];
    
    return (
      <TouchableOpacity
        onPress={onPress}
        disabled={disabled || isLoading}
        style={[getButtonStyle(), style]}
        activeOpacity={0.8}
        {...props}
      >
        <LinearGradient
          colors={gradientColors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.gradient}
        >
          {renderContent()}
        </LinearGradient>
      </TouchableOpacity>
    );
  }
  
  // For outline and text variants
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || isLoading}
      style={[getButtonStyle(), style]}
      activeOpacity={0.8}
      {...props}
    >
      {renderContent()}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  buttonSmall: {
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 16,
    minWidth: 80,
  },
  buttonMedium: {
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 24,
    minWidth: 120,
  },
  buttonLarge: {
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 32,
    minWidth: 160,
  },
  buttonOutline: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: colors.primary,
  },
  buttonText: {
    backgroundColor: 'transparent',
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  buttonLabel: {
    fontWeight: '600',
    textAlign: 'center',
  },
  buttonLabelSmall: {
    fontSize: 14,
  },
  buttonLabelLarge: {
    fontSize: 18,
  },
  fullWidth: {
    width: '100%',
  },
  gradient: {
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
});

export default Button;