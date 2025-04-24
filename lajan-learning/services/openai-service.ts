import AsyncStorage from '@react-native-async-storage/async-storage';

const API_KEY = 'sk-p'; // Replace with your actual OpenAI API key
const API_URL = 'https://api.openai.com/v1/chat/completions';
const MODEL = 'gpt-3.5-turbo'; // You can also use 'gpt-4' if you have access

// Cache TTL in milliseconds (24 hours)
const CACHE_TTL = 24 * 60 * 60 * 1000;

// Maximum questions to generate per topic
const MAX_QUESTIONS = 10;
const MAX_RETRIES = 2;
const RETRY_DELAY = 1000; // 1 second delay between retries

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));


interface CacheItem {
  data: any;
  timestamp: number;
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
  visualContent?: string; // Add field for visual content description or URL
  practicalExample?: string; // Add field for practical examples
}

interface RawQuizQuestion {
  question: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
  difficulty?: string;
  visualContent?: string;
  practicalExample?: string;
}

// Use the interface when declaring the array
// Cache helpers
const getCacheKey = (prefix: string, query: string) => `${prefix}_${query.toLowerCase().trim()}`;

const getFromCache = async (key: string): Promise<any | null> => {
  try {
    const cachedData = await AsyncStorage.getItem(key);
    if (!cachedData) return null;
    
    const { data, timestamp }: CacheItem = JSON.parse(cachedData);
    const now = Date.now();
    
    // Check if cache is still valid
    if (now - timestamp < CACHE_TTL) {
      return data;
    }
    
    // Cache expired, remove it
    await AsyncStorage.removeItem(key);
    return null;
  } catch (error) {
    console.error('Cache retrieval error:', error);
    return null;
  }
};

const saveToCache = async (key: string, data: any): Promise<void> => {
  try {
    const cacheItem: CacheItem = {
      data,
      timestamp: Date.now()
    };
    await AsyncStorage.setItem(key, JSON.stringify(cacheItem));
  } catch (error) {
    console.error('Cache save error:', error);
  }
};



