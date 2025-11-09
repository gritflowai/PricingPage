# Deploy Edge Function - Quick Fix for Location Count Saving

## The Problem
Your location count changes aren't saving because the Edge Function on Supabase doesn't have the fix deployed.

## Quick Deploy Steps

### Option 1: Via Supabase Dashboard (Easiest)

1. Copy the entire contents of this file:
   `C:\repos\PricingPage\supabase\functions\quotes\index.ts`

2. Go to your Supabase Dashboard:
   https://app.supabase.com/project/ijlpiwxodfsjmexktcoc/functions

3. Click on the **"quotes"** function

4. Click **"Edit"**

5. Delete all existing code and paste the new code

6. Click **"Deploy"**

7. Wait for deployment to complete (usually 30 seconds)

### Option 2: Via Supabase CLI

```bash
# If you have access to deploy:
npx supabase functions deploy quotes --project-ref ijlpiwxodfsjmexktcoc
```

## Test It Works

1. Open your quote:
   http://localhost:3000/?mode=quote&formId=47f05360-1111-4a9b-a662-8a15a84d6126&admin=true

2. Open browser console (F12)

3. Change location count to **38**

4. Look for console message: `[Auto-Save] Quote successfully saved with count: 38`

5. **Refresh the page**

6. Location count should still be **38**

## Verify in Database

Run this SQL query in Supabase:

```sql
SELECT id, count, selected_plan, is_annual, updated_at
FROM quotes
WHERE id = '47f05360-1111-4a9b-a662-8a15a84d6126';
```

The `count` field should show **38**.

## What The Fix Does

The Edge Function now extracts the location count from `selection_raw` and updates the database `count` field:

```typescript
if (selectionRaw.count !== undefined) {
  updateData.count = selectionRaw.count;
}
```

This ensures that when you change the location slider, it actually saves to the database.