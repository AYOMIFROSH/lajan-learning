import { v4 as uuidv4 } from 'uuid';

export interface FinancialTerm {
  id: string;
  term: string;
  definition: string;
  category: string;
  relatedTopic?: string;
  examples?: string[];
}

export const financialTerms: FinancialTerm[] = [
  {
    id: uuidv4(),
    term: "401(k)",
    definition: "A retirement savings plan sponsored by an employer that lets workers save and invest a piece of their paycheck before taxes are taken out.",
    category: "investing",
    relatedTopic: "retirement-planning",
    examples: [
      "Traditional 401(k) - Contributions are pre-tax",
      "Roth 401(k) - Contributions are after-tax"
    ]
  },
  {
    id: uuidv4(),
    term: "APR (Annual Percentage Rate)",
    definition: "The yearly interest rate charged for a loan or earned by an investment, including fees and costs related to the transaction.",
    category: "credit",
    relatedTopic: "credit-cards",
    examples: [
      "Credit card APR: 15.99%",
      "Mortgage APR: 4.25%"
    ]
  },
  {
    id: uuidv4(),
    term: "Asset Allocation",
    definition: "The strategy of dividing investments among different asset categories, such as stocks, bonds, and cash to optimize the risk/reward tradeoff based on an individual's goals, risk tolerance, and investment horizon.",
    category: "investing",
    relatedTopic: "portfolio-management",
    examples: [
      "Conservative allocation: 20% stocks, 60% bonds, 20% cash",
      "Aggressive allocation: 80% stocks, 15% bonds, 5% cash"
    ]
  },
  {
    id: uuidv4(),
    term: "Bond",
    definition: "A fixed income investment where an investor loans money to an entity (corporate or governmental) that borrows the funds for a defined period of time at a fixed interest rate.",
    category: "investing",
    relatedTopic: "fixed-income",
    examples: [
      "Treasury bonds issued by the U.S. government",
      "Corporate bonds issued by companies"
    ]
  },
  {
    id: uuidv4(),
    term: "Capital Gain",
    definition: "The profit earned when an investment is sold for a higher price than the original purchase price.",
    category: "investing",
    relatedTopic: "taxes",
    examples: [
      "Short-term capital gains (assets held less than a year)",
      "Long-term capital gains (assets held more than a year)"
    ]
  },
  {
    id: uuidv4(),
    term: "Compound Interest",
    definition: "Interest calculated on the initial principal and also on the accumulated interest of previous periods of a deposit or loan.",
    category: "investing",
    relatedTopic: "saving-strategies",
    examples: [
      "Savings account earning interest on interest",
      "Student loan interest compounding if unpaid"
    ]
  },
  {
    id: uuidv4(),
    term: "Credit Score",
    definition: "A numerical expression based on a level analysis of a person's credit files, to represent the creditworthiness of an individual.",
    category: "credit",
    relatedTopic: "credit-management",
    examples: [
      "FICO Score ranging from 300-850",
      "VantageScore ranging from 300-850"
    ]
  },
  {
    id: uuidv4(),
    term: "Diversification",
    definition: "A risk management strategy that mixes a wide variety of investments within a portfolio to reduce exposure to any single asset or risk.",
    category: "investing",
    relatedTopic: "risk-management",
    examples: [
      "Investing across different asset classes (stocks, bonds, real estate)",
      "Investing across different sectors and industries"
    ]
  },
  {
    id: uuidv4(),
    term: "Emergency Fund",
    definition: "Money set aside for unexpected expenses or financial emergencies, typically recommended to cover 3-6 months of living expenses.",
    category: "budgeting",
    relatedTopic: "financial-planning",
    examples: [
      "Savings for unexpected medical bills",
      "Funds to cover expenses during job loss"
    ]
  },
  {
    id: uuidv4(),
    term: "ETF (Exchange-Traded Fund)",
    definition: "A type of investment fund and exchange-traded product, traded on stock exchanges, that holds assets such as stocks, commodities, or bonds.",
    category: "investing",
    relatedTopic: "investment-vehicles",
    examples: [
      "S&P 500 ETF tracking the S&P 500 index",
      "Sector ETFs focusing on specific industries"
    ]
  },
  {
    id: uuidv4(),
    term: "FICO Score",
    definition: "A credit score created by the Fair Isaac Corporation that is used by lenders to assess a borrower's credit risk and determine whether to extend credit.",
    category: "credit",
    relatedTopic: "credit-management",
    examples: [
      "Payment history (35% of score)",
      "Credit utilization (30% of score)"
    ]
  },
  {
    id: uuidv4(),
    term: "Inflation",
    definition: "The rate at which the general level of prices for goods and services is rising, and subsequently, purchasing power is falling.",
    category: "economics",
    relatedTopic: "economic-indicators",
    examples: [
      "Consumer Price Index (CPI) as a measure of inflation",
      "Inflation eroding the value of cash savings over time"
    ]
  },
  {
    id: uuidv4(),
    term: "IRA (Individual Retirement Account)",
    definition: "A tax-advantaged investing tool designed for retirement savings with several variations including Traditional and Roth IRAs.",
    category: "investing",
    relatedTopic: "retirement-planning",
    examples: [
      "Traditional IRA with tax-deductible contributions",
      "Roth IRA with tax-free withdrawals in retirement"
    ]
  },
  {
    id: uuidv4(),
    term: "Liquidity",
    definition: "The ease with which an asset can be converted into cash without affecting its market price.",
    category: "investing",
    relatedTopic: "asset-management",
    examples: [
      "Cash is the most liquid asset",
      "Real estate typically has low liquidity"
    ]
  },
  {
    id: uuidv4(),
    term: "Mortgage",
    definition: "A loan used to purchase or maintain a home, land, or other types of real estate, with the property serving as collateral for the loan.",
    category: "credit",
    relatedTopic: "home-buying",
    examples: [
      "30-year fixed-rate mortgage",
      "15-year fixed-rate mortgage"
    ]
  }
];