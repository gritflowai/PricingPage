# API Endpoints Documentation

This document describes the API endpoints for the quote management system.

## Base URL

All endpoints are prefixed with your Supabase project URL:

```
https://ijlpiwxodfsjmexktcoc.supabase.co/functions/v1
```

## Authentication

Currently, all endpoints are public (no JWT verification). This will be restricted when authentication is added.

## Endpoints

### 1. GET /pricing-models/active

Get the currently active pricing model.

**URL:** `GET /pricing-models/active`

**Response (200 OK):**
```json
{
  "id": "uuid",
  "name": "Q1 2025 Pricing",
  "status": "active",
  "valid_from": "2025-01-01T00:00:00Z",
  "valid_to": null,
  "config_json": {
    "planConfigs": {...},
    "wholesaleDiscount": 0,
    "resellerCommission": 0
  },
  "created_at": "2025-01-01T00:00:00Z"
}
```

**Error Responses:**
- `404 Not Found` - No active pricing model found
- `409 Conflict` - Multiple active pricing models found (data integrity issue)
- `500 Internal Server Error` - Database error

**Example:**
```bash
curl https://ijlpiwxodfsjmexktcoc.supabase.co/functions/v1/pricing-models/active
```

---

### 2. POST /pricing-models

Create a new pricing model.

**URL:** `POST /pricing-models`

**Request Body:**
```json
{
  "name": "Q2 2025 Pricing",
  "status": "draft",
  "valid_from": "2025-04-01T00:00:00Z",
  "valid_to": "2025-06-30T23:59:59Z",
  "config_json": {
    "planConfigs": {
      "starter": {...},
      "growth": {...},
      "scale": {...},
      "ai-advisor": {...}
    },
    "wholesaleDiscount": 10,
    "resellerCommission": 5
  }
}
```

**Response (201 Created):**
```json
{
  "id": "uuid",
  "name": "Q2 2025 Pricing",
  "status": "draft",
  "valid_from": "2025-04-01T00:00:00Z",
  "valid_to": "2025-06-30T23:59:59Z",
  "config_json": {...},
  "created_at": "2025-01-01T00:00:00Z"
}
```

**Error Responses:**
- `400 Bad Request` - Missing required fields or invalid data
- `500 Internal Server Error` - Database error

**Example:**
```bash
curl -X POST https://ijlpiwxodfsjmexktcoc.supabase.co/functions/v1/pricing-models \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Q2 2025 Pricing",
    "status": "draft",
    "valid_from": "2025-04-01T00:00:00Z",
    "config_json": {}
  }'
```

---

### 3. POST /quotes/init

Initialize a new quote or update an existing draft.

**URL:** `POST /quotes/init`

**Request Body:**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "selected_plan": "growth",
  "count": 25,
  "is_annual": true
}
```

**Response (200 OK):**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "pricing_model_id": "uuid",
  "selected_plan": "growth",
  "count": 25,
  "is_annual": true,
  "status": "draft",
  "version": 1,
  "created_at": "2025-01-01T00:00:00Z",
  "updated_at": "2025-01-01T00:00:00Z",
  "locked_at": null,
  "expires_at": null,
  "accepted_at": null
}
```

**Error Responses:**
- `400 Bad Request` - Missing required fields or invalid count
- `404 Not Found` - No active pricing model found
- `500 Internal Server Error` - Database error

**Example:**
```bash
curl -X POST https://ijlpiwxodfsjmexktcoc.supabase.co/functions/v1/quotes/init \
  -H "Content-Type: application/json" \
  -d '{
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "selected_plan": "growth",
    "count": 25,
    "is_annual": true
  }'
```

---

### 4. POST /quotes/update

Update draft quote calculations (called on debounced slider changes).

**URL:** `POST /quotes/update`

