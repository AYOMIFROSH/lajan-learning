// components/NetworkErrorBanner.tsx
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { AlertCircle, X } from 'lucide-react-native';
import colors from '@/constants/colors';

interface NetworkErrorBannerProps {
  message?: string;
  onDismiss: () => void;
}

const NetworkErrorBanner: React.FC<NetworkErrorBannerProps> = ({ 
  message = "Network connection issue. Using offline mode.", 
  onDismiss 
}) => {
  return (
    <View style={styles.container}>
      <View style={styles.iconContainer}>
        <AlertCircle size={20} color="#fff" />
      </View>
      <Text style={styles.message}>{message}</Text>
      <TouchableOpacity onPress={onDismiss} style={styles.dismissButton}>
        <X size={16} color="#fff" />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.error,
    padding: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 8,
    marginHorizontal: 16,
    marginBottom: 16,
  },
  iconContainer: {
    marginRight: 8,
  },
  message: {
    color: '#fff',
    flex: 1,
    fontSize: 14,
  },
  dismissButton: {
    padding: 4,
  },
});

export default NetworkErrorBanner;