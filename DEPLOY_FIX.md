# Quote Auto-Save Fix - Deployment Instructions

## Problem Fixed
The quote auto-save wasn't working because the Edge Function `/quotes/update` endpoint was not updating the core fields (`selected_plan`, `count`, `is_annual`). It was only updating pricing calculations.

## Changes Made

### 1. Frontend Changes (`src/App.tsx`)
- Added `userType` to `selection_raw` object (line 723)
- Added `userType` to dependency array (line 786)
- Added `customTermsEnabled`, `customTermsTitle`, `customTermsContent` to dependency array (lines 811-813)
- Added restoration of `userType` and `customTerms` from database (lines 510-513, 562-572)
- Added `userType` support in INIT_QUOTE handler (line 1172-1174)
- Added debug logging to trace auto-save issues (lines 710-716, 721, 782)

### 2. Edge Function Changes (`supabase/functions/quotes/index.ts`)
**CRITICAL FIX:** Modified the `/quotes/update` endpoint to:
- Extract `selectedPlan`, `count`, and `isAnnual` from `selection_raw`
- Update these fields in the database along with pricing calculations
- Added `subscription_price` and `subscription_price_per_unit` fields

Changes in lines 188-210:
```typescript
// Extract core fields from selection_raw if available
const selectionRaw = body.summary.selection_raw || {};
const updateData: any = {
    subtotal: body.summary.subtotal,
    final_monthly_price: body.summary.final_monthly_price,
    subscription_price: body.summary.subscription_price,
    subscription_price_per_unit: body.summary.subscription_price_per_unit,
    price_per_unit: body.summary.price_per_unit,
    annual_savings: body.summary.annual_savings,
    price_breakdown: body.summary.price_breakdown,
    plan_details: body.summary.plan_details,
    selection_raw: selectionRaw,
    updated_at: now,
};

// Also update the core fields from selection_raw
if (selectionRaw.selectedPlan !== undefined) {
  updateData.selected_plan = selectionRaw.selectedPlan;
}
if (selectionRaw.count !== undefined) {
  updateData.count = selectionRaw.count;
}
if (selectionRaw.isAnnual !== undefined) {
  updateData.is_annual = selectionRaw.isAnnual;
}
```

## Deployment Steps

### 1. Deploy Edge Function to Supabase

You need to deploy the updated Edge Function. Run these commands:

```bash
# Login to Supabase CLI (if not already logged in)
npx supabase login

# Link to your project (use your project ref: ijlpiwxodfsjmexktcoc)
npx supabase link --project-ref ijlpiwxodfsjmexktcoc

# Deploy the quotes function
npx supabase functions deploy quotes --no-verify-jwt
```

If you can't use the CLI, you can also deploy via the Supabase Dashboard:
1. Go to https://app.supabase.com/project/ijlpiwxodfsjmexktcoc
2. Navigate to Edge Functions
3. Find the "quotes" function
4. Click Edit
5. Replace the code with the updated code from `supabase/functions/quotes/index.ts`
6. Click Deploy

### 2. Deploy Frontend Changes

The frontend is already built. Deploy the `dist` folder to your hosting service.

## Testing the Fix

1. Go to: http://localhost:3000/?mode=quote&formId=47f05360-1111-4a9b-a662-8a15a84d6126&admin=true
2. Open browser console (F12)
3. Change the location count to 38
4. Look for console logs:
   - `[Auto-Save Debug]` - Shows if conditions are met for saving
   - `[Auto-Save] Attempting to save quote with count: 38`
   - `[Auto-Save] Quote successfully saved with count: 38`
5. Wait 1 second for debounce
6. Refresh the page
7. The location count should persist as 38

## Verify in Database

Run this SQL query to confirm the changes are saved:

```sql
SELECT id, selected_plan, count, is_annual, status, updated_at, selection_raw
FROM quotes
WHERE id = '47f05360-1111-4a9b-a662-8a15a84d6126';
```

The `count` field should now show 38 (or whatever value you set).

## What Was Wrong

The Edge Function was only updating these fields:
- `subtotal`
- `final_monthly_price`
- `price_per_unit`
- `annual_savings`
- `price_breakdown`
- `plan_details`
- `selection_raw`

But NOT updating:
- `selected_plan` ❌
- `count` ❌
- `is_annual` ❌

Now it updates all fields correctly!