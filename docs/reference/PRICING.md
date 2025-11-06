# Pricing Configuration Guide

## Overview

This document explains how the pricing system works and how to quickly update pricing tiers using JSON configuration.

---

## Current Pricing Structure

### Pricing Philosophy

Our platform uses **volume-based tiered pricing** with progressive flat fees to:
- Incentivize customers to manage more companies
- Provide aggressive volume discounts (up to 86% off)
- Maintain healthy profit margins through base fees
- Ensure smooth price transitions (no "price cliffs")

### Target Market Position

- **vs Databox ($159-799)**: 3-12X more expensive but positioned as "Automated CFO" vs visualization tool
- **vs Fathom ($45-224)**: 2-3X more expensive with AI-powered financial intelligence
- **vs Reach Reporting ($149-550)**: Comparable at entry, premium at scale

---

## Current Pricing Tiers (as of update)

### AI Growth Advisor (Per-User Pricing)
Entry product for solo users, no data connections, manual scorecards only.

| Users | Per User | Flat Fee | Example Total |
|-------|----------|----------|---------------|
| 1-5 | $19 | $0 | $19-95 |
| 6-14 | $17 | $0 | $102-238 |
| 15-29 | $15 | $0 | $225-435 |
| 30-49 | $12 | $0 | $360-588 |
| 50+ | $10 | $0 | $500+ |

### Starter Plan (1 connection, 3 users/company)
Entry-level automated CFO for small portfolios.

| Companies | Per Unit | Flat Fee | Example Cost |
|-----------|----------|----------|--------------|
| 1-5 | $90 | $0 | $90-450 |
| 6-15 | $50 | $200 | $500-950 |
| 16-30 | $35 | $425 | $985-1,475 |
| 31-50 | $25 | $725 | $1,500-1,975 |
| 51+ | $20 | $975 | $2,000+ |

### Growth Plan ⭐ Most Popular (3 connections, 5 users/company)
Professional tier with all premium features.

| Companies | Per Unit | Flat Fee | Example Cost |
|-----------|----------|----------|--------------|
| 1-5 | $180 | $0 | $180-900 |
| 6-15 | $100 | $400 | $1,000-1,900 |
| 16-30 | $65 | $925 | $1,965-2,875 |
| 31-50 | $55 | $1,225 | $2,930-3,975 |
| 51+ | $50 | $1,475 | $4,025+ |

### Scale Plan (5 connections, 8 users/company)
Enterprise tier with API access and dedicated support.

| Companies | Per Unit | Flat Fee | Example Cost |
|-----------|----------|----------|--------------|
| 1-5 | $350 | $0 | $350-1,750 |
| 6-15 | $200 | $750 | $1,950-3,750 |
| 16-30 | $125 | $1,875 | $3,875-5,625 |
| 31-50 | $100 | $2,625 | $5,725-7,625 |
| 51+ | $85 | $3,375 | $7,710+ |

---

## How Pricing Calculation Works

### Formula

For each tier:
```
Total Price = (Number of Units × Per Unit Price) + Flat Fee
```

### Example Calculation (Growth Plan, 25 companies)

1. Find applicable tiers:
   - Tier 1 (1-5): 5 companies × $180 = $900
   - Tier 2 (6-15): 10 companies × $100 = $1,000
   - Tier 3 (16-30): 10 companies × $65 = $650

2. Add flat fees (only for the current tier):
   - Flat fee for tier 3: $925

3. Total: $900 + $1,000 + $650 + $925 = **$3,475/month**

### Progressive Flat Fees Prevent Price Cliffs

The flat fee increases at each tier boundary to ensure:
- Going from 5 → 6 companies always increases price
- Going from 15 → 16 companies always increases price
- No customer gets a lower price by managing more companies

**Example:**
- 5 companies: $900 (tier 1)
- 6 companies: $900 + $100 + $400 = $1,400 ✓ (price increases)

---

## Quick Pricing Update Guide

### Where to Update Pricing

**File:** `src/App.tsx`
**Lines:** 40-73

### JSON Format for Each Plan

