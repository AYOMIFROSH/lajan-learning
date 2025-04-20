import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity,
  SafeAreaView,
  Image,
  ActivityIndicator,
  Dimensions,
  Platform,
  Alert
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { useAuthStore } from '@/store/auth-store';
import { useProgressStore } from '@/store/progress-store';
import colors from '@/constants/colors';
import Button from '@/components/Button';
import { topics } from '@/mocks/topics';
import { 
  Clock, 
  BarChart, 
  Award, 
  ChevronRight,
  ArrowLeft,
  ArrowRight, 
  CheckCircle, 
  XCircle,
  AlertCircle,
  ThumbsUp,
  Eye,
  BookOpen,
  PieChart,
  LineChart,
  BarChart2
} from 'lucide-react-native';
import { getQuizQuestions, generateQuizFeedback, QuizQuestion } from '@/services/openai-service';
import { LinearGradient } from 'expo-linear-gradient';
import { Module, Topic, QuizQuestion as ModuleQuizQuestion } from '@/mocks/topics'; // Import types
import { useQuizStore } from '@/store/quize-store';
import { useNetInfo } from '@react-native-community/netinfo';
import NetworkErrorBanner from '@/components/networkErrorBanner';


const { width } = Dimensions.get('window');

// Helper function to check if a topic is today's recommended topic
const isRecommendedTopic = (topicId: string, userPreferredTopics: string[] = [], userPoints: number = 0): boolean => {
  // Get today's date and create a seed from it
  const today = new Date();
  const dateSeed = today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate();
  
  // Filter topics based on user's points
  const availableTopics = topics.filter(topic => 
    userPoints >= topic.requiredPoints
  );

  // If user has preferred topics, prioritize them
  let preferredAvailableTopics = availableTopics;
  if (userPreferredTopics && userPreferredTopics.length > 0) {
    preferredAvailableTopics = availableTopics.filter(topic => 
      userPreferredTopics.includes(topic.id)
    );
  }

  // Use preferred topics if available, otherwise fall back to all available topics
  const topicsToChooseFrom = preferredAvailableTopics.length > 0 
    ? preferredAvailableTopics 
    : availableTopics;
  
  // If no topics are available, return false
  if (topicsToChooseFrom.length === 0) {
    return false;
  }
  
  // Use the date seed to pick a topic for today
  const index = dateSeed % topicsToChooseFrom.length;
  const recommendedTopic = topicsToChooseFrom[index];
  
  return recommendedTopic.id === topicId;
};

export default function ModuleScreen() {
  const { id, moduleId } = useLocalSearchParams<{ id: string, moduleId: string }>();
  const router = useRouter();
  const { user } = useAuthStore();
  const { progress, completeModule } = useProgressStore();
  
  const [topic, setTopic] = useState<Topic | null>(null);
  const [module, setModule] = useState<Module | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentSection, setCurrentSection] = useState(0);
  const [quizMode, setQuizMode] = useState(false);
  const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [isAnswerCorrect, setIsAnswerCorrect] = useState<boolean | null>(null);
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [score, setScore] = useState(0);
  const [feedback, setFeedback] = useState("");
  const [loadingQuiz, setLoadingQuiz] = useState(false);
  const [loadingFeedback, setLoadingFeedback] = useState(false);
  const [isRecommended, setIsRecommended] = useState(false);
  const [moduleCompletedToday, setModuleCompletedToday] = useState(false);
  const { difficultyLevel } = useQuizStore();
  const [mixedKeyPoints, setMixedKeyPoints] = useState<string[]>([]);

  const [showNetworkError, setShowNetworkError] = useState(false);
const [networkErrorMessage, setNetworkErrorMessage] = useState("Network connection issue. Using offline mode.");
const netInfo = useNetInfo();

// Add this useEffect to monitor network status
useEffect(() => {
  if (netInfo.isConnected === false) {
    setNetworkErrorMessage("No internet connection. Some features may be limited.");
    setShowNetworkError(true);
  } else if (netInfo.isConnected === true && showNetworkError) {
    // Auto-dismiss after connection is restored
    setTimeout(() => {
      setShowNetworkError(false);
    }, 3000);
  }
}, [netInfo.isConnected]);

  const getDifficultyColor = (difficulty: 'beginner' | 'intermediate' | 'advanced' | string) => {
    switch(difficulty) {
      case 'beginner':
        return colors.success;
      case 'intermediate':
        return colors.warning;
      case 'advanced':
        return colors.error;
      default:
        return colors.secondary;
    }
  };

  useEffect(() => {
    if (id && moduleId) {
      // Convert ids to string for reliable comparison
      const topicId = String(id);
      const modId = String(moduleId);
      
      const foundTopic = topics.find(t => String(t.id) === topicId);
      if (foundTopic) {
        setTopic(foundTopic);
        
        const foundModule = foundTopic.modules.find(m => String(m.id) === modId);
        if (foundModule) {
          setModule(foundModule);
          
          // Check if this is part of today's recommended topic
          if (user && progress) {
            const recommended = isRecommendedTopic(
              foundTopic.id,
              user.preferredTopics,
              progress.totalPoints || 0
            );
            setIsRecommended(recommended);
            
            // Check if module is already completed today
            if (recommended && progress.topicsProgress && 
                progress.topicsProgress[topicId] && 
                progress.topicsProgress[topicId].modules && 
                progress.topicsProgress[topicId].modules[modId] && 
                progress.topicsProgress[topicId].modules[modId].completed) {
              
              // Check if it was completed today
              const lastAttempt = new Date(progress.topicsProgress[topicId].modules[modId].lastAttempt);
              const today = new Date();
              
              const isCompletedToday = (
                lastAttempt.getDate() === today.getDate() &&
                lastAttempt.getMonth() === today.getMonth() &&
                lastAttempt.getFullYear() === today.getFullYear()
              );
              
              setModuleCompletedToday(isCompletedToday);
              
              if (isCompletedToday) {
                // Show alert and go back if this module was completed today
                setTimeout(() => {
                  Alert.alert(
                    "Module Already Completed",
                    "You've already completed this module today. Come back tomorrow for new lessons!",
                    [{ 
                      text: "Go Back", 
                      onPress: () => router.back() 
                    }]
                  );
                }, 500);
              }
            }
          }
        }
      }
      
      setLoading(false);
    }
  }, [id, moduleId, user, progress]);
  

  // Enhanced keypoints system to be added to the startQuiz function in ModuleScreen.jsx

