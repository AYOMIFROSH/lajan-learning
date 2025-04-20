import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  SafeAreaView,
  ActivityIndicator,
  Share
} from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import colors from '@/constants/colors';
import { getFinancialInfo } from '@/services/openai-service';
import { financialTerms } from '@/mocks/financial-terms';
import { 
  ArrowLeft, 
  Share2, 
  BookOpen, 
  ChevronRight, 
  ExternalLink,
  Bookmark,
  ThumbsUp,
  ThumbsDown
} from 'lucide-react-native';

const TermDetailScreen = () => {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [term, setTerm] = useState<any>(null);
  const [extendedDefinition, setExtendedDefinition] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [feedbackGiven, setFeedbackGiven] = useState<'helpful' | 'not-helpful' | null>(null);
  
  useEffect(() => {
    // Find the term in our financial terms data
    const foundTerm = financialTerms.find(item => item.id === id);
    if (foundTerm) {
      setTerm(foundTerm);
      
      // Get extended definition from OpenAI service
      const fetchExtendedDefinition = async () => {
        try {
          const response = await getFinancialInfo(foundTerm.term);
          setExtendedDefinition(response);
        } catch (error) {
          console.error('Error fetching extended definition:', error);
          setExtendedDefinition('Unable to load extended definition at this time.');
        } finally {
          setIsLoading(false);
        }
      };
      
      fetchExtendedDefinition();
    } else {
      setIsLoading(false);
    }
  }, [id]);
  
  const handleShare = async () => {
    if (term) {
      try {
        await Share.share({
          message: `${term.term}: ${term.definition}\n\nLearn more financial terms with our app!`,
          title: `Financial Term: ${term.term}`
        });
      } catch (error) {
        console.error('Error sharing term:', error);
      }
    }
  };
  
  const handleBookmark = () => {
    setIsBookmarked(!isBookmarked);
    // In a real app, this would save to user's bookmarks
  };
  
  const handleFeedback = (type: 'helpful' | 'not-helpful') => {
    setFeedbackGiven(type);
    // In a real app, this would send feedback to the server
  };
  
  const handleRelatedTopicPress = (topicId: string) => {
    router.push(`/topics/${topicId}`);
  };
  
  if (!term && !isLoading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <Stack.Screen 
          options={{ 
            title: 'Term Not Found',
            headerTitleStyle: {
              fontWeight: 'bold',
            },
          }} 
        />
        
        <View style={styles.notFoundContainer}>
          <Text style={styles.notFoundText}>
            Sorry, we couldn't find the term you're looking for.
          </Text>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }
  
  return (
    <SafeAreaView style={styles.safeArea}>
      <Stack.Screen 
        options={{ 
          title: term?.term || 'Financial Term',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
          headerRight: () => (
            <View style={styles.headerButtons}>
              <TouchableOpacity 
                style={styles.headerButton}
                onPress={handleBookmark}
              >
                <Bookmark 
                  size={22} 
                  color={isBookmarked ? colors.primary : colors.darkGray} 
                  fill={isBookmarked ? colors.primary : 'transparent'}
                />
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.headerButton}
                onPress={handleShare}
              >
                <Share2 size={22} color={colors.darkGray} />
              </TouchableOpacity>
            </View>
          ),
        }} 
      />
      
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading term information...</Text>
        </View>
      ) : (
        <ScrollView style={styles.container}>
          <View style={styles.termHeader}>
            <Text style={styles.termTitle}>{term.term}</Text>
            {term.category && (
              <View style={styles.categoryBadge}>
                <Text style={styles.categoryText}>
                  {term.category.charAt(0).toUpperCase() + term.category.slice(1)}
                </Text>
              </View>
            )}
          </View>
          
          <View style={styles.definitionContainer}>
            <Text style={styles.definitionTitle}>Definition</Text>
            <Text style={styles.definitionText}>{term.definition}</Text>
          </View>
          
          <View style={styles.extendedDefinitionContainer}>
            <Text style={styles.extendedDefinitionTitle}>Extended Explanation</Text>
            <Text style={styles.extendedDefinitionText}>{extendedDefinition}</Text>
            
            <View style={styles.feedbackContainer}>
              <Text style={styles.feedbackTitle}>Was this explanation helpful?</Text>
              <View style={styles.feedbackButtons}>
                <TouchableOpacity
                  style={[
                    styles.feedbackButton,
                    feedbackGiven === 'helpful' && styles.feedbackButtonSelected
                  ]}
                  onPress={() => handleFeedback('helpful')}
                  disabled={feedbackGiven !== null}
                >
                  <ThumbsUp 
                    size={18} 
                    color={feedbackGiven === 'helpful' ? colors.light : colors.darkGray} 
                  />
                  <Text style={[
                    styles.feedbackButtonText,
                    feedbackGiven === 'helpful' && styles.feedbackButtonTextSelected
                  ]}>
                    Yes
                  </Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[
                    styles.feedbackButton,
                    feedbackGiven === 'not-helpful' && styles.feedbackButtonSelected
                  ]}
                  onPress={() => handleFeedback('not-helpful')}
                  disabled={feedbackGiven !== null}
                >
                  <ThumbsDown 
                    size={18} 
                    color={feedbackGiven === 'not-helpful' ? colors.light : colors.darkGray} 
                  />
                  <Text style={[
                    styles.feedbackButtonText,
                    feedbackGiven === 'not-helpful' && styles.feedbackButtonTextSelected
                  ]}>
                    No
                  </Text>
                </TouchableOpacity>
              </View>
              
              {feedbackGiven && (
                <Text style={styles.feedbackThankYou}>
                  Thank you for your feedback!
                </Text>
              )}
            </View>
          </View>
          
          {term.relatedTopic && (
            <View style={styles.relatedTopicContainer}>
              <Text style={styles.relatedTopicTitle}>Learn More</Text>
              <TouchableOpacity
                style={styles.relatedTopicCard}
                onPress={() => handleRelatedTopicPress(term.relatedTopic)}
              >
                <View style={styles.relatedTopicContent}>
                  <BookOpen size={24} color={colors.primary} />
                  <View style={styles.relatedTopicTextContainer}>
                    <Text style={styles.relatedTopicText}>
                      Explore our {term.relatedTopic.replace('-', ' ')} module
                    </Text>
                    <Text style={styles.relatedTopicSubtext}>
                      Deepen your understanding with comprehensive lessons
                    </Text>
                  </View>
                  <ChevronRight size={20} color={colors.primary} />
                </View>
              </TouchableOpacity>
            </View>
          )}
          
          {term.externalResources && (
            <View style={styles.externalResourcesContainer}>
              <Text style={styles.externalResourcesTitle}>External Resources</Text>
              {term.externalResources.map((resource: any, index: number) => (
                <TouchableOpacity
                  key={index}
                  style={styles.externalResourceItem}
                  onPress={() => {
                    // In a real app, this would open the URL
                    console.log(`Would open: ${resource.url}`);
                  }}
                >
                  <Text style={styles.externalResourceText}>{resource.title}</Text>
                  <ExternalLink size={16} color={colors.primary} />
                </TouchableOpacity>
              ))}
            </View>
          )}
          
          <View style={styles.relatedTermsContainer}>
            <Text style={styles.relatedTermsTitle}>Related Terms</Text>
            <View style={styles.relatedTermsList}>
              {financialTerms
                .filter(item => 
                  item.category === term.category && 
                  item.id !== term.id
                )
                .slice(0, 3)
                .map(relatedTerm => (
                  <TouchableOpacity
                    key={relatedTerm.id}
                    style={styles.relatedTermItem}
                    onPress={() => router.push(`/search/term/${relatedTerm.id}`)}
                  >
                    <Text style={styles.relatedTermText}>{relatedTerm.term}</Text>
                    <ChevronRight size={16} color={colors.darkGray} />
                  </TouchableOpacity>
                ))}
            </View>
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

