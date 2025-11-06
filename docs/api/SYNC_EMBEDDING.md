# Sync Embedding Guide

This document explains how to embed the pricing calculator as a component and sync data bidirectionally with your main application (the "brain").

## Architecture Overview

```
┌─────────────────────────────────────┐
│   MAIN APPLICATION (The Brain)      │
│   - Owns the database/form data     │
│   - Handles quote lifecycle         │
│   - Manages user authentication     │
│   - Processes quote acceptance      │
└──────────────┬──────────────────────┘
               │
               │ PostMessage API
               │ (Bidirectional Sync)
               │
┌──────────────▼──────────────────────┐
│   PRICING CALCULATOR (Component)    │
│   - Renders pricing UI              │
│   - Handles user interactions       │
│   - Calculates pricing in real-time │
│   - Syncs changes to parent         │
└─────────────────────────────────────┘
```

**Philosophy:** The calculator is a **stateless component**. The main application is the **source of truth**.

---

## Quick Start

### 1. Embed the Calculator

```html
<iframe
  id="pricing-calculator"
  src="https://your-calculator-url.com?mode=quote&embedded=true"
  width="100%"
  height="900"
></iframe>
```

### 2. Initialize Quote Data

When the calculator loads, it will request initial data from the parent:

```javascript
const iframe = document.getElementById('pricing-calculator');

// Listen for ready signal
window.addEventListener('message', (event) => {
  if (event.data.type === 'IFRAME_READY') {
    // Send initial quote data
    iframe.contentWindow.postMessage({
      type: 'INIT_QUOTE',
      data: {
        id: 'quote-uuid-from-your-database',
        selectedPlan: 'growth',
        count: 25,
        isAnnual: true,
        // ... all other fields (see Database Schema below)
      }
    }, '*');
  }
});
```

### 3. Listen for Changes

```javascript
window.addEventListener('message', (event) => {
  if (event.data.type === 'QUOTE_SUMMARY_UPDATE') {
    // Calculator is sending updated data - save to your database
    saveQuoteToDatabase(event.data);
  }
});
```

---

## Database Schema

Your database should store these fields for each quote:

### Core Quote Fields

```typescript
{
  // Identifiers
  id: string;                    // UUID for the quote
  pricing_model_id: string;      // Which pricing model is active

  // Plan Selection
  selected_plan: 'starter' | 'growth' | 'scale' | 'ai-advisor';
  count: number;                 // Number of locations/companies
  is_annual: boolean;            // Billing frequency

  // Pricing Results
  subtotal: number;              // Base price before discounts
  final_monthly_price: number;   // Final price after all discounts
  price_per_unit: number;        // Per-location price
  annual_savings: number;        // Savings if annual billing

  // Quote Status
  status: 'draft' | 'locked' | 'accepted' | 'expired';
  version: number;               // Incremented on lock
  created_at: timestamp;
  updated_at: timestamp;
  locked_at: timestamp | null;
  expires_at: timestamp | null;
  accepted_at: timestamp | null;

  // Complete State (JSONB)
  selection_raw: {
    // Basic selections
    userType: 'cpa' | 'franchisee' | 'smb';
    selectedPlan: string;
    count: number;
    isAnnual: boolean;

    // Custom Discount (nullable)
    customDiscount: {
      type: 'percentage' | 'fixed';
      value: number;
      label: string;
      reason: string;
      discountAmount: number;
    } | null;

    // Royalty Processing (nullable)
    royaltyProcessing: {
      enabled: boolean;
      baseFee: number;
      perTransaction: number;
      estimatedTransactions: number;
      totalFee: number;
    } | null;

    // Onboarding Fee (nullable)
    onboardingFee: {
      amount: number;
      title: string;
      description: string;
    } | null;

    // Custom Terms (nullable)
    customTerms: {
      enabled: boolean;
      title: string;
      content: string;
    } | null;

    // Projected Pricing (nullable)
    projectedLocations: number | null;

    // Price Breakdown
    price_breakdown: {
      subtotal: number;
      volumeDiscount: number;
      customDiscount: number;
      wholesaleDiscount: number;
      annualSavings: number;
      royaltyProcessingFee: number;
      finalMonthlyPrice: number;
    };

    // Plan Details
    plan_details: {
      name: string;
      connections: number;
      users: number;
      scorecards: number | 'unlimited';
      aiTokens: number;
    };
  };
}
```

---

## Message Flow

### Initialization Flow