```typescript
const PLAN_PRICING_TIERS: PricingTier[] = [
  { firstUnit: 1, lastUnit: 5, perUnit: 90, flatFee: 0 },
  { firstUnit: 6, lastUnit: 15, perUnit: 50, flatFee: 200 },
  { firstUnit: 16, lastUnit: 30, perUnit: 35, flatFee: 425 },
  { firstUnit: 31, lastUnit: 50, perUnit: 25, flatFee: 725 },
  { firstUnit: 51, lastUnit: 999, perUnit: 20, flatFee: 975 }
];
```

### Field Definitions

| Field | Type | Description |
|-------|------|-------------|
| `firstUnit` | number | Starting number of units for this tier |
| `lastUnit` | number | Ending number of units (use 999 for unlimited) |
| `perUnit` | number | Price per unit (company or user) in this tier |
| `flatFee` | number | Base fee added when entering this tier |

---

## Complete Pricing JSON (Copy & Paste)

### Current Optimized Pricing (March 2025)

```json
{
  "ai-advisor": [
    { "firstUnit": 1, "lastUnit": 5, "perUnit": 19, "flatFee": 0 },
    { "firstUnit": 6, "lastUnit": 14, "perUnit": 17, "flatFee": 0 },
    { "firstUnit": 15, "lastUnit": 29, "perUnit": 15, "flatFee": 0 },
    { "firstUnit": 30, "lastUnit": 49, "perUnit": 12, "flatFee": 0 },
    { "firstUnit": 50, "lastUnit": 999, "perUnit": 10, "flatFee": 0 }
  ],
  "starter": [
    { "firstUnit": 1, "lastUnit": 5, "perUnit": 90, "flatFee": 0 },
    { "firstUnit": 6, "lastUnit": 15, "perUnit": 50, "flatFee": 200 },
    { "firstUnit": 16, "lastUnit": 30, "perUnit": 35, "flatFee": 425 },
    { "firstUnit": 31, "lastUnit": 50, "perUnit": 25, "flatFee": 725 },
    { "firstUnit": 51, "lastUnit": 999, "perUnit": 20, "flatFee": 975 }
  ],
  "growth": [
    { "firstUnit": 1, "lastUnit": 5, "perUnit": 180, "flatFee": 0 },
    { "firstUnit": 6, "lastUnit": 15, "perUnit": 100, "flatFee": 400 },
    { "firstUnit": 16, "lastUnit": 30, "perUnit": 65, "flatFee": 925 },
    { "firstUnit": 31, "lastUnit": 50, "perUnit": 55, "flatFee": 1225 },
    { "firstUnit": 51, "lastUnit": 999, "perUnit": 50, "flatFee": 1475 }
  ],
  "scale": [
    { "firstUnit": 1, "lastUnit": 5, "perUnit": 350, "flatFee": 0 },
    { "firstUnit": 6, "lastUnit": 15, "perUnit": 200, "flatFee": 750 },
    { "firstUnit": 16, "lastUnit": 30, "perUnit": 125, "flatFee": 1875 },
    { "firstUnit": 31, "lastUnit": 50, "perUnit": 100, "flatFee": 2625 },
    { "firstUnit": 51, "lastUnit": 999, "perUnit": 85, "flatFee": 3375 }
  ]
}
```

---

## Step-by-Step: Update Pricing

### Method 1: Direct Code Edit (Recommended)

1. Open `src/App.tsx`
2. Find the pricing tier constants (lines 40-73)
3. Update the arrays directly:

```typescript
// Example: Update Starter Plan tier 1 from $90 to $100
const STARTER_PRICING_TIERS: PricingTier[] = [
  { firstUnit: 1, lastUnit: 5, perUnit: 100, flatFee: 0 }, // Changed from 90
  // ... rest of tiers
];
```

4. Save the file
5. The app will auto-reload with new pricing

### Method 2: Settings Modal (For Testing)

1. Run the app: `npm start`
2. Click the Settings gear icon (⚙️)
3. Select the plan tab you want to edit
4. Manually adjust the tier values in the UI
5. Click "Save Changes"
6. **Note:** This saves to localStorage, not the code

⚠️ **Warning:** Settings modal changes are temporary and will reset if you clear localStorage or deploy new code.

---

## Pricing Strategy Guidelines

### When to Adjust Pricing

