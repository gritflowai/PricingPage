# Embedding the Pricing Calculator

This guide explains how to embed the pricing calculator on your website and communicate with it via iframe messaging.

## Quick Start

### 1. Basic Iframe Embed

Add this HTML code to your website where you want the pricing calculator to appear:

```html
<iframe
  id="pricing-calculator"
  src="https://your-deployed-url.com?embedded=true&theme=transparent"
  width="100%"
  height="800"
  frameborder="0"
  style="border: none;"
></iframe>
```

### 2. Listen for User Selections

Add this JavaScript code to receive pricing selections and user actions:

```javascript
window.addEventListener('message', function(event) {
  // For security, verify the origin in production
  // if (event.origin !== "https://your-deployed-url.com") return;

  const message = event.data;

  switch(message.type) {
    case 'IFRAME_READY':
      console.log('Pricing calculator is ready');
      break;

    case 'PRICING_SELECTION_UPDATE':
      // User changed their selections
      const selection = message.data;
      console.log('User selected:', selection);

      // Access the data:
      console.log('Plan:', selection.selectedPlan);
      console.log('Companies/Users:', selection.count);
      console.log('Billing:', selection.isAnnual ? 'Annual' : 'Monthly');
      console.log('Price:', selection.finalPrice);
      console.log('Per unit:', selection.pricePerUnit);

      // You can now use this data to:
      // - Update your UI
      // - Pre-fill form fields
      // - Track analytics
      // - Store in local storage
      break;

    case 'USER_ACTION':
      // User clicked a CTA button
      const action = message.data.action;
      const selections = message.data.selections;

      if (action === 'START_FREE_TRIAL') {
        console.log('User wants to start trial with:', selections);
        // Redirect to signup page or open modal
        window.location.href = '/signup?plan=' + selections.selectedPlan;
      } else if (action === 'CONTACT_SALES') {
        console.log('User wants to contact sales');
        // Open your contact form or CRM
      } else if (action === 'SCHEDULE_MEETING') {
        console.log('User scheduled a meeting');
        // Track conversion or update CRM
      }
      break;

    case 'ENTERPRISE_INQUIRY':
      // User reached enterprise threshold
      console.log('Enterprise inquiry for', message.data.count, message.data.planName);
      // Trigger sales notification
      break;
  }
});
```

## URL Parameters

Customize the pricing calculator behavior using URL parameters:

### Required for Embedding
- `?embedded=true` - Enables iframe mode (adjusts layout, enables messaging)

