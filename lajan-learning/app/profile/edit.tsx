import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Alert,
  Image
} from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { useAuthStore } from '@/store/auth-store';
import colors from '@/constants/colors';
import Button from '@/components/Button';
import Input from '@/components/Input';
import { User, Mail, Camera, ArrowLeft, Check } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { firebase, firestoreDB } from '@/firebase/config';
import { createNotification } from '@/services/notifictaion-service';

export default function EditProfileScreen() {
  const router = useRouter();
  const { user, updateUser, uploadAvatar } = useAuthStore();

  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  // Initialize bio with empty string if null or undefined to ensure it's always a string
  const [bio, setBio] = useState(user?.bio || '');
  const [learningStyle, setLearningStyle] = useState(user?.learningStyle);
  const [isLoading, setIsLoading] = useState(false);
  const [avatarLoading, setAvatarLoading] = useState(false);

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Name cannot be empty');
      return;
    }

    setIsLoading(true);

    try {
      console.log({ name, bio, learningStyle });

      // Include all updated fields in a single call
      const sanitizedName = name.trim();
      // Allow empty bio to be saved as an empty string, not as undefined
      const sanitizedBio = bio || '';

      // Check if learning style has changed
      const isLearningStyleChanged = user?.learningStyle !== learningStyle;

      await updateUser({
        name: sanitizedName,
        bio: sanitizedBio,
        learningStyle,
      });

      // Create notification for first-time learning style selection
      if (user?.id && isLearningStyleChanged) {
        try {
          // Only create notification if learning style was previously not set or has changed
          if (!user.learningStyle || isLearningStyleChanged) {
            await createNotification(
              user.id,
              "Learning Style Updated",
              `Your learning style is now set to ${learningStyle === 'visual' ? 'Visual' : 'Practical'} Learner. Content will be tailored to your preferences.`,
              'achievement'
            );
          }
        } catch (notifError) {
          console.error('Error creating notification:', notifError);
          // Non-critical error, don't show alert to user
        }
      }

      Alert.alert('Success', 'Profile updated successfully', [
        { text: 'OK', onPress: () => router.back() }
      ]);
    } catch (error) {
      console.error('Error updating profile:', error);
      Alert.alert('Error', 'Failed to update profile. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChangeAvatar = async () => {
    try {
      // Request permission to access the photo library
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'We need permission to access your photos to change your profile picture.');
        return;
      }

      // Launch the image picker
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const selectedAsset = result.assets[0];

        // Create a form data object to send the image
        const formData = new FormData();

        // Get the file name and extension
        const uriParts = selectedAsset.uri.split('.');
        const fileType = uriParts[uriParts.length - 1];

        // Append the image to the form data
        formData.append('avatar', {
          uri: selectedAsset.uri,
          name: `avatar.${fileType}`,
          type: `image/${fileType}`,
        } as any);

        setAvatarLoading(true);

        try {
          // Call the uploadAvatar function from the auth store
          await uploadAvatar(formData);
          
          // Create notification for avatar update
          if (user?.id) {
            try {
              await createNotification(
                user.id,
                "Profile Picture Updated",
                "You've successfully updated your profile picture!",
                'achievement'
              );
            } catch (notifError) {
              console.error('Error creating avatar notification:', notifError);
              // Non-critical error, don't show alert to user
            }
          }
          
          Alert.alert('Success', 'Profile picture updated successfully');
        } catch (error) {
          console.error('Error uploading avatar:', error);
          Alert.alert('Error', 'Failed to upload profile picture. Please try again.');
        } finally {
          setAvatarLoading(false);
        }
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'An error occurred while selecting the image.');
    }
  };

  // Helper function to determine if the learning style has been selected
  const isLearningStyleSelected = learningStyle === 'visual' || learningStyle === 'practical';

  return (
    <SafeAreaView style={styles.safeArea}>
      <Stack.Screen
        options={{
          title: 'Edit Profile',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
          headerRight: () => (
            <TouchableOpacity onPress={handleSave} disabled={isLoading}>
              <Check size={24} color={isLoading ? colors.darkGray : colors.primary} />
            </TouchableOpacity>
          ),
        }}
      />

      <ScrollView style={styles.container}>
        <View style={styles.avatarSection}>
          <View style={styles.avatarContainer}>
            {avatarLoading ? (
              <View style={[styles.avatar, styles.avatarLoading]}>
                <Text style={styles.loadingText}>Uploading...</Text>
              </View>
            ) : (
              <Image
                source={{
                  uri: user?.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60'
                }}
                style={styles.avatar}
              />
            )}
            <TouchableOpacity
              style={styles.changeAvatarButton}
              onPress={handleChangeAvatar}
              disabled={avatarLoading}
            >
              <Camera size={20} color={colors.light} />
            </TouchableOpacity>
          </View>
          <Text style={styles.changePhotoText}>Tap to change photo</Text>
        </View>

        <View style={styles.form}>
          <Input
            label="Name"
            placeholder="Your name"
            value={name}
            onChangeText={setName}
            leftIcon={<User size={20} color={colors.darkGray} />}
          />

          <Input
            label="Email"
            placeholder="Your email"
            value={email}
            onChangeText={setEmail}
            leftIcon={<Mail size={20} color={colors.darkGray} />}
            editable={false}
            containerStyle={styles.disabledInput}
          />

          <Input
            label="Bio"
            placeholder="Tell us about yourself"
            value={bio}
            onChangeText={setBio}
            multiline={true}
            numberOfLines={4}
            textAlignVertical="top"
            style={styles.bioInput}
            containerStyle={styles.bioInputContainer}
            wrapperStyle={styles.bioInputWrapper}
          />

          <View style={styles.learningStyleSection}>
            <Text style={styles.sectionTitle}>Learning Style</Text>
            <Text style={styles.sectionDescription}>
              Your preferred way of learning financial concepts
            </Text>

            <View style={styles.learningStyleOptions}>
              <TouchableOpacity
                style={[
                  styles.learningStyleOption,
                  learningStyle === 'visual' && styles.selectedLearningStyle
                ]}
                onPress={() => setLearningStyle('visual')}
              >
                <Text style={[
                  styles.learningStyleText,
                  learningStyle === 'visual' && styles.selectedLearningStyleText
                ]}>
                  Visual Learner
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.learningStyleOption,
                  learningStyle === 'practical' && styles.selectedLearningStyle
                ]}
                onPress={() => setLearningStyle('practical')}
              >
                <Text style={[
                  styles.learningStyleText,
                  learningStyle === 'practical' && styles.selectedLearningStyleText
                ]}>
                  Practical Learner
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <Button
            title="Save Changes"
            onPress={handleSave}
            variant="primary"
            isLoading={isLoading}
            style={styles.saveButton}
          />
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
  avatarSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 8,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  avatarLoading: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.gray,
  },
  loadingText: {
    fontSize: 12,
    color: colors.darkGray,
  },
  changeAvatarButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.light,
  },
  changePhotoText: {
    fontSize: 14,
    color: colors.primary,
  },
  form: {
    width: '100%',
  },
  disabledInput: {
    opacity: 0.7,
  },
  bioInputContainer: {
    width: '100%',
    marginBottom: 16,
  },
  bioInputWrapper: {
    flex: 1,
    width: '100%',
  },
  bioInput: {
    flex: 1,
    height: 100,
    paddingTop: 12,
    textAlignVertical: 'top',
    width: '100%',
  },
  learningStyleSection: {
    marginTop: 16,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.dark,
    marginBottom: 8,
  },
  sectionDescription: {
    fontSize: 14,
    color: colors.darkGray,
    marginBottom: 16,
  },
  learningStyleOptions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  learningStyleOption: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    marginHorizontal: 4,
    alignItems: 'center',
  },
  selectedLearningStyle: {
    borderColor: colors.primary,
    backgroundColor: `${colors.primary}10`,
  },
  learningStyleText: {
    fontSize: 14,
    color: colors.darkGray,
  },
  selectedLearningStyleText: {
    color: colors.primary,
    fontWeight: 'bold',
  },
  saveButton: {
    marginTop: 16,
  },
});