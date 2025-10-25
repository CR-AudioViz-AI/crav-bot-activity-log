# CRAV Bot/Avatar Activity Log

Enterprise-grade bot/avatar activity monitoring dashboard with multi-tenant support, analytics, and ticket integration.

## 🚀 Features

### Build 1-5 (Complete)
- **Multi-tenant bot monitoring** with per-bot activity dashboards
- **HMAC-authenticated ingestion API** with idempotency
- **Comprehensive filtering & sorting** with saved presets
- **Real-time analytics** with charts and pivot tables
- **Ticket system integration** (Jira/GitHub/Linear) with deep-links and status sync
- **Bot management** (rotate keys, pause/resume, settings)
- **CSV/JSON export** functionality
- **Audit logging** for all admin actions
- **RBAC with RLS** (Row Level Security)

### Build 6 (Enhancements)
- **Health/canary endpoint** for monitoring
- **Realtime updates** (optional Supabase Realtime)
- **Per-bot rate limiting** with anomaly detection
- **Comprehensive security** (WCAG 2.2 AA, OWASP Top 10)

## 📋 Prerequisites

- Node.js 18+
- Supabase account with project created
- Vercel account (for deployment)
- GitHub account

## 🛠️ Environment Variables

Copy `.env.example` to `.env.local` and configure:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE=your-service-role-key

# Organization
DEFAULT_ORG_SLUG=crav
DEV_USER_ID=your-user-uuid

# Feature Flags
BOT_INGEST_ENABLED=1
REQUIRE_HMAC=1
UI_EXPORT_ENABLED=1
PUBLIC_READONLY_DASH=0
INGEST_RATE_LIMIT_PER_MIN=120

# Ticket Integration (Optional)
TICKET_TOKEN_JIRA=
TICKET_TOKEN_GITHUB=
TICKET_TOKEN_LINEAR=
```

## 🗄️ Database Setup

Run the SQL migrations in order from `supabase/migrations/`:

1. `001_initial_schema.sql` - Base tables (bots, tickets, activities, audit)
2. `002_orgs_and_rbac.sql` - Multi-tenant org/project structure
3. `003_bot_settings.sql` - Bot configuration features
4. `004_analytics.sql` - Saved views and analytics
5. `005_ticket_integration.sql` - Ticket sources and deep-links

Run these in your Supabase SQL Editor.

## 🚀 Vercel Deployment (Preview-Only to Save Credits)

### Step 1: Create Vercel Project

```bash
# Import the GitHub repository to Vercel
# Framework: Next.js
# Build Command: (default)
# Output Directory: (default)
```

### Step 2: CRITICAL - Configure Preview-Only Deployments

**In Vercel Project Settings:**

1. Go to **Settings → Git**
2. Scroll to **Ignored Build Step**
3. Set the command to:
   ```bash
   exit 1
   ```
4. Click **Save**

**This is critical!** Setting `exit 1` prevents automatic deployments on every push, saving Vercel credits. All deployments will go to **Preview** only.

### Step 3: Add Environment Variables

In Vercel Project Settings → Environment Variables, add all variables from `.env.example`:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE`
- `DEFAULT_ORG_SLUG`
- `BOT_INGEST_ENABLED=1`
- `REQUIRE_HMAC=1`
- `UI_EXPORT_ENABLED=1`
- And any other optional variables

### Step 4: Manual Deployment

When ready to deploy:

1. Go to Vercel Dashboard → Deployments
2. Click **"Deploy"** button manually
3. Choose the commit you want to deploy
4. Deploy goes to **Preview** (not Production)
5. Test thoroughly on preview URL
6. When satisfied, promote to Production manually

## 📝 Seeding Demo Data

```bash
npm run seed
```

This creates:
- Organization (DEFAULT_ORG_SLUG)
- Test project
- Admin membership (DEV_USER_ID)
- Sample bot with keys

## ✅ Verify Installation

```bash
npm run verify
```

This:
- Posts a signed test activity
- Confirms 200 response
- Verifies row appears in database

## 🏗️ Development

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Type checking
npm run type-check
```

Open [http://localhost:3000](http://localhost:3000)

## 📊 Application Structure

```
app/
├── api/
│   ├── health/          # Health check endpoint
│   ├── ingest/          # Activity ingestion
│   ├── bots/            # Bot management
│   ├── analytics/       # Charts and analytics
│   ├── saved-views/     # User filter presets
│   └── tickets/         # Ticket sync
├── bots/
│   ├── page.tsx         # Bot cards grid
│   └── [handle]/
│       ├── page.tsx     # Bot dashboard
│       └── settings/    # Bot settings
└── analytics/           # Org-wide analytics

components/
├── ui/                  # shadcn/ui components
├── BotCard.tsx         # Bot summary card
├── ActivityTable.tsx   # Activity list/table
├── BotFilters.tsx      # Filter controls
├── ChartsPanel.tsx     # Analytics charts
└── DownloadMenu.tsx    # Export menu

lib/
├── supabase/           # Supabase clients
├── tickets/            # Ticket provider integrations
├── hmac.ts            # HMAC signature verification
├── validation.ts      # Zod schemas
├── org-helpers.ts     # Multi-tenant utilities
└── flags.ts           # Feature flags

supabase/migrations/    # SQL schema files
scripts/               # Seed and verify scripts
```

## 🔒 Security Features

- **HMAC signature verification** for all ingest requests
- **Row Level Security (RLS)** on all tables
- **RBAC** with admin/member/viewer roles
- **Input validation** with Zod schemas
- **Rate limiting** on ingest endpoints
- **Audit logging** for all admin actions
- **WCAG 2.2 AA** compliance
- **OWASP Top 10** protections

## 🎯 API Endpoints

### Public
- `POST /api/ingest/activity` - Ingest bot activity (HMAC required)

### Authenticated
- `GET /api/health` - Health check
- `GET /api/bots` - List bots
- `GET /api/bots/[handle]` - Bot details
- `GET /api/bots/[handle]/activities` - Activity list
- `POST /api/bots/[handle]/rotate` - Rotate keys
- `POST /api/bots/[handle]/pause` - Pause/resume bot
- `POST /api/bots/[handle]/ping` - Test ping
- `GET /api/analytics/*` - Analytics endpoints
- `POST /api/tickets/sync` - Sync ticket status

## 📈 Monitoring

Access the health check endpoint:

```bash
curl https://your-app.vercel.app/api/health
```

Returns:
```json
{
  "ok": true,
  "db": true,
  "lastActivityAt": "2025-10-25T18:00:00.000Z",
  "version": "1.0.0",
  "time": "2025-10-25T18:00:00.000Z"
}
```

## 🎨 Tech Stack

- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS + shadcn/ui
- **Database:** Supabase (PostgreSQL)
- **Auth:** Supabase Auth
- **Deployment:** Vercel
- **Validation:** Zod
- **Charts:** Recharts

## 📄 License

Proprietary - CR AudioViz AI, LLC

## 🤝 Support

For support, contact: info@craudiovizai.com

---

**Built with ❤️ by CR AudioViz AI**