const startQuiz = async () => {
  if (!module) {
    console.error("Cannot start quiz: Module is not defined");
    return;
  }
  
  setLoadingQuiz(true);
  setQuizMode(true);
  
  try {
    console.log("Starting quiz for module:", module.title);
    console.log("Using difficulty level:", difficultyLevel);

    // Get user's learning style from auth store
    const userLearningStyle = useAuthStore.getState().user?.learningStyle as 'visual' | 'practical' | undefined;
    console.log("User learning style:", userLearningStyle || "not set");
    
    // Start with the module's existing key points
    let mixedKeyPoints = [...(module.keyPoints || [])];
    
    // If we have key points, enhance them with dynamic generation
    if (mixedKeyPoints.length > 0) {
      // Shuffle existing key points to create random order
      for (let i = mixedKeyPoints.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [mixedKeyPoints[i], mixedKeyPoints[j]] = [mixedKeyPoints[j], mixedKeyPoints[i]];
      }
      
      // Generate dynamic insights based on module content and title
      const moduleTitle = module.title.toLowerCase();
      const moduleContent = module.content.toLowerCase();
      
      // Categories for dynamic insights generation
      const insightCategories = {
        practical: [
          `Regular application of ${moduleTitle} principles leads to better financial outcomes.`,
          `Developing a habit around ${moduleTitle} can improve your financial well-being.`,
          `Setting measurable goals for ${moduleTitle} increases your chances of success.`,
          `Small, consistent actions related to ${moduleTitle} often lead to significant results over time.`
        ],
        conceptual: [
          `${moduleTitle} is a foundational concept that connects to broader financial literacy.`,
          `Understanding the theory behind ${moduleTitle} helps with practical application.`,
          `${moduleTitle} concepts evolve as financial markets and regulations change.`,
          `The principles of ${moduleTitle} can be applied in various financial contexts.`
        ],
        psychological: [
          `Behavioral biases can affect decisions related to ${moduleTitle}.`,
          `Being aware of emotional responses to ${moduleTitle} improves decision-making.`,
          `Building confidence with ${moduleTitle} comes through education and practice.`,
          `Creating positive associations with ${moduleTitle} improves long-term engagement.`
        ],
        statistical: [
          `Research shows that mastering ${moduleTitle} positively impacts overall financial health.`,
          `Most financial experts emphasize the importance of ${moduleTitle} in financial planning.`,
          `Data suggests that people who understand ${moduleTitle} make better financial decisions.`,
          `Comparative studies show the benefits of implementing good ${moduleTitle} practices.`
        ]
      };
      
      // Sample related terms for different financial modules to enhance keypoint generation
      const relatedTerms = {
        budget: ['spending', 'income', 'expenses', 'planning', 'tracking', 'allocating'],
        saving: ['emergency fund', 'goals', 'future', 'compound interest', 'consistency'],
        investing: ['diversification', 'risk', 'return', 'compound growth', 'portfolio', 'assets'],
        credit: ['score', 'debt', 'interest', 'borrowing', 'utilization', 'history'],
        debt: ['repayment', 'snowball', 'avalanche', 'interest', 'consolidation', 'management'],
        retirement: ['planning', 'savings', 'income', 'future', 'security', 'investments'],
        tax: ['deductions', 'credits', 'filing', 'planning', 'strategies', 'compliance'],
        banking: ['accounts', 'fees', 'services', 'interest', 'transactions', 'digital'],
        insurance: ['coverage', 'risk', 'premium', 'policy', 'protection', 'claims']
      };
      
      // Determine which category this module most closely relates to
      let relevantCategory = Object.keys(relatedTerms).find(category => 
        moduleTitle.includes(category) || 
        moduleContent.includes(category)
      ) || 'budget'; // Default to budget if no match
      
      // Find relevant terms from module content
      const relevantTermsForModule = relatedTerms[relevantCategory as keyof typeof relatedTerms];
      
      // Generate content-specific insights based on the module's content
      const contentSpecificInsights: string[] = [];
      if (moduleContent.includes('emergency') || moduleContent.includes('unexpected')) {
        contentSpecificInsights.push('Preparing for unexpected financial situations increases security and reduces stress.');
      }
      if (moduleContent.includes('goal') || moduleContent.includes('target')) {
        contentSpecificInsights.push('Setting specific, measurable, achievable, relevant, and time-bound (SMART) financial goals improves success rates.');
      }
      if (moduleContent.includes('long-term') || moduleContent.includes('future')) {
        contentSpecificInsights.push('Long-term financial planning requires different strategies than short-term financial management.');
      }
      if (moduleContent.includes('risk') || moduleContent.includes('return')) {
        contentSpecificInsights.push('Understanding the relationship between risk and return is fundamental to making informed investment decisions.');
      }
      if (moduleContent.includes('habit') || moduleContent.includes('behavior')) {
        contentSpecificInsights.push('Financial behaviors and habits often have a greater impact on financial outcomes than knowledge alone.');
      }
      
      // Select insights from different categories to ensure variety
      const categories = Object.keys(insightCategories);
      const selectedInsights: string[] = [];
      
      // Add 1-2 content-specific insights if available
      if (contentSpecificInsights.length > 0) {
        selectedInsights.push(contentSpecificInsights[Math.floor(Math.random() * contentSpecificInsights.length)]);
        if (contentSpecificInsights.length > 1 && Math.random() > 0.5) {
          const secondInsight = contentSpecificInsights.find(insight => insight !== selectedInsights[0]);
          if (secondInsight) selectedInsights.push(secondInsight);
        }
      }
      
      // Add insights from random categories
      for (let i = 0; i < 2; i++) {
        const category = categories[Math.floor(Math.random() * categories.length)];
        const categoryInsights = insightCategories[category as keyof typeof insightCategories];
        const insight = categoryInsights[Math.floor(Math.random() * categoryInsights.length)];
        if (!selectedInsights.includes(insight) && !mixedKeyPoints.some(point => point.includes(insight))) {
          selectedInsights.push(insight);
        }
      }
      
      // Look for key points from related topics in the same subject area
      if (topic) {
        const relatedKeyPoints: string[] = [];
        
        // Find modules in the same topic with related content
        topic.modules.forEach(relatedModule => {
          if (relatedModule.id !== module.id && relatedModule.keyPoints) {
            // Check if the module content or title contains relevant terms
            const moduleIsRelevant = relevantTermsForModule.some(term => 
              relatedModule.title.toLowerCase().includes(term) || 
              (relatedModule.content && relatedModule.content.toLowerCase().includes(term))
            );
            
            if (moduleIsRelevant && relatedModule.keyPoints) {
              // Add 1-2 key points from the related module
              const potentialPoints = [...relatedModule.keyPoints];
              if (potentialPoints.length > 0) {
                const randomIndex = Math.floor(Math.random() * potentialPoints.length);
                const selectedPoint = potentialPoints[randomIndex];
                if (!mixedKeyPoints.some(point => point === selectedPoint)) {
                  relatedKeyPoints.push(selectedPoint);
                }
              }
            }
          }
        });
        
        // Add up to 2 key points from related modules if found
        relatedKeyPoints.slice(0, 2).forEach(point => {
          if (!mixedKeyPoints.some(existingPoint => existingPoint === point)) {
            mixedKeyPoints.push(point);
          }
        });
      }
      
      // Add the selected dynamic insights to our key points
      selectedInsights.forEach(insight => {
        if (!mixedKeyPoints.some(point => point.includes(insight))) {
          mixedKeyPoints.push(insight);
        }
      });
      
      // Create variations of existing key points to add diversity
      const keyPointVariations = mixedKeyPoints.slice(0, 2).map(point => {
        // Simple variations by adding prefixes or changing sentence structure
        const variations = [
          `Experts agree that ${point.toLowerCase()}`,
          `A key insight: ${point.toLowerCase()}`,
          `Research suggests that ${point.toLowerCase()}`,
          `An important principle is that ${point.toLowerCase()}`,
          `Financial advisors often emphasize that ${point.toLowerCase()}`
        ];
        
        return variations[Math.floor(Math.random() * variations.length)];
      });
      
      // Add variations if they don't duplicate existing points
      keyPointVariations.forEach(variation => {
        if (!mixedKeyPoints.some(point => point === variation)) {
          mixedKeyPoints.push(variation);
        }
      });
    } else {
      // If there are no key points, generate some basic ones based on the module title
      const moduleTitle = module.title.toLowerCase();
      
      if (moduleTitle.includes('money') || moduleTitle.includes('understanding')) {
        mixedKeyPoints = [
          'Money serves as a medium of exchange in the economy',
          'Financial literacy improves overall quality of life',
          'Understanding financial concepts leads to better decision-making',
          'Money management skills develop through education and practice'
        ];
      } 
      else if (moduleTitle.includes('budget')) {
        mixedKeyPoints = [
          'Budgeting helps track income and expenses systematically',
          'The 50/30/20 rule allocates income to needs, wants, and savings',
          'Regular budget reviews help adjust for changing financial circumstances',
          'Digital tools can simplify the budgeting process'
        ];
      }
      else if (moduleTitle.includes('saving') || moduleTitle.includes('save')) {
        mixedKeyPoints = [
          'Consistent saving creates financial security over time',
          'An emergency fund should cover 3-6 months of essential expenses',
          'Automating savings helps maintain discipline',
          'Saving even small amounts regularly adds up through compound growth'
        ];
      }
      else if (moduleTitle.includes('invest')) {
        mixedKeyPoints = [
          'Diversification helps manage investment risk effectively',
          'Compound interest significantly grows investments over long periods',
          'Risk tolerance should guide investment strategy selection',
          'Regular investing helps overcome market volatility through dollar-cost averaging'
        ];
      }
      else if (moduleTitle.includes('credit')) {
        mixedKeyPoints = [
          'Credit scores impact borrowing costs and financial opportunities',
          'Payment history is the most influential factor in credit scores',
          'Maintaining low credit utilization improves credit health',
          'Regular credit monitoring helps identify issues early'
        ];
      }
      else {
        // Generic financial key points for any other module
        mixedKeyPoints = [
          'Financial education leads to better decision-making',
          'Setting specific financial goals increases success probability',
          'Regular review of financial strategies is essential for adaptation',
          'Building positive financial habits creates long-term success',
          'Financial wellness connects to overall personal wellbeing'
        ];
        
        // Shuffle these generic points
        for (let i = mixedKeyPoints.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [mixedKeyPoints[i], mixedKeyPoints[j]] = [mixedKeyPoints[j], mixedKeyPoints[i]];
        }
      }
    }
    
    // Trim key points to avoid too many (keep between 3-7)
    if (mixedKeyPoints.length > 7) {
      mixedKeyPoints = mixedKeyPoints.slice(0, 7);
    }
    
    // Always generate fresh questions using the forceRefresh parameter and mixed key points
    try {
      const questions = await getQuizQuestions(
        module.title, 
        module.content,
        mixedKeyPoints, 
        true,
        difficultyLevel,
        userLearningStyle ,
      );
      
      setMixedKeyPoints(mixedKeyPoints);

      console.log(`Received ${questions.length} questions from OpenAI`);
      setQuizQuestions(questions);
    } catch (error) {
      console.error("Error fetching quiz questions:", error);
      
      // Fall back to module questions if they exist
      if (module.quizQuestions && module.quizQuestions.length > 0) {
        console.log("Falling back to existing module questions");
        
        // Format the questions to match our expected format
        let formattedQuestions = module.quizQuestions.map((q: ModuleQuizQuestion) => {
          // Get correct answer from the options using the index
          const correctAnswer = q.options[q.correctOptionIndex];
          
          return {
            id: `${q.id}-${Date.now()}`, 
            question: q.question,
            options: q.options,
            correctAnswer: correctAnswer,
            explanation: q.explanation,
            difficulty: q.difficulty 
          };
        });

        if (difficultyLevel !== 'all') {
          const filteredQuestions = formattedQuestions.filter(
            q => q.difficulty === difficultyLevel
          );
          
          // Only use filtered questions if we found some
          if (filteredQuestions.length > 0) {
            formattedQuestions = filteredQuestions;
          }
          // If no questions match the difficulty, we'll use all questions
        }
        
        
        // Randomize the options to prevent pattern recognition
        const randomizeOptions = (questions: QuizQuestion[]): QuizQuestion[] => {
          return questions.map(question => {
            // Create a copy of the options
            const options = [...question.options];
            const correctAnswer = question.correctAnswer;
            
            // Shuffle the options
            for (let i = options.length - 1; i > 0; i--) {
              const j = Math.floor(Math.random() * (i + 1));
              [options[i], options[j]] = [options[j], options[i]];
            }
            
            return {
              ...question,
              options,
              correctAnswer
            };
          });
        };
        
        // Randomize the questions before setting them
        setQuizQuestions(randomizeOptions(formattedQuestions));
      } else {
        // If no existing questions, use default fallback questions
        const defaultQuestions = [
          {
            id: `fallback-1-${Date.now()}`,
            question: "What is the main purpose of this module?",
            options: [
              "To entertain",
              "To educate about financial concepts",
              "To sell financial products",
              "To provide investment advice"
            ],
            correctAnswer: "To educate about financial concepts",
            explanation: "This module is designed to provide educational content about financial concepts to improve your financial literacy."
          },
          {
            id: `fallback-2-${Date.now()}`,
            question: "What is an important habit for financial success?",
            options: [
              "Spending all your income",
              "Saving regularly",
              "Avoiding all investments",
              "Taking on maximum debt"
            ],
            correctAnswer: "Saving regularly",
            explanation: "Consistently saving a portion of your income is a foundational habit for financial success."
          },
          {
            id: `fallback-3-${Date.now()}`,
            question: "What should you do before making major financial decisions?",
            options: [
              "Act quickly without research",
              "Follow what everyone else is doing",
              "Research and understand the implications",
              "Maximize your borrowing first"
            ],
            correctAnswer: "Research and understand the implications",
            explanation: "Making informed decisions based on research and understanding is crucial for financial success."
          }
        ];
        
        // Randomize even the default questions
        const randomizeOptions = (questions: QuizQuestion[]): QuizQuestion[] => {
          return questions.map(question => {
            // Create a copy of the options
            const options = [...question.options];
            const correctAnswer = question.correctAnswer;
            
            // Shuffle the options
            for (let i = options.length - 1; i > 0; i--) {
              const j = Math.floor(Math.random() * (i + 1));
              [options[i], options[j]] = [options[j], options[i]];
            }
            
            return {
              ...question,
              options,
              correctAnswer
            };
          });
        };
        
        setQuizQuestions(randomizeOptions(defaultQuestions));
      }
    }
  } catch (error) {
    console.error("Error in startQuiz:", error);
    // Generic fallback questions are already handled in the inner try/catch
  } finally {
    setLoadingQuiz(false);
  }
};
  
  const handleAnswerSelect = (index: number) => {
    if (!quizQuestions[currentQuestion]) return;
    
    const selectedOption = quizQuestions[currentQuestion].options[index];
    const correctOption = quizQuestions[currentQuestion].correctAnswer;
    const correct = selectedOption === correctOption;
    
    setSelectedAnswer(index);
    setIsAnswerCorrect(correct);
    if (correct) {
      setScore(score + 1);
    }
  };

  const nextQuestion = () => {
    if (currentQuestion < quizQuestions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
      setSelectedAnswer(null);
      setIsAnswerCorrect(null);
    } else {
      completeQuiz();
    }
  };

  // Updated completeQuiz function in ModuleScreen.tsx

