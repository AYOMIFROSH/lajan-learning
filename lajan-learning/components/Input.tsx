import React, { useState } from 'react';
import { 
  View, 
  TextInput, 
  Text, 
  StyleSheet, 
  TextInputProps,
  TouchableOpacity,
  ViewStyle
} from 'react-native';
import colors from '@/constants/colors';
import { Eye, EyeOff } from 'lucide-react-native';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  icon?: React.ReactNode;
  containerStyle?: ViewStyle;
  wrapperStyle?: ViewStyle;
  isPassword?: boolean;
}

const Input: React.FC<InputProps> = ({
  label,
  error,
  leftIcon,
  rightIcon,
  icon,
  containerStyle,
  wrapperStyle,
  isPassword = false,
  multiline = false,
  textAlignVertical,
  numberOfLines,
  ...props
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Use icon as leftIcon if provided
  const effectiveLeftIcon = leftIcon || icon;

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const renderPasswordIcon = () => {
    if (!isPassword) return rightIcon;
    
    return (
      <TouchableOpacity onPress={togglePasswordVisibility}>
        {showPassword ? (
          <EyeOff size={20} color={colors.darkGray} />
        ) : (
          <Eye size={20} color={colors.darkGray} />
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, containerStyle]}>
      {label && <Text style={styles.label}>{label}</Text>}
      
      <View 
        style={[
          styles.inputContainer, 
          isFocused ? styles.inputContainerFocused : null,
          error ? styles.inputContainerError : null,
          multiline ? styles.multilineContainer : null,
          wrapperStyle
        ]}
      >
        {effectiveLeftIcon && <View style={[
          styles.iconContainer,
          multiline ? styles.multilineIconContainer : null
        ]}>{effectiveLeftIcon}</View>}
        
        <TextInput
          style={[
            styles.input,
            effectiveLeftIcon ? styles.inputWithLeftIcon : null,
            (rightIcon || isPassword) ? styles.inputWithRightIcon : null,
            multiline ? styles.multilineInput : null,
            props.style
          ]}
          placeholderTextColor={colors.darkGray}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          secureTextEntry={isPassword && !showPassword}
          multiline={multiline}
          numberOfLines={numberOfLines || (multiline ? 4 : 1)}
          textAlignVertical={multiline ? (textAlignVertical || 'top') : (textAlignVertical || 'center')}
          {...props}
        />
        
        {(rightIcon || isPassword) && (
          <View style={[
            styles.iconContainer,
            multiline ? styles.multilineIconContainer : null
          ]}>
            {renderPasswordIcon()}
          </View>
        )}
      </View>
      
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
    width: '100%',
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
    color: colors.dark,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    backgroundColor: colors.light,
    width: '100%',
  },
  multilineContainer: {
    minHeight: 100,
    alignItems: 'flex-start', // This is crucial for multiline inputs
  },
  multilineIconContainer: {
    paddingTop: 12, // Align icons with the top of the text in multiline mode
    alignSelf: 'flex-start',
  },
  inputContainerFocused: {
    borderColor: colors.primary,
    borderWidth: 2,
  },
  inputContainerError: {
    borderColor: colors.error,
  },
  input: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    color: colors.dark,
    width: '100%', // Ensure the input takes full width
  },
  multilineInput: {
    minHeight: 100,
    textAlignVertical: 'top',
    paddingTop: 12,
  },
  inputWithLeftIcon: {
    paddingLeft: 8,
  },
  inputWithRightIcon: {
    paddingRight: 8,
  },
  iconContainer: {
    paddingHorizontal: 12,
  },
  errorText: {
    color: colors.error,
    fontSize: 12,
    marginTop: 4,
  },
});

export default Input;