**Increase prices if:**
- ✅ CAC payback > 6 months (not recovering acquisition costs fast enough)
- ✅ NRR < 100% (customers churning or downgrading)
- ✅ Competitor analysis shows you're significantly cheaper with better features
- ✅ Margins < 70% (costs eating into profitability)

**Decrease prices if:**
- ✅ Conversion rate < 2% (price resistance)
- ✅ Competitors offer similar value at lower price
- ✅ Customer feedback consistently mentions "too expensive"
- ✅ Low volume at higher tiers (nobody reaching 31+ companies)

### A/B Testing Pricing

To test new pricing without affecting all users:

1. Deploy current pricing to production
2. Create a feature flag or URL parameter for test pricing
3. Send test traffic to alternative pricing
4. Measure: conversion rate, ARPA, churn, CAC payback
5. Choose winner after statistical significance (1000+ visitors)

---

## Calculating Flat Fees (Advanced)

### How to Calculate Flat Fees That Prevent Price Cliffs

**Rule:** At each tier boundary, total price must increase.

**Formula:**
```
New Flat Fee = Previous Total - (New Per Unit × Units at Boundary) + Buffer
```

**Example:** Calculating flat fee for tier 2 (6-15 companies)

1. Price at 5 companies (tier 1): 5 × $90 = $450
2. Price at 6 companies (tier 2): 5 × $90 + 1 × $50 + Flat Fee
3. Requirement: 6 companies > 5 companies
4. Minimum flat fee: $450 - $500 = Need at least $0, but we use $200 for revenue
5. Result: 6 companies = $450 + $50 + $200 = $700 ✓ (increases)

### Online Calculator

You can use this spreadsheet formula to verify no price cliffs:

```excel
=IF(
  (Previous_Tier_Total) < (Current_Tier_Units × Current_Per_Unit + Current_Flat_Fee),
  "✓ No cliff",
  "⚠️ Price drops!"
)
```

---

## Key Metrics to Track

### Revenue Metrics

| Metric | Formula | Target |
|--------|---------|--------|
| **ARPA** | Total MRR / Total Customers | $500+ |
| **CAC Payback** | CAC / (ARPA × Gross Margin) | < 6 months |
| **NRR** | (Start MRR + Expansion - Churn) / Start MRR | > 110% |
| **Gross Margin** | (Revenue - COGS) / Revenue | > 75% |

### Pricing Health Indicators

- **Distribution across tiers:** Most customers in Growth (50%+), some in Starter (30%), few in Scale (20%)
- **Upgrade rate:** 30%+ of Starter customers upgrade to Growth within 6 months
- **Average companies per customer:** 10-15 companies (sweet spot for profitability)
- **Churn rate:** < 5% monthly (low churn = pricing is acceptable)

---

## Competitive Pricing Comparison

### Current Market Position (as of March 2025)

| Competitor | Entry Price | Mid-Tier | High-Volume (50 companies) | Our Premium |
|------------|-------------|----------|---------------------------|-------------|
| **Fathom** | $45 | $82-150 | ~$224 ($4.48/co) | 8.8X more |
| **Databox** | $159 | $399 | $799 (flat) | 2.5-9.5X more |
| **Reach Reporting** | $149 | $290 | $550 (flat) | 1.2-7.2X more |
| **Syft** | $19+ | $79+ | $119+ (per user) | Comparable |
| **Our Starter** | $90 | $700 | $1,975 | — |
| **Our Growth** | $180 | $1,400 | $3,975 | — |
| **Our Scale** | $350 | $2,700 | $7,625 | — |

**Positioning:** Premium "Automated CFO" solution, 3-12X more expensive than visualization tools, justified by AI-powered actionable insights.

---

## Competitor Strengths & Weaknesses

### **Fathom** (QuickBooks Financial Reporting)
**Pricing:** $45-224/mo | Company-based | 4 tiers
**Model:** 1 co ($45), 10 co ($82), 25 co ($150), 50 co ($224)

✅ **Strengths:**
- Extremely simple pricing (4 price points total)
- Very low entry barrier ($45)
- Massive 90% volume discount ($45→$4.48/co)
- Clear company-count messaging
- Trusted QuickBooks ecosystem integration

