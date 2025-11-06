# Future Quotes Specification - Simple Implementation

## Executive Summary

This spec describes a **minimal, practical approach** to handle future pricing quotes for "true-up" contracts where customers commit to a future quantity but start with fewer units.

**Core Problem:** Customer says "I have 32 locations now, but will have 120 in 90 days." Sales needs to show both pricing scenarios.

**Simple Solution:** Create two separate quotes with different Form IDs, linked together.

---

## Key Design Principles

1. **Build on what works** - Use existing quote system, just create two quotes instead of one
2. **Minimal UI changes** - Add a small "Future Pricing" section, don't redesign everything
3. **Separate Form IDs** - Each quote gets its own Form ID for independent Stripe tracking
4. **Manual process is OK** - Sales rep creates both quotes, it doesn't need to be fully automated

---

## Feature 1: Future Pricing Input (Simple)

### Where: Main Calculator Screen

Add a collapsible section BELOW the quantity slider:

```
┌──────────────────────────────────────────────────┐
│  [ ] Show Future Pricing (optional)              │
│      For customers who will grow over time       │
└──────────────────────────────────────────────────┘
```

When checked, show:

```
┌──────────────────────────────────────────────────┐
│  ✓ Future Pricing Enabled                        │
│                                                   │
│  Current Quantity:    [32]   (starting today)   │
│  Future Quantity:     [120]  (in 90 days)       │
│  Commitment Period:   [90] days                  │
│                                                   │
│  [ Generate Both Quotes ]                        │
└──────────────────────────────────────────────────┘
```

### What Happens When "Generate Both Quotes" is Clicked:

1. **Creates TWO quotes in database:**
   - Quote A: 32 locations (Current) - gets Form ID A
   - Quote B: 120 locations (Future) - gets Form ID B

2. **Links them together** with `related_quote_id` field

3. **Shows TWO shareable links:**
   ```
   Current Quote (32 locations):
   https://...?mode=quote&id=abc123&label=Current
   [Copy Link]

   Future Quote (120 locations):
   https://...?mode=quote&id=def456&label=Future
   [Copy Link]
   ```

That's it. Simple.

---

## Feature 2: Visual Distinction for Future Quotes

### When viewing a Future quote (?label=Future in URL):

**Add a small banner at the top:**

```
┌──────────────────────────────────────────────────┐
│  📈 FUTURE PRICING                               │
│  This is projected pricing for 120 locations     │
│  Current pricing: View Current Quote             │
└──────────────────────────────────────────────────┘
```

**Add a badge on the pricing card:**
```
┌──────────────────────────────────────────────────┐
│  [FUTURE PRICING] badge in purple                │
│                                                   │
│  Growth Plan                                     │
│  120 locations                                   │
│  $89/month per location                          │
└──────────────────────────────────────────────────┘
```

That's all. Don't change the rest of the UI.

---

## Feature 3: Form ID Tracking (Critical for Stripe)

### Current Issue:
- Quotes use quote ID (UUID) but no separate Form ID
- Need independent Form IDs for tracking multiple quotes for same customer

### Simple Solution:

**Add ONE field to quotes table:**
```sql
ALTER TABLE quotes ADD COLUMN form_id VARCHAR(50);
```

**Form ID Format:**
- Current Quote: `FORM-{timestamp}-CURR-{random4}`
  - Example: `FORM-20250104-CURR-X7K2`
- Future Quote: `FORM-{timestamp}-FUTR-{random4}`
  - Example: `FORM-20250104-FUTR-M9P5`

**Why this works:**
- Each quote has unique Form ID
- Easy to identify Current vs Future quotes
- Can track in Stripe metadata independently
- Human-readable for support

### Usage:

1. **When creating Stripe subscription**, include:
   ```javascript
   metadata: {
     form_id: "FORM-20250104-CURR-X7K2",
     quote_id: "abc123",
     quote_type: "current" // or "future"
   }
   ```

2. **When customer accepts Current quote** → Stripe gets Current Form ID
3. **When customer accepts Future quote** → Stripe gets Future Form ID
4. **Both are tracked separately** but linked via `related_quote_id`

---

## Feature 4: Quote Expiration Date Picker

### Current: Fixed 30 days
### Need: Flexible date picker

**Add to Settings Modal → "Discounts" tab:**

```
┌──────────────────────────────────────────────────┐
│  Quote Expiration (optional)                     │
│                                                   │
│  [ ] Set custom expiration date                  │
│                                                   │
│  When enabled:                                    │
│  Expires on: [Date Picker: Nov 19, 2024]        │
│                                                   │
│  Default: 30 days from when quote is locked      │
└──────────────────────────────────────────────────┘
```

**Implementation:**
- If date picker is empty → use default 30 days from lock
- If date is set → use that specific date
- Save as `custom_expiration_date` in quote
- Show countdown: "Expires in 5 days" or "Expires on Nov 19"

**That's it.** Don't overcomplicate with start date, just end date.

---

## Feature 5: Expired Quote Improvements

