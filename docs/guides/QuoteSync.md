# QuoteSync.md

## Overview

The AI Growth Advisor Onboarding Form embeds the Pricing Calculator as an iframe and syncs pricing/quote data bidirectionally using the browser's postMessage API.

**Key Principle**: The quote is the **source of truth** after initial load. The form pre-fills the calculator with initial data, then the calculator sends updates back to the form as the user configures pricing.

## Architecture Diagram

```
┌─────────────────────────────────────┐
│   Onboarding Form (main.ts)        │
│   https://advisor.auty.io           │
│                                     │
│  ┌───────────────────────────────┐ │
│  │  Iframe: Pricing Calculator   │ │
│  │  https://pricing.auty.io      │ │
│  │  ?formId={uuid}&embedded=true │ │
│  └───────────────────────────────┘ │
│                                     │
│  PricingCalculatorService           │
│  - Listens for postMessage events  │
│  - Sends LOAD_QUOTE message         │
│  - Exposes RxJS observables         │
└─────────────────────────────────────┘

Message Flow:
1. Form → Calculator: URL params (initial values)
2. Calculator → Form: QUOTE_SUMMARY_UPDATE (on every change)
3. Form → Calculator: LOAD_QUOTE (when returning to existing quote)
```

## URL Parameters (Form → Calculator)

When the form embeds the calculator, it passes initial values via URL parameters:

| Parameter            | Type    | Description                                            | Example                                |
| -------------------- | ------- | ------------------------------------------------------ | -------------------------------------- |
| `formId`             | UUID    | **Required.** Unique form/quote identifier             | `aa005fb1-89e1-42b5-aaed-8df45368731c` |
| `embedded`           | boolean | Hides calculator header/footer                         | `true`                                 |
| `mode`               | string  | Display mode: `quote` or `calculator`                  | `quote`                                |
| `quoteExpiresInDays` | number  | Days until quote expires                               | `30`                                   |
| `theme`              | string  | Visual theme: `transparent`, `light`, `dark`           | `transparent`                          |
| `admin`              | boolean | Enables admin features (onboarding fee, custom terms)  | `true`                                 |
| `userType`           | string  | User context: `franchisee`, `franchisor`, `accountant` | `franchisee`                           |
| `count`              | number  | Number of locations to onboard                         | `5`                                    |
| `projectedLocations` | number  | Total locations in network (for pricing at scale)      | `25`                                   |
| `selectedPlan`       | string  | Pre-selected plan: `starter`, `professional`, `elite`  | `professional`                         |
| `isAnnual`           | boolean | Pre-select annual billing                              | `true`                                 |

**Example URL:**

```
https://pricing.auty.io/?formId=aa005fb1-89e1-42b5-aaed-8df45368731c&embedded=true&mode=quote&quoteExpiresInDays=30&theme=transparent&admin=true&userType=franchisee&count=5&projectedLocations=25&selectedPlan=professional&isAnnual=true
```

## PostMessage Events (Calculator → Form)

The calculator sends updates to the form using `window.parent.postMessage()`. The form listens via `PricingCalculatorService`.

### Event: QUOTE_SUMMARY_UPDATE

Sent whenever the user changes any pricing configuration in the calculator.

**Message Structure:**

```typescript
{
  type: 'QUOTE_SUMMARY_UPDATE',
  data: {
    // Quote metadata
    quoteId: string;           // UUID of the quote
    status: 'draft' | 'locked' | 'accepted' | 'expired';
    lockedAt: string | null;   // ISO date when quote was locked
    expiresAt: string | null;  // ISO date when quote expires

    // Pricing configuration
    count: number;             // Number of locations to onboard
    projectedLocations: number | null;  // Total locations in network
    selectedPlan: 'starter' | 'professional' | 'elite';
    isAnnual: boolean;         // true = annual, false = monthly

    // Price breakdown
    finalPrice: number;        // Final monthly or annual price
    priceBreakdown: {
      basePrice: number;       // Base plan price per location
      totalBasePrice: number;  // basePrice × count
      discountAmount: number;  // Total discount amount
      finalMonthlyPrice: number;  // After discounts + royalty fees
      finalAnnualPrice: number;   // finalMonthlyPrice × 12
    };

    // Discounts
    discount: {
      type: 'percentage' | 'fixed' | null;
      value: number;           // 15 = 15% or $15 fixed
      reason: string;          // "Early adopter pricing"
    } | null;

    // Royalty processing
    royaltyProcessing: {
      enabled: boolean;
      flatFeePerLocation: number;  // e.g., 25 = $25/location/month
    } | null;

    // Onboarding fee (one-time)
    onboardingFee: {
      amount: number;          // e.g., 5000 = $5,000
      title: string;           // "Custom Onboarding Package"
      description: string;     // "Includes data migration and training"
    } | null;

    // Custom contract terms
    customTerms: {
      enabled: boolean;
      title: string;           // "Special Payment Terms"
      content: string;         // Multi-line text content
    } | null;
  }
}
```

