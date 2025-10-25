# 🚀 Bot Activity Log - Database Setup Instructions

**[2025-10-25 15:03 ET]**

## ⚠️ CRITICAL: Migrations Must Be Run Before Deployment Works

The TypeScript build failures are happening because **the database tables don't exist yet**. Once you run these migrations, the build will succeed immediately.

---

## 🎯 Quick Setup (5 Minutes)

### Option 1: Supabase Dashboard (Easiest) ✅

1. **Open Supabase SQL Editor:**  
   https://supabase.com/dashboard/project/kteobfyferrukqeolofj/sql

2. **Create New Query:**
   - Click "New Query" button

3. **Copy Migration SQL:**
   - Download: https://raw.githubusercontent.com/CR-AudioViz-AI/crav-bot-activity-log/main/supabase/COMPLETE_MIGRATION.sql
   - Or use the file at: `supabase/COMPLETE_MIGRATION.sql` in your repo

4. **Paste and Run:**
   - Paste entire SQL content into the editor
   - Click "Run" or press `Ctrl/Cmd + Enter`
   - Should complete in ~5-10 seconds

5. **Verify Success:**
   - You should see: "Success. No rows returned"
   - Check the Tables panel - you should see:
     - `organizations`
     - `projects`
     - `members`
     - `bots`
     - `bot_activities`
     - `tickets`
     - `audit_logs`
     - `bot_settings`

---

### Option 2: Command Line (If you have psql)

```bash
# Download migration
curl -o migration.sql https://raw.githubusercontent.com/CR-AudioViz-AI/crav-bot-activity-log/main/supabase/COMPLETE_MIGRATION.sql

# Run migration (replace with your actual connection string)
PGPASSWORD="oce@N251812345" psql \
  -h aws-0-us-east-1.pooler.supabase.com \
  -p 6543 \
  -U postgres.kteobfyferrukqeolofj \
  -d postgres \
  -f migration.sql
```

---

## ✅ After Migration Completes

Once the database tables are created:

1. **Vercel will automatically trigger a new build**
2. **TypeScript types will be properly inferred**
3. **Build will succeed** ✅
4. **App will be live and functional**

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

**Functions (4):**
- `audit_log()` - Logging helper
- `update_updated_at()` - Timestamp trigger
- `increment_activity_count()` - Bot activity counter
- `check_rate_limit()` - Rate limiting

**RLS Policies:**
- Organization-scoped data access
- Role-based permissions (admin/member/viewer)
- Service role bypass for API

**Indexes:**
- Performance indexes on common queries
- Unique constraints on key fields

---

## 🔧 Troubleshooting

**If migration fails:**
1. Check if tables already exist (may need to drop them first)
2. Ensure you're using the service role key
3. Check Supabase dashboard for error details

**To reset and start fresh:**
```sql
-- Drop all tables (CAUTION: Deletes all data)
DROP TABLE IF EXISTS bot_settings CASCADE;
DROP TABLE IF EXISTS audit_logs CASCADE;
DROP TABLE IF EXISTS tickets CASCADE;
DROP TABLE IF EXISTS bot_activities CASCADE;
DROP TABLE IF EXISTS bots CASCADE;
DROP TABLE IF EXISTS members CASCADE;
DROP TABLE IF EXISTS projects CASCADE;
DROP TABLE IF EXISTS organizations CASCADE;

-- Then run the migration again
```

---

## 📞 Next Steps

After running migrations:

1. ✅ Check Vercel dashboard - new deployment should be building
2. ✅ Build should complete successfully
3. ✅ Preview URL will be functional
4. ✅ You can start using the Bot Activity Log!

---

**File Location:** `supabase/COMPLETE_MIGRATION.sql`  
**GitHub URL:** https://github.com/CR-AudioViz-AI/crav-bot-activity-log/blob/main/supabase/COMPLETE_MIGRATION.sql  
**Raw URL:** https://raw.githubusercontent.com/CR-AudioViz-AI/crav-bot-activity-log/main/supabase/COMPLETE_MIGRATION.sql

---

**Need Help?** The migration is straightforward - just copy/paste into Supabase SQL Editor and run it. Should take less than 30 seconds to execute.
