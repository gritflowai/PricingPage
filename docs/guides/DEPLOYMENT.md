# Deployment Guide

This guide explains how to deploy your Supabase migrations and edge functions when working locally with Claude Code.

## Prerequisites

1. **Supabase CLI** - Required for deploying migrations and edge functions
2. **Supabase Project** - Your project ID: `ijlpiwxodfsjmexktcoc`

## Setup Instructions

### 1. Install Supabase CLI

**macOS/Linux:**
```bash
brew install supabase/tap/supabase
```

**Windows:**
```bash
scoop install supabase
```

**npm (all platforms):**
```bash
npm install -g supabase
```

### 2. Link Your Project to Supabase

Run this command in your project root:

```bash
supabase link --project-ref ijlpiwxodfsjmexktcoc
```

You'll be prompted to enter your Supabase database password. Get this from:
- Go to: https://supabase.com/dashboard/project/ijlpiwxodfsjmexktcoc/settings/database
- Look for "Database password" or reset it if needed

### 3. Configure Environment Variables

The `.env` file already contains your project credentials:
- `VITE_SUPABASE_URL`: Your project URL
- `VITE_SUPABASE_ANON_KEY`: Public anonymous key

For deployments, you'll also need:
- **Database Password**: Used by Supabase CLI
- **Service Role Key**: Found at https://supabase.com/dashboard/project/ijlpiwxodfsjmexktcoc/settings/api

## Deployment Commands

### Deploy Database Migrations

To apply all pending migrations:

```bash
supabase db push
```

This will:
- Read all SQL files in `supabase/migrations/`
- Apply them to your remote database in order
- Skip migrations that have already been applied

### Deploy Edge Functions

To deploy all edge functions:

```bash
supabase functions deploy pricing-models
supabase functions deploy quotes
```

Or deploy all at once:

```bash
supabase functions deploy
```

### View Deployment Status

Check which migrations have been applied:

```bash
supabase migration list
```

List deployed edge functions:

```bash
supabase functions list
```

## Workflow: Local Development → Deployment

### When You Make Changes

1. **Database Schema Changes:**
   - Edit files in `supabase/migrations/`
   - Or create new migration: `supabase migration new migration_name`
   - Deploy: `supabase db push`

2. **Edge Function Changes:**
   - Edit files in `supabase/functions/`
   - Deploy: `supabase functions deploy function-name`

3. **Frontend Changes:**
   - Changes are automatically reflected in development
   - Build for production: `npm run build`

### Recommended Git Workflow

```bash
# 1. Make changes locally
# 2. Test locally
npm run dev

# 3. Commit to git
git add .
git commit -m "Your commit message"

# 4. Deploy database changes
supabase db push

# 5. Deploy edge functions
supabase functions deploy

# 6. Push to git remote
git push origin main
```

## CI/CD: Automatic Deployments (Optional)

For automatic deployments when you push to GitHub, create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Supabase

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Supabase CLI
        uses: supabase/setup-cli@v1

      - name: Link Supabase Project
        env:
          SUPABASE_ACCESS_TOKEN: ${{ secrets.SUPABASE_ACCESS_TOKEN }}
          SUPABASE_DB_PASSWORD: ${{ secrets.SUPABASE_DB_PASSWORD }}
        run: |
          supabase link --project-ref ijlpiwxodfsjmexktcoc

      - name: Deploy Migrations
        run: supabase db push

      - name: Deploy Edge Functions
        run: supabase functions deploy
```

You'll need to add these GitHub secrets:
- `SUPABASE_ACCESS_TOKEN`: Generate at https://supabase.com/dashboard/account/tokens
- `SUPABASE_DB_PASSWORD`: Your database password

## Troubleshooting

### "Project not linked"
Run: `supabase link --project-ref ijlpiwxodfsjmexktcoc`

### "Migration already applied"
This is normal - Supabase tracks which migrations have been applied

### "Function deployment failed"
- Check function syntax
- Ensure all dependencies use `npm:` or `jsr:` prefixes
- Check CORS headers are properly configured

### "Cannot connect to database"
- Verify your database password
- Check network connection
- Ensure project is not paused (free tier pauses after inactivity)

## Manual Deployment via Supabase Dashboard

If CLI doesn't work, you can deploy manually:

### Migrations:
1. Go to: https://supabase.com/dashboard/project/ijlpiwxodfsjmexktcoc/editor/sql
2. Copy SQL from migration files
3. Run in SQL editor

### Edge Functions:
1. Go to: https://supabase.com/dashboard/project/ijlpiwxodfsjmexktcoc/functions
2. Create new function
3. Copy code from `supabase/functions/function-name/index.ts`
4. Deploy

## Current Deployment Status

Your project currently has:

**Migrations:**
- `20251104154936_create_pricing_models_table.sql`
- `20251104154959_create_quotes_table.sql`

**Edge Functions:**
- `pricing-models` - Manages pricing model versions
- `quotes` - Handles quote lifecycle (init, update, lock, load)

**Next Steps:**
1. Install Supabase CLI
2. Link your project: `supabase link --project-ref ijlpiwxodfsjmexktcoc`
3. Deploy migrations: `supabase db push`
4. Deploy functions: `supabase functions deploy`

## Useful Links

- **Project Dashboard**: https://supabase.com/dashboard/project/ijlpiwxodfsjmexktcoc
- **Database Editor**: https://supabase.com/dashboard/project/ijlpiwxodfsjmexktcoc/editor
- **SQL Editor**: https://supabase.com/dashboard/project/ijlpiwxodfsjmexktcoc/sql
- **Functions**: https://supabase.com/dashboard/project/ijlpiwxodfsjmexktcoc/functions
- **API Docs**: https://supabase.com/dashboard/project/ijlpiwxodfsjmexktcoc/settings/api
- **CLI Docs**: https://supabase.com/docs/guides/cli