❌ **Weaknesses:**
- No AI/predictive insights (just reporting)
- Limited to financial statement formatting
- No portfolio management features
- Single-business focus (not multi-client)
- Basic visualization only

**vs Us:** We're 2X price but offer AI CFO insights they lack. Vulnerable if we don't prove AI value.

---

### **Databox** (Data Visualization Platform)
**Pricing:** $159-799/mo | Flat pricing | Unlimited dashboards
**Model:** Professional ($159), Growth ($399), Premium ($799)

✅ **Strengths:**
- **Unlimited users** (huge advantage)
- **Unlimited dashboards** (no per-company penalty)
- Flat pricing = easy budgeting
- 130+ integrations (broader than us)
- Strong marketing/sales focus
- 20% annual discount matches ours

❌ **Weaknesses:**
- Not built for multi-company portfolio management
- No financial/accounting focus
- Generic dashboards (not CFO insights)
- Per-data-source fees add up ($5.60 each)
- No AI-powered recommendations

**vs Us:** We're 3-12X more expensive. Only justified if customers need multi-client CFO intelligence vs single-business dashboards. Direct threat at low volumes (1-5 companies).

---

### **Reach Reporting** (Marketing Data Aggregator)
**Pricing:** $149-550/mo | Connection-based | 3 tiers
**Model:** Basic ($149), Plus ($290), Premium ($550)

✅ **Strengths:**
- Clear tiered progression
- Focused value prop (marketing ROI)
- Simple 3-tier structure
- Predictable flat pricing
- No per-client/per-dashboard penalties

❌ **Weaknesses:**
- Marketing-only (not financial)
- No AI insights or predictions
- Limited to 3 tiers (no enterprise option)
- No volume discounts (flat at all scales)
- Wrong vertical for CFO work

**vs Us:** Comparable entry ($90-180 vs $149) but we're 3-7X more at volume. Not a direct competitor (different vertical) but sets price expectations for "premium data tool."

---

### **Syft Analytics** (Multi-company Financial Platform)
**Pricing:** Free-$119+/mo | Feature-gated | 5 tiers
**Model:** Free, Standard ($19+), Plus ($39+), Advanced ($79+), Scale ($119+)

✅ **Strengths:**
- **Free tier** (conversion funnel advantage)
- Similar multi-company focus (direct competitor)
- Clear feature progression (5 tiers)
- Low entry ($19 matches our AI Advisor)
- "+" pricing allows flexibility
- Strong feature differentiation per tier