```
1. PARENT: Load iframe with ?mode=quote&embedded=true
2. CALCULATOR: Send IFRAME_READY
3. PARENT: Send INIT_QUOTE with database data
4. CALCULATOR: Render UI with provided data
```

### Real-Time Sync Flow (Draft Mode)

```
1. USER: Changes slider/toggle in calculator
2. CALCULATOR: Update internal state
3. CALCULATOR: Wait 300ms (debounce)
4. CALCULATOR: Send QUOTE_SUMMARY_UPDATE to parent
5. PARENT: Save to database
6. PARENT: (Optional) Send confirmation
```

### Quote Lock Flow

```
1. USER: Click "Lock Quote" in calculator
2. CALCULATOR: Send QUOTE_LOCK_INTENT to parent
3. PARENT: Update database (status='locked', set expires_at)
4. PARENT: Send CONFIRM_QUOTE_LOCK to calculator
5. CALCULATOR: Disable all controls, show locked UI
6. CALCULATOR: Send QUOTE_LOCKED confirmation
```

### Quote Acceptance Flow

```
1. USER: Click "Accept Quote" in calculator
2. CALCULATOR: Send QUOTE_ACCEPT_INTENT to parent
3. PARENT: Show terms/conditions modal
4. USER: Accept terms in parent
5. PARENT: Update database (status='accepted', set accepted_at)
6. PARENT: Send CONFIRM_QUOTE_ACCEPTANCE to calculator
7. CALCULATOR: Update UI, send QUOTE_ACCEPTED confirmation
```

---

## Message Types Reference

### Messages FROM Calculator TO Parent

#### IFRAME_READY
Calculator has loaded and is ready to receive data.

```javascript
{ type: 'IFRAME_READY' }
```

#### QUOTE_SUMMARY_UPDATE
User changed selections (debounced 300ms). **Save this to your database.**

```javascript
{
  type: 'QUOTE_SUMMARY_UPDATE',
  data: {
    id: 'quote-uuid',
    selectedPlan: 'growth',
    count: 25,
    isAnnual: true,
    subtotal: 2000.00,
    finalMonthlyPrice: 1600.00,
    pricePerUnit: 64.00,
    annualSavings: 333.33,
    selectionRaw: { /* complete state - see Database Schema */ }
  }
}
```

#### QUOTE_LOCK_INTENT
User wants to lock the quote. **Update database before confirming.**

```javascript
{
  type: 'QUOTE_LOCK_INTENT',
  data: {
    id: 'quote-uuid',
    expiresInDays: 30
  }
}
```

#### QUOTE_LOCKED
Quote has been successfully locked.

```javascript
{
  type: 'QUOTE_LOCKED',
  data: {
    id: 'quote-uuid',
    version: 2,
    expiresAt: '2025-12-31T23:59:59Z',
    status: 'locked'
  }
}
```

#### QUOTE_ACCEPT_INTENT
User wants to accept the quote. **Show your terms modal, then confirm.**

```javascript
{
  type: 'QUOTE_ACCEPT_INTENT',
  data: {
    id: 'quote-uuid',
    version: 2,
    status: 'locked'
  }
}
```

#### QUOTE_ACCEPTED
Quote has been accepted (after parent confirmation).

```javascript
{
  type: 'QUOTE_ACCEPTED',
  data: {
    id: 'quote-uuid',
    version: 2,
    status: 'accepted',
    acceptedAt: '2025-11-06T10:30:00Z'
  }
}
```

#### QUOTE_ERROR
Something went wrong.

```javascript
{
  type: 'QUOTE_ERROR',
  data: {
    error: 'Failed to lock quote',
    code: 'NETWORK_ERROR',
    details: { /* additional context */ }
  }
}
```

---

### Messages FROM Parent TO Calculator

#### INIT_QUOTE
Initialize calculator with data from your database. **Send immediately after IFRAME_READY.**

```javascript
iframe.contentWindow.postMessage({
  type: 'INIT_QUOTE',
  data: {
    id: 'quote-uuid',
    selectedPlan: 'growth',
    count: 25,
    isAnnual: true,
    status: 'draft', // or 'locked', 'accepted', 'expired'

    // Optional: Pre-populate settings from database
    customDiscount: {
      type: 'percentage',
      value: 15,
      label: 'Early Adopter',
      reason: 'Q1 promo'
    },

    royaltyProcessing: {
      enabled: true,
      baseFee: 0,
      perTransaction: 1.82,
      estimatedTransactions: 2
    },

    onboardingFee: {
      amount: 5000,
      title: 'White-Glove Onboarding',
      description: 'Full setup and training'
    },

    customTerms: {
      enabled: true,
      title: 'Custom Integration',
      content: 'Custom UPS tracking integration\nMilestone payments\n30-day implementation'
    },

    projectedLocations: 200, // Show pricing at scale

    // If quote is locked
    lockedAt: '2025-11-06T00:00:00Z',
    expiresAt: '2025-12-06T00:00:00Z'
  }
}, '*');
```

