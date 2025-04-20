import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity,
  SafeAreaView,
  FlatList,
  ActivityIndicator
} from 'react-native';
import { useRouter } from 'expo-router';
import colors from '../../constants/colors';
import Input from '../../components/Input';
import Card from '../../components/Card';
import { Search as SearchIcon, TrendingUp, Book, DollarSign, Percent, Info, CreditCard, Wallet, PiggyBank, Landmark, ChevronRight } from 'lucide-react-native';
import { financialTerms } from '../../mocks/financial-terms';

// Financial terms categories
const categories = [
  { id: 'investing', name: 'Investing', icon: <TrendingUp size={20} color={colors.primary} /> },
  { id: 'banking', name: 'Banking', icon: <Landmark size={20} color={colors.secondary} /> },
  { id: 'credit', name: 'Credit', icon: <CreditCard size={20} color="#6C5CE7" /> },
  { id: 'budgeting', name: 'Budgeting', icon: <PiggyBank size={20} color="#00B894" /> },
  { id: 'general', name: 'General', icon: <Info size={20} color="#FF7675" /> },
  { id: 'saving', name: 'Saving', icon: <Wallet size={20} color="#FDCB6E" /> },
];

// Popular search terms
const popularSearches = [
  'Investing', 'Savings', 'Credit Score', 'Taxes', 'Retirement', 'Stocks', 'Budgeting', 'Compound Interest'
];

 const SearchScreen = () => {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<typeof financialTerms>([]);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  const handleSearch = (query: string) => {
    setSearchQuery(query);
    
    if (query.trim() === '') {
      setSearchResults([]);
      return;
    }
    
    setIsLoading(true);
    
    // Filter terms based on search query
    const results = financialTerms.filter(
      item => item.term.toLowerCase().includes(query.toLowerCase()) ||
              item.definition.toLowerCase().includes(query.toLowerCase())
    );
    
    // Simulate network delay
    setTimeout(() => {
      setSearchResults(results);
      setIsLoading(false);
    }, 300);
  };
  
  const handleTermPress = (term: string, termId: string) => {
    // Add to recent searches
    if (!recentSearches.includes(term)) {
      setRecentSearches([term, ...recentSearches.slice(0, 4)]);
    }
    
    // Navigate to term detail page
    router.push(`/search/term/${termId}`);
  };
  
  const handlePopularSearch = (term: string) => {
    setSearchQuery(term);
    handleSearch(term);
  };

  const handleCategorySelect = (categoryId: string) => {
    setSelectedCategory(categoryId === selectedCategory ? null : categoryId);
    
    if (categoryId !== selectedCategory) {
      setIsLoading(true);
      // Filter terms by category
      const results = financialTerms.filter(item => item.category === categoryId);
      
      // Simulate network delay
      setTimeout(() => {
        setSearchResults(results);
        setIsLoading(false);
      }, 300);
    } else {
      setSearchResults([]);
    }
  };
  
  const renderSearchResults = () => {
    if (searchQuery.trim() === '' && !selectedCategory) {
      return null;
    }
    
    if (isLoading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Searching...</Text>
        </View>
      );
    }
    
    if (searchResults.length === 0) {
      return (
        <View style={styles.noResultsContainer}>
          <Text style={styles.noResultsText}>
            No results found {searchQuery ? `for "${searchQuery}"` : 'in this category'}
          </Text>
        </View>
      );
    }
    
    return (
      <View style={styles.resultsContainer}>
        <Text style={styles.resultsTitle}>
          {selectedCategory 
            ? `${categories.find(c => c.id === selectedCategory)?.name} Terms` 
            : 'Search Results'}
        </Text>
        
        {searchResults.map(item => (
          <TouchableOpacity
            key={item.id}
            style={styles.resultCard}
            onPress={() => handleTermPress(item.term, item.id)}
            activeOpacity={0.7}
          >
            <Text style={styles.termText}>{item.term}</Text>
            <Text style={styles.definitionText} numberOfLines={2}>
              {item.definition}
            </Text>
            
            {item.relatedTopic && (
              <View style={styles.relatedTopicContainer}>
                <Book size={14} color={colors.primary} />
                <Text style={styles.relatedTopicText}>
                  Learn more in our {item.relatedTopic.replace('-', ' ')} module
                </Text>
                <ChevronRight size={14} color={colors.primary} />
              </View>
            )}
          </TouchableOpacity>
        ))}
      </View>
    );
  };
  
  const handleTrendingTopicPress = (topic: string, topicId: string) => {
    router.push(`/topics/${topicId}`);
  };
  
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Text style={styles.title}>Search</Text>
        <Text style={styles.subtitle}>
          Find financial terms and concepts
        </Text>
        
        <Input
          placeholder="Search financial terms..."
          value={searchQuery}
          onChangeText={handleSearch}
          leftIcon={<SearchIcon size={20} color={colors.darkGray} />}
          containerStyle={styles.searchInputContainer}
        />
        
        <ScrollView 
          style={styles.scrollContainer}
          keyboardShouldPersistTaps="handled"
        >
          {/* Categories horizontal scroll */}
          <View style={styles.categoriesContainer}>
            <FlatList
              horizontal
              showsHorizontalScrollIndicator={false}
              data={categories}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.categoryButton,
                    selectedCategory === item.id ? styles.selectedCategoryButton : null
                  ]}
                  onPress={() => handleCategorySelect(item.id)}
                  activeOpacity={0.7}
                >
                  <View style={styles.categoryIconContainer}>
                    {item.icon}
                  </View>
                  <Text 
                    style={[
                      styles.categoryText,
                      selectedCategory === item.id ? styles.selectedCategoryText : null
                    ]}
                  >
                    {item.name}
                  </Text>
                </TouchableOpacity>
              )}
              contentContainerStyle={styles.categoriesList}
            />
          </View>
          
          {renderSearchResults()}
          
          {searchQuery.trim() === '' && !selectedCategory && (
            <>
              {recentSearches.length > 0 && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Recent Searches</Text>
                  <View style={styles.tagsContainer}>
                    {recentSearches.map((term, index) => (
                      <TouchableOpacity
                        key={index}
                        style={styles.tag}
                        onPress={() => handlePopularSearch(term)}
                        activeOpacity={0.7}
                      >
                        <Text style={styles.tagText}>{term}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              )}
              
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Popular Searches</Text>
                <View style={styles.tagsContainer}>
                  {popularSearches.map((term, index) => (
                    <TouchableOpacity
                      key={index}
                      style={styles.tag}
                      onPress={() => handlePopularSearch(term)}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.tagText}>{term}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
              
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Trending Topics</Text>
                
                <Card variant="elevated" style={styles.trendingCard}>
                  <TouchableOpacity 
                    style={styles.trendingCardContent}
                    onPress={() => handleTrendingTopicPress("Investing Basics", "investing")}
                    activeOpacity={0.7}
                  >
                    <View style={styles.trendingCardHeader}>
                      <View style={styles.trendingIconContainer}>
                        <TrendingUp size={24} color={colors.primary} />
                      </View>
                      <View style={styles.trendingCardTitleContainer}>
                        <Text style={styles.trendingCardTitle}>Investing Basics</Text>
                        <Text style={styles.trendingCardSubtitle}>Learn how to grow your money</Text>
                      </View>
                    </View>
                    <View style={styles.trendingCardFooter}>
                      <Text style={styles.trendingCardFooterText}>
                        <Book size={14} color={colors.darkGray} /> 5 modules
                      </Text>
                      <ChevronRight size={16} color={colors.primary} />
                    </View>
                  </TouchableOpacity>
                </Card>
                
                <Card variant="elevated" style={styles.trendingCard}>
                  <TouchableOpacity 
                    style={styles.trendingCardContent}
                    onPress={() => handleTrendingTopicPress("Budgeting 101", "budgeting")}
                    activeOpacity={0.7}
                  >
                    <View style={styles.trendingCardHeader}>
                      <View style={[
                        styles.trendingIconContainer,
                        { backgroundColor: `${colors.secondary}20` }
                      ]}>
                        <PiggyBank size={24} color={colors.secondary} />
                      </View>
                      <View style={styles.trendingCardTitleContainer}>
                        <Text style={styles.trendingCardTitle}>Budgeting 101</Text>
                        <Text style={styles.trendingCardSubtitle}>Master your personal finances</Text>
                      </View>
                    </View>
                    <View style={styles.trendingCardFooter}>
                      <Text style={styles.trendingCardFooterText}>
                        <Book size={14} color={colors.darkGray} /> 3 modules
                      </Text>
                      <ChevronRight size={16} color={colors.secondary} />
                    </View>
                  </TouchableOpacity>
                </Card>
                
                <Card variant="elevated" style={styles.trendingCard}>
                  <TouchableOpacity 
                    style={styles.trendingCardContent}
                    onPress={() => handleTrendingTopicPress("Credit Essentials", "credit")}
                    activeOpacity={0.7}
                  >
                    <View style={styles.trendingCardHeader}>
                      <View style={[
                        styles.trendingIconContainer,
                        { backgroundColor: "#6C5CE720" }
                      ]}>
                        <CreditCard size={24} color="#6C5CE7" />
                      </View>
                      <View style={styles.trendingCardTitleContainer}>
                        <Text style={styles.trendingCardTitle}>Credit Essentials</Text>
                        <Text style={styles.trendingCardSubtitle}>Build and maintain good credit</Text>
                      </View>
                    </View>
                    <View style={styles.trendingCardFooter}>
                      <Text style={styles.trendingCardFooterText}>
                        <Book size={14} color={colors.darkGray} /> 4 modules
                      </Text>
                      <ChevronRight size={16} color="#6C5CE7" />
                    </View>
                  </TouchableOpacity>
                </Card>
              </View>
            </>
          )}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

export default SearchScreen

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
  searchInputContainer: {
    marginBottom: 16,
  },
  scrollContainer: {
    flex: 1,
  },
  categoriesContainer: {
    marginBottom: 24,
  },
  categoriesList: {
    paddingVertical: 8,
  },
  categoryButton: {
    backgroundColor: colors.light,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginRight: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: colors.dark,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  selectedCategoryButton: {
    backgroundColor: `${colors.primary}15`,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  categoryIconContainer: {
    marginRight: 8,
  },
  categoryText: {
    fontSize: 14,
    color: colors.dark,
    fontWeight: '500',
  },
  selectedCategoryText: {
    color: colors.primary,
    fontWeight: 'bold',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.dark,
    marginBottom: 16,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  tag: {
    backgroundColor: colors.light,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    marginBottom: 8,
    shadowColor: colors.dark,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 1,
    elevation: 1,
  },
  tagText: {
    fontSize: 14,
    color: colors.darkGray,
  },
  trendingCard: {
    marginBottom: 16,
  },
  trendingCardContent: {
    padding: 16,
  },
  trendingCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  trendingIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: `${colors.primary}20`,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  trendingCardTitleContainer: {
    flex: 1,
  },
  trendingCardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.dark,
    marginBottom: 4,
  },
  trendingCardSubtitle: {
    fontSize: 14,
    color: colors.darkGray,
  },
  trendingCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 12,
  },
  trendingCardFooterText: {
    fontSize: 14,
    color: colors.darkGray,
    flexDirection: 'row',
    alignItems: 'center',
  },
  footerIcon: {
    marginRight: 4,
  },
  loadingContainer: {
    padding: 24,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: colors.darkGray,
  },
  noResultsContainer: {
    padding: 24,
    alignItems: 'center',
    backgroundColor: colors.light,
    borderRadius: 12,
    marginBottom: 24,
  },
  noResultsText: {
    fontSize: 16,
    color: colors.darkGray,
    textAlign: 'center',
  },
  resultsContainer: {
    marginBottom: 24,
  },
  resultsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.dark,
    marginBottom: 16,
  },
  resultCard: {
    backgroundColor: colors.light,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: colors.dark,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  termText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.dark,
    marginBottom: 8,
  },
  definitionText: {
    fontSize: 14,
    color: colors.darkGray,
    lineHeight: 20,
    marginBottom: 12,
  },
  relatedTopicContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${colors.primary}10`,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  relatedTopicText: {
    fontSize: 12,
    color: colors.primary,
    marginHorizontal: 8,
    flex: 1,
  },
});

