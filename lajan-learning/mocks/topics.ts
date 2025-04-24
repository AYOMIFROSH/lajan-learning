export interface Module {
  id: string;
  title: string;
  description: string;
  estimatedTime: number;
  points: number;
  content: string;
  keyPoints?: string[]; 
  quizQuestions?: QuizQuestion[];
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
  image?: string; 
}

// Define the quiz question interface
export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctOptionIndex: number;
  explanation: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
}

// Define the topic interface
export interface Topic {
  id: string;
  title: string;
  description: string;
  icon: string;
  color: string;
  modules: Module[];
  prerequisites?: string[];
  level: 'beginner' | 'intermediate' | 'advanced';
  requiredPoints: number;
}

// Helper function to enhance topics with key points
export function enhanceTopicsWithKeyPoints(): void {
  // Loop through each topic and add key points to modules that don't have them
  topics.forEach(topic => {
    topic.modules.forEach(module => {
      // Only add key points if they don't already exist
      if (!module.keyPoints || module.keyPoints.length === 0) {
        // Generate key points based on module title and topic
        const moduleTitle = module.title.toLowerCase();
        
        if (moduleTitle.includes('money') || moduleTitle.includes('understanding')) {
          module.keyPoints = [
            'Money serves as a medium of exchange',
            'Money is a store of value over time',
            'Money functions as a unit of account',
            'Money has evolved from physical to digital forms'
          ];
        } 
        else if (moduleTitle.includes('budget')) {
          module.keyPoints = [
            'Budgeting helps track income and expenses',
            'The 50/30/20 rule allocates income to needs, wants, and savings',
            'Regular budget reviews help adjust for changing circumstances',
            'Budgeting apps can automate the tracking process'
          ];
        }
        else if (moduleTitle.includes('saving') || moduleTitle.includes('save')) {
          module.keyPoints = [
            'Saving money is essential for financial security',
            'An emergency fund should cover 3-6 months of expenses',
            'Automating savings helps maintain consistency',
            'Different savings goals require different approaches'
          ];
        }
        else if (moduleTitle.includes('invest')) {
          module.keyPoints = [
            'Diversification spreads risk across different investments',
            'Compound interest can significantly grow investments over time',
            'Risk and return are typically correlated in investments',
            'Regular investing helps overcome market volatility'
          ];
        }
        else if (moduleTitle.includes('risk')) {
          module.keyPoints = [
            'Higher returns typically involve higher risks',
            'Risk tolerance varies based on individual circumstances',
            'Diversification helps manage investment risk',
            'Time horizon affects appropriate risk levels'
          ];
        }
        else if (moduleTitle.includes('credit')) {
          module.keyPoints = [
            'Credit scores range from 300 to 850',
            'Payment history is the most important factor in credit scores',
            'Credit utilization should be kept below 30%',
            'Regular credit report reviews help identify errors'
          ];
        }
        else if (moduleTitle.includes('debt')) {
          module.keyPoints = [
            'The debt snowball method focuses on paying smaller debts first',
            'The debt avalanche method prioritizes high-interest debts',
            'Debt consolidation combines multiple debts into one',
            'Creating a budget is essential for effective debt management'
          ];
        }
        else if (moduleTitle.includes('bank')) {
          module.keyPoints = [
            'Checking accounts are designed for frequent transactions',
            'Savings accounts are meant for accumulating money',
            'Certificates of deposit (CDs) offer higher interest for fixed terms',
            'FDIC insurance protects up to $250,000 per depositor per bank'
          ];
        }
        else if (moduleTitle.includes('tax')) {
          module.keyPoints = [
            'Tax deductions reduce your taxable income',
            'Tax credits directly reduce your tax liability',
            'Different types of income may be taxed differently',
            'Tax-advantaged accounts can help reduce tax burden'
          ];
        }
        else if (moduleTitle.includes('retirement')) {
          module.keyPoints = [
            'Traditional IRAs offer tax-deductible contributions',
            'Roth IRAs provide tax-free withdrawals in retirement',
            '401(k) plans are employer-sponsored retirement accounts',
            'Early retirement planning maximizes compound growth'
          ];
        }
        else if (moduleTitle.includes('supply') || moduleTitle.includes('demand')) {
          module.keyPoints = [
            'Supply and demand determine market prices',
            'When demand increases and supply remains constant, prices rise',
            'When supply increases and demand remains constant, prices fall',
            'Market equilibrium occurs when supply equals demand'
          ];
        }
        else {
          // Generic financial key points for any other module
          module.keyPoints = [
            'Financial literacy improves decision-making',
            'Setting specific financial goals increases success rates',
            'Regular review of financial plans is important',
            'Building good financial habits leads to long-term success'
          ];
        }
      }
    });
  });
}

