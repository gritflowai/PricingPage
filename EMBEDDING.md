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
- `&plan=growth` - Pre-select a plan (`ai-advisor`, `starter`, `growth`, `scale`)
- `&count=25` - Pre-fill companies/users count
- `&annual=true` - Pre-select annual billing (`true` or `false`)

### Example: Full Configuration
```html
<iframe
  src="https://your-url.com?embedded=true&theme=transparent&hideSettings=true&plan=growth&count=25&annual=true"
  width="100%"
  height="800"
></iframe>
```

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

### 3. USER_ACTION
Sent when user clicks action buttons (Start Free Trial, Contact Sales, Schedule Meeting).

```javascript
{
  type: 'USER_ACTION',
  data: {
    action: 'START_FREE_TRIAL',  // or 'CONTACT_SALES' or 'SCHEDULE_MEETING'
    selections: {
      // Same structure as PRICING_SELECTION_UPDATE data
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

## Change Log

### Version 1.0.0 (2025-10-31)
- Initial iframe embedding support
- PostMessage API for selection updates
- URL parameter configuration
- User action tracking
- Enterprise inquiry notifications
