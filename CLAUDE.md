# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A React-based pricing calculator application with two distinct pricing models: **Standard Connection Plan** and **AI Growth Advisor Only**. Built with Vite, TypeScript, and Tailwind CSS.

## Development Commands

**Initial Setup:**
```bash
npm install  # Required before first run - installs all dependencies
```

**Development:**
```bash
npm start     # Start dev server on port 3000
npm run dev   # Alias for npm start
```

**Production:**
```bash
npm run build    # Build for production (outputs to dist/)
npm run preview  # Preview production build locally
```

**Code Quality:**
```bash
npm run lint  # Run ESLint on codebase
```

## Architecture

### State Management & Pricing Calculation

All application state is managed in [src/App.tsx](src/App.tsx) using React hooks. The pricing calculation is **tiered** and supports:

1. **Two pricing modes** (toggled via `useSimplePricing`):
   - Standard Connection Plan: Complex tiered pricing with per-company and per-connection costs
   - AI Growth Advisor Only: Simplified per-user pricing ($19/user)

2. **Pricing tiers** defined as arrays of objects:
   ```typescript
   { firstUnit: number, lastUnit: number, perUnit: number, flatFee: number }
   ```
   - Tiers can have **flat fees only** (perUnit = 0) or **per-unit pricing + flat fees**
   - The `calculateBasePrice()` function determines which tier applies based on count

3. **Discount/commission system**:
   - Annual billing: 20% discount (applied after wholesale discount)
   - Wholesale discount: Percentage-based, **mutually exclusive** with annual billing
   - Reseller commission: Calculated after 3% credit card fee deduction

### Component Structure

- **[App.tsx](src/App.tsx)**: Main container, manages all state and pricing calculations
- **[Settings.tsx](src/components/Settings.tsx)**: Admin modal with tabs for:
  - Plan-specific pricing tiers (AI Advisor, Starter, Growth, Scale)
  - Reseller settings (wholesale discount, commission)
  - Quote & Discount configuration (expiration, custom discounts)
  - Royalty Processing (ACH processing fees)
  - Onboarding Fee (one-time setup charges)
  - **Custom Terms** (SOW, integrations, special conditions)
- **Slider components**: `CompanySlider.tsx`, `ConnectionSlider.tsx` - Interactive controls for selecting quantities
- **Display components**: `PricingToggle.tsx`, `PricingCard.tsx`, etc. - Presentational components

### Key Business Logic

**Pricing calculation flow** ([App.tsx:54-73](src/App.tsx#L54-L73)):
1. Determine base price from tier lookup
2. Add additional connection costs (Standard plan only)
3. Apply wholesale discount (if monthly billing)
4. Apply annual discount (20% if annual billing)
5. Calculate reseller commission (from net amount after credit card fees)

**Important constraints**:
- Wholesale discount and annual billing are **mutually exclusive** - warning shown if both attempted
- Connection pricing only applies to Standard plan, not AI Growth Advisor plan
- Settings modal only appears when `useSimplePricing = false`

### Custom Terms & SOW Feature

**Purpose**: Allows salespeople to add custom terms, statement of work, integration details, or special conditions to quotes for enterprise deals.

**Implementation** ([App.tsx:279-288](src/App.tsx#L279-L288)):
- **State Variables**:
  - `customTermsEnabled`: Boolean toggle to show/hide the section
  - `customTermsTitle`: Customizable heading (default: "Custom Terms & Conditions")
  - `customTermsContent`: Free-form text with preserved line breaks
- **Persistence**: Saved to localStorage and included in quote `selection_raw` data
- **Configuration**: Settings > Custom Terms tab ([Settings.tsx:1137-1238](src/components/Settings.tsx#L1137-L1238))
  - Enable/disable checkbox
  - Title input field
  - Large textarea (10 rows) with character counter
  - Live preview panel showing customer view
  - Examples of common use cases
- **Display** ([App.tsx:1798-1813](src/App.tsx#L1798-L1813)):
  - Appears in pricing details section after onboarding fee
  - Blue color scheme with FileText icon (from lucide-react)
  - Only visible when `customTermsEnabled && customTermsContent` both true
  - Uses `whitespace-pre-wrap` to preserve formatting

**Common Use Cases**:
- Statement of Work (SOW) for custom development
- Custom integration descriptions (e.g., "Custom UPS integration with real-time tracking")
- Special payment terms or milestone schedules
- Service level agreements (SLAs)
- Implementation timelines and deliverables
- Customer-specific requirements
- Training and support commitments
- Data migration or setup services

**Technical Notes**:
- Plain text only (no markdown rendering currently)
- Line breaks and formatting preserved with CSS `whitespace-pre-wrap`
- Admin-only configuration (not visible to end users unless configured)
- Disabled when quote is locked/accepted

### Projected Pricing Calculator (Quote Mode Only)

**Purpose**: Shows pricing at scale for future growth scenarios, helping close deals by demonstrating volume savings.

**Implementation** ([App.tsx:407-439](src/App.tsx#L407-L439)):
- **State Variable**: `projectedLocations` - number of locations/users at scale (nullable)
- **Calculation Flow**:
  1. Calculate base price for projected count using same tier lookup
  2. Apply custom discount (if any)
  3. Apply wholesale discount (monthly billing only)
  4. Apply annual discount (if annual billing)
  5. Add royalty processing fees (if enabled)
- **Key Metrics Calculated**:
  - `projectedPrice`: Total monthly price at scale
  - `projectedPricePerUnit`: Price per unit at scale
  - `savingsPerUnit`: Difference between current and projected per-unit pricing

**User Interface** ([App.tsx:1819-1906](src/App.tsx#L1819-L1906)):
- **Trigger Button**: "+ Calculate Pricing at Scale" (only when no projection active)
- **Projected Price Card**:
  - Gradient green-to-blue design (emerald/blue color scheme)
  - Editable input for projected location count (minimum: current count + 1)
  - Large bold price display with "at scale" indicator
  - Per-unit pricing breakdown
  - Annual billing total (if applicable)
  - Prominent savings callout showing per-unit savings and total monthly savings
  - Close button (✕) to remove projection
- **Visibility**: Only available in quote mode AND for non-AI-advisor plans
- **Persistence**: Saved in quote `selection_raw.projectedLocations`

**Business Logic**:
- Default suggestion: `count * 5` (5x current locations)
- Cannot project below current count
- Uses TrendingUp icon (lucide-react)
- Disabled when quote is locked/accepted/expired
- Automatically restored when loading existing quotes

**Example Display**:
```
Current: $500/mo (5 locations at $100/each)
Projected: $1,800/mo (50 locations at $36/each)
Savings: $64 per location — that's $3,200 total monthly savings!
```

**Technical Notes**:
- URL parameter: `?projectedLocations=100` can pre-set the value
- Calculation function: `calculateProjectedPrice(projectedCount)`
- Only included in quote data when projection is active (not null)
- Quote API includes projected data in webhook payloads

## Configuration Files

- [vite.config.ts](vite.config.ts): Dev server port set to 3000, React plugin, lucide-react optimization
- [tailwind.config.js](tailwind.config.js): Tailwind CSS configuration
- [tsconfig.json](tsconfig.json): TypeScript base config (references app and node configs)
