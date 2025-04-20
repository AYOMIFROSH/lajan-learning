import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import colors from '@/constants/colors';
import { Lock, TrendingUp, PieChart, CreditCard, Landmark, FileText, Percent, AlertCircle, Building } from 'lucide-react-native';
import { useProgressStore } from '@/store/progress-store';
import { useRouter } from 'expo-router';

// Make a more flexible interface that can handle both Topic and Offering
interface CardItem {
  id: string;
  title: string;
  description: string;
  color?: string;
  icon?: string;
  requiredPoints?: number;
  // Optional fields that may be in either type
  image?: string;
  provider?: string;
  category?: string;
  link?: string;
  modules?: any[];
  prerequisites?: string[];
  level?: 'beginner' | 'intermediate' | 'advanced';
}

interface TopicCardProps {
  topic: CardItem;
  onPress?: (topicId: string) => void;
}

const TopicCard: React.FC<TopicCardProps> = ({ topic, onPress }) => {
  const { progress } = useProgressStore();
  const router = useRouter();
  
  // Default requiredPoints to 0 if not defined
  const totalPoints = progress?.totalPoints || 0;
  const requiredPoints = topic.requiredPoints || 0;
  const isLocked = totalPoints < requiredPoints;

  const handlePress = () => {
    if (isLocked) return;
    
    if (onPress) {
      onPress(topic.id);
    } else {
      // Navigate directly to the topic detail page
      router.push(`/topics/${topic.id}`);
    }
  };

  const getTopicIcon = () => {
    // If icon is not provided, use a default based on category or a generic one
    const iconType = topic.icon || (topic.category === 'banking' ? 'landmark' : 
                                  topic.category === 'investing' ? 'pie-chart' : 
                                  topic.category === 'credit' ? 'credit-card' : 'trending-up');
    
    switch (iconType) {
      case 'trending-up':
        return <TrendingUp size={24} color={topic.color || colors.primary} />;
      case 'pie-chart':
        return <PieChart size={24} color={topic.color || colors.primary} />;
      case 'credit-card':
        return <CreditCard size={24} color={topic.color || colors.primary} />;
      case 'landmark':
        return <Landmark size={24} color={topic.color || colors.primary} />;
      case 'file-text':
        return <FileText size={24} color={topic.color || colors.primary} />;
      case 'percent':
        return <Percent size={24} color={topic.color || colors.primary} />;
      case 'alert-circle':
        return <AlertCircle size={24} color={topic.color || colors.primary} />;
      case 'building':
        return <Building size={24} color={topic.color || colors.primary} />;
      default:
        return <TrendingUp size={24} color={topic.color || colors.primary} />;
    }
  };

  return (
    <TouchableOpacity
      style={[styles.card, { borderColor: topic.color || colors.primary }]}
      onPress={handlePress}
      disabled={isLocked}
    >
      <View style={styles.content}>
        <View style={[styles.iconContainer, { backgroundColor: `${topic.color || colors.primary}20` }]}>
          {getTopicIcon()}
        </View>
        <View style={styles.textContainer}>
          <Text style={styles.title}>{topic.title}</Text>
          <Text style={styles.description} numberOfLines={2}>
            {topic.description}
          </Text>
          {topic.provider && (
            <Text style={styles.providerText}>{topic.provider}</Text>
          )}
        </View>
      </View>
      
      {isLocked && (
        <View style={styles.lockedOverlay}>
          <Lock size={24} color={colors.light} />
          <Text style={styles.lockedText}>
            Unlock at {requiredPoints} points
          </Text>
          <Text style={styles.currentPointsText}>
            Your points: {totalPoints}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.light,
    borderRadius: 12,
    padding: 16,
    marginVertical: 8,
    borderLeftWidth: 4,
    shadowColor: colors.dark,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.dark,
    marginBottom: 4,
  },
  description: {
    fontSize: 14,
    color: colors.darkGray,
    marginBottom: 4,
  },
  providerText: {
    fontSize: 12,
    color: colors.primary,
    fontWeight: '500',
  },
  lockedOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'column',
  },
  lockedText: {
    color: colors.light,
    fontSize: 14,
    fontWeight: 'bold',
    marginTop: 8,
  },
  currentPointsText: {
    color: colors.light,
    fontSize: 12,
    opacity: 0.8,
    marginTop: 4,
  },
});

export default TopicCard;