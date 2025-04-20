import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Offering } from '@/types/content';
import colors from '@/constants/colors';
import { ExternalLink, Lock } from 'lucide-react-native';
import { useProgressStore } from '@/store/progress-store';

interface OfferingCardProps {
  offering: Offering;
  onPress: (offering: Offering) => void;
}

const OfferingCard: React.FC<OfferingCardProps> = ({ offering, onPress }) => {
  const { progress } = useProgressStore();
  const isLocked = (progress?.totalPoints ?? 0) < offering.requiredPoints;
  
  return (
    <TouchableOpacity
      style={styles.card}
      onPress={() => onPress(offering)}
      disabled={isLocked}
    >
      <Image
        source={{ uri: offering.image }}
        style={styles.image}
        resizeMode="cover"
      />
      
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.provider}>{offering.provider}</Text>
          <View style={[
            styles.categoryBadge, 
            { 
              backgroundColor: 
                offering.category === 'investing' ? `${colors.primary}20` :
                offering.category === 'banking' ? `${colors.info}20` : 
                `${colors.error}20`
            }
          ]}>
            <Text style={[
              styles.categoryText,
              {
                color: 
                  offering.category === 'investing' ? colors.primary :
                  offering.category === 'banking' ? colors.info : 
                  colors.error
              }
            ]}>
              {offering.category.charAt(0).toUpperCase() + offering.category.slice(1)}
            </Text>
          </View>
        </View>
        
        <Text style={styles.title}>{offering.title}</Text>
        <Text style={styles.description} numberOfLines={2}>
          {offering.description}
        </Text>
        
        <View style={styles.footer}>
          <ExternalLink size={16} color={colors.primary} />
          <Text style={styles.linkText}>View Offer</Text>
        </View>
      </View>
      
      {isLocked && (
        <View style={styles.lockedOverlay}>
          <Lock size={24} color={colors.light} />
          <Text style={styles.lockedText}>
            Unlock at {offering.requiredPoints} points
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
    marginVertical: 8,
    shadowColor: colors.dark,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: 120,
  },
  content: {
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  provider: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.darkGray,
  },
  categoryBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  categoryText: {
    fontSize: 12,
    fontWeight: '500',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.dark,
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    color: colors.darkGray,
    marginBottom: 16,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  linkText: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '500',
    marginLeft: 8,
  },
  lockedOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
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
});

export default OfferingCard;