❌ **Weaknesses:**
- Complex feature matrix (confusing)
- Per-user pricing limits enterprise scale
- Free tier cannibalizes paid conversions
- Ambiguous "+" pricing (what's the real cost?)
- Lower perceived value vs premium pricing

**vs Us:** We match their entry ($19 AI Advisor) but grow to 10-40X more expensive at scale. They prove market will pay for multi-company CFO tools. Risk: customers start with Syft's free tier, never upgrade to us.

---

## Competitive Summary Matrix

| Factor | Fathom | Databox | Reach | Syft | **Us** |
|--------|--------|---------|-------|------|--------|
| **Entry Price** | ⭐️ $45 | 💰 $159 | 💰 $149 | ⭐️ Free/$19 | 💰 $90-180 |
| **Volume Scaling** | ⭐️ 90% discount | ❌ Flat pricing | ❌ Flat pricing | ⚠️ Per-user | ⭐️ 86% discount |
| **Multi-Company** | ✅ Yes | ❌ Not built for it | ❌ Not built for it | ✅ Yes | ✅ Core feature |
| **AI/Predictive** | ❌ No | ❌ No | ❌ No | ⚠️ Limited | ⭐️ Core feature |
| **User Limits** | ⚠️ Unclear | ⭐️ Unlimited | ⚠️ Unclear | ❌ Pay per user | ❌ 3-8 per company |
| **Simplicity** | ⭐️ Very simple | ⭐️ Simple | ⭐️ Simple | ⚠️ Complex | ⚠️ Complex |
| **Financial Focus** | ✅ Yes | ❌ No | ❌ No | ✅ Yes | ✅ Yes |
| **Free Tier** | ❌ No | ❌ No | ❌ No | ⭐️ Yes | ❌ No |
| **Price at 50 co** | ⭐️ $224 | 💰 $799 | 💰 $550 | ⚠️ $1k+? | 💸 $1,975-7,625 |

### Key Insights:

1. **Fathom = Simplicity King:** Wins on ease of understanding, loses on features
2. **Databox = Scale Winner:** Unlimited dashboards/users beats our per-company model at low volume
3. **Reach = Not a Threat:** Different vertical, but sets "premium tool" price expectations
4. **Syft = Direct Competitor:** Similar multi-company focus, free tier is dangerous
5. **Us = Premium Position:** Highest price requires strongest value proof (AI CFO)

### Strategic Positioning:

**Our Advantage:**
- Only true "Automated CFO" with AI insights
- Volume discounts competitive with Fathom
- Multi-company portfolio focus (vs Databox single-business)

**Our Vulnerabilities:**
- 3-12X more expensive needs strong ROI proof
- Limited users per company vs Databox unlimited
- No free tier vs Syft's conversion funnel
- Complex pricing vs competitors' simplicity

**Win Condition:** Prove that AI-powered CFO insights save customers $5,000+/month in consultant fees, making our premium pricing a 90% discount vs traditional CFO.

---

## Troubleshooting

### Issue: Prices dropping at tier boundaries

**Symptom:** 15 companies costs more than 16 companies

**Solution:** Increase the flat fee for tier 3
```typescript
// Before (causes cliff)
{ firstUnit: 16, lastUnit: 30, perUnit: 35, flatFee: 200 }

// After (smooth transition)
{ firstUnit: 16, lastUnit: 30, perUnit: 35, flatFee: 425 }
```

### Issue: Settings modal not showing updated pricing

**Symptom:** Changed code but Settings shows old values

**Solution:** Clear localStorage
```javascript
// In browser console
localStorage.removeItem('pricingSettings')
// Then refresh page
```

### Issue: Pricing too high, losing customers

**Symptom:** Low conversion rate, feedback about price

**Solution:** Test lowering entry tier pricing by 20-30%
```typescript
// Test reducing entry from $90 to $75
{ firstUnit: 1, lastUnit: 5, perUnit: 75, flatFee: 0 }
```

---

## Future Pricing Considerations

### Potential Improvements

1. **Usage-based pricing:** Charge per AI token consumed (like OpenAI)
2. **Hybrid model:** Base fee + per-company (like Databox's base + per-data-source)
3. **Industry-specific pricing:** Higher prices for wealth management vs bookkeeping
4. **Annual-only at high tiers:** Force Scale customers to annual contracts
5. **Free tier:** Limited to 1 company, 1 connection (conversion play)

### Pricing Experiments to Run

- [ ] Test 15% annual discount vs current 20%
- [ ] Test $75 Starter entry vs $90 entry
- [ ] Test free tier with 1 company limit
- [ ] Test Growth tier at $200 entry (10% increase)
- [ ] Test removing AI Advisor tier entirely (simplification)

---

## Resources

- **Pricing Framework Used:** Price Intelligently / SaaS Pricing Playbook
- **Competitive Analysis:** Fathom, Databox, Reach Reporting, Syft Analytics
- **Last Updated:** March 2025
- **Next Review:** Quarterly (June 2025)

---

## Quick Reference: Price at Key Volumes

### Starter Plan
- 1 company: **$90/month** ($1,080/year)
- 10 companies: **$700/month** ($8,400/year)
- 50 companies: **$1,975/month** ($23,700/year)

### Growth Plan ⭐
- 1 company: **$180/month** ($2,160/year)
- 10 companies: **$1,400/month** ($16,800/year)
- 50 companies: **$3,975/month** ($47,700/year)

### Scale Plan
- 1 company: **$350/month** ($4,200/year)
- 10 companies: **$2,700/month** ($32,400/year)
- 50 companies: **$7,625/month** ($91,500/year)

**Annual discount:** 20% off (equivalent to 2 months free)

---

## Contact for Pricing Questions

For strategic pricing decisions, consult:
- Finance team for margin analysis
- Sales team for customer feedback
- Product team for feature valuation
- Marketing team for competitive positioning

**Remember:** Pricing is the most important lever for profitability. Test carefully and measure rigorously.
