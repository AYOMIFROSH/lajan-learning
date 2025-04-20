import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity,
  SafeAreaView,
  Linking,
  Platform
} from 'react-native';
import { useProgressStore } from '@/store/progress-store';
import colors from '@/constants/colors';
import OfferingCard from '@/components/OfferingCard';
import { offerings } from '@/mocks/offerings';
import { 
  Lock, 
  DollarSign, 
  CreditCard, 
  Building,
  TrendingUp
} from 'lucide-react-native';

type OfferingCategory = 'all' | 'investing' | 'banking' | 'credit';

export default function OfferingsScreen() {
  const { progress } = useProgressStore();
  const [selectedCategory, setSelectedCategory] = useState<OfferingCategory>('all');
  const [isLocked, setIsLocked] = useState(true);
  
  useEffect(() => {
    // Check if user has enough points to access offerings
    if (progress && progress.totalPoints >= 500) {
      setIsLocked(false);
    } else {
      setIsLocked(true);
    }
  }, [progress]);
  
  const handleCategorySelect = (category: OfferingCategory) => {
    setSelectedCategory(category);
  };
  
  const handleOfferingPress = async (offering: typeof offerings[0]) => {
    if (isLocked) return;
    
    // Open link in browser
    if (Platform.OS !== 'web') {
      const canOpen = await Linking.canOpenURL(offering.link);
      if (canOpen) {
        await Linking.openURL(offering.link);
      }
    } else {
      window.open(offering.link, '_blank');
    }
  };
  
  const filteredOfferings = selectedCategory === 'all'
    ? offerings
    : offerings.filter(offering => offering.category === selectedCategory);
  
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Text style={styles.title}>Offerings</Text>
        <Text style={styles.subtitle}>
          Exclusive financial products for Lajan learners
        </Text>
        
        <View style={styles.categoriesContainer}>
          <TouchableOpacity
            style={[
              styles.categoryButton,
              selectedCategory === 'all' && styles.selectedCategoryButton
            ]}
            onPress={() => handleCategorySelect('all')}
            disabled={isLocked}
          >
            <DollarSign 
              size={20} 
              color={selectedCategory === 'all' ? colors.light : colors.darkGray} 
            />
            <Text 
              style={[
                styles.categoryText,
                selectedCategory === 'all' && styles.selectedCategoryText
              ]}
            >
              All
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[
              styles.categoryButton,
              selectedCategory === 'investing' && styles.selectedCategoryButton
            ]}
            onPress={() => handleCategorySelect('investing')}
            disabled={isLocked}
          >
            <TrendingUp 
              size={20} 
              color={selectedCategory === 'investing' ? colors.light : colors.darkGray} 
            />
            <Text 
              style={[
                styles.categoryText,
                selectedCategory === 'investing' && styles.selectedCategoryText
              ]}
            >
              Investing
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[
              styles.categoryButton,
              selectedCategory === 'banking' && styles.selectedCategoryButton
            ]}
            onPress={() => handleCategorySelect('banking')}
            disabled={isLocked}
          >
            <Building 
              size={20} 
              color={selectedCategory === 'banking' ? colors.light : colors.darkGray} 
            />
            <Text 
              style={[
                styles.categoryText,
                selectedCategory === 'banking' && styles.selectedCategoryText
              ]}
            >
              Banking
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[
              styles.categoryButton,
              selectedCategory === 'credit' && styles.selectedCategoryButton
            ]}
            onPress={() => handleCategorySelect('credit')}
            disabled={isLocked}
          >
            <CreditCard 
              size={20} 
              color={selectedCategory === 'credit' ? colors.light : colors.darkGray} 
            />
            <Text 
              style={[
                styles.categoryText,
                selectedCategory === 'credit' && styles.selectedCategoryText
              ]}
            >
              Credit
            </Text>
          </TouchableOpacity>
        </View>
        
        {isLocked ? (
          <View style={styles.lockedContainer}>
            <View style={styles.lockIconContainer}>
              <Lock size={48} color={colors.light} />
            </View>
            <Text style={styles.lockedTitle}>Offerings Locked</Text>
            <Text style={styles.lockedDescription}>
              Complete more lessons to unlock exclusive financial offerings. You need 500 points to access this section.
            </Text>
            <Text style={styles.pointsText}>
              Your Points: {progress?.totalPoints || 0} / 500
            </Text>
            <View style={styles.progressBarContainer}>
              <View 
                style={[
                  styles.progressBar, 
                  { width: `${Math.min(((progress?.totalPoints || 0) / 500) * 100, 100)}%` }
                ]} 
              />
            </View>
          </View>
        ) : (
          <ScrollView style={styles.offeringsContainer}>
            {filteredOfferings.map(offering => (
              <OfferingCard
                key={offering.id}
                offering={offering}
                onPress={() => handleOfferingPress(offering)}
              />
            ))}
          </ScrollView>
        )}
      </View>
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
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.dark,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: colors.darkGray,
    marginBottom: 24,
  },
  categoriesContainer: {
    flexDirection: 'row',
    marginBottom: 24,
    flexWrap: 'wrap',
  },
  categoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    marginBottom: 8,
    backgroundColor: colors.gray,
  },
  selectedCategoryButton: {
    backgroundColor: colors.primary,
  },
  categoryText: {
    fontSize: 14,
    color: colors.darkGray,
    marginLeft: 4,
  },
  selectedCategoryText: {
    color: colors.light,
    fontWeight: '500',
  },
  offeringsContainer: {
    flex: 1,
  },
  lockedContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  lockIconContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  lockedTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.dark,
    marginBottom: 16,
    textAlign: 'center',
  },
  lockedDescription: {
    fontSize: 16,
    color: colors.darkGray,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 24,
  },
  pointsText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: 16,
  },
  progressBarContainer: {
    width: '100%',
    height: 8,
    backgroundColor: colors.gray,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: colors.primary,
  },
});