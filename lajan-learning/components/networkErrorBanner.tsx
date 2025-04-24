import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Animated, TouchableOpacity } from 'react-native';
import colors from '@/constants/colors';
import { WifiOff, X } from 'lucide-react-native';

interface NetworkErrorBannerProps {
  message: string;
  visible: boolean;
  onDismiss?: () => void;
  autoDismiss?: boolean;
  autoDismissTime?: number;
}

const NetworkErrorBanner: React.FC<NetworkErrorBannerProps> = ({ 
  message, 
  visible, 
  onDismiss,
  autoDismiss = true,
  autoDismissTime = 5000
}) => {
  const [animation] = useState(new Animated.Value(0));
  
  useEffect(() => {
    if (visible) {
      // Animate banner in
      Animated.timing(animation, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
      
      // Set auto-dismiss timer if enabled
      if (autoDismiss && onDismiss) {
        const timer = setTimeout(() => {
          handleDismiss();
        }, autoDismissTime);
        
        return () => clearTimeout(timer);
      }
    } else {
      // Animate banner out
      Animated.timing(animation, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [visible]);
  
  const handleDismiss = () => {
    Animated.timing(animation, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      if (onDismiss) onDismiss();
    });
  };
  
  if (!visible) return null;
  
  return (
    <Animated.View 
      style={[
        styles.container,
        {
          transform: [
            {
              translateY: animation.interpolate({
                inputRange: [0, 1],
                outputRange: [-100, 0],
              }),
            },
          ],
          opacity: animation,
        },
      ]}
    >
      <View style={styles.iconContainer}>
        <WifiOff size={18} color="#fff" />
      </View>
      <Text style={styles.message}>{message}</Text>
      {onDismiss && (
        <TouchableOpacity style={styles.closeButton} onPress={handleDismiss}>
          <X size={16} color="#fff" />
        </TouchableOpacity>
      )}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.error,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: colors.dark,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
    zIndex: 1000,
  },
  iconContainer: {
    marginRight: 8,
  },
  message: {
    flex: 1,
    fontSize: 14,
    color: '#fff',
    fontWeight: '500',
  },
  closeButton: {
    padding: 4,
  },
});

export default NetworkErrorBanner;