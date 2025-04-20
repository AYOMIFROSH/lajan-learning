import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Notification } from '@/types/content';
import colors from '@/constants/colors';
import { Bell, Users, Award, DollarSign, UserRound } from 'lucide-react-native';

interface NotificationItemProps {
  notification: Notification;
  onPress: (notification: Notification) => void;
}

const NotificationItem: React.FC<NotificationItemProps> = ({ 
  notification, 
  onPress 
}) => {
  const getNotificationIcon = () => {
    switch (notification.type) {
      case 'lesson':
        return <Bell size={20} color={colors.primary} />;
      case 'friend':
        return <Users size={20} color={colors.info} />;
      case 'achievement':
        return <Award size={20} color={colors.secondary} />;
      case 'offering':
        return <DollarSign size={20} color={colors.success} />;
      case 'guardian':
        return <UserRound size={20} color={colors.warning} />;
      default:
        return <Bell size={20} color={colors.primary} />;
    }
  };

  return (
    <TouchableOpacity 
      style={[
        styles.container,
        !notification.read && styles.unread
      ]} 
      onPress={() => onPress(notification)}
    >
      <View style={styles.iconContainer}>
        {getNotificationIcon()}
      </View>
      
      <View style={styles.content}>
        <Text style={styles.title}>{notification.title}</Text>
        <Text style={styles.message} numberOfLines={2}>
          {notification.message}
        </Text>
        <Text style={styles.time}>
          {new Date(notification.createdAt).toLocaleDateString()}
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
  unread: {
    backgroundColor: `${colors.primary}10`,
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