**Form Handler:**

```typescript
this.pricingCalculatorService.quoteSummary$
  .pipe(takeUntil(this.destroy$))
  .subscribe((summary) => {
    // Smart merge: preserve existing data when calculator doesn't send all fields
    const existing = this.form.value.pricingCalculatorData || {};
    const finalPrice =
      summary.priceBreakdown?.finalMonthlyPrice || summary.finalPrice;

    const pricingDataUpdate = {
      ...existing,
      quoteId: summary.quoteId,
      status: summary.status,
      lockedAt: summary.lockedAt,
      expiresAt: summary.expiresAt,
      count: summary.count,
      selectedPlan: summary.selectedPlan,
      isAnnual: summary.isAnnual,
      finalPrice: finalPrice,
      priceBreakdown: summary.priceBreakdown,
      ...(summary.discount !== undefined && { discount: summary.discount }),
      ...(summary.royaltyProcessing !== undefined && {
        royaltyProcessing: summary.royaltyProcessing,
      }),
      ...(summary.onboardingFee !== undefined && {
        onboardingFee: summary.onboardingFee,
      }),
      ...(summary.customTerms !== undefined && {
        customTerms: summary.customTerms,
      }),
      ...(summary.projectedLocations !== undefined && {
        projectedLocations: summary.projectedLocations,
      }),
    };

    // Update form controls
    this.form.patchValue(
      {
        locationsToOnboard: summary.count,
        estimatedMonthlyBudget: finalPrice,
        selectedPlan: summary.selectedPlan,
        preferredBilling: summary.isAnnual ? "annual" : "monthly",
        totalLocations: summary.projectedLocations || summary.count,
        pricingCalculatorData: pricingDataUpdate,
      },
      { emitEvent: false }
    );

    // Auto-save to Supabase
    this.saveDebounce$.next();
  });
```

### Event: QUOTE_ERROR

Sent when the calculator encounters an error.

**Message Structure:**

```typescript
{
  type: 'QUOTE_ERROR',
  data: {
    error: string;  // Error message
    code?: string;  // Optional error code
  }
}
```

**Form Handler:**

```typescript
this.pricingCalculatorService.quoteError$
  .pipe(takeUntil(this.destroy$))
  .subscribe((error) => {
    console.log("[AppComponent] Quote error:", error);

    // Suppress expected errors during initial quote creation
    const isInitializationError =
      error.error === "Quote not found" ||
      error.error === "Quote not found or not in draft status";

    if (isInitializationError) {
      console.log(
        "[AppComponent] Ignoring initialization error - quote will be created on first change"
      );
      return; // Suppress dialog
    }

    // Only show alert for unexpected errors
    console.error("[AppComponent] Unexpected quote error:", error);
    alert(`Quote Error: ${error.error}`);
  });
```

## PostMessage Events (Form → Calculator)

### Event: LOAD_QUOTE

Sent when the user returns to an existing form with saved quote data. This tells the calculator to restore its state from the saved quote.

**When to Send:**

- User navigates to form with `?uid={formId}` parameter
- Form loads existing data from Supabase
- Quote data exists in `form.value.pricingCalculatorData`

**Message Structure:**

```typescript
{
  type: 'LOAD_QUOTE',
  data: {
    quoteId: string;  // UUID of the saved quote
    formId: string;   // UUID of the form (same as quoteId)
    // Include full pricingCalculatorData object
    ...form.value.pricingCalculatorData
  }
}
```

**Form Sender:**

```typescript
// After iframe loads and form data is restored
const iframe = document.querySelector('iframe[src*="pricing.auty.io"]');
if (
  iframe &&
  iframe.contentWindow &&
  this.form.value.pricingCalculatorData?.quoteId
) {
  iframe.contentWindow.postMessage(
    {
      type: "LOAD_QUOTE",
      data: {
        quoteId: this.form.value.pricingCalculatorData.quoteId,
        formId: this.formId,
        ...this.form.value.pricingCalculatorData,
      },
    },
    "https://pricing.auty.io"
  );
}
```