// Update the completeQuiz function to include learning style in feedback

const completeQuiz = async () => {
  setQuizCompleted(true);
  setLoadingFeedback(true);
  
  try {
    // Get personalized feedback based on quiz performance
    const finalScore = score + (isAnswerCorrect ? 1 : 0);
    const totalQuestions = quizQuestions.length;
    const percentage = finalScore / totalQuestions;
    
    // Get user's learning style for personalized feedback
    const userLearningStyle = useAuthStore.getState().user?.learningStyle;
    
    // Pass the mixed keypoints and learning style to the feedback generator for more relevant feedback
    const feedbackText = await generateQuizFeedback(
      module?.title || 'Module',
      finalScore,
      totalQuestions,
      mixedKeyPoints, // Pass the mixed keypoints we used for question generation
      userLearningStyle // Pass user's learning style for tailored feedback
    );
    
    // Make sure we're using the feedback text, not the object
    setFeedback(typeof feedbackText === 'string' ? feedbackText : 'Good job on completing the quiz!');
    
    // Mark module as completed in progress store
    if (id && moduleId && user) {
      // Pass all required parameters including userId and the score
      const userToken = useAuthStore.getState().token; // Retrieve token from auth store
      completeModule(user.id, String(id), String(moduleId), percentage, userToken);
      
      // If this was a recommended topic module and the score is high enough (e.g., 70%)
      if (isRecommended && percentage >= 0.7) {
        setModuleCompletedToday(true);
      }
    }
  // Update the error handling in your completeQuiz function
// This should replace the catch block in your completeQuiz function

} catch (error) {
  console.error("Error generating feedback:", error);
  
  // Check if it's a network error and show the banner
  if (error instanceof Error && error.message.includes('Network request failed')) {
    setNetworkErrorMessage("Network issue while generating feedback. Using standard feedback instead.");
    setShowNetworkError(true);
  }
  
  // Fallback feedback based on score
  const finalScore = score + (isAnswerCorrect ? 1 : 0);
  const totalQuestions = quizQuestions.length;
  const percentage = finalScore / totalQuestions;
  
  // Get user's learning style for the fallback
  const userLearningStyle = useAuthStore.getState().user?.learningStyle;
  
  // Enhanced fallback feedback with learning style support
  if (percentage >= 0.8) {
    if (userLearningStyle === 'visual') {
      setFeedback("Excellent work! You've demonstrated a strong understanding of the material. Try visualizing these concepts with diagrams or charts to further solidify your understanding.");
    } else if (userLearningStyle === 'practical') {
      setFeedback("Excellent work! You've demonstrated a strong understanding of the material. Try applying these concepts to your personal finances to see how they work in practice.");
    } else {
      setFeedback("Excellent work! You've demonstrated a strong understanding of the material. Keep up the great work!");
    }
  } else if (percentage >= 0.6) {
    if (userLearningStyle === 'visual') {
      setFeedback("Good job! You've grasped most of the concepts, but there's still room for improvement. Try finding visual representations of the challenging concepts to strengthen your understanding.");
    } else if (userLearningStyle === 'practical') {
      setFeedback("Good job! You've grasped most of the concepts, but there's still room for improvement. Try practicing with real-world scenarios to reinforce your understanding.");
    } else {
      setFeedback("Good job! You've grasped most of the concepts, but there's still room for improvement. Consider reviewing the module again.");
    }
  } else {
    if (userLearningStyle === 'visual') {
      setFeedback("You might need to spend more time with this material. Try reviewing the module again with a focus on creating visual memory aids for key concepts.");
    } else if (userLearningStyle === 'practical') {
      setFeedback("You might need to spend more time with this material. Try reviewing the module again and think about how each concept applies to real financial situations you encounter.");
    } else {
      setFeedback("You might need to spend more time with this material. Try reviewing the module again and focus on the key concepts.");
    }
  }
  
  // Still try to mark module as completed in progress store
  if (id && moduleId && user) {
    try {
      const userToken = useAuthStore.getState().token;
      completeModule(user.id, String(id), String(moduleId), percentage, userToken);
      
      if (isRecommended && percentage >= 0.7) {
        setModuleCompletedToday(true);
      }
    } catch (progressError) {
      // Handle errors when saving progress
      console.error("Error saving progress:", progressError);
      if (progressError instanceof Error && progressError.message.includes('Network request failed')) {
        setNetworkErrorMessage("Progress will be saved when your connection is restored.");
        setShowNetworkError(true);
      }
    }
  }
  } finally {
    setLoadingFeedback(false);
  }
};

  const resetQuiz = () => {
    setQuizMode(false);
    setQuizCompleted(false);
    setCurrentQuestion(0);
    setSelectedAnswer(null);
    setIsAnswerCorrect(null);
    setScore(0);
    setFeedback("");
  };

  const navigateToNextModule = () => {
    if (!topic || !module) return;
    
    const currentIndex = topic.modules.findIndex(m => m.id === moduleId);
    if (currentIndex < topic.modules.length - 1) {
      const nextModule = topic.modules[currentIndex + 1];
      router.push(`/topics/${id}/modules/${nextModule.id}`);
    } else {
      // If this was the last module, go back to topic page
      router.push(`/topics/${id}`);
    }
  };

  const renderContent = () => {
    if (loading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading module content...</Text>
        </View>
      );
    }

    if (!module) {
      return (
        <View style={styles.errorContainer}>
          <AlertCircle size={48} color={colors.error} />
          <Text style={styles.errorText}>Module not found</Text>
          <Button 
            title="Go Back" 
            onPress={() => router.back()} 
            style={styles.errorButton}
          />
        </View>
      );
    }

    if (moduleCompletedToday && isRecommended) {
      return (
        <View style={styles.completedContainer}>
          <CheckCircle size={48} color={colors.success} />
          <Text style={styles.completedTitle}>Module Completed</Text>
          <Text style={styles.completedText}>
            You've already completed this module today.
            Come back tomorrow for new lessons!
          </Text>
          <Button 
            title="Go Back" 
            onPress={() => router.back()} 
            style={styles.completedButton}
          />
        </View>
      );
    }

    if (quizMode) {
      return renderQuiz();
    }

    // Render module content
    return (
      <View style={styles.contentContainer}>
        <View style={styles.moduleHeader}>
          <View style={styles.moduleInfo}>
            <Clock size={18} color={colors.secondary} />
            <Text style={styles.moduleInfoText}>{module.estimatedTime} min</Text>
          </View>
          <View style={styles.moduleInfo}>
            <BarChart size={18} color={colors.secondary} />
            <Text style={styles.moduleInfoText}>{module.difficulty || topic?.level || 'beginner'}</Text>
          </View>
        </View>

        <View style={styles.contentSection}>
          <Image 
            source={{ uri: module.image || 'https://images.unsplash.com/photo-1579621970795-87facc2f976d?q=80&w=2070&auto=format&fit=crop' }} 
            style={styles.moduleImage} 
            resizeMode="cover"
          />
          
          <Text style={styles.contentText}>{module.content}</Text>
          
          {module.keyPoints && (
            <View style={styles.keyPointsContainer}>
              <Text style={styles.keyPointsTitle}>Key Points</Text>
              {module.keyPoints.map((point: string, index: number) => (
                <View key={index} style={styles.keyPoint}>
                  <View style={styles.keyPointBullet}>
                    <Text style={styles.keyPointBulletText}>{index + 1}</Text>
                  </View>
                  <Text style={styles.keyPointText}>{point}</Text>
                </View>
              ))}
            </View>
          )}
        </View>

        <View style={styles.actionButtons}>
          <Button 
            title="Take Quiz" 
            onPress={startQuiz} 
            style={styles.quizButton}
            icon={<Award size={20} color="#fff" />}
          />
        </View>
      </View>
    );
  };

  // In the ModuleScreen component, update the renderQuiz function:

