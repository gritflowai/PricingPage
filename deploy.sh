#!/bin/bash

# Deployment script for Supabase migrations and edge functions
# Usage: ./deploy.sh

set -e  # Exit on error

echo "🚀 Starting deployment..."

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo -e "${RED}❌ Supabase CLI is not installed${NC}"
    echo "Install it with: brew install supabase/tap/supabase"
    echo "Or visit: https://supabase.com/docs/guides/cli"
    exit 1
fi

echo -e "${GREEN}✓ Supabase CLI found${NC}"

# Check if project is linked
if [ ! -f ".git/config" ] || ! grep -q "supabase" ".git/config" 2>/dev/null; then
    echo -e "${YELLOW}⚠ Project not linked to Supabase${NC}"
    echo "Run: supabase link --project-ref ijlpiwxodfsjmexktcoc"
    echo "Then run this script again"
    exit 1
fi

# Deploy migrations
echo ""
echo "📊 Deploying database migrations..."
if supabase db push; then
    echo -e "${GREEN}✓ Migrations deployed successfully${NC}"
else
    echo -e "${RED}❌ Migration deployment failed${NC}"
    exit 1
fi

# Deploy edge functions
echo ""
echo "⚡ Deploying edge functions..."

# Deploy pricing-models function
echo "  - Deploying pricing-models..."
if supabase functions deploy pricing-models --no-verify-jwt; then
    echo -e "${GREEN}  ✓ pricing-models deployed${NC}"
else
    echo -e "${RED}  ❌ pricing-models deployment failed${NC}"
    exit 1
fi

# Deploy quotes function
echo "  - Deploying quotes..."
if supabase functions deploy quotes --no-verify-jwt; then
    echo -e "${GREEN}  ✓ quotes deployed${NC}"
else
    echo -e "${RED}  ❌ quotes deployment failed${NC}"
    exit 1
fi

echo ""
echo -e "${GREEN}✅ All deployments completed successfully!${NC}"
echo ""
echo "📝 Next steps:"
echo "  - View functions: https://supabase.com/dashboard/project/ijlpiwxodfsjmexktcoc/functions"
echo "  - View database: https://supabase.com/dashboard/project/ijlpiwxodfsjmexktcoc/editor"
echo "  - Test API: See API.md for endpoint examples"