#### CONFIRM_QUOTE_LOCK
Confirm that you've updated the database and the quote is locked.

```javascript
iframe.contentWindow.postMessage({
  type: 'CONFIRM_QUOTE_LOCK',
  data: {
    id: 'quote-uuid',
    lockedAt: '2025-11-06T10:00:00Z',
    expiresAt: '2025-12-06T10:00:00Z',
    version: 2
  }
}, '*');
```

#### CONFIRM_QUOTE_ACCEPTANCE
Confirm that user accepted terms and quote is now accepted.

```javascript
iframe.contentWindow.postMessage({
  type: 'CONFIRM_QUOTE_ACCEPTANCE',
  data: {
    id: 'quote-uuid',
    acceptedAt: '2025-11-06T10:30:00Z'
  }
}, '*');
```

#### SET_ADMIN_MODE
Enable/disable admin mode (for salespeople).

```javascript
iframe.contentWindow.postMessage({
  type: 'SET_ADMIN_MODE',
  data: { enabled: true }
}, '*');
```

---

## Complete Integration Example

```javascript
class QuoteManager {
  constructor() {
    this.iframe = document.getElementById('pricing-calculator');
    this.quoteId = null;
    this.setupListeners();
  }

  setupListeners() {
    window.addEventListener('message', (event) => {
      const { type, data } = event.data;

      switch(type) {
        case 'IFRAME_READY':
          this.initializeQuote();
          break;

        case 'QUOTE_SUMMARY_UPDATE':
          this.saveQuoteToDatabase(data);
          break;

        case 'QUOTE_LOCK_INTENT':
          this.lockQuote(data);
          break;

        case 'QUOTE_LOCKED':
          console.log('Quote locked successfully:', data);
          break;

        case 'QUOTE_ACCEPT_INTENT':
          this.showTermsModal(data);
          break;

        case 'QUOTE_ACCEPTED':
          this.redirectToOnboarding(data);
          break;

        case 'QUOTE_ERROR':
          this.handleError(data);
          break;
      }
    });
  }

  async initializeQuote() {
    // Load from your database
    const quote = await fetch('/api/quotes/current').then(r => r.json());

    this.quoteId = quote.id;

    // Send to calculator
    this.iframe.contentWindow.postMessage({
      type: 'INIT_QUOTE',
      data: quote
    }, '*');
  }

  async saveQuoteToDatabase(quoteData) {
    await fetch('/api/quotes/' + quoteData.id, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        selected_plan: quoteData.selectedPlan,
        count: quoteData.count,
        is_annual: quoteData.isAnnual,
        subtotal: quoteData.subtotal,
        final_monthly_price: quoteData.finalMonthlyPrice,
        price_per_unit: quoteData.pricePerUnit,
        annual_savings: quoteData.annualSavings,
        selection_raw: quoteData.selectionRaw,
        updated_at: new Date().toISOString()
      })
    });
  }

  async lockQuote({ id, expiresInDays }) {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + expiresInDays);

    await fetch('/api/quotes/' + id + '/lock', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        expires_at: expiresAt.toISOString()
      })
    });

    // Confirm to calculator
    this.iframe.contentWindow.postMessage({
      type: 'CONFIRM_QUOTE_LOCK',
      data: {
        id: id,
        lockedAt: new Date().toISOString(),
        expiresAt: expiresAt.toISOString(),
        version: 2
      }
    }, '*');
  }

  showTermsModal({ id }) {
    // Show your custom terms modal
    const modal = new TermsModal({
      onAccept: async () => {
        // Update database
        await fetch('/api/quotes/' + id + '/accept', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            accepted_at: new Date().toISOString()
          })
        });

        // Confirm to calculator
        this.iframe.contentWindow.postMessage({
          type: 'CONFIRM_QUOTE_ACCEPTANCE',
          data: {
            id: id,
            acceptedAt: new Date().toISOString()
          }
        }, '*');
      }
    });

    modal.show();
  }

  redirectToOnboarding({ id }) {
    window.location.href = '/onboarding?quote=' + id;
  }

  handleError({ error, code }) {
    console.error('Quote error:', error, code);
    alert('Error: ' + error);
  }
}

// Initialize
const quoteManager = new QuoteManager();
```