// OpenAI API call using fetch
const callOpenAI = async (prompt: string, systemPrompt: string = ''): Promise<string> => {
  try {
    console.log('Calling OpenAI API with prompt:', prompt.substring(0, 100) + '...');
    
    // Prepare messages array
    const messages: { role: string; content: string }[] = [];
    
    // Add system message if provided
    if (systemPrompt) {
      messages.push({
        role: 'system',
        content: systemPrompt
      });
    } else {
      // Default system prompt
      messages.push({
        role: 'system',
        content: 'You are a helpful financial education assistant.'
      });
    }
    
    // Add user message
    messages.push({
      role: 'user',
      content: prompt
    });
    
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`
      },
      body: JSON.stringify({
        model: MODEL,
        messages: messages,
        temperature: 0.7,
        max_tokens: 2000
      })
    });
    
    if (!response.ok) {
      let errorDetails = '';
      try {
        const errorData = await response.json();
        errorDetails = errorData?.error?.message || `Status: ${response.status}`;
      } catch (e) {
        errorDetails = `Status: ${response.status}`;
      }
      throw new Error(`OpenAI API error: ${errorDetails}`);
    }
    
    const data = await response.json();
    return data.choices[0].message.content;
  } catch (error) {
    console.error('OpenAI API error:', error instanceof Error ? error.message : String(error));
    throw new Error(error instanceof Error ? error.message : 'Unknown error occurred');
  }
};

const callOpenAIWithRetry = async (prompt: string, systemPrompt: string = '', retries = MAX_RETRIES): Promise<string> => {
  try {
    return await callOpenAI(prompt, systemPrompt);
  } catch (error) {
    console.error('OpenAI API error with retries remaining:', retries, error);
    
    if (retries <= 0) {
      console.error('Max retries reached, failing request');
      throw error;
    }
    
    // Check if the error is a network error or OpenAI API error
    const errorMessage = error instanceof Error ? error.message : String(error);
    const isNetworkError = 
      errorMessage.includes('Network request failed') || 
      errorMessage.includes('timeout') ||
      errorMessage.includes('connection') ||
      errorMessage.includes('ECONNREFUSED');
    
    if (isNetworkError) {
      console.log(`Network error detected, retrying (${MAX_RETRIES - retries + 1}/${MAX_RETRIES})...`);
      await delay(RETRY_DELAY * (MAX_RETRIES - retries + 1)); // Exponential backoff
      return callOpenAIWithRetry(prompt, systemPrompt, retries - 1);
    } else {
      // Not a network error, don't retry
      throw error;
    }
  }
};

// Function to get financial information about a specific term
export const getFinancialInfo = async (query: string): Promise<string> => {
  try {
    // Check cache first
    const cacheKey = getCacheKey('financial_info', query);
    const cachedData = await getFromCache(cacheKey);
    
    if (cachedData) {
      console.log('Retrieved financial info from cache:', cacheKey);
      return cachedData;
    }
    
    // Create system prompt for financial information
    const systemPrompt = 'You are a financial education expert. Provide clear, detailed, and accurate information about financial concepts. Focus on being educational, informative, and accessible to people learning about finance.';
    
    // Create user prompt for the term
    const prompt = `Provide a comprehensive explanation of the financial term or concept "${query}". 
Include:
- A clear definition
- How it works in practice
- Why it's important in finance
- Any key points someone should understand about it

Keep your explanation educational and accessible for someone learning about finance.`;

    try {
      // Call OpenAI for information
      const infoText = await callOpenAI(prompt, systemPrompt);
      
      // Cache the result
      await saveToCache(cacheKey, infoText);
      
      return infoText;
    } catch (error) {
      console.error('Error getting financial info from OpenAI:', error instanceof Error ? error.message : String(error));
      throw error;
    }
  } catch (error) {
    console.error('Error in getFinancialInfo:', error instanceof Error ? error.message : String(error));
    
    // Return a fallback explanation
    return getMockFinancialInfo(query);
  }
};

// Provide mock financial information as fallback
const getMockFinancialInfo = (query: string): string => {
  const term = query.toLowerCase();
  
  if (term.includes('compound interest')) {
    return "Compound interest is the addition of interest to the principal sum of a loan or deposit, or in other words, interest on interest. It is the result of reinvesting interest, rather than paying it out, so that interest in the next period is then earned on the principal sum plus previously accumulated interest. Compound interest is standard in finance and economics.\n\nThe formula for compound interest is A = P(1 + r/n)^(nt), where A is the final amount, P is the principal (initial investment), r is the interest rate (decimal), n is the number of times interest is compounded per time period, and t is the time the money is invested.\n\nCompound interest is powerful for growing wealth over time, especially for long-term investments like retirement accounts. This is why financial advisors often emphasize the importance of starting to save early, as even small amounts can grow significantly over decades due to compounding.";
  } 
  else if (term.includes('diversification')) {
    return "Diversification is a risk management strategy that mixes a wide variety of investments within a portfolio. The rationale behind this technique is that a portfolio constructed of different kinds of assets will, on average, yield higher long-term returns and lower the risk of any individual holding or security.\n\nThe key principle is that different asset classes often perform differently under various market conditions. For example, when stocks are performing poorly, bonds might be stable or increasing in value. By spreading investments across various asset types, industries, and geographic regions, investors can reduce the impact of volatility on their portfolio.\n\nDiversification includes investing across various asset classes (stocks, bonds, real estate, commodities), within asset classes (different sectors and industries for stocks), and geographically (domestic and international markets). Modern portfolio theory suggests that there is an optimal mix of investments that will provide the highest return for a given level of risk.";
  }
  else if (term.includes('stock') || term.includes('share')) {
    return "A stock, also known as a share or equity, represents ownership in a company. When you purchase a stock, you're buying a small piece of that company, which makes you a shareholder. Companies issue stocks to raise capital for various purposes such as funding growth, paying off debt, or launching new products.\n\nStocks are typically bought and sold on stock exchanges, such as the New York Stock Exchange (NYSE) or NASDAQ. The price of a stock fluctuates based on supply and demand, which is influenced by factors including company performance, industry trends, economic conditions, and investor sentiment.\n\nAs a shareholder, you may benefit in two ways: through capital appreciation (when the stock price increases) and through dividends (distributions of the company's profits). However, stocks also carry risk, as their value can decrease, potentially resulting in losses. Different types of stocks exist, including common stocks (which typically provide voting rights) and preferred stocks (which usually offer fixed dividends but no voting rights).\n\nStocks are a fundamental component of many investment portfolios and have historically provided higher returns than many other investment types over the long term, though with higher volatility.";
  }
  else if (term.includes('bond')) {
    return "A bond is a fixed-income security that represents a loan made by an investor to a borrower, typically corporate or governmental entities. When you buy a bond, you're essentially lending money to the issuer for a specified period of time at a fixed interest rate, known as the coupon rate.\n\nThe bond issuer promises to pay interest regularly (usually semi-annually) and to return the principal or face value of the bond when it matures (the maturity date). Bonds are considered less risky than stocks because they provide regular income and return of principal at maturity, though they generally offer lower returns over the long term.\n\nBond prices have an inverse relationship with interest rates—when rates rise, bond prices typically fall, and vice versa. This is because newer bonds will be issued at the higher prevailing interest rates, making the older, lower-rate bonds less attractive unless their price drops.\n\nDifferent types of bonds include government bonds (e.g., U.S. Treasury bonds), municipal bonds issued by state or local governments, corporate bonds issued by companies, and high-yield or 'junk' bonds which offer higher returns but with greater risk. Bonds play an important role in portfolio diversification and can provide stability, especially for investors approaching retirement.";
  }
  else if (term.includes('mutual fund')) {
    return "A mutual fund is an investment vehicle that pools money from many investors to purchase a diversified portfolio of stocks, bonds, or other securities. Mutual funds are operated by professional money managers who allocate the fund's assets and attempt to produce capital gains or income for the fund's investors.\n\nInvestors buy shares in mutual funds, with each share representing partial ownership of the fund's holdings and the income those holdings generate. The price of a mutual fund share is referred to as the net asset value (NAV) per share, which is calculated by dividing the total value of all the securities in the portfolio by the number of outstanding shares.\n\nMutual funds offer several advantages, including professional management, diversification, liquidity, and convenience. They allow individual investors to gain exposure to a broad range of securities with a relatively small investment, which helps reduce risk through diversification.\n\nDifferent types of mutual funds include equity funds (investing primarily in stocks), fixed-income funds (focusing on bonds), money market funds (investing in short-term debt securities), and balanced funds (mixing stocks, bonds, and other securities). Each type has its own risk profile and investment objectives, allowing investors to choose funds that align with their financial goals and risk tolerance.";
  }
  else if (term.includes('inflation')) {
    return "Inflation is the rate at which the general level of prices for goods and services rises, causing purchasing power to fall over time. It's typically measured as an annual percentage increase in a broad price index, such as the Consumer Price Index (CPI) or the Personal Consumption Expenditures Price Index (PCE).\n\nWhen inflation occurs, each unit of currency buys fewer goods and services than it did previously. For example, if the annual inflation rate is 3%, then a basket of goods and services that cost $100 in one year will cost $103 the next year.\n\nInflation can be caused by various factors, including increased production costs, higher demand for goods and services, expansionary monetary policy (when central banks increase the money supply), or supply chain disruptions. Central banks like the Federal Reserve aim to maintain price stability, often targeting an inflation rate of around 2%.\n\nFor consumers, inflation erodes purchasing power, particularly affecting those with fixed incomes. For investors, it's crucial to ensure that investment returns outpace inflation to preserve wealth in real terms. Assets that have historically helped protect against inflation include stocks, inflation-protected securities (like TIPS), real estate, and certain commodities.";
  }
  else if (term.includes('roth ira') || term.includes('traditional ira')) {
    return "Individual Retirement Accounts (IRAs) are tax-advantaged savings accounts designed to help individuals save for retirement. The two most common types are Traditional IRAs and Roth IRAs, each with distinct tax benefits.\n\nA Traditional IRA allows for tax-deductible contributions, meaning you can reduce your taxable income in the year you make contributions. The investments in the account grow tax-deferred, and you pay income tax on withdrawals during retirement. Early withdrawals before age 59½ typically incur a 10% penalty plus income tax on the amount withdrawn, with some exceptions.\n\nA Roth IRA, on the other hand, is funded with after-tax dollars, so contributions are not tax-deductible. However, qualified withdrawals in retirement are completely tax-free, including all earnings. Additionally, you can withdraw your contributions (but not earnings) at any time without penalties or taxes.\n\nBoth IRA types have annual contribution limits ($6,500 for 2023, with an additional $1,000 catch-up contribution for those 50 and older) and various eligibility requirements based on income and other factors. The choice between Traditional and Roth often depends on whether you expect to be in a higher or lower tax bracket in retirement than you are currently.";
  }
  else {
    return `${query} is an important financial concept that relates to how money is managed, invested, or utilized within the economic system. Understanding this and other financial terms is crucial for making informed decisions about your personal finances, investments, and long-term financial planning.\n\nFinancial literacy encompasses knowledge of various concepts, tools, and strategies that help individuals navigate their financial lives effectively. This includes budgeting, saving, investing, managing debt, and planning for future financial needs such as education, home ownership, and retirement.\n\nTo deepen your understanding of financial concepts like ${query}, consider exploring educational resources from reputable financial institutions, taking financial literacy courses, or consulting with financial advisors who can provide guidance tailored to your specific situation.`;
  }
};

// Function to generate quiz questions based on module content
// Add this function to randomize the position of answer options
const randomizeAnswerPositions = (questions: QuizQuestion[]): QuizQuestion[] => {
  return questions.map(question => {
    // Create a copy of the options array
    const originalOptions = [...question.options];
    const correctAnswer = question.correctAnswer;
    
    // Create a new randomized options array
    const randomizedOptions: string[] = [];
    const tempOptions = [...originalOptions];
    
    // Randomly select options until the array is empty
    while (tempOptions.length > 0) {
      const randomIndex = Math.floor(Math.random() * tempOptions.length);
      randomizedOptions.push(tempOptions[randomIndex]);
      tempOptions.splice(randomIndex, 1);
    }
    
    // Return the question with randomized options
    return {
      ...question,
      options: randomizedOptions,
      correctAnswer: correctAnswer
    };
  });
};

// Enhanced getQuizQuestions function for openai-service.ts
// Enhanced getQuizQuestions function with learning style parameter
export const getQuizQuestions = async (
  moduleTitle: string, 
  moduleContent: string, 
  keyPoints?: string[],
  forceRefresh: boolean = true,
  difficultyLevel: string = 'all',
  learningStyle?: 'visual' | 'practical' // Add learning style parameter
): Promise<QuizQuestion[]> => {
  try {
    console.log('Generating quiz questions for:', moduleTitle);
    console.log('Using difficulty level:', difficultyLevel);
    console.log('Using learning style:', learningStyle || 'not specified');
    console.log('Using keypoints count:', keyPoints?.length || 0);
    
    // Use a unique cache key when force refresh is enabled
    // Include learning style in the cache key as well
    const keyPointsHash = keyPoints ? 
      keyPoints.join('').replace(/\s+/g, '').slice(0, 20) : 'nokeypoints';
    const timestamp = forceRefresh ? Date.now().toString() : '';
    const learningStyleParam = learningStyle ? `_${learningStyle}` : '';
    const cacheKey = getCacheKey(
      'quiz_questions', 
      `${moduleTitle}_${difficultyLevel}${learningStyleParam}_${keyPointsHash}${timestamp ? '_' + timestamp : ''}`
    );
    
    // Only check cache if not forcing refresh
    if (!forceRefresh) {
      const cachedData = await getFromCache(cacheKey);
      if (cachedData) {
        console.log('Retrieved quiz questions from cache:', cacheKey);
        // Randomize the answer positions even for cached questions
        return randomizeAnswerPositions(cachedData);
      }
    } else {
      console.log('Force refreshing questions - generating new set with difficulty level:', difficultyLevel);
    }
    
    // Create system prompt for quiz generation with emphasis on proper JSON formatting
    // Include the difficulty level in the system prompt
    let difficultyPrompt = '';
    if (difficultyLevel === 'beginner') {
      difficultyPrompt = 'Generate ONLY beginner-level questions (Level 1) that are accessible to someone new to this topic.';
    } else if (difficultyLevel === 'intermediate') {
      difficultyPrompt = 'Generate ONLY intermediate-level questions (Level 2) that assume some basic knowledge of the topic.';
    } else if (difficultyLevel === 'advanced') {
      difficultyPrompt = 'Generate ONLY advanced-level questions (Level 3) that challenge someone with good knowledge of the topic.';
    }
    
    // Add learning style guidance to system prompt
    let learningStylePrompt = '';
    if (learningStyle === 'visual') {
      learningStylePrompt = 'The user prefers visual learning. For each question, include a visualContent field with a text description of a relevant chart, diagram, or image that would help illustrate the concept. Focus on spatial relationships, graphics, and visual representations of data or concepts.';
    } else if (learningStyle === 'practical') {
      learningStylePrompt = 'The user prefers practical learning. For each question, include a practicalExample field with a real-world example or practical application of the concept being tested. Focus on how concepts apply to real-life situations and hands-on learning.';
    }
    
    const systemPrompt = `You are an expert in financial education creating quiz questions for a learning app. 
${difficultyLevel !== 'all' ? difficultyPrompt : 'Generate a mix of beginner, intermediate, and advanced questions.'}
${learningStylePrompt}
IMPORTANT: Your response must be a valid JSON array with no markdown formatting. Do not wrap your response in backticks or code blocks. The response should start with "[" and end with "]". Vary the position of correct answers - don't make them predictable.`;
    
    // Prepare the prompt for OpenAI with enhanced instructions for dynamic keypoints
    let prompt = `Generate ${MAX_QUESTIONS} multiple-choice quiz questions for a financial education app about "${moduleTitle}".

Module Content: ${moduleContent}
`;

    // Add enhanced instructions for handling dynamic keypoints
    if (keyPoints && keyPoints.length > 0) {
      prompt += `\nKey Points and Insights:\n${keyPoints.map(point => `- ${point}`).join('\n')}

IMPORTANT: Use the key points provided as a foundation for creating questions, but don't limit yourself to only testing these specific points. The key points include a mix of core concepts, insights, and related perspectives to help you understand the topic's scope. Create questions that:
1. Test understanding of the core concepts mentioned in the key points
2. Apply these concepts to realistic financial scenarios
3. Connect these concepts to broader financial principles
4. Evaluate understanding at different levels of complexity
`;
    }

    // Add difficulty-specific instructions
    if (difficultyLevel !== 'all') {
      prompt += `\n\nIMPORTANT: The questions must be ${difficultyLevel} level (${
        difficultyLevel === 'beginner' ? 'Level 1' : 
        difficultyLevel === 'intermediate' ? 'Level 2' : 'Level 3'
      }).`;
      
      if (difficultyLevel === 'beginner') {
        prompt += ` These questions should be accessible to someone just starting to learn about this topic with no prior knowledge. Focus on basic definitions, simple concepts, and straightforward applications.`;
      } else if (difficultyLevel === 'intermediate') {
        prompt += ` These questions should be moderately challenging and assume basic knowledge of financial concepts. Include questions that require applying concepts to situations and making connections between related ideas.`;
      } else if (difficultyLevel === 'advanced') {
        prompt += ` These questions should be challenging and test deeper understanding and application of the concepts. Include complex scenarios, nuanced distinctions, and questions requiring synthesis of multiple concepts.`;
      }
    }

    // Add learning style-specific instructions
    if (learningStyle === 'visual') {
      prompt += `\n\nIMPORTANT: The user prefers VISUAL learning. For each question:
1. Include visual elements where possible (described in text)
2. Add a "visualContent" field describing a chart, diagram, or image that would help illustrate the concept
3. Frame questions in terms of visual relationships, patterns, or graphical representations
4. Use scenarios that involve interpreting visual financial information like charts, graphs, or diagrams`;
    } else if (learningStyle === 'practical') {
      prompt += `\n\nIMPORTANT: The user prefers PRACTICAL learning. For each question:
1. Include real-world examples and practical applications
2. Add a "practicalExample" field with a concrete, real-life application of the concept
3. Frame questions in terms of problem-solving scenarios
4. Use examples that show how the financial concept works in everyday situations
5. Emphasize the practical utility and application of knowledge over theory`;
    }

    prompt += `\n
For each question, provide:
1. The question itself
2. Four answer options (make them reasonably challenging - don't make the wrong answers obviously incorrect)
3. The correct answer (must be exactly one of the options)
4. A brief explanation of why the correct answer is right (and if helpful, why the others are wrong)
5. The difficulty level: "${difficultyLevel === 'all' ? '<varies>' : difficultyLevel}"
${learningStyle === 'visual' ? '6. A visualContent field describing a relevant visual aid' : ''}
${learningStyle === 'practical' ? '6. A practicalExample field with a real-world application' : ''}

IMPORTANT: 
- Your response must be ONLY a valid JSON array with no markdown formatting, code blocks, or explanatory text.
- DO NOT wrap your response in \`\`\` or \`\`\`json.
- The response should start with "[" and end with "]".
- VARY the position of the correct answer randomly - don't always put it in the same position.
- Make sure there is variety in the question types${difficultyLevel === 'all' ? ' and difficulty levels' : ''}.
- Create questions that test different cognitive levels: recall, comprehension, application, and analysis.
- IMPORTANT: Ensure the questions actually test understanding of the subject matter rather than just memorization of terminology.

Format each question as an object with these properties:
- question: string
- options: array of 4 strings
- correctAnswer: string (matching exactly one of the options)
- explanation: string
- difficulty: string (${difficultyLevel === 'all' ? '"beginner", "intermediate", or "advanced"' : `"${difficultyLevel}"`})
${learningStyle === 'visual' ? '- visualContent: string (description of a chart/diagram/visual that would help)' : ''}
${learningStyle === 'practical' ? '- practicalExample: string (a real-world application example)' : ''}

Example format (your response should look exactly like this, but with your own content):
[
  {
    "question": "What is the main purpose of budgeting?",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correctAnswer": "Option B",
    "explanation": "Explanation here",
    "difficulty": "${difficultyLevel === 'all' ? 'beginner' : difficultyLevel}"${learningStyle === 'visual' ? ',\n    "visualContent": "A pie chart showing typical budget allocation between needs, wants, and savings"' : ''}${learningStyle === 'practical' ? ',\n    "practicalExample": "A family using a monthly budget to save for a vacation by tracking expenses"' : ''}
  }
]`;

    try {
      // Call OpenAI to generate questions
      const response = await callOpenAIWithRetry(prompt, systemPrompt);
      
      // Extract JSON from response with improved handling for markdown code blocks
      let jsonStr = response;
      
      // Handle response wrapped in code blocks (```json ... ```)
      if (response.includes('```')) {
        const codeBlockMatch = response.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
        if (codeBlockMatch && codeBlockMatch[1]) {
          jsonStr = codeBlockMatch[1].trim();
          console.log('Extracted JSON from code block');
        }
      }
      
      // Ensure the string starts with [ and ends with ]
      const jsonArrayMatch = jsonStr.match(/\[\s*[\s\S]*\]\s*/);
      if (jsonArrayMatch) {
        jsonStr = jsonArrayMatch[0].trim();
        console.log('Extracted JSON array from response');
      }
      
      let questions;
      
      try {
        questions = JSON.parse(jsonStr);
        console.log(`Successfully parsed JSON with ${questions.length} questions`);
      } catch (parseError) {
        console.error('JSON parse error:', parseError);
        
        // Try more aggressive JSON extraction
        const lastResortMatch = response.match(/\[\s*\{[\s\S]*\}\s*\]/);
        if (lastResortMatch) {
          try {
            questions = JSON.parse(lastResortMatch[0]);
            console.log('Successfully parsed JSON with aggressive extraction');
          } catch (secondaryError) {
            console.error('Secondary JSON parse error:', secondaryError);
            console.log('Received text that could not be parsed:', jsonStr.substring(0, 500) + '...');
            throw new Error('Failed to parse OpenAI response as JSON');
          }
        } else {
          console.log('Received text:', jsonStr.substring(0, 500) + '...');
          throw new Error('Failed to parse OpenAI response as JSON');
        }
      }
      
      // Validate questions to ensure they match our expected format
      if (!Array.isArray(questions)) {
        console.error('Parsed JSON is not an array');
        throw new Error('OpenAI response is not in the expected format (array)');
      }
      
      // Filter questions by difficulty if needed
      let filteredQuestions = questions;
      if (difficultyLevel !== 'all') {
        filteredQuestions = questions.filter(q => 
          q.difficulty === difficultyLevel || !q.difficulty // Include questions with no difficulty set
        );
        
        // If we filtered out all questions, fall back to the original set
        if (filteredQuestions.length === 0) {
          console.log('No questions matched the requested difficulty level, using all questions');
          filteredQuestions = questions;
        }
      }
      
      // Check that each question has the required properties
      filteredQuestions.forEach((q, i) => {
        if (!q.question || !q.options || !Array.isArray(q.options) || 
            q.options.length < 2 || !q.correctAnswer || !q.explanation) {
          console.error(`Question ${i} is missing required properties:`, q);
        }
        
        // Ensure difficulty is set
        if (!q.difficulty && difficultyLevel !== 'all') {
          q.difficulty = difficultyLevel;
        } else if (!q.difficulty) {
          q.difficulty = 'beginner'; // Default to beginner if not specified
        }
      });
      
      // Validate and format questions - ensure no duplicate questions are included
      const dedupedQuestions: RawQuizQuestion[] = [];
      const questionTexts = new Set();
      
      for (const q of filteredQuestions) {
        // Skip duplicate questions (based on question text)
        if (questionTexts.has(q.question)) {
          continue;
        }
        
        questionTexts.add(q.question);
        dedupedQuestions.push(q);
        
        // Stop once we have enough questions
        if (dedupedQuestions.length >= MAX_QUESTIONS) {
          break;
        }
      }
      
      const formattedQuestions: QuizQuestion[] = dedupedQuestions.map((q, index) => ({
        id: `${moduleTitle.replace(/\s+/g, '-').toLowerCase()}-q${index + 1}-${Date.now()}`, // Add timestamp to make ID unique
        question: q.question,
        options: q.options,
        correctAnswer: q.correctAnswer,
        explanation: q.explanation,
        difficulty: (q.difficulty as 'beginner' | 'intermediate' | 'advanced') || (difficultyLevel !== 'all' ? (difficultyLevel as 'beginner' | 'intermediate' | 'advanced') : 'beginner'),
        visualContent: q.visualContent, // Include visual content if provided
        practicalExample: q.practicalExample // Include practical example if provided
      }));
      
      // Further randomize the answer positions
      const randomizedQuestions = randomizeAnswerPositions(formattedQuestions);
      
      // Cache the questions if needed (even with force refresh, we might want to cache briefly)
      await saveToCache(cacheKey, randomizedQuestions);
      
      return randomizedQuestions;
    } catch (error) {
      console.error('Error generating or parsing questions:', error instanceof Error ? error.message : String(error));
      throw error;
    }
  } catch (error) {
    console.error('Error in getQuizQuestions:', error instanceof Error ? error.message : String(error));
    
    // Return default questions as fallback, filtered by the requested difficulty
    // Now including visual content or practical examples based on learning style
    const defaultQuestions = [
      {
        id: `${moduleTitle.replace(/\s+/g, '-').toLowerCase()}-q1-${Date.now()}`,
        question: "What is the main purpose of budgeting?",
        options: ["To track expenses", "To plan finances", "To save money", "All of the above"],
        correctAnswer: "All of the above",
        explanation: "Budgeting helps in tracking expenses, planning finances, and saving money effectively.",
        difficulty: "beginner",
        visualContent: learningStyle === 'visual' ? "A pie chart showing budget allocation between needs (50%), wants (30%), and savings (20%)." : undefined,
        practicalExample: learningStyle === 'practical' ? "A family setting up a monthly budget worksheet to track income and expenses, allowing them to save for a summer vacation." : undefined
      },
      {
        id: `${moduleTitle.replace(/\s+/g, '-').toLowerCase()}-q2-${Date.now()}`,
        question: "What is an emergency fund?",
        options: [
          "Money set aside for vacations",
          "Investments in the stock market",
          "Savings for unexpected expenses",
          "Money used for daily expenses"
        ],
        correctAnswer: "Savings for unexpected expenses",
        explanation: "An emergency fund is money set aside specifically to cover unexpected expenses like medical emergencies or sudden job loss.",
        difficulty: "beginner",
        visualContent: learningStyle === 'visual' ? "A bar graph showing recommended emergency fund amounts for different household sizes, typically 3-6 months of expenses." : undefined,
        practicalExample: learningStyle === 'practical' ? "Sarah lost her job unexpectedly but was able to pay her rent and bills for 4 months using her emergency fund while she searched for new employment." : undefined
      },
      {
        id: `${moduleTitle.replace(/\s+/g, '-').toLowerCase()}-q3-${Date.now()}`,
        question: "What is the rule of 72 in finance?",
        options: [
          "A law requiring 72% of income to be saved",
          "A formula to estimate how long it takes for money to double",
          "A tax rule allowing deduction of 72% of investment losses",
          "A banking regulation limiting interest rates to 72%"
        ],
        correctAnswer: "A formula to estimate how long it takes for money to double",
        explanation: "The Rule of 72 is a simple way to determine how long an investment will take to double given a fixed annual rate of interest. You divide 72 by the annual rate of return.",
        difficulty: "intermediate",
        visualContent: learningStyle === 'visual' ? "A line graph showing investment growth over time with different interest rates, illustrating how the rule of 72 works." : undefined,
        practicalExample: learningStyle === 'practical' ? "Calculating that a retirement account with 8% annual returns will double approximately every 9 years (72 ÷ 8 = 9)." : undefined
      },
      {
        id: `${moduleTitle.replace(/\s+/g, '-').toLowerCase()}-q4-${Date.now()}`,
        question: "What is the difference between a traditional IRA and a Roth IRA?",
        options: [
          "There is no difference",
          "Traditional IRAs are taxed on withdrawal, Roth IRAs are taxed on contribution",
          "Roth IRAs have higher contribution limits",
          "Traditional IRAs can only be opened by employees"
        ],
        correctAnswer: "Traditional IRAs are taxed on withdrawal, Roth IRAs are taxed on contribution",
        explanation: "With traditional IRAs, contributions are tax-deductible now but distributions in retirement are taxable. With Roth IRAs, contributions are made with after-tax dollars, but qualified distributions in retirement are tax-free.",
        difficulty: "intermediate",
        visualContent: learningStyle === 'visual' ? "A side-by-side comparison chart showing the tax treatment, contribution limits, and withdrawal rules for Traditional vs Roth IRAs." : undefined,
        practicalExample: learningStyle === 'practical' ? "John contributes $6,000 to his Traditional IRA, reducing his taxable income this year. Meanwhile, Maria contributes $6,000 to her Roth IRA using after-tax money, but will pay no taxes when she withdraws the money in retirement." : undefined
      },
      {
        id: `${moduleTitle.replace(/\s+/g, '-').toLowerCase()}-q5-${Date.now()}`,
        question: "Which of the following is NOT typically considered a defensive stock?",
        options: [
          "Utilities",
          "Consumer staples",
          "Technology",
          "Healthcare"
        ],
        correctAnswer: "Technology",
        explanation: "Technology stocks are generally considered growth or cyclical stocks rather than defensive stocks. Defensive stocks typically maintain stability during economic downturns.",
        difficulty: "advanced",
        visualContent: learningStyle === 'visual' ? "A scatter plot showing stock volatility vs. market performance during recessions, with defensive stocks clustered in the low-volatility area and technology stocks showing higher volatility." : undefined,
        practicalExample: learningStyle === 'practical' ? "During the 2008 recession, utility companies like Duke Energy maintained relatively stable stock prices and continued paying dividends, while many technology companies saw their values decline significantly." : undefined
      },
      {
        id: `${moduleTitle.replace(/\s+/g, '-').toLowerCase()}-q6-${Date.now()}`,
        question: "What is the primary risk associated with investing in long-term bonds?",
        options: [
          "Default risk",
          "Interest rate risk",
          "Currency risk",
          "Political risk"
        ],
        correctAnswer: "Interest rate risk",
        explanation: "Long-term bonds are particularly sensitive to interest rate changes. When interest rates rise, bond prices fall, with longer duration bonds experiencing greater price declines.",
        difficulty: "advanced",
        visualContent: learningStyle === 'visual' ? "A graph showing the inverse relationship between bond prices and interest rates, with long-term bonds showing steeper price declines when rates rise." : undefined,
        practicalExample: learningStyle === 'practical' ? "An investor who purchased a 30-year Treasury bond yielding 3% saw its market value drop by 20% when interest rates rose to 5%, even though the bond still pays the same 3% on its face value." : undefined
      }
    ];
    
    // Filter questions by requested difficulty level
    let filteredQuestions = defaultQuestions;
    if (difficultyLevel !== 'all') {
      filteredQuestions = defaultQuestions.filter(q => q.difficulty === difficultyLevel);
      // If no questions match the difficulty, return all questions
      if (filteredQuestions.length === 0) {
        filteredQuestions = defaultQuestions;
      }
    }
    
    // Randomize the positions of the answers
    return randomizeAnswerPositions(
      filteredQuestions.map(question => ({
        ...question,
        difficulty: question.difficulty as 'beginner' | 'intermediate' | 'advanced' | undefined
      }))
    );
  }
};