// Sample topics data
export const topics: Topic[] = [
  {
    id: 'basics',
    title: 'Financial Basics',
    description: 'Learn the fundamental concepts of personal finance and money management.',
    icon: 'trending-up',
    color: '#4C6EF5',
    level: 'beginner',
    requiredPoints: 190,
    modules: [
      {
        id: 'basics-1',
        title: 'Understanding Money',
        description: 'Learn about the history and function of money in society.',
        estimatedTime: 15,
        points: 50,
        
        content: 'Money is a medium of exchange that allows people to trade goods and services...',
        keyPoints: [
          'Money is a medium of exchange.',
          'It serves as a store of value.',
          'It acts as a unit of account.'
        ],
        quizQuestions: [
          {
            id: 'q1',
            question: 'What are the three main functions of money?',
            options: [
              'Medium of exchange, store of value, unit of account',
              'Saving, spending, investing',
              'Cash, credit, digital currency',
              'Coins, bills, electronic transfers'
            ],
            correctOptionIndex: 0,
            explanation: 'Money serves as a medium of exchange for buying goods and services, a store of value for saving, and a unit of account for measuring the value of items.',
            difficulty: 'beginner'
          }
        ]
      },
      {
        id: 'basics-2',
        title: 'Budgeting 101',
        description: 'Learn how to create and maintain a personal budget.',
        estimatedTime: 20,
        points: 75,
        content: 'A budget is a plan for your money that helps you track income and expenses...',
        keyPoints: [
          'Budgeting helps you track income and expenses.',
          'The 50/30/20 rule is a popular budgeting method.',
          'A budget can help you achieve financial goals.'
        ],
        quizQuestions: [
          {
            id: 'q1',
            question: 'What is the 50/30/20 rule in budgeting?',
            options: [
              'Save 50%, spend 30%, invest 20%',
              'Needs 50%, wants 30%, savings 20%',
              'Housing 50%, food 30%, other 20%',
              'Income 50%, expenses 30%, debt 20%'
            ],
            correctOptionIndex: 1,
            explanation: 'The 50/30/20 rule suggests allocating 50% of your income to needs, 30% to wants, and 20% to savings and debt repayment.',
            difficulty: 'beginner'
          }
        ]
      },
      {
        id: 'basics-3',
        title: 'Saving Strategies',
        description: 'Discover effective ways to save money for your goals.',
        estimatedTime: 18,
        points: 65,
        content: 'Saving money is essential for financial security and achieving your goals...',
        keyPoints: [
          'Saving money is essential for financial security.',
          'An emergency fund is crucial for unexpected expenses.',
          'Automating savings can help you stay consistent.'
        ],
        quizQuestions: [
          {
            id: 'q1',
            question: 'What is an emergency fund?',
            options: [
              'Money set aside for vacations',
              'Savings for retirement',
              'Money reserved for unexpected expenses',
              'Investment in the stock market'
            ],
            correctOptionIndex: 2,
            explanation: 'An emergency fund is money set aside specifically to cover unexpected expenses like medical emergencies or sudden job loss.',
            difficulty: 'beginner'
          }
        ]
      }
    ]
  },
  // Rest of the topics array remains the same
  {
    id: 'investing',
    title: 'Investing Fundamentals',
    description: 'Learn the basics of investing and growing your wealth over time.',
    icon: 'pie-chart',
    color: '#20C997',
    level: 'intermediate',
    requiredPoints: 190,
    prerequisites: ['basics'],
    modules: [
      {
        id: 'investing-1',
        title: 'Investment Basics',
        description: 'Understand the fundamental concepts of investing.',
        estimatedTime: 25,
        points: 100,
        content: 'Investing is the act of allocating resources, usually money, with the expectation of generating income or profit...',
        keyPoints: [
          'Investing involves allocating resources for future returns.',
          'Stocks represent ownership, while bonds represent debt.',
          'Diversification reduces risk in investing.'
        ],
        quizQuestions: [
          {
            id: 'q1',
            question: 'What is the difference between stocks and bonds?',
            options: [
              'Stocks are safer, bonds are riskier',
              'Stocks represent ownership, bonds represent debt',
              'Stocks are issued by governments, bonds by companies',
              'Stocks provide fixed income, bonds provide variable returns'
            ],
            correctOptionIndex: 1,
            explanation: 'Stocks represent ownership in a company, while bonds represent a loan you make to a company or government entity.',
            difficulty: 'beginner'
          }
        ]
      },
      {
        id: 'investing-2',
        title: 'Risk and Return',
        description: 'Learn about the relationship between risk and potential returns.',
        estimatedTime: 22,
        points: 90,
        content: 'In investing, risk and return are closely related. Generally, investments with higher potential returns come with higher risks...',
        keyPoints: [
          'Higher returns often come with higher risks.',
          'Risk tolerance varies from person to person.',
          'Understanding risk is key to making informed investments.'
        ],
        quizQuestions: [
          {
            id: 'q1',
            question: 'Which investment typically has the highest risk and potential return?',
            options: [
              'Government bonds',
              'Certificates of deposit',
              'Blue-chip stocks',
              'Small-cap growth stocks'
            ],
            correctOptionIndex: 3,
            explanation: 'Small-cap growth stocks typically offer the highest potential returns but also come with the highest risk compared to the other options listed.',
            difficulty: 'intermediate'
          }
        ]
      }
    ]
  },
  {
    id: 'credit',
    title: 'Credit and Debt Management',
    description: 'Learn how to manage credit responsibly and handle debt effectively.',
    icon: 'credit-card',
    color: '#6C5CE7',
    level: 'beginner',
    requiredPoints: 175,
    prerequisites: ['basics', 'financial-literacy'],
    modules: [
      {
        id: 'credit-1',
        title: 'Understanding Credit Scores',
        description: 'Learn what credit scores are and how they impact your financial life.',
        estimatedTime: 20,
        points: 80,
        content: 'A credit score is a number that represents your creditworthiness based on your credit history...',
        keyPoints: [
          'Credit scores range from 300 to 850.',
          'Higher scores indicate better creditworthiness.',
          'Payment history is a key factor in determining credit scores.'
        ],
        quizQuestions: [
          {
            id: 'q1',
            question: 'What is the FICO score range?',
            options: [
              '0-100',
              '300-850',
              '1-10',
              '1000-2000'
            ],
            correctOptionIndex: 1,
            explanation: 'FICO scores range from 300 to 850, with higher scores indicating better creditworthiness.',
            difficulty: 'beginner'
          }
        ]
      },
      {
        id: 'credit-2',
        title: 'Managing Debt',
        description: 'Learn strategies for managing and reducing debt.',
        estimatedTime: 25,
        points: 95,
        content: 'Debt management involves developing and following a plan to repay what you owe while meeting your other financial obligations...',
        keyPoints: [
          'The debt snowball method focuses on paying off smaller debts first.',
          'Debt consolidation combines multiple debts into one loan.',
          'Creating a budget is essential for effective debt management.'
        ],
        quizQuestions: [
          {
            id: 'q1',
            question: 'What is the debt snowball method?',
            options: [
              'Paying off debts from highest to lowest interest rate',
              'Paying off debts from lowest to highest balance',
              'Paying the minimum on all debts',
              'Consolidating all debts into one loan'
            ],
            correctOptionIndex: 1,
            explanation: 'The debt snowball method involves paying off debts from smallest to largest balance, regardless of interest rate, to build momentum and motivation.',
            difficulty: 'intermediate'
          }
        ]
      }
    ]
  },
  {
    id: 'banking',
    title: 'Banking and Financial Services',
    description: 'Understand how banks work and how to use financial services effectively.',
    icon: 'landmark',
    color: '#00B894',
    level: 'beginner',
    requiredPoints: 60,
    prerequisites: [ 'investing'],
    modules: [
      {
        id: 'banking-1',
        title: 'Types of Bank Accounts',
        description: 'Learn about different types of bank accounts and their purposes.',
        estimatedTime: 15,
        points: 60,
        content: 'Banks offer various types of accounts designed for different financial needs...',
        keyPoints: [
          'Checking accounts are for frequent transactions.',
          'Savings accounts are for accumulating money over time.',
          'Certificates of deposit (CDs) offer higher interest rates for fixed terms.'
        ],
        quizQuestions: [
          {
            id: 'q1',
            question: 'What is the main difference between a checking and savings account?',
            options: [
              'Only checking accounts earn interest',
              'Only savings accounts have FDIC insurance',
              'Checking accounts are designed for frequent transactions, savings for accumulating money',
              'Checking accounts have higher interest rates than savings accounts'
            ],
            correctOptionIndex: 2,
            explanation: 'Checking accounts are designed for everyday transactions and bill payments, while savings accounts are meant for setting money aside and typically have withdrawal limitations.',
            difficulty: 'beginner'
          }
        ]
      }
    ]
  },
  {
    id: 'taxes',
    title: 'Tax Basics',
    description: 'Learn the fundamentals of taxation and strategies for tax efficiency.',
    icon: 'file-text',
    color: '#FF7675',
    level: 'intermediate',
    requiredPoints: 110,
    prerequisites: ['basics'],
    modules: [
      {
        id: 'taxes-1',
        title: 'Understanding Income Tax',
        description: 'Learn the basics of income tax and how it affects your finances.',
        estimatedTime: 30,
        points: 110,
        content: 'Income tax is a tax imposed on individuals or entities based on their income or profits...',
        keyPoints: [
          'Income tax is based on earnings from work or investments.',
          'Tax deductions reduce taxable income.',
          'Tax credits directly reduce the amount of tax owed.'
        ],
        quizQuestions: [
          {
            id: 'q1',
            question: 'What is the difference between a tax deduction and a tax credit?',
            options: [
              'They are the same thing',
              'A deduction reduces taxable income, a credit reduces tax owed directly',
              'A credit reduces taxable income, a deduction reduces tax owed directly',
              'Deductions are for businesses, credits are for individuals'
            ],
            correctOptionIndex: 1,
            explanation: 'A tax deduction reduces your taxable income, while a tax credit reduces your tax liability dollar-for-dollar.',
            difficulty: 'intermediate'
          }
        ]
      }
    ]
  },
  {
    id: 'retirement',
    title: 'Retirement Planning',
    description: 'Learn how to plan and save for a comfortable retirement.',
    icon: 'percent',
    color: '#FDCB6E',
    level: 'advanced',
    requiredPoints: 100,
    prerequisites: ['basics', 'investing'],
    modules: [
      {
        id: 'retirement-1',
        title: 'Retirement Account Types',
        description: 'Learn about different retirement accounts and their benefits.',
        estimatedTime: 25,
        points: 100,
        content: 'There are several types of retirement accounts, each with different tax advantages and rules...',
        keyPoints: [
          'Traditional IRAs offer tax-deductible contributions.',
          'Roth IRAs provide tax-free withdrawals in retirement.',
          '401(k) plans are employer-sponsored retirement accounts.'
        ],
        quizQuestions: [
          {
            id: 'q1',
            question: 'What is the main difference between a traditional IRA and a Roth IRA?',
            options: [
              'Traditional IRAs are for employees, Roth IRAs are for self-employed individuals',
              'Traditional IRAs have higher contribution limits than Roth IRAs',
              'Traditional IRA contributions are tax-deductible now, Roth IRA withdrawals are tax-free later',
              'Roth IRAs are only available to high-income earners'
            ],
            correctOptionIndex: 2,
            explanation: 'With traditional IRAs, you get a tax deduction for contributions now but pay taxes on withdrawals in retirement. With Roth IRAs, you contribute after-tax dollars now but withdrawals in retirement are tax-free.',
            difficulty: 'intermediate'
          }
        ]
      }
    ]
  },
  {
    id: 'economics',
    title: 'Economics Fundamentals',
    description: 'Understand basic economic principles and how they affect your finances.',
    icon: 'trending-up',
    color: '#74B9FF',
    level: 'intermediate',
    requiredPoints: 85,
    prerequisites: ['basics', 'investing'],
    modules: [
      {
        id: 'economics-1',
        title: 'Supply and Demand',
        description: 'Learn about the fundamental economic principle of supply and demand.',
        estimatedTime: 20,
        points: 85,
        content: 'Supply and demand is one of the most basic concepts in economics and helps explain how prices are determined in a market economy...',
        keyPoints: [
          'Supply and demand determine market prices.',
          'When demand increases and supply remains constant, prices rise.',
          'Equilibrium occurs when supply equals demand.'
        ],
        quizQuestions: [
          {
            id: 'q1',
            question: 'What typically happens to the price of a product when demand increases but supply remains the same?',
            options: [
              'Price decreases',
              'Price increases',
              'Price remains the same',
              'Price fluctuates unpredictably'
            ],
            correctOptionIndex: 1,
            explanation: 'When demand increases while supply remains constant, prices typically rise as more consumers compete for the same amount of goods.',
            difficulty: 'beginner'
          }
        ]
      }
    ]
  }
];