const renderQuiz = () => {
  if (loadingQuiz) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Preparing your quiz...</Text>
      </View>
    );
  }

  if (quizCompleted) {
    return renderQuizResults();
  }

  if (!quizQuestions || quizQuestions.length === 0 || !quizQuestions[currentQuestion]) {
    return (
      <View style={styles.errorContainer}>
        <AlertCircle size={48} color={colors.error} />
        <Text style={styles.errorText}>Failed to load quiz questions</Text>
        <Button 
          title="Go Back" 
          onPress={() => setQuizMode(false)} 
          style={styles.errorButton}
        />
      </View>
    );
  }

  const question = quizQuestions[currentQuestion];
  // Find the index of the correct answer in the options array
  const correctAnswerIndex = question.options.findIndex(
    option => option === question.correctAnswer
  );
  
  // Get user's learning style
  const userLearningStyle = useAuthStore.getState().user?.learningStyle;
  
  return (
    <View style={styles.quizContainer}>
      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <View 
            style={[
              styles.progressFill, 
              { width: `${((currentQuestion + 1) / quizQuestions.length) * 100}%` }
            ]} 
          />
        </View>
        <Text style={styles.progressText}>
          Question {currentQuestion + 1} of {quizQuestions.length}
        </Text>
      </View>

      <View style={styles.questionContainer}>
        <Text style={styles.questionText}>{question.question}</Text>

        {question.difficulty && (
          <View style={[
            styles.difficultyBadge,
            { backgroundColor: `${getDifficultyColor(question.difficulty)}20` }
          ]}>
            <Text style={[
              styles.difficultyText,
              { color: getDifficultyColor(question.difficulty) }
            ]}>
              {question.difficulty === 'beginner' ? 'Level 1' :
              question.difficulty === 'intermediate' ? 'Level 2' : 'Level 3'}
            </Text>
          </View>
        )}
        
        {/* Display Visual Content if available and user has visual learning style */}
        {userLearningStyle === 'visual' && question.visualContent && (
          <View style={styles.visualContentContainer}>
            <View style={styles.visualContentIcon}>
              <PieChart size={18} color={colors.primary} />
            </View>
            <Text style={styles.visualContentText}>
              {question.visualContent}
            </Text>
          </View>
        )}
        
        {/* Display Practical Example if available and user has practical learning style */}
        {userLearningStyle === 'practical' && question.practicalExample && (
          <View style={styles.practicalExampleContainer}>
            <View style={styles.practicalExampleIcon}>
              <BookOpen size={18} color={colors.primary} />
            </View>
            <Text style={styles.practicalExampleText}>
              {question.practicalExample}
            </Text>
          </View>
        )}
        
        <View style={styles.optionsContainer}>
          {question.options.map((option, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.optionButton,
                selectedAnswer === index && styles.selectedOption,
                selectedAnswer !== null && index === correctAnswerIndex && styles.correctOption,
                selectedAnswer === index && selectedAnswer !== correctAnswerIndex && styles.incorrectOption
              ]}
              onPress={() => selectedAnswer === null && handleAnswerSelect(index)}
              disabled={selectedAnswer !== null}
            >
              <Text 
                style={[
                  styles.optionText,
                  selectedAnswer === index && styles.selectedOptionText,
                  selectedAnswer !== null && index === correctAnswerIndex && styles.correctOptionText,
                  selectedAnswer === index && selectedAnswer !== correctAnswerIndex && styles.incorrectOptionText
                ]}
              >
                {option}
              </Text>
              {selectedAnswer !== null && index === correctAnswerIndex && (
                <CheckCircle size={20} color={colors.success} style={styles.optionIcon} />
              )}
              {selectedAnswer === index && selectedAnswer !== correctAnswerIndex && (
                <XCircle size={20} color={colors.error} style={styles.optionIcon} />
              )}
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {selectedAnswer !== null && (
        <View style={styles.feedbackContainer}>
          <Text style={[
            styles.feedbackText,
            isAnswerCorrect ? styles.correctFeedbackText : styles.incorrectFeedbackText
          ]}>
            {isAnswerCorrect 
              ? "Correct! Well done." 
              : `Incorrect. The correct answer is: ${question.correctAnswer}`
            }
          </Text>
          {question.explanation && (
            <Text style={styles.explanationText}>{question.explanation}</Text>
          )}
          <Button 
            title={currentQuestion < quizQuestions.length - 1 ? "Next Question" : "Complete Quiz"} 
            onPress={nextQuestion} 
            style={styles.nextButton}
            icon={<ArrowRight size={20} color="#fff" />}
          />
        </View>
      )}
    </View>
  );
  };

  // Update the renderQuizResults function to include learning style elements

