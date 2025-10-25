# CRAV Bot/Avatar Activity Log

> ⚠️ **SETUP REQUIRED:** Before deployment works, you must run the database migrations.  
> **See: [MIGRATION_INSTRUCTIONS.md](./MIGRATION_INSTRUCTIONS.md)** for step-by-step setup (5 minutes)

Enterprise-grade bot/avatar activity monitoring dashboard with multi-tenant support, analytics, and ticket integration.

---

## 🚨 Quick Start

**Step 1: Run Database Migrations (Required)**
```
1. Open: https://supabase.com/dashboard/project/kteobfyferrukqeolofj/sql
2. Copy contents of: supabase/COMPLETE_MIGRATION.sql
3. Paste and Run
4. Done! ✅
```

**Step 2: Deploy**
- Vercel will automatically build once migrations complete
- Build will succeed and app will be live

**Detailed Instructions:** [MIGRATION_INSTRUCTIONS.md](./MIGRATION_INSTRUCTIONS.md)

---

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

---

## 📋 Prerequisites

- Node.js 18+
- Supabase account with project created
- Vercel account (for deployment)
- GitHub account

---

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
```

---

## 🗄️ Database Setup

**Critical:** Run migrations before first deployment!

See [MIGRATION_INSTRUCTIONS.md](./MIGRATION_INSTRUCTIONS.md) for detailed setup.

**Quick version:**
1. Open Supabase SQL Editor
2. Run `supabase/COMPLETE_MIGRATION.sql`
3. Verify tables are created
4. Deploy to Vercel

---

## 📦 Deployment

### Vercel (Recommended)

1. **Run database migrations first** (see above)
2. Connect your GitHub repository
3. Environment variables will auto-sync from Vercel project
4. Deploy!

### Manual Deployment

```bash
# Install dependencies
npm install

# Build
npm run build

# Start
npm start
```

---

## 📊 What Gets Created

**Tables (8):**
- `organizations` - Multi-tenant organization management
- `projects` - Project grouping within orgs  
- `members` - User-org relationships with RBAC
- `bots` - Bot configuration and API keys
- `bot_activities` - Activity log entries
- `tickets` - Jira/GitHub/Linear integration
- `audit_logs` - Admin action tracking
- `bot_settings` - Per-bot configuration

**Plus:** Functions, triggers, RLS policies, and performance indexes

---

## 🔐 Security

- **Row Level Security (RLS)** on all tables
- **HMAC authentication** for bot ingestion
- **RBAC** with admin/member/viewer roles
- **Rate limiting** per bot
- **Audit logging** for compliance
- **OWASP Top 10** protections

---

## 📖 API Documentation

### Ingest API

```bash
POST /api/ingest
Content-Type: application/json
X-Bot-Key: your_bot_ingest_key
X-HMAC-Signature: computed_signature

{
  "event": "task.completed",
  "message": "User task finished",
  "metadata": { "userId": "123" }
}
```

### Management API

- `POST /api/bots/[handle]/pause` - Pause/resume bot
- `POST /api/bots/[handle]/rotate` - Rotate API keys
- `POST /api/bots/[handle]/ping` - Health check
- `GET /api/activities` - List activities with filters
- `GET /api/analytics/overview` - Analytics dashboard data

---

## 🧪 Testing

```bash
# Run tests
npm test

# Run with coverage
npm run test:coverage

# E2E tests
npm run test:e2e
```

---

## 📚 Documentation

- [Migration Instructions](./MIGRATION_INSTRUCTIONS.md) - Database setup
- [API Documentation](./docs/API.md) - Complete API reference
- [Architecture](./docs/ARCHITECTURE.md) - System design
- [Security](./docs/SECURITY.md) - Security model

---

## 🤝 Contributing

1. Fork the repository
2. Create feature branch
3. Make changes
4. Submit pull request

---

## 📄 License

Proprietary - CR AudioViz AI, LLC

---

## 🆘 Support

For issues or questions:
- Create an issue on GitHub
- Email: info@craudiovizai.com

---

**Built with ❤️ by CR AudioViz AI**