---

## Field Sync Checklist

When syncing data, ensure these fields are always included:

### Required Fields (Always)
- ✅ `id` - Quote UUID
- ✅ `selectedPlan` - Plan type
- ✅ `count` - Location/company count
- ✅ `isAnnual` - Billing frequency
- ✅ `status` - Quote status

### Pricing Fields (Always)
- ✅ `subtotal` - Base price
- ✅ `finalMonthlyPrice` - Final price after discounts
- ✅ `pricePerUnit` - Per-unit price
- ✅ `annualSavings` - Annual billing savings

### Optional Fields (Include if set)
- ⚠️ `customDiscount` - Custom discount config (null if not set)
- ⚠️ `royaltyProcessing` - Royalty fees (null if disabled)
- ⚠️ `onboardingFee` - Onboarding charges (null if not set)
- ⚠️ `customTerms` - SOW/terms (null if disabled)
- ⚠️ `projectedLocations` - Projected pricing (null if not active)

### Complete State (Always)
- ✅ `selectionRaw` - Complete quote state (JSONB field)

---

## URL Parameters for Pre-Configuration

You can pre-populate the calculator using URL parameters:

```
?mode=quote
&embedded=true
&plan=growth
&count=25
&annual=true
&discountType=percentage
&discountValue=15
&discountLabel=Early%20Adopter
&royaltyProcessing=true
&royaltyPerTx=1.82
&royaltyTxCount=2
&onboardingFee=5000
&onboardingTitle=Custom%20Setup
&projectedLocations=200
&admin=true
```

**Note:** URL parameters are overridden by `INIT_QUOTE` data if provided.

---

## Admin Mode

Enable admin mode for salespeople (removes limits, shows settings):

```javascript
// Via URL
?admin=true

// Via message
iframe.contentWindow.postMessage({
  type: 'SET_ADMIN_MODE',
  data: { enabled: true }
}, '*');
```

Admin mode features:
- Max locations: 500 (vs 50 for customers)
- Settings gear always visible
- Contact modal disabled
- Exact count display (no "50+" truncation)

---

## Best Practices

### 1. Always Save on QUOTE_SUMMARY_UPDATE
Don't wait for user to click "Save" - calculator sends updates every 300ms during editing.

### 2. Validate Before Locking
Check quote data is complete before confirming `QUOTE_LOCK_INTENT`.

### 3. Handle Errors Gracefully
If database save fails, send `QUOTE_ERROR` back to calculator.

### 4. Keep calculator Stateless
The calculator should NEVER store quote data permanently. Your database is the source of truth.

### 5. Use selection_raw for Everything
Store the complete `selection_raw` object - it contains all settings and can fully restore calculator state.

### 6. Verify Message Origin
In production, validate `event.origin` to prevent XSS attacks:

```javascript
if (event.origin !== 'https://your-calculator-url.com') return;
```

---

## Troubleshooting

### Issue: Calculator not receiving data

**Solution:** Ensure you send `INIT_QUOTE` AFTER receiving `IFRAME_READY`.

### Issue: Changes not saving

**Solution:** Listen for `QUOTE_SUMMARY_UPDATE` and save to database immediately.

### Issue: Quote won't lock

**Solution:** Send `CONFIRM_QUOTE_LOCK` after successfully updating database.

### Issue: Projected pricing not working

**Solution:** Only works in quote mode (`?mode=quote`) for non-AI-advisor plans.

---

## API Endpoints (Optional)

If using the built-in Supabase API:

```
POST /quotes/init        # Create new quote
POST /quotes/update      # Update draft quote
POST /quotes/lock        # Lock quote (freeze pricing)
GET  /quotes/:id         # Load existing quote
```

See [API.md](./API.md) for complete API documentation.

---

## Summary

**The calculator is a dumb component. Your main application is the brain.**

1. Load calculator in iframe with `?mode=quote&embedded=true`
2. Send `INIT_QUOTE` when you receive `IFRAME_READY`
3. Save to database when you receive `QUOTE_SUMMARY_UPDATE`
4. Confirm actions (lock, accept) by sending confirmation messages
5. Store everything in `selection_raw` field for complete state restoration

That's it. The calculator handles UI and calculations, you handle persistence and business logic.
