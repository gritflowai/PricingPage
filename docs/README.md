# Documentation Index

This directory contains all documentation for the Pricing Calculator project, organized by purpose for optimal AI and human navigation.

## Quick Navigation

### 🚀 Getting Started
- **[Quickstart Guide](guides/QUICKSTART.md)** - Get the app running locally in 5 minutes
- **[README (Project Root)](../README.md)** - Project overview and basic information

### 🔌 API & Integration
- **[SYNC_EMBEDDING](api/SYNC_EMBEDDING.md)** - ⭐ **START HERE** for iframe integration - Complete bidirectional sync guide
- **[API Reference](api/API.md)** - REST API endpoints for quote management
- **[EMBEDDING (Legacy)](api/EMBEDDING.md)** - Original embedding guide (use SYNC_EMBEDDING instead)

### 📖 User Guides
- **[Quote Settings](guides/QUOTE_SETTINGS.md)** - How to configure discounts, royalty fees, onboarding charges
- **[Deployment Guide](guides/DEPLOYMENT.md)** - How to deploy to production

### 📚 Reference
- **[Pricing Configuration](reference/PRICING.md)** - Pricing tiers, competitive analysis, how to update pricing

### 🏗️ Architecture
- **[CLAUDE.md](architecture/CLAUDE.md)** - AI assistant guidance (project structure, state management, business logic)
- **[Future Quotes Spec](architecture/FUTURE_QUOTES_SPEC.md)** - Future feature specifications

---

## Documentation Structure

```
docs/
├── api/                    # API documentation and integration guides
│   ├── SYNC_EMBEDDING.md   # Primary integration guide (bidirectional sync)
│   ├── API.md              # REST API reference
│   └── EMBEDDING.md        # Legacy embedding docs
│
├── guides/                 # Step-by-step how-to guides
│   ├── QUICKSTART.md       # Getting started locally
│   ├── QUOTE_SETTINGS.md   # Configuring quote features
│   └── DEPLOYMENT.md       # Production deployment
│
├── reference/              # Deep-dive reference material
│   └── PRICING.md          # Pricing tiers and strategy
│
└── architecture/           # System design and AI guidance
    ├── CLAUDE.md           # Project structure for AI assistants
    └── FUTURE_QUOTES_SPEC.md # Future feature specs
```

---

## For AI Assistants

### Context Priority Order

When working on this codebase, load documentation in this order:

1. **[architecture/CLAUDE.md](architecture/CLAUDE.md)** - Required first - Understand project structure
2. **[api/SYNC_EMBEDDING.md](api/SYNC_EMBEDDING.md)** - If integrating with parent app
3. **[api/API.md](api/API.md)** - If working with backend API
4. **[guides/QUOTE_SETTINGS.md](guides/QUOTE_SETTINGS.md)** - If configuring quote features
5. **[reference/PRICING.md](reference/PRICING.md)** - If updating pricing tiers

### Document Purpose Summary

| Document | Purpose | Use When |
|----------|---------|----------|
| **CLAUDE.md** | Project overview, architecture, state management | Starting any task |
| **SYNC_EMBEDDING.md** | Complete iframe sync architecture | Integrating with parent app |
| **API.md** | REST endpoint reference | Making API calls |
| **QUOTE_SETTINGS.md** | Settings sync behavior | Configuring discounts/fees |
| **PRICING.md** | Pricing tiers and formulas | Updating pricing |
| **QUICKSTART.md** | Local development setup | Running the app |
| **DEPLOYMENT.md** | Production deployment | Deploying to production |
| **EMBEDDING.md** | Legacy embedding reference | Historical context only |
| **FUTURE_QUOTES_SPEC.md** | Feature roadmap | Planning new features |

---

## For Developers

### Common Tasks

**Task: Run the app locally**
→ See [guides/QUICKSTART.md](guides/QUICKSTART.md)

**Task: Embed calculator in website**
→ See [api/SYNC_EMBEDDING.md](api/SYNC_EMBEDDING.md)

**Task: Update pricing tiers**
→ See [reference/PRICING.md](reference/PRICING.md)

**Task: Configure custom discounts**
→ See [guides/QUOTE_SETTINGS.md](guides/QUOTE_SETTINGS.md)

**Task: Deploy to production**
→ See [guides/DEPLOYMENT.md](guides/DEPLOYMENT.md)

---

## Document Relationships

```
CLAUDE.md (Architecture)
    ↓
    ├─→ SYNC_EMBEDDING.md (Integration)
    │       ↓
    │       └─→ API.md (Backend)
    │
    ├─→ QUOTE_SETTINGS.md (Features)
    │
    └─→ PRICING.md (Configuration)
```

---

## Contributing to Documentation

When adding new documentation:

- **API guides** → `docs/api/`
- **Step-by-step tutorials** → `docs/guides/`
- **Reference material** → `docs/reference/`
- **System design** → `docs/architecture/`

Keep CLAUDE.md updated when making architectural changes.