**Request Body:**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "summary": {
    "subtotal": 2000.00,
    "final_monthly_price": 1600.00,
    "price_per_unit": 64.00,
    "annual_savings": 333.33,
    "price_breakdown": {
      "subtotal": 2000.00,
      "volumeDiscount": 0,
      "customDiscount": 0,
      "wholesaleDiscount": 0,
      "annualSavings": 333.33,
      "royaltyProcessingFee": 0,
      "finalMonthlyPrice": 1600.00
    },
    "plan_details": {
      "name": "Growth",
      "connections": 3,
      "users": 125,
      "scorecards": 250,
      "aiTokens": 125000
    },
    "selection_raw": {
      "userType": "franchisee",
      "selectedPlan": "growth",
      "count": 25,
      "isAnnual": true,
      "customDiscount": {
        "type": "percentage",
        "value": 15,
        "label": "Early Adopter",
        "reason": "Q1 promo",
        "discountAmount": 250.00
      },
      "royaltyProcessing": {
        "enabled": true,
        "baseFee": 0,
        "perTransaction": 1.82,
        "estimatedTransactions": 2,
        "totalFee": 91.00
      },
      "onboardingFee": {
        "amount": 5000,
        "title": "White-Glove Onboarding",
        "description": "Setup sCOA, hierarchy, benchmarking, KPI reporting and forecasting..."
      }
    }
  }
}
```

**Response (200 OK):**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "subtotal": 2000.00,
  "final_monthly_price": 1600.00,
  "price_per_unit": 64.00,
  "annual_savings": 333.33,
  "price_breakdown": {...},
  "plan_details": {...},
  "selection_raw": {...},
  "updated_at": "2025-01-01T00:00:00Z",
  ...
}
```

**Error Responses:**
- `400 Bad Request` - Quote not found or not in draft status
- `500 Internal Server Error` - Database error

**Example:**
```bash
curl -X POST https://ijlpiwxodfsjmexktcoc.supabase.co/functions/v1/quotes/update \
  -H "Content-Type: application/json" \
  -d '{
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "summary": {
      "subtotal": 2000.00,
      "final_monthly_price": 1600.00,
      "price_per_unit": 64.00,
      "annual_savings": 333.33,
      "price_breakdown": {},
      "plan_details": {}
    }
  }'
```

---

### 5. POST /quotes/lock

Lock a quote (freeze pricing, set expiration).

**URL:** `POST /quotes/lock`

**Request Body:**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "expires_in_days": 30
}
```

**Response (200 OK):**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "status": "locked",
  "locked_at": "2025-01-01T00:00:00Z",
  "expires_at": "2025-01-31T00:00:00Z",
  "version": 2,
  "updated_at": "2025-01-01T00:00:00Z",
  ...
}
```

**Error Responses:**
- `400 Bad Request` - Quote not found or not in draft status
- `500 Internal Server Error` - Database error

**Notes:**
- Default `expires_in_days` is 30 if not provided
- Version is incremented by 1
- Status changes from `draft` to `locked`

**Example:**
```bash
curl -X POST https://ijlpiwxodfsjmexktcoc.supabase.co/functions/v1/quotes/lock \
  -H "Content-Type: application/json" \
  -d '{
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "expires_in_days": 30
  }'
```

---

### 6. GET /quotes/:id

Load an existing quote.

**URL:** `GET /quotes/:id`

**Response (200 OK):**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "pricing_model_id": "uuid",
  "selected_plan": "growth",
  "count": 25,
  "is_annual": true,
  "subtotal": 2000.00,
  "final_monthly_price": 1600.00,
  "price_per_unit": 64.00,
  "annual_savings": 333.33,
  "price_breakdown": {...},
  "plan_details": {...},
  "selection_raw": {...},
  "status": "locked",
  "version": 2,
  "created_at": "2025-01-01T00:00:00Z",
  "updated_at": "2025-01-01T00:00:00Z",
  "locked_at": "2025-01-01T00:00:00Z",
  "expires_at": "2025-01-31T00:00:00Z",
  "accepted_at": null
}
```

**Error Responses:**
- `404 Not Found` - Quote not found
- `500 Internal Server Error` - Database error

**Notes:**
- If quote is `locked` and past `expires_at`, status is automatically updated to `expired`
- The returned quote reflects the current status

**Example:**
```bash
curl https://ijlpiwxodfsjmexktcoc.supabase.co/functions/v1/quotes/550e8400-e29b-41d4-a716-446655440000
```

---

## Error Response Format

All errors follow this format:

```json
{
  "error": "Error message describing what went wrong"
}
```

## CORS

All endpoints support CORS with the following headers:
- `Access-Control-Allow-Origin: *`
- `Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS`
- `Access-Control-Allow-Headers: Content-Type, Authorization, X-Client-Info, Apikey`

## Quote Status Flow

```
draft → locked → accepted
  ↓       ↓
