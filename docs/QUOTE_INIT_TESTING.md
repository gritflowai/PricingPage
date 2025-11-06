# Quote Initialization Testing Guide

This guide explains how to test the new two-phase quote initialization flow that fixes the "Quote not found" errors for new users.

## What Was Fixed

### Before
1. Calculator loaded with `?formId={uuid}` parameter
2. Tried to load quote from database via `GET /quotes/:id`
3. If quote didn't exist → ❌ **"Quote not found"** error dialog
4. User saw confusing error messages
5. Calculator couldn't initialize

### After
1. Calculator loads with `?formId={uuid}` parameter
2. **Phase 1:** Try to load existing quote from database
   - If exists → Load quote and send `QUOTE_ID_READY` ✅
   - If not found → Go to Phase 2
3. **Phase 2:** Wait for `INIT_QUOTE` message from parent
   - Show "Initializing quote..." loading banner
   - Parent sends `INIT_QUOTE` with initial data
   - Calculator creates quote in database
   - Send `QUOTE_ID_READY` to parent ✅
4. No error dialogs for expected missing quotes

## Test Cases

### Test Case 1: First-Time Load (No Existing Quote)

**Purpose**: Verify calculator waits for INIT_QUOTE when quote doesn't exist

**Steps**:
1. Open `test-quote-init.html` in browser
2. Click "Generate New Form ID" (creates fresh UUID)
3. Click "Load Calculator"
4. **Expected Result**:
   - Calculator loads successfully
   - Blue banner shows "Initializing quote... Waiting for quote data from parent application"
   - Status shows "✅ Calculator ready - Click Send INIT_QUOTE to create quote"
   - **NO error dialogs appear** ✅

5. Adjust plan/locations in control panel
6. Click "Send INIT_QUOTE"
7. **Expected Result**:
   - Calculator creates quote in database
   - Loading banner disappears
   - Calculator shows quote UI with selected values
   - Status shows "✅ Quote created successfully!"
   - Log shows `QUOTE_ID_READY` message received

**Success Criteria**:
- ✅ No error dialogs during initialization
- ✅ Calculator waits gracefully for INIT_QUOTE
- ✅ Quote created successfully after INIT_QUOTE
- ✅ Calculator functional after initialization

---

### Test Case 2: Return Visit (Existing Quote)

**Purpose**: Verify calculator loads existing quotes without issues

**Steps**:
1. Complete Test Case 1 first (creates a quote)
2. Note the Form ID used
3. Click "Load Calculator" again with same Form ID
4. **Expected Result**:
   - Calculator loads successfully
   - No loading banner (quote exists)
   - Quote loads with previously saved values
   - Status shows "✅ Quote loaded successfully"
   - **NO waiting for INIT_QUOTE** (unnecessary since quote exists)

**Success Criteria**:
- ✅ No error dialogs
- ✅ Existing quote loads immediately
- ✅ All saved values restored (plan, locations, billing, custom settings)
- ✅ No unnecessary INIT_QUOTE flow triggered

---

### Test Case 3: INIT_QUOTE with Custom Settings

**Purpose**: Verify calculator applies custom settings from INIT_QUOTE

**Steps**:
1. Generate new Form ID
2. Configure in control panel:
   - Plan: Scale
   - Locations: 50
   - Billing: Annual
3. Click "Load Calculator"
4. Click "Send INIT_QUOTE"
5. **Expected Result**:
   - Calculator creates quote with specified settings
   - UI shows Scale plan selected
   - Slider shows 50 locations
   - Annual toggle is ON
   - Pricing reflects these selections

**Success Criteria**:
- ✅ Calculator applies all settings from INIT_QUOTE
- ✅ UI updates immediately
- ✅ Pricing calculations correct

---

### Test Case 4: Missing Form ID

**Purpose**: Verify proper error handling when formId is missing

**Steps**:
1. Open calculator directly: `http://localhost:3000/?mode=quote&embedded=true`
2. **Expected Result**:
   - Red error banner appears: "Error: No Form ID provided"
   - Message: "Cannot save quote. This page must be accessed with a valid Form ID in the URL."
   - Calculator still renders (with limited functionality)

**Success Criteria**:
- ✅ Clear error message shown
- ✅ User understands the issue
- ✅ Calculator doesn't crash

---

### Test Case 5: Network Error Handling

**Purpose**: Verify calculator handles real errors appropriately

**Steps**:
1. Stop the Supabase backend
2. Generate new Form ID
3. Load calculator
4. Send INIT_QUOTE
5. **Expected Result**:
   - Network error occurs
   - Error message sent via postMessage: `QUOTE_ERROR`
   - User sees meaningful error (not "Quote not found")

**Success Criteria**:
- ✅ Network errors reported clearly
- ✅ Distinguished from "quote doesn't exist yet" (expected state)
- ✅ Error messages are actionable

---

### Test Case 6: Quote Updates After Initialization

**Purpose**: Verify quote syncing works after initialization

**Steps**:
1. Create new quote via Test Case 1
2. Change slider to different location count
3. Toggle billing frequency
4. Wait 300ms (debounce period)
5. **Expected Result**:
   - `QUOTE_SUMMARY_UPDATE` message sent to parent
   - Quote saved to database
   - Changes persist across page refresh

**Success Criteria**:
- ✅ Updates auto-save every 300ms
- ✅ All changes included in QUOTE_SUMMARY_UPDATE
- ✅ Quote persists in database
- ✅ Reload shows updated values

