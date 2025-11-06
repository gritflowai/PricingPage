// Plan configuration types and constants

export type PlanType = 'ai-advisor' | 'starter' | 'growth' | 'scale';

export interface PricingTier {
  firstUnit: number;
  lastUnit: number;
  perUnit: number;
  flatFee: number;
}

export interface PlanConfig {
  name: string;
  pricingTiers: PricingTier[];
  connections: number;
  usersPerCompany: number;
  scorecardsPerCompany: number | 'unlimited';
  metricsPerScorecard: number;
  aiTokensPerDollar: number;
  historicDataYears: number;
  contactThreshold: number;
  nudgeThreshold: number;
  stripeProductId: string;
  features: {
    dailySync: boolean;
    immediateSyncCommand: boolean;
    billingFlexibility: boolean;
    customBranding: boolean;
  };
}

// AI Advisor pricing tiers (volume discounts for users)
const AI_PRICING_TIER: PricingTier[] = [
  { firstUnit: 1, lastUnit: 5, perUnit: 19, flatFee: 0 },
  { firstUnit: 6, lastUnit: 14, perUnit: 17, flatFee: 0 },
  { firstUnit: 15, lastUnit: 29, perUnit: 15, flatFee: 0 },
  { firstUnit: 30, lastUnit: 49, perUnit: 12, flatFee: 0 },
  { firstUnit: 50, lastUnit: 999, perUnit: 10, flatFee: 0 }
];

// Starter plan pricing tiers
const STARTER_PRICING_TIERS: PricingTier[] = [
  { firstUnit: 1, lastUnit: 5, perUnit: 90, flatFee: 0 },
  { firstUnit: 6, lastUnit: 15, perUnit: 50, flatFee: 200 },
  { firstUnit: 16, lastUnit: 30, perUnit: 35, flatFee: 425 },
  { firstUnit: 31, lastUnit: 50, perUnit: 25, flatFee: 725 },
  { firstUnit: 51, lastUnit: 999, perUnit: 20, flatFee: 975 }
];

// Growth plan pricing tiers
const GROWTH_PRICING_TIERS: PricingTier[] = [
  { firstUnit: 1, lastUnit: 5, perUnit: 180, flatFee: 0 },
  { firstUnit: 6, lastUnit: 15, perUnit: 100, flatFee: 400 },
  { firstUnit: 16, lastUnit: 30, perUnit: 65, flatFee: 925 },
  { firstUnit: 31, lastUnit: 50, perUnit: 55, flatFee: 1225 },
  { firstUnit: 51, lastUnit: 999, perUnit: 50, flatFee: 1475 }
];

// Scale plan pricing tiers
const SCALE_PRICING_TIERS: PricingTier[] = [
  { firstUnit: 1, lastUnit: 5, perUnit: 350, flatFee: 0 },
  { firstUnit: 6, lastUnit: 15, perUnit: 200, flatFee: 750 },
  { firstUnit: 16, lastUnit: 30, perUnit: 125, flatFee: 1875 },
  { firstUnit: 31, lastUnit: 50, perUnit: 100, flatFee: 2625 },
  { firstUnit: 51, lastUnit: 999, perUnit: 85, flatFee: 3375 }
];

// Default plan configurations (synced with Stripe metadata)
export const DEFAULT_PLAN_CONFIGS: Record<PlanType, PlanConfig> = {
  'ai-advisor': {
    name: 'AI Growth Advisor',
    pricingTiers: AI_PRICING_TIER,
    connections: 0,
    usersPerCompany: 1,
    scorecardsPerCompany: 'unlimited',
    metricsPerScorecard: 999,
    aiTokensPerDollar: 166666,
    historicDataYears: 0,
    contactThreshold: 200,
    nudgeThreshold: 150,
    stripeProductId: 'prod_7YtGm3ZhA2kR1Q5B',
    features: {
      dailySync: false,
      immediateSyncCommand: false,
      billingFlexibility: false,
      customBranding: false
    }
  },
  'starter': {
    name: 'Starter',
    pricingTiers: STARTER_PRICING_TIERS,
    connections: 1,
    usersPerCompany: 3,
    scorecardsPerCompany: 12,
    metricsPerScorecard: 10,
    aiTokensPerDollar: 166666,
    historicDataYears: 2,
    contactThreshold: 51,
    nudgeThreshold: 31,
    stripeProductId: 'prod_9WlNx5UpL8dC4V6M',
    features: {
      dailySync: true,
      immediateSyncCommand: false,
      billingFlexibility: false,
      customBranding: false
    }
  },
  'growth': {
    name: 'Growth',
    pricingTiers: GROWTH_PRICING_TIERS,
    connections: 3,
    usersPerCompany: 5,
    scorecardsPerCompany: 25,
    metricsPerScorecard: 15,
    aiTokensPerDollar: 166666,
    historicDataYears: 3,
    contactThreshold: 17,
    nudgeThreshold: 11,
    stripeProductId: 'prod_3QpHz8EvN1sB7K2X',
    features: {
      dailySync: true,
      immediateSyncCommand: true,
      billingFlexibility: true,
      customBranding: true
    }
  },
  'scale': {
    name: 'Scale',
    pricingTiers: SCALE_PRICING_TIERS,
    connections: 5,
    usersPerCompany: 8,
    scorecardsPerCompany: 25,
    metricsPerScorecard: 15,
    aiTokensPerDollar: 166666,
    historicDataYears: 4,
    contactThreshold: 6,
    nudgeThreshold: 4,
    stripeProductId: 'prod_6RtKx2JmF4aL9D7T',
    features: {
      dailySync: true,
      immediateSyncCommand: true,
      billingFlexibility: true,
      customBranding: true
    }
  }
};