expired expired
```

- **draft**: Quote is being configured, can be updated
- **locked**: Quote is frozen for 30 days, pricing cannot be changed
- **accepted**: Customer accepted the quote
- **expired**: Quote's expiration date has passed

## Integration Example

Here's how to integrate the API in your React frontend:

```typescript
// Initialize a quote when iframe loads in quote mode
const quoteId = crypto.randomUUID();

const initResponse = await fetch(
  'https://ijlpiwxodfsjmexktcoc.supabase.co/functions/v1/quotes/init',
  {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      id: quoteId,
      selected_plan: 'growth',
      count: 25,
      is_annual: true,
    }),
  }
);

const quote = await initResponse.json();

// Update quote when user changes selections (debounced)
const updateResponse = await fetch(
  'https://ijlpiwxodfsjmexktcoc.supabase.co/functions/v1/quotes/update',
  {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      id: quoteId,
      summary: {
        subtotal: 2000.00,
        final_monthly_price: 1600.00,
        price_per_unit: 64.00,
        annual_savings: 333.33,
        price_breakdown: {...},
        plan_details: {...},
      },
    }),
  }
);

// Lock quote when user clicks "Lock Pricing"
const lockResponse = await fetch(
  'https://ijlpiwxodfsjmexktcoc.supabase.co/functions/v1/quotes/lock',
  {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      id: quoteId,
      expires_in_days: 30,
    }),
  }
);

// Load existing quote
const loadResponse = await fetch(
  `https://ijlpiwxodfsjmexktcoc.supabase.co/functions/v1/quotes/${quoteId}`
);

const existingQuote = await loadResponse.json();
```

## Admin Mode for Salespeople

### Overview

The pricing calculator supports an **Admin Mode** (`isAdmin`) that provides extended capabilities for salespeople and administrators. This mode removes UI restrictions and allows configuration of high-volume quotes.

### URL Parameters

The calculator supports various URL parameters for configuration:

| Parameter | Type | Values | Description | Example |
|-----------|------|--------|-------------|---------|
| `userType` | string | `cpa`, `franchisee`, `smb` | User's role (affects terminology and postMessage data) | `?userType=cpa` |
| `plan` | string | `starter`, `growth`, `scale`, `ai-advisor` | Pre-select a plan | `?plan=growth` |
| `count` | number | 1-500 | Pre-select location/client count | `?count=25` |
| `annual` | boolean | `true`, `false` | Pre-select billing cycle | `?annual=true` |
| `admin` | boolean | `true`, `false` | Enable admin mode | `?admin=true` |
| `mode` | string | `calculator`, `quote` | Operating mode | `?mode=quote` |
| `id` | string | UUID | Load existing quote | `?id=550e8400-e29b-41d4...` |

**User Type Values:**
- `cpa` - CPA/Accountant (uses "client" terminology)
- `franchisee` - Franchisee/ZOR (uses "location" terminology, default)
- `smb` - Small Business Owner (uses "company" terminology)

The `userType` parameter is included in all postMessage events sent to the parent window (see [EMBEDDING.md](./EMBEDDING.md) for details).

**Example URLs:**
```
# CPA with 50 clients on Growth plan (annual)
?userType=cpa&plan=growth&count=50&annual=true