### Current: Shows red banner
### Add: Call-to-action button

**When quote is expired, show:**

```
┌──────────────────────────────────────────────────┐
│  ⚠️ Quote Expired                                │
│  This quote expired on Jan 15, 2025              │
│                                                   │
│  [ Schedule Meeting to Get Updated Pricing ]    │
└──────────────────────────────────────────────────┘
```

**When button clicked:**
- If `?calendar=true` parameter exists → open ContactModal
- Otherwise → show "Contact sales at [email]"

Simple addition, big UX improvement.

---

## Database Changes (Minimal)

### quotes table - Add 3 columns:

```sql
-- Form ID for Stripe tracking
ALTER TABLE quotes ADD COLUMN form_id VARCHAR(50);

-- Link related quotes (current ↔ future)
ALTER TABLE quotes ADD COLUMN related_quote_id UUID REFERENCES quotes(id);

-- Quote type identifier
ALTER TABLE quotes ADD COLUMN quote_type VARCHAR(20) DEFAULT 'standard';
-- Values: 'standard', 'current', 'future'

-- Optional custom expiration
ALTER TABLE quotes ADD COLUMN custom_expiration_date TIMESTAMP;
```

**That's it.** No new tables. No complex schemas.

---

## API Changes (Minimal)

### 1. Create Quote - Add Form ID generation

**Existing endpoint:** `POST /quotes/init`

**Change:** Auto-generate `form_id` when creating quote:
```typescript
const formId = `FORM-${Date.now()}-STD-${randomString(4)}`;
```

### 2. Create Future Quote - New endpoint

**New endpoint:** `POST /quotes/{id}/create-future`

**Body:**
```json
{
  "futureQuantity": 120,
  "commitmentDays": 90
}
```

**Response:**
```json
{
  "currentQuote": {
    "id": "abc123",
    "form_id": "FORM-20250104-CURR-X7K2",
    "count": 32
  },
  "futureQuote": {
    "id": "def456",
    "form_id": "FORM-20250104-FUTR-M9P5",
    "count": 120
  }
}
```

**Logic:**
1. Load original quote
2. Create copy with new count (120)
3. Generate new Form ID with FUTR suffix
4. Set `quote_type = 'future'`
5. Link via `related_quote_id`
6. Return both

### 3. Get Quote - Include related quote

**Existing endpoint:** `GET /quotes/{id}`

**Change:** Include related quote info:
```json
{
  "quote": { ...existing fields... },
  "relatedQuote": {
    "id": "def456",
    "type": "future",
    "count": 120,
    "url": "https://...?mode=quote&id=def456"
  }
}
```

---

## UI Components to Add/Modify

### 1. FuturePricingToggle.tsx (NEW - small component)

```typescript
// Just a checkbox + input fields
// ~100 lines of code
<div className="border rounded-lg p-4">
  <label>
    <input type="checkbox" /> Show Future Pricing
  </label>

  {enabled && (
    <>
      <input label="Current Quantity" value={current} />
      <input label="Future Quantity" value={future} />
      <input label="Commitment Days" value={days} />
      <button onClick={generateBothQuotes}>
        Generate Both Quotes
      </button>
    </>
  )}
</div>
```

### 2. FutureQuoteBanner.tsx (NEW - tiny component)

```typescript
// Just a colored banner
// ~50 lines of code
{quoteType === 'future' && (
  <div className="bg-purple-50 border-l-4 border-purple-500 p-4">
    📈 FUTURE PRICING - Projected for {count} locations
    {relatedQuote && (
      <a href={relatedQuote.url}>View Current Quote</a>
    )}
  </div>
)}
```

### 3. Settings.tsx (MODIFY - add date picker)

Add to "Discounts" tab:
- Custom expiration date toggle
- Date picker input (use existing date-fns utilities)
- ~50 lines added

### 4. QuoteModeBanner.tsx (MODIFY - add CTA button)

For expired status:
- Add "Schedule Meeting" button
- ~20 lines added

### 5. App.tsx (MODIFY - state management)

Add state for:
```typescript
const [showFuturePricing, setShowFuturePricing] = useState(false);
const [currentQuantity, setCurrentQuantity] = useState(count);
const [futureQuantity, setFutureQuantity] = useState(count);
const [commitmentDays, setCommitmentDays] = useState(90);
const [customExpirationDate, setCustomExpirationDate] = useState<Date | null>(null);
```

Add handler:
```typescript
const generateBothQuotes = async () => {
  // Create current quote
  const currentQuoteId = await saveQuote({ count: currentQuantity });

  // Create future quote via API
  const { futureQuote } = await api.createFutureQuote(currentQuoteId, {
    futureQuantity,
    commitmentDays
  });

  // Show both URLs
  setShowQuoteLinks({ current: currentQuoteId, future: futureQuote.id });
};
```

~100 lines total

---

## Implementation Plan (Incremental)

### Phase 1: Form ID Foundation (1-2 days)
- [ ] Add `form_id`, `related_quote_id`, `quote_type`, `custom_expiration_date` columns
- [ ] Update quote creation to auto-generate Form IDs
- [ ] Test Form ID generation