## Field Mapping (Form ↔ Calculator)

| Form Field                                | Calculator Field                   | Direction         | Notes                                             |
| ----------------------------------------- | ---------------------------------- | ----------------- | ------------------------------------------------- |
| `locationsToOnboard`                      | `count`                            | Both              | Number of locations to onboard immediately        |
| `totalLocations`                          | `projectedLocations`               | Both              | Total locations in network (for pricing at scale) |
| `selectedPlan`                            | `selectedPlan`                     | Both              | starter, professional, elite                      |
| `preferredBilling`                        | `isAnnual`                         | Both              | annual → true, monthly → false                    |
| `estimatedMonthlyBudget`                  | `priceBreakdown.finalMonthlyPrice` | Calculator → Form | Use finalMonthlyPrice (includes royalty fees)     |
| `pricingCalculatorData.quoteId`           | `quoteId`                          | Calculator → Form | UUID of the quote                                 |
| `pricingCalculatorData.status`            | `status`                           | Calculator → Form | draft, locked, accepted, expired                  |
| `pricingCalculatorData.lockedAt`          | `lockedAt`                         | Calculator → Form | ISO date when quote was locked                    |
| `pricingCalculatorData.expiresAt`         | `expiresAt`                        | Calculator → Form | ISO date when quote expires                       |
| `pricingCalculatorData.discount`          | `discount`                         | Calculator → Form | Discount details (type, value, reason)            |
| `pricingCalculatorData.royaltyProcessing` | `royaltyProcessing`                | Calculator → Form | Royalty fee configuration                         |
| `pricingCalculatorData.onboardingFee`     | `onboardingFee`                    | Calculator → Form | One-time onboarding fee details                   |
| `pricingCalculatorData.customTerms`       | `customTerms`                      | Calculator → Form | Custom contract terms                             |

## Data Flow Sequences

### Sequence 1: First Visit (No Saved Quote)

```
1. User lands on form at https://advisor.auty.io/
2. User fills out basic info, selects 5 locations, selects "Professional" plan
3. User navigates to pricing step
4. Form generates iframe URL with initial values:
   https://pricing.auty.io/?formId={NEW_UUID}&count=5&selectedPlan=professional&...
5. Calculator loads, sees formId in URL
6. Calculator tries: GET /quotes/{formId} → 404 (quote doesn't exist yet)
7. Calculator displays pricing UI with URL params as defaults
8. User changes location count to 7
9. Calculator sends: QUOTE_SUMMARY_UPDATE with count=7, quoteId={NEW_UUID}
10. Form receives update, patches form.value.locationsToOnboard = 7
11. Form auto-saves to Supabase (500ms debounce)
12. Calculator auto-saves quote to its database: POST /quotes/init
```

**Expected Console Output (Calculator):**

```
[PricingCalculator] Initializing with formId: aa005fb1-89e1-42b5-aaed-8df45368731c
[PricingCalculator] GET /quotes/aa005fb1-89e1-42b5-aaed-8df45368731c → 404 (expected)
[PricingCalculator] No existing quote found, will create on first change
[PricingCalculator] Loading URL params: count=5, selectedPlan=professional
[PricingCalculator] User changed count to 7
[PricingCalculator] POST /quotes/init → 201 Created
[PricingCalculator] Sending QUOTE_SUMMARY_UPDATE to parent window
```

### Sequence 2: Returning to Existing Form

```
1. User navigates to https://advisor.auty.io/?uid={EXISTING_UUID}
2. Form loads data from Supabase
3. Form sees pricingCalculatorData.quoteId exists
4. Form generates iframe URL: https://pricing.auty.io/?formId={EXISTING_UUID}&...
5. Calculator loads, tries: GET /quotes/{EXISTING_UUID} → 200 OK
6. Calculator restores state from quote data
7. Form waits for iframe to load (onload event)
8. Form sends: LOAD_QUOTE message with full pricingCalculatorData
9. Calculator receives LOAD_QUOTE, updates UI to match saved state
10. Calculator sends: QUOTE_SUMMARY_UPDATE (confirmation)
11. Form receives update, verifies data matches
```

**Expected Console Output (Calculator):**

```
[PricingCalculator] Initializing with formId: aa005fb1-89e1-42b5-aaed-8df45368731c
[PricingCalculator] GET /quotes/aa005fb1-89e1-42b5-aaed-8df45368731c → 200 OK
[PricingCalculator] Loaded existing quote: status=draft, count=7, selectedPlan=professional
[PricingCalculator] Received LOAD_QUOTE message from parent
[PricingCalculator] Verifying state matches saved quote... ✓
[PricingCalculator] Sending QUOTE_SUMMARY_UPDATE to parent window
```