### Optional Customization
- `&theme=transparent` - Removes background color for seamless integration
- `&hideSettings=true` - Hides the admin settings button
- `&admin=true` - **Admin mode for salespeople** (`isAdmin` property - see [Admin Mode](#admin-mode-new) section below)
- `&plan=growth` - Pre-select a plan (`ai-advisor`, `starter`, `growth`, `scale`)
- `&count=25` - Pre-fill companies/users count
- `&projectedLocations=6000` - Show future pricing projection at specified count (displays "what you'll pay at scale")
- `&annual=true` - Pre-select annual billing (`true` or `false`)
- `&discountType=percentage` - Pre-apply a discount type (`percentage` or `fixed`)
- `&discountValue=15` - Pre-apply discount value (percentage as number or dollar amount)
- `&discountLabel=Q1%20Promotion` - Pre-apply discount label (URL-encoded)
- `&royaltyProcessing=true` - Enable royalty payment processing feature
- `&royaltyBaseFee=0` - Set base fee per location per month (default: $0)
- `&royaltyPerTx=1.82` - Set per-transaction ACH fee (default: $1.82, includes $0.32 WorldPay fee + $1.50 service fee)
- `&royaltyTxCount=2` - Set estimated transactions per location per month (default: 2)
- `&onboardingFee=5000` - Set one-time onboarding fee amount (default: 0)
- `&onboardingTitle=Custom%20Setup` - Set onboarding fee title (URL-encoded, default: "Custom Onboarding Fee")
- `&onboardingDesc=Full%20setup` - Set onboarding fee description (URL-encoded, default: comprehensive onboarding text)

### Example: Full Configuration
```html
<iframe
  src="https://your-url.com?embedded=true&theme=transparent&hideSettings=true&plan=growth&count=25&annual=true"
  width="100%"
  height="800"
></iframe>
```

### Example: With Custom Discount
```html
<iframe
  src="https://your-url.com?embedded=true&theme=transparent&plan=growth&count=25&annual=true&discountType=percentage&discountValue=15&discountLabel=Early%20Adopter%20Discount"
  width="100%"
  height="800"
></iframe>
```

### Example: With Royalty Processing
```html
<iframe
  src="https://your-url.com?embedded=true&theme=transparent&plan=growth&count=25&annual=true&royaltyProcessing=true&royaltyPerTx=1.82&royaltyTxCount=2"
  width="100%"
  height="800"
></iframe>
```

### Example: With Projected Pricing (Future Growth Scenario)
```html
<!-- Show current pricing for 130 pilot locations + future pricing for 6,000 locations at scale -->
<iframe
  src="https://your-url.com?embedded=true&theme=transparent&userType=franchisee&count=130&projectedLocations=6000&annual=true"
  width="100%"
  height="800"
></iframe>
```

**Use Case:** Perfect for sales presentations where customers need to understand pricing as they scale. For example, showing UPS that their 130-location pilot will cost $X/month, while their future 6,000-location rollout will cost $Y/month with volume discounts.

## Message Types & Data Structures

### 1. IFRAME_READY
Sent when the calculator finishes loading.

```javascript
{
  type: 'IFRAME_READY'
}
```

### 2. PRICING_SELECTION_UPDATE
Sent whenever user changes selections (debounced 300ms for sliders).

```javascript
{
  type: 'PRICING_SELECTION_UPDATE',
  data: {
    // User information
    userType: 'franchisee',            // User's role: 'cpa', 'franchisee', or 'smb'

    // Selected configuration
    selectedPlan: 'growth',           // Plan type: ai-advisor, starter, growth, scale
    count: 25,                         // Number of companies or users
    isAnnual: true,                    // Billing frequency

    // Calculated pricing
    finalPrice: 1600.00,               // Final monthly price after discounts
    pricePerUnit: 64.00,               // Price per company/user
    totalPrice: 2000.00,               // Base price before discounts
    monthlySavings: 333.33,            // Monthly savings if annual
    wholesaleDiscountAmount: 0,        // Dollar amount of wholesale discount
    resellerCommissionAmount: 0,       // Dollar amount of reseller commission
    wholesaleDiscount: 0,              // Wholesale discount percentage
    resellerCommission: 0,             // Reseller commission percentage

    // NEW: Projected pricing (null if not set via projectedLocations parameter)
    projectedLocations: 6000,          // Future/target location count (null if not provided)
    projectedPrice: 50460.00,          // Projected monthly price at future count (null if not provided)
    projectedPricePerUnit: 8.41,       // Projected price per unit at future count (null if not provided)

    // NEW: Custom discount (null if no discount applied)
    customDiscount: {
      type: 'percentage',              // Discount type: 'percentage' or 'fixed'
      value: 15,                       // Discount value (15% or $15)
      label: 'Early Adopter Discount', // Display label
      reason: 'Q1 2025 promotion',     // Internal notes
      discountAmount: 250.00           // Calculated dollar discount
    } | null,

    // NEW: Royalty payment processing (null if not enabled)
    royaltyProcessing: {
      enabled: true,                   // Whether royalty processing is enabled
      baseFee: 0,                      // Monthly base fee per location
      perTransaction: 1.82,            // Fee per ACH transaction ($0.32 WorldPay + $1.50 service)
      estimatedTransactions: 2,        // Estimated monthly transactions per location
      totalFee: 91.00                  // Calculated total royalty processing fee (25 locations × 2 txns × $1.82)
    } | null,

    // NEW: Detailed price breakdown
    priceBreakdown: {
      subtotal: 2000.00,               // Before any discounts
      volumeDiscount: 0,               // Volume tier discount (baked into subtotal)
      customDiscount: 250.00,          // Custom discount amount
      wholesaleDiscount: 0,            // Wholesale discount amount
      annualSavings: 333.33,           // Annual billing savings
      royaltyProcessingFee: 91.00,     // Royalty payment processing fee (if enabled)
      finalMonthlyPrice: 1691.00       // Final price after all discounts + royalty processing
    },

    // Plan features
    planDetails: {
      name: 'Growth',                  // Display name
      connections: 3,                  // Number of integrations
      users: 125,                      // Total users (count × usersPerCompany)
      scorecards: 250,                 // Total scorecards or 'unlimited'
      aiTokens: 125000                 // Total AI tokens (count × tokensPerCompany)
    }
  }
}
```

**User Type Values:**
- `'cpa'` - CPA/Accountant: User refers to items as "clients"
- `'franchisee'` - Franchisee/ZOR: User refers to items as "locations"
- `'smb'` - Small Business Owner: User refers to items as "companies"

The `userType` field helps you understand the user's perspective and terminology preferences, enabling you to:
- Customize messaging based on their role (e.g., "Perfect for accounting firms" vs "Great for franchise brands")
- Track which user segments are interested in which plans
- Tailor follow-up communications to their industry
- Use appropriate terminology in your UI ("clients" vs "locations" vs "companies")

### 3. USER_ACTION
Sent when user clicks action buttons (Start Free Trial, Contact Sales, Schedule Meeting).

```javascript
{
  type: 'USER_ACTION',
  data: {
    action: 'START_FREE_TRIAL',  // or 'CONTACT_SALES' or 'SCHEDULE_MEETING'
    selections: {
      // Same structure as PRICING_SELECTION_UPDATE data
      userType: 'franchisee',    // User's role: 'cpa', 'franchisee', or 'smb'
      selectedPlan: 'growth',
      count: 25,
      isAnnual: true,
      finalPrice: 1600.00,
      // ... all other pricing data
    }
  }
}
```

### 4. ENTERPRISE_INQUIRY
Sent when user selects more companies/users than the plan's threshold.

```javascript
{
  type: 'ENTERPRISE_INQUIRY',
  data: {
    count: 50,                    // Number that triggered threshold
    planName: 'Growth'            // Plan name
  }
}
```

## Integration Examples

### Example 1: Webflow Custom Code

Add to your Webflow page's **Before `</body>` tag** section:

```html
<script>
// Store latest pricing selection
let latestPricingSelection = null;

window.addEventListener('message', function(event) {
  const message = event.data;

  if (message.type === 'PRICING_SELECTION_UPDATE') {
    latestPricingSelection = message.data;

    // Update a Webflow text element with the price
    const priceDisplay = document.getElementById('current-price');
    if (priceDisplay) {
      priceDisplay.textContent = '$' + message.data.finalPrice.toFixed(2);
    }
  }

  if (message.type === 'USER_ACTION' && message.data.action === 'START_FREE_TRIAL') {
    // Store in localStorage for signup page
    localStorage.setItem('pricingSelection', JSON.stringify(message.data.selections));

    // Redirect to signup
    window.location.href = '/signup';
  }
});

// Auto-resize iframe to content height
window.addEventListener('message', function(event) {
  if (event.data.type === 'resize' && event.data.height) {
    document.getElementById('pricing-calculator').style.height = event.data.height + 'px';
  }
});
</script>
```

### Example 2: React Integration

```jsx
import { useEffect, useState } from 'react';

function PricingPage() {
  const [pricingData, setPricingData] = useState(null);

  useEffect(() => {
    const handleMessage = (event) => {
      const message = event.data;

      if (message.type === 'PRICING_SELECTION_UPDATE') {
        setPricingData(message.data);
      }

      if (message.type === 'USER_ACTION') {
        const { action, selections } = message.data;

        if (action === 'START_FREE_TRIAL') {
          // Navigate to signup with pricing data
          navigate('/signup', { state: { pricing: selections } });
        }
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  return (
    <div>
      <iframe
        src="https://your-url.com?embedded=true&theme=transparent"
        width="100%"
        height="800"
        frameBorder="0"
      />

      {pricingData && (
        <div className="pricing-summary">
          <p>Current selection: {pricingData.count} companies</p>
          <p>Monthly cost: ${pricingData.finalPrice.toFixed(2)}</p>
        </div>
      )}
    </div>
  );
}
```

### Example 3: WordPress Integration

Add this to your WordPress page using a **Custom HTML** block:

```html
<!-- Iframe -->
<div id="pricing-calculator-container" style="width: 100%; max-width: 1200px; margin: 0 auto;">
  <iframe
    id="pricing-calculator"
    src="https://your-url.com?embedded=true&theme=transparent&hideSettings=true"
    width="100%"
    height="800"
    frameborder="0"
    style="border: none;"
  ></iframe>
</div>

<!-- Listener Script -->
<script>
jQuery(document).ready(function($) {
  window.addEventListener('message', function(event) {
    const message = event.data;

    if (message.type === 'USER_ACTION' && message.data.action === 'START_FREE_TRIAL') {
      // Store in session storage
      sessionStorage.setItem('pricing', JSON.stringify(message.data.selections));

      // Redirect to WordPress signup page
      window.location.href = '/signup/';
    }

    if (message.type === 'PRICING_SELECTION_UPDATE') {
      // Track in Google Analytics
      if (typeof gtag !== 'undefined') {
        gtag('event', 'pricing_selection', {
          plan: message.data.selectedPlan,
          count: message.data.count,
          price: message.data.finalPrice
        });
      }
    }
  });
});
</script>
```

## Auto-Resize Iframe (Optional)

To make the iframe automatically adjust to the content height, you can implement this pattern:

**In the parent page:**
```javascript
window.addEventListener('message', function(event) {
  if (event.data.type === 'height') {
    const iframe = document.getElementById('pricing-calculator');
    iframe.style.height = event.data.value + 'px';
  }
});
```

**Add to the calculator** (optional enhancement):
```javascript
// Send height updates to parent
const sendHeight = () => {
  const height = document.documentElement.scrollHeight;
  window.parent.postMessage({ type: 'height', value: height }, '*');
};

// Send on load and when content changes
window.addEventListener('load', sendHeight);
new ResizeObserver(sendHeight).observe(document.body);
```

## Security Considerations

### Origin Verification
In production, verify the message origin:

```javascript
window.addEventListener('message', function(event) {
  // IMPORTANT: Verify origin in production
  const ALLOWED_ORIGINS = [
    'https://your-deployed-url.com',
    'https://your-bolt-domain.bolt.new'
  ];

  if (!ALLOWED_ORIGINS.includes(event.origin)) {
    console.warn('Message from untrusted origin:', event.origin);
    return;
  }

  // Process message...
});
```

### Content Security Policy
If you have CSP headers, ensure they allow iframe embedding:

```
Content-Security-Policy: frame-src https://your-deployed-url.com;
```

## Troubleshooting

### Issue: No messages received
**Solution:** Make sure `?embedded=true` is in the iframe URL.

### Issue: Iframe is too small
**Solution:**
- Set explicit `height` on iframe element
- Implement auto-resize pattern (see above)
- Test with `height: 1200px` initially

### Issue: Apollo Meetings widget not working
**Solution:** Check if parent page CSP allows loading from `https://assets.apollo.io`

### Issue: Messages from wrong origin
**Solution:** Add origin verification (see Security Considerations)

### Issue: Styles look broken
**Solution:** Try `&theme=transparent` to remove background, or match your site's background color

## Analytics Integration

Track user interactions with your analytics platform:

```javascript
window.addEventListener('message', function(event) {
  const message = event.data;

  if (message.type === 'PRICING_SELECTION_UPDATE') {
    // Google Analytics 4
    if (typeof gtag !== 'undefined') {
      gtag('event', 'pricing_configured', {
        plan: message.data.selectedPlan,
        count: message.data.count,
        annual: message.data.isAnnual,
        price: message.data.finalPrice
      });
    }

    // Facebook Pixel
    if (typeof fbq !== 'undefined') {
      fbq('track', 'ViewContent', {
        content_name: message.data.planDetails.name,
        value: message.data.finalPrice,
        currency: 'USD'
      });
    }
  }

  if (message.type === 'USER_ACTION' && message.data.action === 'START_FREE_TRIAL') {
    // Track conversion
    if (typeof gtag !== 'undefined') {
      gtag('event', 'begin_checkout', {
        value: message.data.selections.finalPrice,
        currency: 'USD'
      });
    }
  }
});
```

## Support

For questions or issues with embedding:
- Review this documentation
- Check browser console for errors
- Verify URL parameters are correctly formatted
- Test in incognito mode to rule out browser extensions

## Quote Mode (NEW!)

### Overview
Quote Mode allows you to generate, lock, and share pricing quotes with customers. Quotes are stored in the database and can be shared via URL.

### URL Parameters for Quote Mode
- `?mode=quote` - Enable quote mode (required)
- `&id=<uuid>` - Quote ID (if loading existing quote, optional for new quotes)
- `&quoteExpiresInDays=30` - Days until quote expires after locking (default: 30)
- All standard parameters work: `plan`, `count`, `annual`, etc.

### Example: Create New Quote
```html
<iframe
  src="https://your-url.com?mode=quote&plan=growth&count=25&annual=true"
  width="100%"
  height="900"
></iframe>
```

### Example: Load Existing Quote
```html
<iframe
  src="https://your-url.com?mode=quote&id=550e8400-e29b-41d4-a716-446655440000"
  width="100%"
  height="900"
></iframe>
```

### New Message Types for Quote Mode

#### QUOTE_ID_READY
Sent when calculator generates a new quote ID (only if ID not provided in URL).

```javascript
{
  type: 'QUOTE_ID_READY',
  data: {
    id: '550e8400-e29b-41d4-a716-446655440000'  // Generated UUID
  }
}
```

#### QUOTE_SUMMARY_UPDATE
Sent when user changes selections in draft mode (debounced 300ms). Similar to `PRICING_SELECTION_UPDATE` but includes quote metadata.

```javascript
{
  type: 'QUOTE_SUMMARY_UPDATE',
  data: {
    id: '550e8400-e29b-41d4-a716-446655440000',
    selectedPlan: 'growth',
    count: 25,
    isAnnual: true,
    currency: 'USD',
    priceBreakdown: { /* full breakdown */ },
    planDetails: { /* plan features */ },
    selectionRaw: { /* complete state */ },
    pricingModelId: 'uuid-of-pricing-model',
    expiresInDays: 30
  }
}
```

#### QUOTE_LOCKED
Sent when user locks the quote (freezes pricing for 30 days).

```javascript
{
  type: 'QUOTE_LOCKED',
  data: {
    id: '550e8400-e29b-41d4-a716-446655440000',
    version: 2,                              // Incremented on lock
    expiresAt: '2025-12-31T23:59:59Z',      // Expiration timestamp
    status: 'locked',
    pricingModelId: 'uuid-of-pricing-model'
  }
}
```

#### QUOTE_ACCEPT_INTENT
Sent when user clicks "Accept Quote" button. **Parent should handle click-wrap terms acceptance and send CONFIRM_QUOTE_ACCEPTANCE back.**

```javascript
{
  type: 'QUOTE_ACCEPT_INTENT',
  data: {
    id: '550e8400-e29b-41d4-a716-446655440000',
    version: 2,
    status: 'locked',
    pricingModelId: 'uuid-of-pricing-model'
  }
}
```

#### QUOTE_ACCEPTED (NEW - Bidirectional)
Sent after parent confirms quote acceptance via CONFIRM_QUOTE_ACCEPTANCE message. This completes the bidirectional acceptance flow.

```javascript
{
  type: 'QUOTE_ACCEPTED',
  data: {
    id: '550e8400-e29b-41d4-a716-446655440000',
    version: 2,
    status: 'accepted',
    acceptedAt: '2025-11-04T15:30:00Z',      // Timestamp when accepted
    pricingModelId: 'uuid-of-pricing-model'
  }
}
```

#### QUOTE_ERROR (NEW)
Sent when any quote operation fails (initialization, update, lock, accept).

```javascript
{
  type: 'QUOTE_ERROR',
  data: {
    error: 'Failed to lock quote',           // Error message
    code: 'NETWORK_ERROR',                   // Error code (optional)
    details: { /* additional error context */ }
  }
}
```

**Error Codes:**
- `EXPIRED` - Quote has expired
- `NOT_FOUND` - Quote ID not found in database
- `VALIDATION_ERROR` - Invalid quote data
- `NETWORK_ERROR` - Network/API failure
- `UNKNOWN` - Unexpected error

## Admin Mode (NEW!)

### Overview
Admin Mode (`isAdmin` property) is designed for salespeople and administrators who need to:
- Configure pricing beyond normal customer limits (up to 500 locations vs. 50)
- Access Settings even when `hideSettings=true` is set
- Avoid triggering Contact Sales modals when exceeding thresholds
- See exact location counts instead of "50+" for high-volume quotes

### Quick Reference

| Feature | Regular User | Admin User (`isAdmin=true`) |
|---------|--------------|----------------------------|
| **Max Locations** | 50 | 500 |
| **Settings Button** | Hidden (always) | Visible (always) |
| **Contact Sales Modal** | Auto-shows at 50+ locations | Disabled |
| **Location Count Display** | "50+" when ≥50 | Exact count (e.g., "87") |
| **Slider Range** | 1-50 | 1-500 |
| **Quote Configuration** | Limited to threshold | Full control |

**Note**: Settings button is ONLY visible when `admin=true`. It is hidden in all other cases, including quote mode and standalone mode.

### Enabling Admin Mode

**Option 1: URL Parameter (Standalone)**
```html
<iframe
  src="https://your-url.com?admin=true&embedded=true&hideSettings=true"
  width="100%"
  height="900"
></iframe>
```

**Option 2: Parent Window Message (Embedded)**
```javascript
// Get reference to iframe
const calculatorIframe = document.getElementById('pricing-calculator');

// Enable admin mode dynamically
calculatorIframe.contentWindow.postMessage({
  type: 'SET_ADMIN_MODE',
  data: {
    enabled: true  // Set to false to disable admin mode
  }
}, '*');
```

### Admin Mode Features

When admin mode is enabled:

1. **Extended Location Limits**: Maximum locations increased from 50 to 500
2. **Settings Always Visible**: Settings gear button shown (hidden for all regular users)
3. **No Contact Modal**: Contact Sales modal will NOT auto-trigger at 50+ locations
4. **Exact Count Display**: Shows precise count (e.g., "87") instead of "50+" for non-admins
5. **Full Quote Control**: Can configure and lock quotes with any number of locations

**Important**: The Settings gear button is **ONLY** visible when:
- `?admin=true` is set

Without this parameter, Settings is always hidden in all modes (quote mode, embedded mode, standalone mode).

### Use Cases

**Salesperson Creating Custom Quote:**
```html
<!-- Salesperson view with full admin access -->
<iframe
  src="https://your-url.com?mode=quote&admin=true&plan=growth&count=125&annual=true"
  width="100%"
  height="900"
></iframe>
```

**Customer View (Locked Quote):**
```html
<!-- Customer sees locked quote but without admin privileges -->
<iframe
  src="https://your-url.com?mode=quote&id=550e8400-e29b-41d4-a716-446655440000"
  width="100%"
  height="900"
></iframe>
```

### Admin Mode Message Type

#### SET_ADMIN_MODE (Incoming)
Control admin mode programmatically from the parent window.

```javascript
// Enable admin mode
calculatorIframe.contentWindow.postMessage({
  type: 'SET_ADMIN_MODE',
  data: { enabled: true }
}, '*');

// Disable admin mode
calculatorIframe.contentWindow.postMessage({
  type: 'SET_ADMIN_MODE',
  data: { enabled: false }
}, '*');
```

### Implementation Details

The `isAdmin` property affects the following frontend behaviors:

**File: `src/App.tsx`**
- Sets `adminMode` state from URL parameter `?admin=true`
- Can be toggled via `SET_ADMIN_MODE` iframe message
- Passes `adminMode` prop to `CompanySlider` component
- Adjusts `maxCompanies` from 50 to 500 when `adminMode=true`
- **Shows Settings ONLY when `adminMode=true`** (hidden in all other cases)
- Disables ContactModal auto-trigger at 50+ locations

**File: `src/components/CompanySlider.tsx`**
- Receives `adminMode` prop
- Displays exact count when `adminMode=true`
- Displays "50+" when `adminMode=false` and count ≥ 50

**File: `src/hooks/useIframeMessaging.ts`**
- Listens for `SET_ADMIN_MODE` incoming messages
- Updates `adminMode` state dynamically

### Property Name: `isAdmin`

Throughout the documentation, this feature is referred to as the **`isAdmin` property** or **Admin Mode**. In the code:
- **State variable**: `adminMode` (boolean)
- **URL parameter**: `?admin=true`
- **Iframe message type**: `SET_ADMIN_MODE`
- **Component prop**: `adminMode` (passed to components)

### Security Considerations

⚠️ **IMPORTANT**: Admin mode (`isAdmin`) does NOT provide authentication. It's a **presentation/UX feature**, NOT a security control.

- ✅ Removes UI friction for internal sales tools
- ✅ Allows configuration of high-volume quotes
- ✅ Works via URL parameter or iframe messaging
- ❌ Does NOT enforce server-side access control
- ❌ Does NOT validate user permissions on backend
- ❌ Should NOT be exposed to untrusted users

**Best Practice:** Use admin mode only in internal sales portals or authenticated contexts where you control access to the pricing calculator URL.

**Backend Considerations:**
- The API endpoints **do not enforce** admin mode restrictions
- Database accepts quotes with any location count (no admin-only validation)
- If you need server-side restrictions, implement authentication and authorization in your API layer

### Incoming Messages (Parent → Iframe)

The calculator can receive messages from the parent window to control quote acceptance and admin mode.

**Supported incoming message types:**
- `CONFIRM_QUOTE_ACCEPTANCE` - Complete quote acceptance flow after click-wrap terms
- `SET_ADMIN_MODE` - Enable/disable admin mode for salespeople (see Admin Mode section above)

#### CONFIRM_QUOTE_ACCEPTANCE
Send this message to the calculator iframe after user accepts click-wrap terms to complete quote acceptance.

```javascript
// Get reference to iframe
const iframe = document.getElementById('pricing-calculator');

// Send confirmation message
iframe.contentWindow.postMessage({
  type: 'CONFIRM_QUOTE_ACCEPTANCE',
  data: {
    id: '550e8400-e29b-41d4-a716-446655440000',  // Quote ID
    acceptedAt: new Date().toISOString()          // Optional: acceptance timestamp
  }
}, '*');
```

### Quote Mode Integration Example (Bidirectional Flow)

```javascript
// Store reference to iframe for sending messages
const calculatorIframe = document.getElementById('pricing-calculator');

// Listen for quote events from calculator
window.addEventListener('message', function(event) {
  const message = event.data;

  switch(message.type) {
    case 'QUOTE_ID_READY':
      // Store the generated quote ID
      const quoteId = message.data.id;
      console.log('New quote created:', quoteId);

      // Save to your database or local storage
      localStorage.setItem('currentQuoteId', quoteId);
      break;

    case 'QUOTE_SUMMARY_UPDATE':
      // Quote pricing updated (auto-saved to database)
      console.log('Quote updated:', message.data);

      // Update your UI if needed
      document.getElementById('current-quote-price').textContent =
        '$' + message.data.priceBreakdown.finalMonthlyPrice.toFixed(2);
      break;

    case 'QUOTE_LOCKED':
      // Quote has been locked (pricing frozen for 30 days)
      console.log('Quote locked until:', message.data.expiresAt);

      // Generate shareable URL
      const shareUrl = `https://your-url.com?mode=quote&id=${message.data.id}`;

      // Show share link to user
      document.getElementById('share-link').value = shareUrl;
      document.getElementById('share-section').style.display = 'block';
      break;

    case 'QUOTE_ACCEPT_INTENT':
      // User clicked "Accept Quote" - show your click-wrap modal
      console.log('User wants to accept quote:', message.data.id);

      // Show your terms modal (example using custom modal)
      showClickWrapModal({
        quoteId: message.data.id,
        onAccept: async () => {
          try {
            // 1. Record acceptance in your backend
            await fetch('/api/quotes/accept', {
              method: 'POST',
              body: JSON.stringify({
                quoteId: message.data.id,
                acceptedAt: new Date().toISOString()
              })
            });

            // 2. Send confirmation back to calculator iframe
            calculatorIframe.contentWindow.postMessage({
              type: 'CONFIRM_QUOTE_ACCEPTANCE',
              data: {
                id: message.data.id,
                acceptedAt: new Date().toISOString()
              }
            }, '*');

            console.log('Quote acceptance confirmed');
          } catch (error) {
            console.error('Failed to confirm acceptance:', error);
            alert('Failed to accept quote. Please try again.');
          }
        },
        onCancel: () => {
          console.log('User cancelled quote acceptance');
        }
      });
      break;

    case 'QUOTE_ACCEPTED':
      // Calculator confirmed quote acceptance
      console.log('Quote accepted successfully:', message.data);

      // Update your UI to show success
      document.getElementById('acceptance-status').textContent = 'Quote Accepted!';
      document.getElementById('acceptance-status').className = 'success';

      // Optionally redirect or show next steps
      setTimeout(() => {
        window.location.href = '/onboarding?quote=' + message.data.id;
      }, 2000);
      break;

    case 'QUOTE_ERROR':
      // Handle quote errors
      console.error('Quote error:', message.data.error, message.data.code);

      // Show user-friendly error message
      alert('Error: ' + message.data.error);
      break;
  }
});