// Enhanced version of generateQuizFeedback to reference keypoints and learning style in feedback
export const generateQuizFeedback = async (
  moduleTitle: string,
  score: number,
  totalQuestions: number,
  keyPoints?: string[], // Add optional keyPoints parameter
  learningStyle?: 'visual' | 'practical' // Add optional learning style parameter
): Promise<string> => {
  try {
    const percentage = Math.round((score / totalQuestions) * 100);
    
    // Use keyPoints and learning style in cache key if provided
    const keyPointsHash = keyPoints && keyPoints.length > 0 ? 
      keyPoints.join('').replace(/\s+/g, '').slice(0, 20) : '';
    const learningStyleParam = learningStyle ? `_${learningStyle}` : '';
    const cacheKey = getCacheKey('quiz_feedback', `${moduleTitle}_${percentage}${learningStyleParam}_${keyPointsHash}`);
    
    // Check cache first
    const cachedData = await getFromCache(cacheKey);
    if (cachedData) {
      console.log('Retrieved feedback from cache:', cacheKey);
      return cachedData;
    }
    
    // Create system prompt for feedback generation - include learning style if available
    let systemPrompt = 'You are a supportive financial education coach providing personalized feedback to students.';
    
    if (learningStyle === 'visual') {
      systemPrompt += ' You understand the student prefers visual learning, so you reference visual metaphors, mental pictures, and graphical concepts in your feedback.';
    } else if (learningStyle === 'practical') {
      systemPrompt += ' You understand the student prefers practical learning, so you reference real-world applications, actionable steps, and practical examples in your feedback.';
    }
    
    // Create enhanced prompt for OpenAI that references keypoints if available
    let prompt = `Generate personalized feedback for a user who completed a quiz on "${moduleTitle}" and scored ${score} out of ${totalQuestions} questions (${percentage}%).
The feedback should be encouraging, mention their performance, and provide tips for improvement if needed.`;

    // Add learning style reference
    if (learningStyle === 'visual') {
      prompt += `\n\nThis user prefers VISUAL learning. Your feedback should:
- Use visual language and metaphors (e.g., "picture this", "visualize", "see how")
- Reference charts, diagrams, or other visual aids that would help them understand
- Suggest visual ways to reinforce the concepts (like drawing mind maps or watching videos)
- Frame concepts in terms of patterns, colors, or spatial relationships`;
    } else if (learningStyle === 'practical') {
      prompt += `\n\nThis user prefers PRACTICAL learning. Your feedback should:
- Focus on real-world applications of the concepts
- Provide actionable, concrete next steps they can take
- Include examples of how the knowledge applies to everyday financial situations
- Suggest hands-on activities to reinforce learning (like creating a real budget)
- Emphasize the practical utility of what they've learned`;
    }

    // Add keypoints reference if available
    if (keyPoints && keyPoints.length > 0) {
      prompt += `\n\nHere are the key learning points from this module that you can reference in your feedback:
${keyPoints.slice(0, 5).map(point => `- ${point}`).join('\n')}`;
    }

    prompt += `\n\nKeep the feedback concise (2-3 paragraphs) and actionable. If they did well, suggest how they can apply this knowledge. If they need improvement, suggest specific concepts to review.`;

    try {
      // Call OpenAI for feedback
      const feedbackText = await callOpenAIWithRetry(prompt, systemPrompt);
      
      // Cache the feedback
      await saveToCache(cacheKey, feedbackText);
      
      return feedbackText;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error('Error getting feedback from OpenAI:', errorMessage);
      throw new Error(errorMessage);
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('Error generating quiz feedback:', errorMessage);
    
    // Fallback feedback
    const percentage = Math.round((score / totalQuestions) * 100);
    
    // Include learning style in fallback feedback if available
    if (percentage >= 80) {
      if (learningStyle === 'visual') {
        return `Excellent work on the ${moduleTitle} quiz! You've demonstrated a strong understanding of the key concepts. Try creating a mind map or visual diagram of these concepts to further solidify your understanding. Visualizing these connections will help you build a complete picture of the topic.`;
      } else if (learningStyle === 'practical') {
        return `Excellent work on the ${moduleTitle} quiz! You've demonstrated a strong understanding of the key concepts. Now, try applying these principles to your own financial situation. Taking practical steps to implement what you've learned will reinforce your knowledge and provide real-world benefits.`;
      } else {
        return `Excellent work on the ${moduleTitle} quiz! You've demonstrated a strong understanding of the key concepts. Keep up the great work and continue building on this knowledge!`;
      }
    } else if (percentage >= 60) {
      if (learningStyle === 'visual') {
        return `Good job on the ${moduleTitle} quiz! You understand most of the concepts, but there's still room for improvement. Try finding or creating visual aids for the concepts you found challenging - charts, diagrams, or even simple sketches can help you see the relationships between ideas more clearly.`;
      } else if (learningStyle === 'practical') {
        return `Good job on the ${moduleTitle} quiz! You understand most of the concepts, but there's still room for improvement. Try applying the concepts you found most challenging to a real-world scenario - this hands-on practice will help solidify your understanding.`;
      } else {
        return `Good job on the ${moduleTitle} quiz! You understand most of the concepts, but there's still room for improvement. Consider reviewing the sections you found challenging and try again later.`;
      }
    } else {
      if (learningStyle === 'visual') {
        return `Thank you for completing the ${moduleTitle} quiz. Consider reviewing the material again, perhaps using visual aids like diagrams, charts, or educational videos that can help you see the concepts more clearly. Creating flashcards with visual cues might also help strengthen your understanding.`;
      } else if (learningStyle === 'practical') {
        return `Thank you for completing the ${moduleTitle} quiz. Consider reviewing the material again and try to find practical examples or real-world applications for each key concept. Working through practical exercises or scenarios can help you understand how these financial principles apply in everyday situations.`;
      } else {
        return `Thank you for completing the ${moduleTitle} quiz. Consider reviewing the material again to strengthen your understanding of these important financial concepts. Don't be discouraged - financial literacy is a journey!`;
      }
    }
  }
};