### Sequence 3: Locking a Quote

```
1. User clicks "Lock Quote" button in calculator
2. Calculator: POST /quotes/{quoteId}/lock → 200 OK
3. Calculator updates internal state: status = 'locked', lockedAt = ISO date
4. Calculator sends: QUOTE_SUMMARY_UPDATE with status='locked', lockedAt=ISO date
5. Form receives update, patches form.value.pricingCalculatorData
6. Form auto-saves to Supabase
7. Calculator disables editing UI (quote is now read-only)
```

## Quote Lifecycle

```
draft → locked → accepted → expired
  ↓       ↓         ↓
  ├─ Can be edited freely
  ├─ Can be locked by admin/user
  ├─ Can be accepted by customer
  └─ Expires after quoteExpiresInDays (default: 30)
```

| Status     | Editable? | Description                                           |
| ---------- | --------- | ----------------------------------------------------- |
| `draft`    | Yes       | Initial state, user can change any values             |
| `locked`   | No        | Admin has locked the quote, ready for customer review |
| `accepted` | No        | Customer has accepted the quote                       |
| `expired`  | No        | Quote has passed expiration date                      |

## Error Handling

### Expected Errors (Suppress in Form)

These errors are **normal during initialization** and should be logged to console but not shown to the user:

- `Quote not found` (404) - Happens on first visit, quote will be created on first change
- `Quote not found or not in draft status` (400) - Happens when trying to update non-existent quote

### Unexpected Errors (Show to User)

These errors indicate a real problem and should be shown in a user-facing alert:

- `Invalid quote data` - Calculator received malformed data
- `Quote is locked` - User tried to edit a locked quote
- `Quote has expired` - User tried to edit an expired quote
- `Network error` - Failed to save quote to database

## Testing Checklist

### Test Case 1: First-Time Form Submission

- [ ] Navigate to form without `uid` parameter
- [ ] Fill out basic info, select 5 locations
- [ ] Navigate to pricing step
- [ ] Verify calculator loads with count=5
- [ ] Change count to 7 in calculator
- [ ] Verify form updates locationsToOnboard to 7
- [ ] Verify auto-save to Supabase completes
- [ ] Verify no error dialogs appear

### Test Case 2: Returning to Existing Form

- [ ] Navigate to form with `?uid={EXISTING_UUID}`
- [ ] Verify form loads saved data from Supabase
- [ ] Navigate to pricing step
- [ ] Verify calculator loads with saved quote data
- [ ] Verify LOAD_QUOTE message is sent
- [ ] Verify calculator displays correct saved state
- [ ] Change a value in calculator
- [ ] Verify form updates and auto-saves

### Test Case 3: Admin Features

- [ ] Enable admin mode: `?admin=true`
- [ ] Add onboarding fee in calculator ($5,000)
- [ ] Verify form displays onboarding fee in "Contract Details" section
- [ ] Add custom terms in calculator
- [ ] Verify form displays custom terms in collapsed section
- [ ] Apply discount (15% early adopter)
- [ ] Verify form displays discount details
- [ ] Enable royalty processing ($25/location)
- [ ] Verify form updates finalMonthlyPrice to include royalty fees

### Test Case 4: Quote Locking

- [ ] Create quote in draft status
- [ ] Click "Lock Quote" button in calculator
- [ ] Verify form receives status='locked', lockedAt={ISO_DATE}
- [ ] Verify form displays "LOCKED" status badge
- [ ] Verify calculator disables editing UI
- [ ] Try to edit locked quote
- [ ] Verify error: "Quote is locked"

## Data Storage

### Form Storage (Supabase: ai_advisor_applications)

