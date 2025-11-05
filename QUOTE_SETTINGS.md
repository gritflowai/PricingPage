# Quote Settings Sync Guide

This document explains how Settings (Discounts, Royalty Processing, Onboarding Fee) are synced with quotes in the pricing calculator.

## Table of Contents
- [Overview](#overview)
- [Settings That Sync](#settings-that-sync)
- [Data Flow](#data-flow)
- [URL Parameters](#url-parameters)
- [Test Cases](#test-cases)
- [Integration Examples](#integration-examples)
- [Troubleshooting](#troubleshooting)

---

## Overview

When working with quotes, all settings configured in the Settings modal are automatically:
1. **Saved** to the quote's `selection_raw` field (debounced 300ms)
2. **Loaded** from the quote when opening a quote URL
3. **Synced** in real-time as users make changes (draft mode only)

This ensures that when a sales rep creates a quote with custom pricing, discounts, royalty processing, or onboarding fees, the customer sees **exactly** the same pricing configuration when they open the quote link.

### Priority Order

When the calculator loads, settings are applied in this priority order:
1. **Quote data** (if in quote mode with existing quote ID)
2. **URL parameters** (if provided)
3. **localStorage** (saved from previous session)
4. **Default values** (hardcoded defaults)

---

## Settings That Sync

### 1. Custom Discount
Configure one-time promotional or negotiated discounts.

**Settings:**
- `customDiscountType`: `'percentage'` | `'fixed'` | `null`
- `customDiscountValue`: number (percentage or dollar amount)
- `customDiscountLabel`: string (displayed to customer)
- `customDiscountReason`: string (internal note, not shown to customer)

**Location:** Settings → Discounts tab

**Example:**
- Type: Percentage
- Value: 15
- Label: "Early Adopter Discount"
- Reason: "Q1 2025 promotion"

**Saved to quote as:**
```json
{
  "customDiscount": {
    "type": "percentage",
    "value": 15,
    "label": "Early Adopter Discount",
    "reason": "Q1 2025 promotion",
    "discountAmount": 250.00
  }
}
```

---

### 2. Royalty Processing
Add automated ACH royalty payment processing fees.

**Settings:**
- `royaltyProcessingEnabled`: boolean
- `royaltyBaseFee`: number (per location/month)
- `royaltyPerTransaction`: number (ACH fee per transaction)
- `estimatedTransactions`: number (monthly transactions per location)

**Location:** Settings → Royalty Processing tab

**Example:**
- Enabled: true
- Base Fee: $0/month
- Per Transaction: $1.82 ($0.32 WorldPay + $1.50 service fee)
- Estimated Transactions: 2/month

**Saved to quote as:**
```json
{
  "royaltyProcessing": {
    "enabled": true,
    "baseFee": 0,
    "perTransaction": 1.82,
    "estimatedTransactions": 2,
    "totalFee": 91.00
  }
}
```

---

### 3. Onboarding Fee (NEW!)
Add a one-time custom onboarding fee.

**Settings:**
- `onboardingFeeAmount`: number (one-time fee)
- `onboardingFeeTitle`: string (displayed to customer)
- `onboardingFeeDescription`: string (shown in tooltip)

**Location:** Settings → Onboarding Fee tab

**Example:**
- Amount: $5,000
- Title: "White-Glove Onboarding"
- Description: "Setup sCOA, hierarchy, benchmarking, KPI reporting and forecasting, and setup custom scorecards. This is white-glove onboarding with dedicated support to ensure your success from day one."

**Saved to quote as:**
```json
{
  "onboardingFee": {
    "amount": 5000,
    "title": "White-Glove Onboarding",
    "description": "Setup sCOA, hierarchy, benchmarking..."
  }
}
```

**Display:**
- Only shown when amount > 0
- Displayed in pricing details as a separate line item
- Clearly labeled as "ONE-TIME FEE"
- Includes tooltip with description

---

## Data Flow

### Creating a Quote with Settings

```
1. Sales Rep configures pricing calculator
   ├─ Selects plan, count, billing frequency
   ├─ Opens Settings modal
   ├─ Configures custom discount (15% off)
   ├─ Enables royalty processing ($1.82/txn)
   └─ Adds onboarding fee ($5,000)

2. Settings automatically saved to localStorage
   └─ Persists across sessions

3. Rep switches to quote mode (?mode=quote)
   └─ New quote created with UUID

4. Debounced updates (300ms) save to database
   └─ All settings stored in selection_raw field

5. Rep locks quote
   ├─ Pricing frozen for 30 days
   ├─ Controls disabled
   └─ Shareable URL generated
```

### Loading an Existing Quote

```
1. Customer opens quote URL
   └─ ?mode=quote&id=550e8400-e29b-41d4...

2. Quote loaded from database
   └─ GET /quotes/:id

3. Settings restored from selection_raw
   ├─ Custom discount → setCustomDiscountType/Value/Label
   ├─ Royalty processing → setRoyaltyProcessingEnabled/etc
   └─ Onboarding fee → setOnboardingFeeAmount/Title/Desc

4. Calculator displays exact pricing
   ├─ Pricing details show all discounts
   ├─ Royalty processing (if enabled)
   └─ Onboarding fee (if set)

5. Settings modal shows configuration
   └─ Sales rep can see all settings used
```

### Updating a Quote (Draft Mode)

```
1. User changes any setting
   └─ Slider, toggle, or Settings modal

2. State updated in React
   └─ useState hooks

3. Debounced effect triggered (300ms)
   └─ Waits for user to finish adjusting

4. Quote summary sent to API
   └─ POST /quotes/update

5. Database updated
   └─ selection_raw field contains all settings

6. Quote remains in draft mode
   └─ Can continue editing
```

---

## URL Parameters

All settings can be pre-configured via URL parameters.

### Custom Discount Parameters
```
&discountType=percentage         # or 'fixed'
&discountValue=15                # 15% or $15
&discountLabel=Early%20Adopter   # URL-encoded label
```

### Royalty Processing Parameters
```
&royaltyProcessing=true          # Enable royalty processing
&royaltyBaseFee=0                # Base fee per location/month
&royaltyPerTx=1.82               # Per-transaction fee
&royaltyTxCount=2                # Estimated monthly transactions
```

### Onboarding Fee Parameters (NEW!)
```
&onboardingFee=5000              # One-time fee amount
&onboardingTitle=Custom%20Setup  # URL-encoded title
&onboardingDesc=Full%20setup     # URL-encoded description
```

### Quote Mode Parameters
```
&mode=quote                      # Enable quote mode
&id=550e8400-e29b-41d4-a716...   # Quote UUID (optional for new)
&quoteExpiresInDays=30           # Days until expiration after lock
```

---

## Test Cases

### Test Case 1: Basic Quote with Custom Discount
**Scenario:** Create a quote with 15% discount for early adopters

**URL:**
```
http://localhost:3002/?mode=quote&plan=growth&count=25&annual=true&discountType=percentage&discountValue=15&discountLabel=Early%20Adopter%20Discount
```

**Expected Result:**
- Quote created in draft mode
- Growth plan, 25 locations, annual billing
- 15% discount applied
- Settings → Discounts tab shows configuration
- Pricing details show discount line item

---

### Test Case 2: Quote with Royalty Processing
**Scenario:** Franchise pricing with royalty payment processing

**URL:**
```
http://localhost:3002/?mode=quote&plan=growth&count=50&annual=true&royaltyProcessing=true&royaltyPerTx=1.82&royaltyTxCount=2
```

**Expected Result:**
- 50 locations, annual billing
- Royalty processing enabled
- $1.82 per transaction fee
- 2 estimated transactions per location
- Total royalty fee: 50 × 2 × $1.82 = $182/month
- Settings → Royalty Processing tab shows configuration

---

### Test Case 3: Quote with Onboarding Fee
**Scenario:** Custom setup with $5,000 one-time onboarding fee

**URL:**
```
http://localhost:3002/?mode=quote&plan=growth&count=25&annual=true&onboardingFee=5000&onboardingTitle=White-Glove%20Onboarding
```

**Expected Result:**
- 25 locations, annual billing
- $5,000 one-time onboarding fee
- Settings → Onboarding Fee tab shows configuration
- Pricing details show "White-Glove Onboarding" as ONE-TIME FEE
- Tooltip shows default onboarding description

---

### Test Case 4: Complete Configuration (All Settings)
**Scenario:** Full sales quote with discount, royalty, and onboarding

**URL:**
```
http://localhost:3002/?mode=quote&plan=scale&count=100&annual=true&discountType=percentage&discountValue=10&discountLabel=Volume%20Discount&royaltyProcessing=true&royaltyPerTx=1.82&royaltyTxCount=2&onboardingFee=10000&onboardingTitle=Enterprise%20Setup
```

**Expected Result:**
- Scale plan, 100 locations, annual billing
- 10% volume discount
- Royalty processing: $1.82/txn × 2 txns × 100 locations = $364/month
- $10,000 one-time onboarding fee
- All settings visible in Settings modal
- Pricing details show complete breakdown

---

### Test Case 5: Load Existing Quote
**Scenario:** Customer opens previously created quote

**Steps:**
1. Create quote using Test Case 4 URL
2. Click "Lock Quote for 30 Days"
3. Copy the quote ID from browser (e.g., `550e8400-e29b-41d4-a716-446655440000`)
4. Open new URL:

**URL:**
```
http://localhost:3002/?mode=quote&id=550e8400-e29b-41d4-a716-446655440000
```

**Expected Result:**
- Quote loads with status: "locked"
- All original settings restored:
  - Scale plan, 100 locations, annual billing
  - 10% volume discount
  - Royalty processing ($364/month)
  - $10,000 onboarding fee
- Controls disabled (sliders, plan selector, toggles)
- "Accept Quote" button visible
- Settings modal shows read-only configuration

---

### Test Case 6: Quote Expiration
**Scenario:** Quote expires after 30 days

**URL:**
```
http://localhost:3002/?mode=quote&id=<expired-quote-id>
```

**Expected Result:**
- Quote status: "expired"
- Red banner: "Quote Expired"
- All controls disabled
- Settings still visible in Settings modal
- Cannot accept expired quote

---

### Test Case 7: Embedded Quote Mode
**Scenario:** Quote embedded in iframe

**HTML:**
```html
<iframe
  src="http://localhost:3002/?embedded=true&mode=quote&plan=growth&count=25&annual=true&onboardingFee=5000"
  width="100%"
  height="900"
  frameborder="0"
></iframe>
```

**Expected Result:**
- Quote created in embedded mode
- Settings saved to database
- Parent receives `QUOTE_ID_READY` message
- Parent receives `QUOTE_SUMMARY_UPDATE` messages
- Settings sync works identically to non-embedded mode

---

## Integration Examples

### Example 1: React Parent Component

```tsx
import { useEffect, useState } from 'react';

function QuoteManager() {
  const [quoteId, setQuoteId] = useState<string | null>(null);
  const [quoteSummary, setQuoteSummary] = useState<any>(null);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      const message = event.data;

      switch (message.type) {
        case 'QUOTE_ID_READY':
          // New quote created
          setQuoteId(message.data.id);
          console.log('Quote created:', message.data.id);
          break;

        case 'QUOTE_SUMMARY_UPDATE':
          // Quote settings updated
          setQuoteSummary(message.data);

          // Access all settings
          const { selectionRaw } = message.data;
          console.log('Custom Discount:', selectionRaw.customDiscount);
          console.log('Royalty Processing:', selectionRaw.royaltyProcessing);
          console.log('Onboarding Fee:', selectionRaw.onboardingFee);
          break;

        case 'QUOTE_LOCKED':
          // Quote locked by sales rep
          const shareUrl = `${window.location.origin}?mode=quote&id=${message.data.id}`;
          console.log('Share this URL with customer:', shareUrl);

          // Send to your CRM
          await fetch('/api/quotes/share', {
            method: 'POST',
            body: JSON.stringify({
              quoteId: message.data.id,
              shareUrl: shareUrl,
              expiresAt: message.data.expiresAt
            })
          });
          break;
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  return (
    <div>
      <iframe
        src="http://localhost:3002/?mode=quote&embedded=true"
        width="100%"
        height="900"
      />

      {quoteSummary && (
        <div className="quote-summary">
          <h3>Current Quote Settings:</h3>

          {quoteSummary.selectionRaw.customDiscount && (
            <div>
              <strong>Discount:</strong>{' '}
              {quoteSummary.selectionRaw.customDiscount.label} -{' '}
              ${quoteSummary.selectionRaw.customDiscount.discountAmount}
            </div>
          )}

          {quoteSummary.selectionRaw.royaltyProcessing && (
            <div>
              <strong>Royalty Processing:</strong>{' '}
              ${quoteSummary.selectionRaw.royaltyProcessing.totalFee}/month
            </div>
          )}

          {quoteSummary.selectionRaw.onboardingFee && (
            <div>
              <strong>Onboarding:</strong>{' '}
              {quoteSummary.selectionRaw.onboardingFee.title} -{' '}
              ${quoteSummary.selectionRaw.onboardingFee.amount} (one-time)
            </div>
          )}
        </div>
      )}
    </div>
  );
}
```

---

### Example 2: Load Quote and Display Settings

```javascript
// Fetch quote from API
const quoteId = '550e8400-e29b-41d4-a716-446655440000';
const response = await fetch(
  `https://ijlpiwxodfsjmexktcoc.supabase.co/functions/v1/quotes/${quoteId}`
);
const quote = await response.json();

// Extract settings from selection_raw
const settings = quote.selection_raw;

// Display custom discount
if (settings.customDiscount) {
  console.log(`Discount: ${settings.customDiscount.label}`);
  console.log(`Amount: -$${settings.customDiscount.discountAmount}`);
}

// Display royalty processing
if (settings.royaltyProcessing?.enabled) {
  console.log(`Royalty Processing: $${settings.royaltyProcessing.totalFee}/month`);
  console.log(`- Base Fee: $${settings.royaltyProcessing.baseFee}/location`);
  console.log(`- Transaction Fee: $${settings.royaltyProcessing.perTransaction}/txn`);
}

// Display onboarding fee
if (settings.onboardingFee) {
  console.log(`Onboarding: ${settings.onboardingFee.title}`);
  console.log(`Cost: $${settings.onboardingFee.amount} (one-time)`);
  console.log(`Details: ${settings.onboardingFee.description}`);
}

// Build shareable URL with all settings
const shareUrl = new URL(window.location.origin);
shareUrl.searchParams.set('mode', 'quote');
shareUrl.searchParams.set('id', quote.id);
console.log('Share URL:', shareUrl.toString());
```

---

## Troubleshooting

### Issue: Settings not syncing to quote

**Symptoms:**
- Open a quote, settings are reset to defaults
- Settings modal shows empty/default values

**Solutions:**
1. Check quote mode is enabled: URL must have `?mode=quote`
2. Verify quote ID is valid: Check database for quote existence
3. Check browser console for errors
4. Verify `selection_raw` field in database contains settings:
   ```sql
   SELECT id, selection_raw FROM quotes WHERE id = 'quote-id';
   ```

---

### Issue: Settings not loading from quote

**Symptoms:**
- Quote loads but settings are defaults
- `selection_raw` has data but UI doesn't update

**Solutions:**
1. Check React DevTools to see if state is being set
2. Verify quote initialization useEffect is running
3. Check for console errors during quote load
4. Clear localStorage: `localStorage.removeItem('pricingSettings')`
5. Hard refresh: Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)

---

### Issue: Wrong settings showing in quote

**Symptoms:**
- Quote shows settings from localStorage instead of quote
- Old settings appear when loading quote

**Solutions:**
1. Priority issue: Quote settings should override localStorage
2. Check if quote `selection_raw` is being properly extracted
3. Verify quote mode is detected: `quoteMode === true`
4. Check that settings restoration code is running after quote load

**Debug:**
```javascript
// Add to quote initialization useEffect
console.log('Quote loaded:', existingQuote);
console.log('selection_raw:', existingQuote.selection_raw);
console.log('Quote mode active:', quoteMode);
```

---

### Issue: Debounced updates not saving

**Symptoms:**
- Make changes in draft mode
- Changes don't save to database
- Reload quote, changes are lost

**Solutions:**
1. Check network tab for POST to `/quotes/update`
2. Verify quote is in `draft` status (not `locked` or `accepted`)
3. Check useEffect dependencies include all settings:
   - `onboardingFeeAmount`
   - `onboardingFeeTitle`
   - `onboardingFeeDescription`
4. Verify 300ms debounce is working
5. Check for API errors in browser console

---

### Issue: Settings not appearing in Settings modal

**Symptoms:**
- Settings are in quote `selection_raw`
- Pricing details show settings correctly
- Settings modal shows defaults

**Solutions:**
1. Settings modal receives props from App.tsx
2. Verify props are being passed correctly
3. Check Settings component state initialization
4. Verify prop names match exactly:
   ```tsx
   onboardingFeeAmount={onboardingFeeAmount}
   onboardingFeeTitle={onboardingFeeTitle}
   onboardingFeeDescription={onboardingFeeDescription}
   ```

---

### Issue: Onboarding fee not showing in pricing details

**Symptoms:**
- Onboarding fee set in Settings
- Not visible in pricing breakdown

**Solutions:**
1. Check amount > 0: Only shows when `onboardingFeeAmount > 0`
2. Verify "Show pricing details" is expanded
3. Check React DevTools for state value
4. Verify conditional rendering:
   ```tsx
   {onboardingFeeAmount > 0 && (
     // Onboarding fee display
   )}
   ```

---

## API Reference

### Quote Summary Structure

The `selection_raw` field in quotes contains:

```typescript
{
  selectedPlan: 'growth',
  count: 25,
  isAnnual: true,

  // Custom discount (null if not set)
  customDiscount: {
    type: 'percentage' | 'fixed',
    value: number,
    label: string,
    reason: string,
    discountAmount: number
  } | null,

  // Royalty processing (null if not enabled)
  royaltyProcessing: {
    enabled: true,
    baseFee: number,
    perTransaction: number,
    estimatedTransactions: number,
    totalFee: number
  } | null,

  // Onboarding fee (null if not set)
  onboardingFee: {
    amount: number,
    title: string,
    description: string
  } | null
}
```

---

## Change Log

### Version 2.1.0 (2025-11-05)
- **NEW: Onboarding Fee sync** - One-time onboarding fees sync with quotes
- **NEW: Settings restoration** - All settings (discount, royalty, onboarding) restored when loading quotes
- **IMPROVED: URL parameters** - Added `onboardingFee`, `onboardingTitle`, `onboardingDesc`
- **IMPROVED: Priority handling** - Quote settings override localStorage
- **FIXED: Settings persistence** - Settings now properly save to and load from quotes

### Version 2.0.0 (2025-11-04)
- Initial quote mode implementation
- Custom discount sync with quotes
- Royalty processing sync with quotes

---

## Support

For questions or issues:
1. Review this documentation
2. Check [API.md](./API.md) for endpoint details
3. Check [EMBEDDING.md](./EMBEDDING.md) for iframe integration
4. Review browser console for errors
5. Test with provided URL examples above

## Quick Reference

**Quote Mode URL Format:**
```
?mode=quote&id={uuid}&plan={plan}&count={count}&annual={true|false}
&discountType={percentage|fixed}&discountValue={number}&discountLabel={text}
&royaltyProcessing={true|false}&royaltyPerTx={number}&royaltyTxCount={number}
&onboardingFee={number}&onboardingTitle={text}&onboardingDesc={text}
```

**Settings Tabs:**
- Discounts → Custom promotional/negotiated discounts
- Royalty Processing → ACH royalty payment fees
- Onboarding Fee → One-time setup/implementation fees

**Database Field:**
- All settings stored in `quotes.selection_raw` (JSONB)
