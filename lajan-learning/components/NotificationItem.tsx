import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Notification } from '@/types/content';
import colors from '@/constants/colors';
import { Bell, Users, Award, DollarSign, UserRound, Check, BookOpen, Star, Zap, Flame } from 'lucide-react-native';
import { formatDistanceToNow } from 'date-fns';

interface NotificationItemProps {
  notification: Notification;
  onPress: (notification: Notification) => void;
}

const NotificationItem: React.FC<NotificationItemProps> = ({ 
  notification, 
  onPress 
}) => {
  const getNotificationIcon = () => {
    // Determine icon based on notification type and title
    if (notification.type === 'lesson') {
      if (notification.title.includes('Module Completed')) {
        return <Check size={20} color={colors.success} />;
      } else if (notification.title.includes('New')) {
        return <Bell size={20} color={colors.info} />;
      } else {
        return <BookOpen size={20} color={colors.primary} />;
      }
    } else if (notification.type === 'friend') {
      return <Users size={20} color={colors.info} />;
    } else if (notification.type === 'achievement') {
      if (notification.title.includes('Streak')) {
        return <Flame size={20} color="#FF9800" />;
      } else if (notification.title.includes('Points')) {
        return <Star size={20} color="#FFC107" />;
      } else if (notification.title.includes('Topic Completed')) {
        return <Zap size={20} color={colors.success} />;
      } else {
        return <Award size={20} color={colors.secondary} />;
      }
    } else if (notification.type === 'offering') {
      return <DollarSign size={20} color={colors.success} />;
    } else if (notification.type === 'guardian') {
      return <UserRound size={20} color={colors.warning} />;
    } else {
      return <Bell size={20} color={colors.primary} />;
    }
  };

  // Format the timestamp
  const getFormattedTime = (timestamp: string) => {
    try {
      // Using date-fns to format the relative time
      return formatDistanceToNow(new Date(timestamp), { addSuffix: true });
    } catch (error) {
      // Fallback to basic formatting if there's an error
      return new Date(timestamp).toLocaleDateString();
    }
  };

  // Determine background color based on notification type
  const getNotificationBackgroundColor = () => {
    if (notification.read) {
      return colors.light;
    }
    
    if (notification.type === 'lesson') {
      return `${colors.primary}10`;
    } else if (notification.type === 'achievement') {
      return `${colors.secondary}10`;
    } else if (notification.type === 'friend') {
      return `${colors.info}10`;
    } else if (notification.type === 'offering') {
      return `${colors.success}10`;
    } else if (notification.type === 'guardian') {
      return `${colors.warning}10`;
    } else {
      return `${colors.primary}10`;
    }
  };

  // Get icon container background color based on notification type
  const getIconContainerColor = () => {
    if (notification.type === 'lesson') {
      return `${colors.primary}20`;
    } else if (notification.type === 'achievement') {
      return `${colors.secondary}20`;
    } else if (notification.type === 'friend') {
      return `${colors.info}20`;
    } else if (notification.type === 'offering') {
      return `${colors.success}20`;
    } else if (notification.type === 'guardian') {
      return `${colors.warning}20`;
    } else {
      return colors.gray;
    }
  };

  return (
    <TouchableOpacity 
      style={[
        styles.container,
        { backgroundColor: getNotificationBackgroundColor() }
      ]} 
      onPress={() => onPress(notification)}
      activeOpacity={0.7}
    >
      <View 
        style={[
          styles.iconContainer,
          { backgroundColor: getIconContainerColor() }
        ]}
      >
        {getNotificationIcon()}
      </View>
      
      <View style={styles.content}>
        <Text style={styles.title}>{notification.title}</Text>
        <Text style={styles.message} numberOfLines={2}>
          {notification.message}
        </Text>
        <Text style={styles.time}>
          {getFormattedTime(notification.createdAt)}
        </Text>
      </View>
      
      {!notification.read && <View style={styles.unreadDot} />}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: colors.light,
    borderRadius: 12,
    marginVertical: 8,
    shadowColor: colors.dark,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.gray,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  content: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.dark,
    marginBottom: 4,
  },
  message: {
    fontSize: 14,
    color: colors.darkGray,
    marginBottom: 8,
    lineHeight: 20,
  },
  time: {
    fontSize: 12,
    color: colors.darkGray,
  },
  unreadDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.primary,
    alignSelf: 'flex-start',
    marginTop: 5,
  },
});

export default NotificationItem;