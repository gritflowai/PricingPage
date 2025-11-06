# GitHub Copilot Instructions

When working on this codebase, follow these guidelines:

## Documentation First

Always reference these documents before making changes:

1. **[docs/architecture/CLAUDE.md](../docs/architecture/CLAUDE.md)** - Project architecture and state management
2. **[docs/api/SYNC_EMBEDDING.md](../docs/api/SYNC_EMBEDDING.md)** - Iframe integration patterns
3. **[docs/api/API.md](../docs/api/API.md)** - API endpoint specifications
4. **[docs/guides/QUOTE_SETTINGS.md](../docs/guides/QUOTE_SETTINGS.md)** - Quote configuration

## Code Style

- Use TypeScript with strict typing
- Follow React hooks patterns (all state in App.tsx)
- Use Tailwind CSS for styling (no custom CSS)
- Keep components functional and prop-based

## State Management

- All state lives in [src/App.tsx](../src/App.tsx)
- No Redux, Context, or external state libraries
- Pass state down via props
- Pricing calculations use tiered lookup functions

## Pricing Logic

- Tiered pricing: `{ firstUnit, lastUnit, perUnit, flatFee }`
- Discounts apply in order: wholesale → annual → custom
- Wholesale and annual billing are mutually exclusive
- See [docs/reference/PRICING.md](../docs/reference/PRICING.md) for formulas

## Integration Patterns

- Calculator is a stateless component
- Parent app owns the database
- Sync via PostMessage API every 300ms (debounced)
- See [docs/api/SYNC_EMBEDDING.md](../docs/api/SYNC_EMBEDDING.md) for message types

## Common Tasks

**Update pricing tiers:**
- Edit tier arrays in [src/App.tsx](../src/App.tsx) lines 40-73
- See [docs/reference/PRICING.md](../docs/reference/PRICING.md)

**Add new quote setting:**
- Add state variable in App.tsx
- Add to Settings.tsx modal
- Include in `selection_raw` object
- Update SYNC_EMBEDDING.md

**Modify API endpoint:**
- Edit [supabase/functions/quotes/index.ts](../supabase/functions/quotes/index.ts)
- Update [docs/api/API.md](../docs/api/API.md)
- Deploy with `supabase functions deploy quotes`

## Documentation Updates

When making changes, update relevant docs:
- Architecture changes → [docs/architecture/CLAUDE.md](../docs/architecture/CLAUDE.md)
- API changes → [docs/api/API.md](../docs/api/API.md)
- New features → [docs/guides/](../docs/guides/)
- Pricing updates → [docs/reference/PRICING.md](../docs/reference/PRICING.md)
