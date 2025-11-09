export interface Citation {
  claim: string;
  source: string;
  url: string;
  year: number;
}

export interface TrainingOfferConfig {
  enabled: boolean;

  // Pricing Configuration
  basePrice: number;
  paymentPlans: {
    single: boolean;
    twoPayment: boolean;
    threePayment: boolean;
  };

  // Availability
  spotsAvailable: number;

  // Copy Customization
  headlines: {
    primary: string;
    subhead: string;
  };

  // Legal/Compliance
  showCitations: boolean;
  guaranteeEnabled: boolean;
  guaranteeText: string;
}