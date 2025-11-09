import { Citation } from '../types/citations';

export const CITATIONS: Record<string, Citation> = {
  FINANCIAL_LITERACY_LOSS: {
    claim: "$118,121 average loss from poor financial literacy",
    source: "Intuit QuickBooks",
    url: "https://quickbooks.intuit.com/r/small-business-data/financial-literacy-statistics/",
    year: 2025
  },
  HARVARD_MARGINS: {
    claim: "30-50% higher profit margins from tracking financials",
    source: "Harvard Business Review",
    url: "https://www.bain.com/insights/stop-focusing-on-profitability-and-go-for-growth-hbr/",
    year: 2017
  },
  ASTD_SUCCESS: {
    claim: "95% success rate with right metrics, strategy, and accountability",
    source: "ASTD Research",
    url: "https://www.afcpe.org/news-and-publications/the-standard/2018-3/the-power-of-accountability/",
    year: 2018
  },
  MONTHLY_GROWTH: {
    claim: "30% faster growth for monthly reviewers",
    source: "CJPI Consulting",
    url: "https://www.cjpi.com/insights/50-key-statistics-every-entrepreneur-should-know-about-business-growth/",
    year: 2024
  },
  PROFESSIONAL_HELP: {
    claim: "89% more likely to grow with professional help",
    source: "CJPI Consulting",
    url: "https://www.cjpi.com/insights/50-key-statistics-every-entrepreneur-should-know-about-business-growth/",
    year: 2024
  },
  REVENUE_BUMP: {
    claim: "5% immediate revenue bump from financial education",
    source: "CBS MoneyWatch",
    url: "https://www.cbsnews.com/news/how-to-build-financially-savvy-franchisees/",
    year: 2010
  },
  FINANCIAL_MONITORING: {
    claim: "Financial monitoring results in significant increases in revenue and profits",
    source: "Academic Research",
    url: "https://eajournals.org/ijsber/wp-content/uploads/sites/85/2023/05/THEINF1.pdf",
    year: 2023
  },
  FRANCHISEE_SUCCESS: {
    claim: "Franchisees who understand their P&L tend to do better in revenue and profit margin",
    source: "CBS MoneyWatch",
    url: "https://www.cbsnews.com/news/how-to-build-financially-savvy-franchisees/",
    year: 2010
  }
};

// Lowercase key mappings for easier access
export const citations = {
  intuit: CITATIONS.FINANCIAL_LITERACY_LOSS,
  harvard: CITATIONS.HARVARD_MARGINS,
  astd: CITATIONS.ASTD_SUCCESS,
  cjpi: CITATIONS.MONTHLY_GROWTH,
  professional: CITATIONS.PROFESSIONAL_HELP,
  revenue: CITATIONS.REVENUE_BUMP,
  monitoring: CITATIONS.FINANCIAL_MONITORING,
  franchisee: CITATIONS.FRANCHISEE_SUCCESS
} as const;