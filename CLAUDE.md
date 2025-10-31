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
- **[Settings.tsx](src/components/Settings.tsx)**: Admin modal for configuring pricing tiers, connection prices, wholesale discounts, and reseller commissions (only shown for Standard plan)
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

## Configuration Files

- [vite.config.ts](vite.config.ts): Dev server port set to 3000, React plugin, lucide-react optimization
- [tailwind.config.js](tailwind.config.js): Tailwind CSS configuration
- [tsconfig.json](tsconfig.json): TypeScript base config (references app and node configs)
