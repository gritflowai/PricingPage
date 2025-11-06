# AI Growth Advisor - Pricing Calculator

A React-based pricing calculator application with two distinct pricing models: **Standard Connection Plan** and **AI Growth Advisor Only**. Built with Vite, TypeScript, and Tailwind CSS with Supabase backend.

## Features

- Interactive pricing calculator with two pricing models
- Tiered pricing with volume discounts
- Quote management system with versioning
- Database-backed pricing models
- Edge functions for server-side logic
- Embeddable iframe support

## Development Setup

### Prerequisites

- Node.js 18+ and npm
- Supabase CLI (for deployments)

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

The app runs on http://localhost:3000

### Environment Variables

The `.env` file contains:
```
VITE_SUPABASE_URL=https://ijlpiwxodfsjmexktcoc.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

## Deployment

### Quick Deploy

Use the provided deployment script:

```bash
./deploy.sh
```

### Manual Deployment

1. **Install Supabase CLI:**
   ```bash
   brew install supabase/tap/supabase
   ```

2. **Link to your Supabase project:**
   ```bash
   supabase link --project-ref ijlpiwxodfsjmexktcoc
   ```

3. **Deploy migrations:**
   ```bash
   supabase db push
   ```

4. **Deploy edge functions:**
   ```bash
   supabase functions deploy pricing-models
   supabase functions deploy quotes
   ```

See [docs/guides/DEPLOYMENT.md](docs/guides/DEPLOYMENT.md) for detailed deployment instructions.

## Documentation

📚 **[Complete Documentation Index](docs/README.md)**

### Quick Links
- 🚀 [Quickstart Guide](docs/guides/QUICKSTART.md) - Get running in 5 minutes
- 🔌 [Sync Embedding Guide](docs/api/SYNC_EMBEDDING.md) - Integrate calculator with your app
- 📖 [API Reference](docs/api/API.md) - REST API endpoints
- 💰 [Pricing Configuration](docs/reference/PRICING.md) - Update pricing tiers
- ⚙️ [Quote Settings](docs/guides/QUOTE_SETTINGS.md) - Configure discounts and fees
- 🏗️ [Architecture Guide](docs/architecture/CLAUDE.md) - System design and structure

## Project Structure

```
├── src/
│   ├── components/     # React components
│   ├── hooks/          # Custom React hooks
│   ├── lib/            # API clients
│   ├── types/          # TypeScript types
│   └── utils/          # Utility functions
├── supabase/
│   ├── migrations/     # Database schema migrations
│   └── functions/      # Edge functions (serverless)
│       ├── pricing-models/
│       └── quotes/
└── docs/               # 📚 Documentation
    ├── api/            # API & integration guides
    ├── guides/         # How-to guides
    ├── reference/      # Reference material
    └── architecture/   # System design
```

## Architecture

- **Frontend**: React + TypeScript + Vite + Tailwind CSS
- **Backend**: Supabase (PostgreSQL + Edge Functions)
- **State Management**: React hooks
- **Pricing Logic**: Tiered pricing with volume discounts

## Available Scripts

```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run preview  # Preview production build
npm run lint     # Run ESLint
```

## API Endpoints

See [docs/api/API.md](docs/api/API.md) for complete API documentation.

**Base URL:** `https://ijlpiwxodfsjmexktcoc.supabase.co/functions/v1`

**Endpoints:**
- `GET /pricing-models/active` - Get active pricing model
- `POST /pricing-models` - Create pricing model
- `POST /quotes/init` - Initialize quote
- `POST /quotes/update` - Update quote
- `POST /quotes/lock` - Lock quote
- `GET /quotes/:id` - Get quote by ID

## Database Schema

### pricing_models
- Stores versioned pricing configurations
- Supports draft, active, and deprecated statuses
- Includes validity date ranges

### quotes
- Stores individual pricing quotes
- Tracks status: draft → locked → accepted/expired
- Includes complete pricing breakdown

## Contributing

1. Make changes locally
2. Test with `npm run dev`
3. Deploy to Supabase:
   ```bash
   ./deploy.sh
   ```
4. Commit and push:
   ```bash
   git add .
   git commit -m "Your message"
   git push
   ```

## Useful Links

- **Supabase Dashboard**: https://supabase.com/dashboard/project/ijlpiwxodfsjmexktcoc
- **Database Editor**: https://supabase.com/dashboard/project/ijlpiwxodfsjmexktcoc/editor
- **Edge Functions**: https://supabase.com/dashboard/project/ijlpiwxodfsjmexktcoc/functions
- **API Settings**: https://supabase.com/dashboard/project/ijlpiwxodfsjmexktcoc/settings/api