### Phase 2: Future Quote UI (2-3 days)
- [ ] Create FuturePricingToggle component
- [ ] Create FutureQuoteBanner component
- [ ] Add state management to App.tsx
- [ ] Test UI interactions

### Phase 3: API Endpoint (2 days)
- [ ] Create `/quotes/{id}/create-future` endpoint
- [ ] Update `/quotes/{id}` to include related quote
- [ ] Test API with Postman

### Phase 4: Date Picker (1-2 days)
- [ ] Add custom expiration date picker to Settings
- [ ] Update quote locking logic to use custom date if set
- [ ] Test date calculations

### Phase 5: Expired Quote UX (1 day)
- [ ] Add "Schedule Meeting" button to expired banner
- [ ] Handle calendar query string
- [ ] Test expired quote flow

### Phase 6: Polish & Testing (2 days)
- [ ] Test full flow: create both quotes → share links → accept → track Form IDs
- [ ] Update documentation
- [ ] Sales team demo

**Total: ~10 days work**

---

## Success Criteria (Simple)

1. ✅ Sales rep can create 2 separate quotes with different quantities
2. ✅ Each quote has unique Form ID (CURR vs FUTR)
3. ✅ Customer sees visual distinction for future quotes
4. ✅ Links work independently (can share both or just one)
5. ✅ Form IDs ready for Stripe metadata (future payment integration)
6. ✅ Custom expiration dates work
7. ✅ Expired quotes show meeting CTA

---

## What This DOESN'T Include (Keep it simple)

❌ Automatic commitment tracking (not needed yet)
❌ Stripe payment integration (separate project)
❌ Commission calculation (comes later)
❌ Authentication/admin views (not required)
❌ Email sending (use manual link sharing)
❌ Complex pricing projections (just two separate quotes)
❌ Automated deadline reminders (manual follow-up)

---

## Usage Example (Sales Process)

### Scenario: Customer says "I have 32 locations, will have 120 in 90 days"

**Step 1:** Sales rep opens pricing calculator
```
- Sets quantity to 32
- Checks "Show Future Pricing"
- Sets Future Quantity to 120
- Sets Commitment Period to 90 days
- Clicks "Generate Both Quotes"
```

**Step 2:** System creates two quotes
```
Current Quote (32 locations):
Form ID: FORM-20250104-CURR-X7K2
URL: ...?mode=quote&id=abc123

Future Quote (120 locations):
Form ID: FORM-20250104-FUTR-M9P5
URL: ...?mode=quote&id=def456
```

**Step 3:** Sales rep shares both links with customer
```
Email:
"Hi Customer,

Here's your pricing for 32 locations to start:
[Current Quote Link]

When you reach 120 locations, your pricing will be:
[Future Quote Link]

You have 30 days to accept. Let me know if you have questions!"
```

**Step 4:** Customer accepts Current quote
- Stripe subscription created with Form ID `FORM-20250104-CURR-X7K2`
- Customer starts at $145/location for 32 locations
- Future quote remains valid as reference

**Step 5:** Customer grows to 120 locations (3 months later)
- Stripe subscription quantity auto-updates (existing functionality)
- Price per location drops automatically (tier pricing)
- Form ID remains `FORM-20250104-CURR-X7K2` (tracks to original deal)

**Optional:** If future is separate subscription
- Customer accepts Future quote
- New Stripe subscription with Form ID `FORM-20250104-FUTR-M9P5`
- Both tracked independently

---

## File Changes Summary

### New Files (2):
1. `src/components/FuturePricingToggle.tsx` - ~100 lines
2. `src/components/FutureQuoteBanner.tsx` - ~50 lines

### Modified Files (3):
1. `src/App.tsx` - Add ~150 lines (state + handlers)
2. `src/components/Settings.tsx` - Add ~50 lines (date picker)
3. `src/components/QuoteModeBanner.tsx` - Add ~20 lines (CTA button)

### Database Migration (1):
1. `migrations/add_future_quote_support.sql` - 4 ALTER statements

### API Changes (1):
1. `supabase/functions/quotes/create-future.ts` - New endpoint, ~100 lines

**Total: ~470 lines of new code + 4 SQL statements**

This is a **small, focused change** that solves the core problem without overwhelming complexity.

---

## Questions to Confirm

1. **Form ID format OK?** `FORM-{timestamp}-{CURR|FUTR}-{random4}`
2. **Two separate quotes approach OK?** (vs. one quote with two prices)
3. **Manual link sharing OK?** (vs. automated email sending)
4. **30 days default expiration OK?** (with optional custom date override)
5. **Future quote just shows pricing, no commitment tracking?** (track in Stripe later)

---

## Next Steps

1. Review this spec with team
2. Confirm approach is acceptable
3. Create database migration
4. Start Phase 1 implementation
5. Iterate based on feedback

**This spec prioritizes simplicity and practicality over perfection.** The goal is to ship something useful quickly that solves the real problem without creating technical debt.