const renderQuizResults = () => {
  if (loadingFeedback) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Analyzing your results...</Text>
      </View>
    );
  }

  const finalScore = score + (isAnswerCorrect ? 1 : 0);
  const totalQuestions = quizQuestions.length;
  const percentage = Math.round((finalScore / totalQuestions) * 100);
  
  // Get user's learning style
  const userLearningStyle = useAuthStore.getState().user?.learningStyle;
  
  return (
    <View style={styles.resultsContainer}>
      <LinearGradient
        colors={percentage >= 70 ? ['#4CAF50', '#2E7D32'] : percentage >= 50 ? ['#FFA726', '#EF6C00'] : ['#EF5350', '#C62828']}
        style={styles.scoreCircle}
      >
        <Text style={styles.scoreText}>{percentage}%</Text>
      </LinearGradient>
      
      <Text style={styles.resultTitle}>
        {percentage >= 80 ? "Excellent!" : percentage >= 60 ? "Good Job!" : "Keep Learning!"}
      </Text>
      
      <Text style={styles.scoreDetail}>
        You scored {finalScore} out of {totalQuestions} questions correctly
      </Text>
      
      <View style={styles.feedbackBox}>
        <Text style={styles.feedbackTitle}>Feedback</Text>
        <Text style={styles.feedbackContent}>{feedback}</Text>
        
        {/* Add learning style-specific icon based on user preference */}
        {userLearningStyle && (
          <View style={styles.learningStyleContainer}>
            {userLearningStyle === 'visual' ? (
              <>
                <PieChart size={20} color={colors.primary} />
                <Text style={styles.learningStyleText}>Tailored for your visual learning style</Text>
              </>
            ) : userLearningStyle === 'practical' ? (
              <>
                <BookOpen size={20} color={colors.primary} />
                <Text style={styles.learningStyleText}>Tailored for your practical learning style</Text>
              </>
            ) : null}
          </View>
        )}
      </View>
      
      {/* Add Next Steps section based on learning style */}
      {userLearningStyle && (
        <View style={styles.nextStepsContainer}>
          <Text style={styles.nextStepsTitle}>Suggested Next Steps</Text>
          
          {userLearningStyle === 'visual' && (
            <View style={styles.nextStepsContent}>
              <View style={styles.nextStepItem}>
                <LineChart size={18} color={colors.primary} style={styles.nextStepIcon} />
                <Text style={styles.nextStepText}>Create a visual summary or mind map of key concepts</Text>
              </View>
              <View style={styles.nextStepItem}>
                <PieChart size={18} color={colors.primary} style={styles.nextStepIcon} />
                <Text style={styles.nextStepText}>Look for charts or diagrams that illustrate these concepts</Text>
              </View>
              <View style={styles.nextStepItem}>
                <BarChart2 size={18} color={colors.primary} style={styles.nextStepIcon} />
                <Text style={styles.nextStepText}>Try to visualize these concepts in your daily financial decisions</Text>
              </View>
            </View>
          )}
          
          {userLearningStyle === 'practical' && (
            <View style={styles.nextStepsContent}>
              <View style={styles.nextStepItem}>
                <BookOpen size={18} color={colors.primary} style={styles.nextStepIcon} />
                <Text style={styles.nextStepText}>Apply these concepts to your own financial situation</Text>
              </View>
              <View style={styles.nextStepItem}>
                <Award size={18} color={colors.primary} style={styles.nextStepIcon} />
                <Text style={styles.nextStepText}>Practice using these principles in your next financial decision</Text>
              </View>
              <View style={styles.nextStepItem}>
                <ThumbsUp size={18} color={colors.primary} style={styles.nextStepIcon} />
                <Text style={styles.nextStepText}>Share what you've learned with someone to reinforce your understanding</Text>
              </View>
            </View>
          )}
        </View>
      )}
      
      <View style={styles.resultActions}>
        <Button 
          title="Try Again" 
          onPress={resetQuiz} 
          style={styles.tryAgainButton}
          variant="secondary"
          icon={<Eye size={20} color={colors.primary} />}
        />
        <Button 
          title={isRecommended && percentage >= 70 ? "Module Completed" : "Next Module"} 
          onPress={navigateToNextModule} 
          style={styles.nextModuleButton}
          disabled={isRecommended && percentage >= 70}
          icon={<ArrowRight size={20} color="#fff" />}
        />
      </View>
    </View>
  );
};

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen 
        options={{
          title: module?.title || "Module",
          headerBackTitle: "Back",
          headerTintColor: colors.primary,
          headerStyle: { backgroundColor: colors.background },
          headerShadowVisible: false,
        }} 
      />
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {renderContent()}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    minHeight: 300,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: colors.secondary,
    textAlign: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    minHeight: 300,
  },
  errorText: {
    marginTop: 16,
    fontSize: 18,
    color: colors.error,
    textAlign: 'center',
    marginBottom: 20,
  },
  errorButton: {
    minWidth: 120,
  },
  completedContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    minHeight: 300,
  },
  completedTitle: {
    marginTop: 16,
    fontSize: 22,
    fontWeight: 'bold',
    color: colors.success,
    textAlign: 'center',
  },
  completedText: {
    marginTop: 12,
    fontSize: 16,
    color: colors.darkGray,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 24,
  },
  completedButton: {
    minWidth: 120,
  },
  contentContainer: {
    flex: 1,
  },
  moduleHeader: {
    flexDirection: 'row',
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  moduleInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  moduleInfoText: {
    marginLeft: 6,
    fontSize: 14,
    color: colors.secondary,
  },
  contentSection: {
    marginBottom: 24,
  },
  moduleImage: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    marginBottom: 16,
  },
  contentText: {
    fontSize: 16,
    lineHeight: 24,
    color: colors.text,
    marginBottom: 20,
  },
  keyPointsContainer: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
  },
  keyPointsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 12,
  },
  keyPoint: {
    flexDirection: 'row',
    marginBottom: 12,
    alignItems: 'flex-start',
  },
  keyPointBullet: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    marginTop: 2,
  },
  keyPointBulletText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  keyPointText: {
    flex: 1,
    fontSize: 15,
    lineHeight: 22,
    color: colors.text,
  },
  actionButtons: {
    marginTop: 24,
  },
  quizButton: {
    marginBottom: 12,
  },
  quizContainer: {
    flex: 1,
  },
  progressContainer: {
    marginBottom: 20,
  },
  progressBar: {
    height: 8,
    backgroundColor: colors.border,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 4,
  },
  progressText: {
    fontSize: 14,
    color: colors.secondary,
    textAlign: 'right',
  },
  questionContainer: {
    marginBottom: 24,
  },
  questionText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 20,
    lineHeight: 26,
  },
  optionsContainer: {
    marginBottom: 16,
  },
  optionButton: {
    padding: 16,
    borderRadius: 12,
    backgroundColor: colors.card,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  selectedOption: {
    borderColor: colors.primary,
    backgroundColor: `${colors.primary}10`,
  },
  correctOption: {
    borderColor: colors.success,
    backgroundColor: `${colors.success}10`,
  },
  incorrectOption: {
    borderColor: colors.error,
    backgroundColor: `${colors.error}10`,
  },
  optionText: {
    fontSize: 16,
    color: colors.text,
    flex: 1,
  },
  selectedOptionText: {
    color: colors.primary,
    fontWeight: '500',
  },
  correctOptionText: {
    color: colors.success,
    fontWeight: '500',
  },
  incorrectOptionText: {
    color: colors.error,
    fontWeight: '500',
  },
  optionIcon: {
    marginLeft: 8,
  },
  feedbackContainer: {
    padding: 16,
    borderRadius: 12,
    backgroundColor: colors.card,
    marginBottom: 24,
  },
  feedbackText: {
    fontSize: 16,
    marginBottom: 16,
    lineHeight: 24,
  },
  explanationText: {
    fontSize: 15,
    lineHeight: 22,
    color: colors.text,
    marginBottom: 16,
    fontStyle: 'italic',
  },
  correctFeedbackText: {
    color: colors.success,
  },
  incorrectFeedbackText: {
    color: colors.error,
  },
  nextButton: {
    alignSelf: 'flex-end',
  },
  resultsContainer: {
    alignItems: 'center',
    padding: 16,
  },
  scoreCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  scoreText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
  },
  resultTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 8,
  },
  scoreDetail: {
    fontSize: 16,
    color: colors.secondary,
    marginBottom: 24,
  },
  feedbackBox: {
    width: '100%',
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  feedbackTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 12,
  },
  feedbackContent: {
    fontSize: 16,
    lineHeight: 24,
    color: colors.text,
  },
  resultActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 16,
  },
  tryAgainButton: {
    flex: 1,
    marginRight: 8,
  },
  nextModuleButton: {
    flex: 1,
    marginLeft: 8,
  },
  questionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  difficultyBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 8,
  },
  difficultyText: {
    fontSize: 12,
    fontWeight: '500',
  },
   visualContentContainer: {
    backgroundColor: `${colors.primary}10`,
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  visualContentIcon: {
    marginRight: 10,
    marginTop: 2,
  },
  visualContentText: {
    flex: 1,
    fontSize: 14,
    color: colors.text,
    fontStyle: 'italic',
    lineHeight: 20,
  },
  practicalExampleContainer: {
    backgroundColor: `${colors.secondary}10`,
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  practicalExampleIcon: {
    marginRight: 10,
    marginTop: 2,
  },
  practicalExampleText: {
    flex: 1,
    fontSize: 14,
    color: colors.text,
    fontStyle: 'italic',
    lineHeight: 20,
  },
  learningStyleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  learningStyleText: {
    fontSize: 14,
    color: colors.primary,
    marginLeft: 8,
    fontStyle: 'italic',
  },
  nextStepsContainer: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    width: '100%',
  },
  nextStepsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 12,
  },
  nextStepsContent: {
    marginTop: 8,
  },
  nextStepItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  nextStepIcon: {
    marginRight: 10,
    marginTop: 2,
  },
  nextStepText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
    color: colors.text,
  },

});