---

## Console Output Reference

### Successful First-Time Load

```
[PricingCalculator] Iframe detection: {isInIframe: true, formId: 'abc-123...'}
[PricingCalculator] Attempting to load existing quote for formId: abc-123...
[PricingCalculator] Quote not found, waiting for INIT_QUOTE message from parent...
[PricingCalculator] Sent postMessage: IFRAME_READY
[PricingCalculator] Received message from parent: {type: 'INIT_QUOTE', ...}
[PricingCalculator] Received INIT_QUOTE message, creating new quote...
[PricingCalculator] Created new quote: abc-123...
[PricingCalculator] Quote initialized successfully, sent QUOTE_ID_READY
```

### Successful Return Visit

```
[PricingCalculator] Iframe detection: {isInIframe: true, formId: 'abc-123...'}
[PricingCalculator] Attempting to load existing quote for formId: abc-123...
[PricingCalculator] Loaded existing quote: abc-123...
[PricingCalculator] Quote loaded successfully, sent QUOTE_ID_READY
```

### Error (Missing Form ID)

```
[PricingCalculator] Quote mode requires a formId parameter in the URL
[PricingCalculator] Sent postMessage: QUOTE_ERROR {error: 'Quote mode requires...'}
```

---

## Integration with Parent Application

### Parent Application Flow

```javascript
// 1. Generate Form ID
const formId = crypto.randomUUID();

// 2. Embed calculator with formId
const iframe = document.createElement('iframe');
iframe.src = `https://pricing.auty.io/?formId=${formId}&embedded=true&mode=quote`;
document.body.appendChild(iframe);

// 3. Listen for IFRAME_READY
window.addEventListener('message', (event) => {
  if (event.data.type === 'IFRAME_READY') {
    // 4. Send INIT_QUOTE with initial data
    iframe.contentWindow.postMessage({
      type: 'INIT_QUOTE',
      data: {
        id: formId,
        selectedPlan: 'growth',
        count: 25,
        isAnnual: true,
        status: 'draft'
      }
    }, '*');
  }

  if (event.data.type === 'QUOTE_ID_READY') {
    console.log('Quote ready:', event.data.id);
    // 5. Quote is now initialized and functional
  }

  if (event.data.type === 'QUOTE_SUMMARY_UPDATE') {
    // 6. Save updates to your database
    saveQuoteToDatabase(event.data);
  }
});
```

---

## Troubleshooting

### Issue: Blue loading banner never goes away

**Cause**: INIT_QUOTE message not sent by parent

**Solution**: Ensure parent sends INIT_QUOTE after receiving IFRAME_READY

---

### Issue: Calculator shows error after INIT_QUOTE

**Cause**: Backend API error (network, validation, etc.)

**Solution**: Check:
- Supabase backend is running
- Form ID format is valid UUID
- API endpoints are accessible
- Check console for detailed error messages

---

### Issue: Existing quotes not loading

**Cause**: Quote ID doesn't match Form ID in URL

**Solution**: Verify Form ID in URL matches quote.id in database

---

### Issue: Changes not saving

**Cause**: Quote status is not 'draft'

**Solution**: Only draft quotes can be updated. Locked/accepted quotes are read-only.

---

## Running the Tests

### 1. Start Development Server

```bash
npm run dev
```

### 2. Open Test Page

```bash
# Open in browser:
http://localhost:3000/test-quote-init.html
```

### 3. Watch Console

Open browser DevTools → Console tab to see detailed logging

### 4. Check Network

DevTools → Network tab to verify API calls:
- `POST /quotes/init` - Creating new quote
- `GET /quotes/:id` - Loading existing quote
- `POST /quotes/update` - Saving updates

---

## Files Modified

### Core Implementation

- **src/hooks/useIframeMessaging.ts**
  - Added `INIT_QUOTE` to `IncomingMessage` type
  - Added handler for `INIT_QUOTE` messages
  - Extended data interface with quote initialization fields

- **src/App.tsx**
  - Added `waitingForInit` state variable
  - Implemented two-phase initialization in quote mode useEffect
  - Added `INIT_QUOTE` message handler useEffect
  - Added loading banner UI for initialization state
  - Send `QUOTE_ID_READY` after both initialization paths

### Testing Files

- **test-quote-init.html** - Interactive test page for quote initialization
- **docs/QUOTE_INIT_TESTING.md** - This testing guide

### Documentation

- **docs/api/SYNC_EMBEDDING.md** - Already documented the protocol (no changes needed)

---

## Success Metrics

After implementing this fix, you should observe:

1. **Zero "Quote not found" errors** during normal first-time flow
2. **Seamless onboarding** for new users at step 7 (pricing)
3. **Instant loading** for return visits (existing quotes)
4. **Clear feedback** during initialization (loading banner)
5. **Proper error handling** for real issues (network, etc.)

---

## Next Steps

1. Test all cases above locally
2. Deploy to staging environment
3. Test with real onboarding form integration
4. Monitor error rates in production
5. Gather user feedback

---

## Support

If you encounter issues:

1. Check console logs for detailed error messages
2. Verify message flow in Network tab (postMessage events)
3. Confirm backend API is accessible
4. Review this testing guide for troubleshooting steps

For questions, see: `docs/api/SYNC_EMBEDDING.md`
