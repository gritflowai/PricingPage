# Quick Start Guide

## First Time Setup (5 minutes)

### 1. Install Supabase CLI

**macOS:**
```bash
brew install supabase/tap/supabase
```

**Other platforms:**
- Windows: `scoop install supabase`
- Linux: `brew install supabase/tap/supabase`
- npm: `npm install -g supabase`

Verify installation:
```bash
supabase --version
```

### 2. Link Your Project

```bash
supabase link --project-ref ijlpiwxodfsjmexktcoc
```

When prompted:
- **Database password**: Get from https://supabase.com/dashboard/project/ijlpiwxodfsjmexktcoc/settings/database
- Or reset password if needed

### 3. Initial Deployment

Deploy everything at once:
```bash
./deploy.sh
```

Or manually:
```bash
supabase db push                        # Deploy migrations
supabase functions deploy pricing-models --no-verify-jwt
supabase functions deploy quotes --no-verify-jwt
```

## Daily Workflow

### Making Changes

1. **Edit code locally** (with Claude Code or your editor)
2. **Test locally**:
   ```bash
   npm run dev
   ```
3. **Build to verify**:
   ```bash
   npm run build
   ```

### Deploying Changes

**Database changes** (new migrations):
```bash
supabase db push
```

**Edge function changes**:
```bash
supabase functions deploy pricing-models
supabase functions deploy quotes
```

**Or deploy everything**:
```bash
./deploy.sh
```

### Committing to Git

```bash
git add .
git commit -m "Description of changes"
git push
```

## Common Commands

```bash
# Check deployment status
supabase migration list              # See which migrations are applied
supabase functions list              # See deployed functions

# Test edge functions locally (optional)
supabase functions serve            # Run functions locally
supabase start                      # Start local Supabase (requires Docker)

# View logs
supabase functions logs pricing-models
supabase functions logs quotes

# Create new migration
supabase migration new migration_name
```

## Deployment Status Check

After deployment, verify:

1. **Database tables exist:**
   - https://supabase.com/dashboard/project/ijlpiwxodfsjmexktcoc/editor

2. **Edge functions are live:**
   - https://supabase.com/dashboard/project/ijlpiwxodfsjmexktcoc/functions

3. **Test API endpoints:**
   ```bash
   # Get active pricing model
   curl https://ijlpiwxodfsjmexktcoc.supabase.co/functions/v1/pricing-models/active

   # Initialize a quote
   curl -X POST https://ijlpiwxodfsjmexktcoc.supabase.co/functions/v1/quotes/init \
     -H "Content-Type: application/json" \
     -d '{"id":"test-123","selected_plan":"growth","count":10,"is_annual":false}'
   ```

## What Gets Deployed

### Migrations (Database Schema)
- `supabase/migrations/*.sql` → Remote database
- Creates/modifies tables, indexes, RLS policies

### Edge Functions (Serverless APIs)
- `supabase/functions/*/index.ts` → Deno runtime
- Become live API endpoints

### Frontend (Not auto-deployed)
- Build: `npm run build`
- Deploy manually to hosting (Vercel, Netlify, etc.)
- Or push to GitHub for auto-deployment

## Troubleshooting

### "Command not found: supabase"
- Install Supabase CLI (see step 1 above)

### "Project not linked"
- Run: `supabase link --project-ref ijlpiwxodfsjmexktcoc`

### "Migration already exists"
- Normal - means migration was already applied
- Supabase tracks which migrations have run

### "Cannot connect to database"
- Check database password
- Verify project isn't paused (free tier auto-pauses)
- Check at: https://supabase.com/dashboard/project/ijlpiwxodfsjmexktcoc

### Edge function not working
- Check logs: `supabase functions logs function-name`
- Verify CORS headers in function code
- Ensure `--no-verify-jwt` flag is used for public functions

## Important Notes

### ✅ What IS Automatic
- Nothing deploys automatically when you push to git
- You must manually run deployment commands

### ❌ What is NOT Automatic
- Database migrations are NOT auto-applied
- Edge functions are NOT auto-deployed
- You must run `supabase db push` and `supabase functions deploy`

### 🔄 Setting Up Auto-Deploy (Optional)
See `DEPLOYMENT.md` for GitHub Actions CI/CD setup

## Your Project URLs

**Development:**
- Local: http://localhost:3000

**Production:**
- Supabase Dashboard: https://supabase.com/dashboard/project/ijlpiwxodfsjmexktcoc
- API Base: https://ijlpiwxodfsjmexktcoc.supabase.co/functions/v1
- Database: https://ijlpiwxodfsjmexktcoc.supabase.co

**API Endpoints:**
- Pricing Models: `/pricing-models/active`
- Quotes: `/quotes/init`, `/quotes/update`, `/quotes/lock`, `/quotes/:id`

## Next Steps

1. ✅ Complete first-time setup above
2. ✅ Deploy migrations and functions
3. ✅ Test API endpoints
4. 📖 Read `API.md` for endpoint documentation
5. 🚀 Start building!

## Getting Help

- **API Docs**: See `API.md`
- **Deployment Guide**: See `DEPLOYMENT.md`
- **Supabase Docs**: https://supabase.com/docs
- **Supabase CLI**: https://supabase.com/docs/guides/cli