```sql
CREATE TABLE ai_advisor_applications (
  id UUID PRIMARY KEY,
  data JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**JSONB Structure:**

```json
{
  "formValues": {
    "locationsToOnboard": 7,
    "totalLocations": 25,
    "selectedPlan": "professional",
    "preferredBilling": "annual",
    "estimatedMonthlyBudget": 1750,
    "pricingCalculatorData": {
      "quoteId": "aa005fb1-89e1-42b5-aaed-8df45368731c",
      "status": "draft",
      "lockedAt": null,
      "expiresAt": "2025-12-06T00:00:00Z",
      "count": 7,
      "projectedLocations": 25,
      "selectedPlan": "professional",
      "isAnnual": true,
      "finalPrice": 1750,
      "priceBreakdown": {
        "basePrice": 250,
        "totalBasePrice": 1750,
        "discountAmount": 0,
        "finalMonthlyPrice": 1750,
        "finalAnnualPrice": 21000
      },
      "discount": null,
      "royaltyProcessing": {
        "enabled": true,
        "flatFeePerLocation": 25
      },
      "onboardingFee": {
        "amount": 5000,
        "title": "Custom Onboarding Package",
        "description": "Includes data migration and training"
      },
      "customTerms": {
        "enabled": true,
        "title": "Special Payment Terms",
        "content": "Net 30 payment terms\nQuarterly invoicing available"
      }
    }
  }
}
```

### Calculator Storage (Pricing Calculator Database)

The calculator maintains its own quote database with a similar structure. The `quoteId` should match the `formId` for consistency.

## Quote URL Format

The form displays a clickable link to the standalone quote view:

```
https://pricing.auty.io/?mode=quote&formId={uuid}
```

This allows users to:

- Share the quote with stakeholders
- View the quote outside the embedded context
- Lock/accept the quote in a dedicated interface

## Development Notes

- **Service File**: [src/pricing-calculator.service.ts](src/pricing-calculator.service.ts) - Handles all postMessage communication
- **Form Component**: [src/main.ts](src/main.ts) - Main form component with iframe embed
- **Template Section**: Lines 4047-4155 in main.ts - "Pricing Configured" display
- **Quote Summary Subscription**: Lines 6149-6180 in main.ts - Handles QUOTE_SUMMARY_UPDATE
- **Error Subscription**: Lines 6318-6337 in main.ts - Handles QUOTE_ERROR

## Key Implementation Details

### Smart Merge Pattern

The form uses a "smart merge" pattern to preserve existing data when the calculator sends partial updates:

```typescript
const pricingDataUpdate = {
  ...existing, // Preserve all existing fields
  quoteId: summary.quoteId, // Always update these core fields
  status: summary.status,
  count: summary.count,
  // Only update these fields if calculator sends them
  ...(summary.onboardingFee !== undefined && {
    onboardingFee: summary.onboardingFee,
  }),
  ...(summary.customTerms !== undefined && {
    customTerms: summary.customTerms,
  }),
};
```

This prevents data loss if the calculator doesn't send all fields in every update.

### Auto-Save Debounce

The form auto-saves to Supabase with a 500ms debounce to avoid excessive database writes:

```typescript
private saveDebounce$ = new Subject<void>();

this.saveDebounce$
  .pipe(
    debounceTime(500),
    takeUntil(this.destroy$)
  )
  .subscribe(() => this.saveFormData());
