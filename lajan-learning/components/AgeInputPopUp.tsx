import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert
} from 'react-native';
import { useAuthStore } from '@/store/auth-store';
import colors from '@/constants/colors';
import Button from '@/components/Button';
import Input from '@/components/Input';
import { Calendar } from 'lucide-react-native';

interface AgeInputPopupProps {
  visible: boolean;
}

export default function AgeInputPopup({ visible }: AgeInputPopupProps) {
  const { updateUserAge, setNeedsAgeInput, isLoading, error } = useAuthStore();
  const [age, setAge] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);

  const handleSubmit = async () => {
    try {
      // Validate age
      if (!age || isNaN(Number(age)) || Number(age) <= 0 || Number(age) > 120) {
        setLocalError('Please enter a valid age between 1 and 120');
        return;
      }

      // Parse age to number
      const ageNumber = parseInt(age, 10);
      
      // Update the user's age
      await updateUserAge(ageNumber);
      
      // Close the popup
      setNeedsAgeInput(false);
      
      // Show success message
      Alert.alert(
        'Success',
        'Your age has been updated successfully.',
        [{ text: 'OK' }]
      );
    } catch (error: any) {
      console.error('Error updating age:', error);
      setLocalError(error.message || 'Failed to update age');
    }
  };

  const handleSkip = () => {
    // Close the popup without setting age
    setNeedsAgeInput(false);
    
    // Inform the user they can set their age later
    Alert.alert(
      'Age Not Set',
      'You can set your age later in your profile settings.',
      [{ text: 'OK' }]
    );
  };

  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      onRequestClose={handleSkip}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <View style={styles.overlay}>
          <View style={styles.popup}>
            <Text style={styles.title}>One More Thing!</Text>
            
            <Text style={styles.description}>
              Please enter your age to help us provide appropriate financial education content.
              {'\n\n'}
              If you're under 18, you'll have access to our guardian connection feature for parental oversight.
            </Text>

            <Input
              label="Your Age"
              placeholder="Enter your age"
              value={age}
              onChangeText={(text) => {
                // Reset error when input changes
                setLocalError(null);
                
                // Only allow numeric input
                if (/^\d*$/.test(text)) {
                  setAge(text);
                }
              }}
              keyboardType="numeric"
              leftIcon={<Calendar size={20} color={colors.darkGray} />}
            />

            {(localError || error) && (
              <Text style={styles.errorText}>{localError || error}</Text>
            )}

            <View style={styles.buttonContainer}>
              <Button
                title="Submit"
                onPress={handleSubmit}
                variant="primary"
                size="medium"
                disabled={!age || isLoading}
                isLoading={isLoading}
                style={styles.button}
              />
              
              <TouchableOpacity onPress={handleSkip} style={styles.skipButton}>
                <Text style={styles.skipText}>I'll do this later</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  popup: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    shadowColor: colors.dark,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.dark,
    marginBottom: 12,
    textAlign: 'center',
  },
  description: {
    fontSize: 16,
    color: colors.darkGray,
    marginBottom: 24,
    textAlign: 'center',
    lineHeight: 22,
  },
  errorText: {
    color: colors.error,
    marginTop: 8,
    marginBottom: 16,
    textAlign: 'center',
  },
  buttonContainer: {
    marginTop: 16,
    alignItems: 'center',
  },
  button: {
    width: '100%',
  },
  skipButton: {
    marginTop: 16,
    padding: 8,
  },
  skipText: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '600',
  },
});