// Example click-wrap modal implementation
function showClickWrapModal({ quoteId, onAccept, onCancel }) {
  const modal = document.createElement('div');
  modal.className = 'modal';
  modal.innerHTML = `
    <div class="modal-content">
      <h2>Accept Quote</h2>
      <div class="terms-scroll">
        <p><strong>By accepting this quote, you agree to:</strong></p>
        <ul>
          <li>The pricing terms outlined in quote #${quoteId}</li>
          <li>Our standard Terms of Service</li>
          <li>Payment within 30 days of service delivery</li>
        </ul>
      </div>
      <label>
        <input type="checkbox" id="accept-terms" />
        I have read and agree to the terms above
      </label>
      <div class="modal-actions">
        <button id="confirm-accept" disabled>Accept Quote</button>
        <button id="cancel-accept">Cancel</button>
      </div>
    </div>
  `;

  document.body.appendChild(modal);

  // Enable accept button when checkbox is checked
  document.getElementById('accept-terms').addEventListener('change', (e) => {
    document.getElementById('confirm-accept').disabled = !e.target.checked;
  });

  // Handle accept
  document.getElementById('confirm-accept').addEventListener('click', () => {
    document.body.removeChild(modal);
    onAccept();
  });

  // Handle cancel
  document.getElementById('cancel-accept').addEventListener('click', () => {
    document.body.removeChild(modal);
    onCancel();
  });
}
```

### Quote Workflow (Bidirectional)

1. **Draft**: User configures pricing, auto-saves every 300ms
   - Calculator sends `QUOTE_ID_READY` on initialization
   - Calculator sends `QUOTE_SUMMARY_UPDATE` on every change (debounced 300ms)

2. **Lock**: User clicks "Lock Quote for 30 Days"
   - Calculator sends `QUOTE_LOCKED` message
   - Pricing frozen, expiration set (30 days from lock)
   - All controls (sliders, toggles) become disabled

3. **Share**: Copy locked quote URL to share with customer
   - Quote URL: `?mode=quote&id={uuid}`
   - Quote can be loaded by anyone with the URL

4. **Accept Intent**: Customer clicks "Accept Quote" button
   - Calculator sends `QUOTE_ACCEPT_INTENT` to parent
   - Parent shows click-wrap terms modal

5. **Confirm Acceptance**: User accepts click-wrap terms
   - Parent sends `CONFIRM_QUOTE_ACCEPTANCE` back to calculator
   - Calculator updates status to 'accepted'
   - Calculator sends `QUOTE_ACCEPTED` confirmation back to parent

6. **Expired**: If 30 days pass without acceptance
   - Quote status becomes "expired"
   - User can no longer accept the quote
   - Pricing is no longer guaranteed

**Error Handling**: If any step fails, calculator sends `QUOTE_ERROR` with details

### Quote Status Visual Indicators

The calculator shows different banners based on quote status:
- **Draft**: Blue "Quote in Progress - Changes are being saved"
- **Locked**: Green "Quote Locked - Expires in X days"
- **Accepted**: Green "✓ Quote Accepted"
- **Expired**: Red "Quote Expired"

When locked, all controls (sliders, plan selectors, toggles) are disabled.

## Additional Documentation

- **[QUOTE_SETTINGS.md](./QUOTE_SETTINGS.md)** - Complete guide for quote settings sync (discounts, royalty processing, onboarding fees)
- **[API.md](./API.md)** - API endpoint documentation for quote management
- **[QUICKSTART.md](./QUICKSTART.md)** - Quick start guide for local development

## Change Log

### Version 2.4.0 (2025-11-04)
- **NEW: User Type Field** - `userType` field added to `PRICING_SELECTION_UPDATE` and `USER_ACTION` messages
- **NEW: Role Tracking** - Track whether user is CPA, Franchisee, or Small Business Owner
- **IMPROVED: Analytics** - Better understanding of pricing patterns by user segment
- **IMPROVED: Customization** - Parent apps can show role-appropriate messaging based on userType
- **IMPROVED: Terminology Sync** - Parent knows user's preferred terminology (clients/locations/companies)

### Version 2.3.0 (2025-11-04)
- **NEW: Admin Mode** - Special mode for salespeople with extended capabilities
- **NEW: SET_ADMIN_MODE Message** - Dynamically enable/disable admin mode via iframe messaging
- **NEW: Extended Location Limits** - Admin mode supports up to 500 locations (vs. 50 for customers)
- **NEW: Admin Count Display** - Admins see exact counts, customers see "50+" when over threshold
- **IMPROVED: Settings Access** - Settings visible in admin mode even with `hideSettings=true`
- **IMPROVED: Contact Modal** - Auto-trigger disabled for admins at high volumes
- **IMPROVED: Sales Workflow** - Salespeople can configure high-volume quotes without friction

### Version 2.2.0 (2025-11-04)
- **NEW: Bidirectional Quote Acceptance** - Full two-way communication for quote acceptance flow
- **NEW: QUOTE_ACCEPTED Message** - Sent after parent confirms acceptance via `CONFIRM_QUOTE_ACCEPTANCE`
- **NEW: QUOTE_ERROR Message** - Comprehensive error reporting for all quote operations
- **NEW: Incoming Message Support** - Calculator can now receive `CONFIRM_QUOTE_ACCEPTANCE` from parent
- **NEW: Console Logging** - All postMessage calls are logged with timestamps for debugging
- **IMPROVED: Error Handling** - All quote API failures now send `QUOTE_ERROR` to parent
- **IMPROVED: Message Types** - Enhanced TypeScript types for all quote messages
- **IMPROVED: Documentation** - Complete bidirectional flow examples with click-wrap modal

### Version 2.1.0 (2025-11-05)
- **NEW: Onboarding Fee** - One-time custom onboarding fees with configurable title and description
- **NEW: Settings Sync** - All settings (discount, royalty, onboarding) sync with quotes automatically
- **NEW: URL Parameters** - `onboardingFee`, `onboardingTitle`, `onboardingDesc` for pre-configuration
- **IMPROVED: Quote Loading** - Settings restored from `selection_raw` when loading quotes
- **IMPROVED: Priority Handling** - Quote settings override localStorage for consistent pricing

### Version 2.0.0 (2025-11-04)
- **NEW: Quote Mode** - Generate, lock, and share pricing quotes
- **NEW: Quote database storage** via Supabase
- **NEW: Quote lifecycle** - Draft → Lock → Accept → Expire
- **NEW: Quote messages** - `QUOTE_ID_READY`, `QUOTE_SUMMARY_UPDATE`, `QUOTE_LOCKED`, `QUOTE_ACCEPT_INTENT`
- **NEW: Shareable quote URLs** with 30-day expiration
- **NEW: Read-only mode** for locked/accepted quotes

### Version 1.0.0 (2025-10-31)
- Initial iframe embedding support
- PostMessage API for selection updates
- URL parameter configuration
- User action tracking
- Enterprise inquiry notifications
