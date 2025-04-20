import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity,
  SafeAreaView
} from 'react-native';
import { useRouter } from 'expo-router';
import { Stack } from 'expo-router';
import { useProgressStore } from '@/store/progress-store';
import { useQuizStore, QuizDifficultyLevel } from '@/store/quize-store';
import colors from '@/constants/colors';
import TopicCard from '@/components/TopicCard';
import { topics } from '@/mocks/topics';
import { Filter, Info } from 'lucide-react-native';

export default function TopicsScreen() {
  const router = useRouter();
  const { progress } = useProgressStore();
  const { difficultyLevel, setDifficultyLevel } = useQuizStore();

  const handleTopicPress = (topic: typeof topics[0]) => {
    if (progress && progress.totalPoints >= topic.requiredPoints) {
      router.push(`/topics/${topic.id}`);
    }
  };

  // Get helper text based on selected difficulty level
  const getDifficultyHelperText = (difficulty: QuizDifficultyLevel) => {
    switch(difficulty) {
      case 'all':
        return 'Questions will include a mix of all difficulty levels';
      case 'beginner':
        return 'Questions will be beginner-friendly (Level 1)';
      case 'intermediate':
        return 'Questions will be for intermediate learners (Level 2)';
      case 'advanced':
        return 'Questions will be more challenging (Level 3)';
      default:
        return '';
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <Stack.Screen
        options={{
          title: 'Learning Topics',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        }}
      />

      <View style={styles.container}>
        <View style={styles.filterContainer}>
          <View style={styles.filterHeader}>
            <Filter size={20} color={colors.darkGray} />
            <Text style={styles.filterTitle}>Quiz Difficulty</Text>
          </View>
          
          <View style={styles.filterInfoContainer}>
            <Info size={16} color={colors.secondary} />
            <Text style={styles.filterInfoText}>
              This setting controls the difficulty of quiz questions, not which topics are shown
            </Text>
          </View>

          <View style={styles.filterButtons}>
            <TouchableOpacity
              style={[
                styles.filterButton,
                difficultyLevel === 'all' && styles.activeFilterButton,
              ]}
              onPress={() => setDifficultyLevel('all')}
            >
              <Text
                style={[
                  styles.filterButtonText,
                  difficultyLevel === 'all' && styles.activeFilterButtonText,
                ]}
              >
                All
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.filterButton,
                difficultyLevel === 'beginner' && styles.activeFilterButton,
              ]}
              onPress={() => setDifficultyLevel('beginner')}
            >
              <Text
                style={[
                  styles.filterButtonText,
                  difficultyLevel === 'beginner' && styles.activeFilterButtonText,
                ]}
              >
                Level 1
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.filterButton,
                difficultyLevel === 'intermediate' && styles.activeFilterButton,
              ]}
              onPress={() => setDifficultyLevel('intermediate')}
            >
              <Text
                style={[
                  styles.filterButtonText,
                  difficultyLevel === 'intermediate' && styles.activeFilterButtonText,
                ]}
              >
                Level 2
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.filterButton,
                difficultyLevel === 'advanced' && styles.activeFilterButton,
              ]}
              onPress={() => setDifficultyLevel('advanced')}
            >
              <Text
                style={[
                  styles.filterButtonText,
                  difficultyLevel === 'advanced' && styles.activeFilterButtonText,
                ]}
              >
                Level 3
              </Text>
            </TouchableOpacity>
          </View>
          
          <Text style={styles.difficultyHelperText}>
            {getDifficultyHelperText(difficultyLevel)}
          </Text>
        </View>

        <ScrollView style={styles.topicsContainer}>
          <Text style={styles.sectionTitle}>Financial Topics</Text>
          <Text style={styles.sectionSubtitle}>
            Select a topic to start learning
          </Text>

          {topics.map(topic => (
            <TopicCard
              key={topic.id}
              topic={topic}
              onPress={() => handleTopicPress(topic)}
            />
          ))}
        </ScrollView>
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
  filterContainer: {
    backgroundColor: colors.light,
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    shadowColor: colors.dark,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  filterHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  filterTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.dark,
    marginLeft: 8,
  },
  filterInfoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    backgroundColor: `${colors.secondary}10`,
    padding: 10,
    borderRadius: 8,
  },
  filterInfoText: {
    fontSize: 12,
    color: colors.secondary,
    marginLeft: 8,
    flex: 1,
  },
  filterButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 8,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: colors.gray,
    marginRight: 8,
    marginBottom: 8,
  },
  activeFilterButton: {
    backgroundColor: colors.primary,
  },
  filterButtonText: {
    fontSize: 14,
    color: colors.darkGray,
  },
  activeFilterButtonText: {
    color: colors.light,
    fontWeight: '500',
  },
  difficultyHelperText: {
    fontSize: 13,
    color: colors.darkGray,
    fontStyle: 'italic',
    marginTop: 8,
  },
  topicsContainer: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.dark,
    marginBottom: 8,
  },
  sectionSubtitle: {
    fontSize: 16,
    color: colors.darkGray,
    marginBottom: 16,
  },
});