# Small business with 10 companies on Starter plan (monthly)
?userType=smb&plan=starter&count=10&annual=false

# Franchisee admin creating a quote
?userType=franchisee&admin=true&mode=quote&plan=scale&count=125
```

### Admin Mode Properties

When `isAdmin` is enabled (via URL parameter `?admin=true` or iframe message), the following changes apply:

| Feature | Regular User | Admin User (`isAdmin=true`) |
|---------|--------------|----------------------------|
| **Max Locations** | 50 | 500 |
| **Settings Access** | Hidden (always) | Visible (always) |
| **Contact Modal** | Auto-triggers at 50+ | Disabled |
| **Count Display** | Shows "50+" when over threshold | Shows exact count (e.g., "87") |
| **Quote Configuration** | Limited to threshold | Full control up to 500 |

**Note**: Settings button is ONLY visible when `admin=true`. Hidden in all other cases (including quote mode).

### Enabling Admin Mode

**Option 1: URL Parameter**
```
?admin=true
```

**Option 2: Iframe Message** (see EMBEDDING.md for details)
```javascript
iframe.contentWindow.postMessage({
  type: 'SET_ADMIN_MODE',
  data: { enabled: true }
}, '*');
```

### Use Cases

1. **Sales Quote Creation**: Salespeople creating custom quotes for enterprise customers with 50-500 locations
2. **Internal Pricing Tools**: Admin dashboards that need full access to pricing configuration
3. **Demo/Testing**: Internal teams testing high-volume scenarios

### Security Considerations

⚠️ **IMPORTANT**: Admin mode is a **presentation-level feature**, NOT a security control.

- ✅ Safe for internal sales portals with authentication
- ✅ Can be used in authenticated iframe embeds
- ❌ Does NOT provide server-side access control
- ❌ Should NOT be exposed to untrusted users
- ❌ Does NOT validate user permissions on the backend

**Best Practice**: Only enable admin mode in authenticated contexts where you control access to the calculator URL.

### Integration with Quote System

Admin mode works seamlessly with the quote system:

1. **Draft Creation**: Admin can configure quotes with 1-500 locations
2. **Lock Quote**: Quote is locked with current pricing (up to 500 locations)
3. **Share Quote**: Customer receives locked quote URL without admin privileges
4. **Customer View**: Customer sees locked pricing but cannot edit or access Settings

**Example Workflow:**
```bash
# Salesperson creates quote with 125 locations
GET https://your-url.com?mode=quote&admin=true&count=125&plan=growth

# Quote is locked and shared with customer
GET https://your-url.com?mode=quote&id=550e8400-e29b-41d4-a716-446655440000

# Customer sees locked quote without admin access
# - Settings hidden
# - Controls disabled
# - Pricing frozen
```

### API Considerations

The API endpoints **do not enforce** admin mode restrictions. The database will accept quotes with any location count (up to the `count` field's limit).

Admin mode only affects:
- ✅ Frontend UI/UX (max slider value, Settings visibility)
- ✅ Client-side validations (ContactModal trigger)
- ❌ API validations (backend accepts any valid count)
- ❌ Database constraints (no special admin-only records)

If you need server-side admin restrictions, implement authentication and authorization in your API layer.

## Additional Documentation

- **[QUOTE_SETTINGS.md](./QUOTE_SETTINGS.md)** - Complete guide for quote settings sync including test cases and URL examples
- **[EMBEDDING.md](./EMBEDDING.md)** - Iframe embedding and PostMessage API documentation (includes Admin Mode details)
- **[QUICKSTART.md](./QUICKSTART.md)** - Quick start guide for local development

## Next Steps

1. ✅ Integrate these endpoints into the React frontend
2. ✅ Add quote mode detection in App.tsx
3. ✅ Implement debounced quote updates on slider changes
4. ✅ Add "Lock Pricing" button to UI
5. ✅ Implement quote sharing (URL with quote ID)
6. Add authentication and restrict RLS policies