```

### Currency Formatting

All currency values should be formatted with comma separators:

```typescript
{
  {
    form.value.pricingCalculatorData.onboardingFee.amount?.toLocaleString(
      "en-US",
      {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }
    );
  }
}
```

---

## App Mode (Subscription Management)

App Mode is a third mode for the pricing calculator, designed for existing customers to manage their subscription within `app.autymate.com`.

### Mode Comparison

| Mode | Purpose | CTA Button | Data Persistence |
|------|---------|------------|------------------|
| `calculator` | Public website | "Start Free Trial" | None |
| `quote` | CRM/onboarding | "Lock Quote" / "Accept" | Auto-save drafts |
| `app` | Subscription management | "Update My Plan" | Explicit save |

### URL Parameters (App Mode)

```
https://pricing.auty.io/?mode=app&formId={uuid}&embedded=true
```

| Parameter | Required | Description |
|-----------|----------|-------------|
| `mode` | Yes | Must be `app` |
| `formId` | Yes | Customer's subscription ID (same as their quote/form UUID) |
| `embedded` | Yes | Enable iframe mode |

**Note:** The locked status is determined from the database (quote status), not from URL parameters.

### PostMessage Events (App Mode)

#### Outgoing: PLAN_UPDATE_REQUESTED

Sent when the user clicks "Update My Plan" button.

```typescript
{
  type: 'PLAN_UPDATE_REQUESTED',
  data: {
    formId: string;
    selectedPlan: string;
    count: number;
    isAnnual: boolean;
    finalPrice: number;
    priceBreakdown: {
      subtotal: number;
      customDiscount: number;
      annualSavings: number;
      finalMonthlyPrice: number;
    };
  }
}
```

#### Outgoing: PLAN_UPDATED

Sent after changes are successfully saved to the database.

```typescript
{
  type: 'PLAN_UPDATED',
  data: {
    formId: string;
    selectedPlan: string;
    count: number;
    isAnnual: boolean;
    finalPrice: number;
    priceBreakdown: {
      subtotal: number;
      customDiscount: number;
      annualSavings: number;
      finalMonthlyPrice: number;
    };
  }
}
```

#### Outgoing: PLAN_UPDATE_BLOCKED

Sent when user tries to update a locked subscription.

```typescript
{
  type: 'PLAN_UPDATE_BLOCKED',
  data: {
    formId: string;
    selectedPlan: string;
    count: number;
    isAnnual: boolean;
    finalPrice: number;
    reason: string; // e.g., "Subscription is locked"
  }
}
```

#### Incoming: INIT_SUBSCRIPTION

Parent app can send this to initialize the calculator with subscription data.

```typescript
{
  type: 'INIT_SUBSCRIPTION',
  data: {
    subscriptionId: string;
    subscriptionStatus: 'active' | 'locked';
    currentPlan: string;
    currentCount: number;
    currentIsAnnual: boolean;
    lockedReason?: string;
  }
}
```

### App Mode Button States

| State | Button Text | Style | Description |
|-------|-------------|-------|-------------|
| No changes | "Current Plan" | Gray, disabled | User hasn't modified anything |
| Has changes | "Update My Plan" | Blue (#1239FF) | User has unsaved changes |
| Saving | "Saving Changes..." | Blue + spinner | Save in progress |
| Saved | "Plan Updated Successfully" | Green | Success state (3 seconds) |
| Locked | "Contact Sales to Update Plan" | Orange | Subscription requires sales assistance |

### App Mode Banner States

The `AppModeBanner` component shows contextual status:

| Status | Color | Message |
|--------|-------|---------|
| `current` | Gray | "Manage Your Subscription" |
| `unsaved` | Blue | "You Have Unsaved Changes" |
| `saving` | Blue (pulse) | "Saving Your Changes..." |
| `saved` | Green | "Plan Updated Successfully" |
| `locked` | Orange | "Subscription Modifications Locked" |

### Key Differences from Quote Mode

1. **No auto-save**: Changes only persist when user clicks "Update My Plan"
2. **Change detection**: Tracks original values to detect unsaved changes
3. **Explicit save**: User must consciously save changes
4. **Locked = Contact Sales**: Locked subscriptions show contact option instead of editing

### Example Integration (Parent App)

```typescript
// Initialize subscription when iframe loads
const iframe = document.getElementById('pricing-calculator') as HTMLIFrameElement;

iframe.contentWindow?.postMessage({
  type: 'INIT_SUBSCRIPTION',
  data: {
    subscriptionId: customer.subscriptionId,
    subscriptionStatus: customer.status,
    currentPlan: customer.plan,
    currentCount: customer.locationCount,
    currentIsAnnual: customer.billingCycle === 'annual'
  }
}, 'https://pricing.auty.io');

// Listen for plan updates
window.addEventListener('message', (event) => {
  if (event.origin !== 'https://pricing.auty.io') return;

  switch (event.data.type) {
    case 'PLAN_UPDATE_REQUESTED':
      console.log('User is updating plan:', event.data.data);
      break;
    case 'PLAN_UPDATED':
      console.log('Plan updated successfully:', event.data.data);
      // Sync to Stripe, update local state, etc.
      break;
    case 'PLAN_UPDATE_BLOCKED':
      console.log('Update blocked:', event.data.data.reason);
      break;
  }
});
```

### Testing Checklist (App Mode)

- [ ] `?mode=app&formId=xxx` initializes app mode
- [ ] Subscription data loads from API on mount
- [ ] Button shows "Current Plan" when no changes
- [ ] Button changes to "Update My Plan" on selection change
- [ ] Clicking "Update My Plan" saves to database
- [ ] Button shows "Plan Updated Successfully" for 3 seconds after save
- [ ] Locked subscription shows "Contact Sales to Update Plan" button
- [ ] INIT_SUBSCRIPTION message properly initializes calculator
- [ ] postMessage events fire correctly to parent

---

## Support and Issues

- **Form Repository**: https://github.com/yourusername/AI-Growth-Advisor-Onboarding-Form
- **Pricing Calculator**: Contact pricing calculator team for issues with quote initialization, onboarding fee sync, or custom terms sync
- **Console Logging**: Both form and calculator log all postMessage events to console for debugging

---

**Last Updated**: 2025-12-18
**Version**: 1.1 (Added App Mode)