export default TermDetailScreen

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    flex: 1,
    padding: 16,
  },
  headerButtons: {
    flexDirection: 'row',
  },
  headerButton: {
    marginLeft: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: colors.darkGray,
    textAlign: 'center',
  },
  notFoundContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  notFoundText: {
    fontSize: 16,
    color: colors.darkGray,
    textAlign: 'center',
    marginBottom: 24,
  },
  backButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  backButtonText: {
    color: colors.light,
    fontWeight: '500',
  },
  termHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  termTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.dark,
    flex: 1,
  },
  categoryBadge: {
    backgroundColor: `${colors.primary}15`,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  categoryText: {
    fontSize: 12,
    color: colors.primary,
    fontWeight: '500',
  },
  definitionContainer: {
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
  definitionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.dark,
    marginBottom: 8,
  },
  definitionText: {
    fontSize: 16,
    color: colors.dark,
    lineHeight: 24,
  },
  extendedDefinitionContainer: {
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
  extendedDefinitionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.dark,
    marginBottom: 8,
  },
  extendedDefinitionText: {
    fontSize: 16,
    color: colors.dark,
    lineHeight: 24,
  },
  feedbackContainer: {
    marginTop: 24,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 16,
  },
  feedbackTitle: {
    fontSize: 14,
    color: colors.darkGray,
    marginBottom: 12,
    textAlign: 'center',
  },
  feedbackButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  feedbackButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.gray,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginHorizontal: 8,
  },
  feedbackButtonSelected: {
    backgroundColor: colors.primary,
  },
  feedbackButtonText: {
    fontSize: 14,
    color: colors.darkGray,
    marginLeft: 8,
  },
  feedbackButtonTextSelected: {
    color: colors.light,
  },
  feedbackThankYou: {
    fontSize: 14,
    color: colors.success,
    textAlign: 'center',
    marginTop: 12,
  },
  relatedTopicContainer: {
    marginBottom: 24,
  },
  relatedTopicTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.dark,
    marginBottom: 12,
  },
  relatedTopicCard: {
    backgroundColor: `${colors.primary}10`,
    borderRadius: 12,
    overflow: 'hidden',
  },
  relatedTopicContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  relatedTopicTextContainer: {
    flex: 1,
    marginHorizontal: 12,
  },
  relatedTopicText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: 4,
  },
  relatedTopicSubtext: {
    fontSize: 12,
    color: colors.darkGray,
  },
  externalResourcesContainer: {
    marginBottom: 24,
  },
  externalResourcesTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.dark,
    marginBottom: 12,
  },
  externalResourceItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.light,
    padding: 16,
    borderRadius: 8,
    marginBottom: 8,
  },
  externalResourceText: {
    fontSize: 14,
    color: colors.dark,
  },
  relatedTermsContainer: {
    marginBottom: 24,
  },
  relatedTermsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.dark,
    marginBottom: 12,
  },
  relatedTermsList: {
    backgroundColor: colors.light,
    borderRadius: 12,
    overflow: 'hidden',
  },
  relatedTermItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  relatedTermText: {
    fontSize: 16,
    color: colors.dark,
  },
});

