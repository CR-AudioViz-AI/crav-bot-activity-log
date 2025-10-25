-- Migration 001: Base Schema
-- Creates all core tables, indexes, and enables RLS

-- ============================================================================
-- TABLES
-- ============================================================================

-- Organizations table
CREATE TABLE IF NOT EXISTS organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  metadata JSONB
);

-- Projects table
CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  slug TEXT NOT NULL,
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  metadata JSONB,
  UNIQUE(org_id, slug)
);

-- Members table
CREATE TABLE IF NOT EXISTS members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'member', 'viewer')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(org_id, user_id)
);

-- Bots table
CREATE TABLE IF NOT EXISTS bots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
  handle TEXT NOT NULL,
  display_name TEXT NOT NULL,
  ingest_key TEXT NOT NULL UNIQUE,
  hmac_secret TEXT,
  is_paused BOOLEAN DEFAULT FALSE,
  default_tags JSONB,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_activity_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(org_id, handle)
);

-- Tickets table
CREATE TABLE IF NOT EXISTS tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  ticket_key TEXT NOT NULL,
  title TEXT NOT NULL,
  status TEXT NOT NULL,
  priority TEXT,
  assignee TEXT,
  deep_link TEXT,
  external_status TEXT,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(org_id, ticket_key)
);

-- Activities table
CREATE TABLE IF NOT EXISTS activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bot_id UUID NOT NULL REFERENCES bots(id) ON DELETE CASCADE,
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
  event_uid TEXT NOT NULL,
  event_type TEXT NOT NULL,
  severity TEXT NOT NULL CHECK (severity IN ('info', 'success', 'warning', 'error', 'needs_attention')),
  message TEXT,
  details JSONB,
  ticket_id TEXT,
  tags TEXT[],
  occurred_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(bot_id, event_uid)
);

-- Audit log table
CREATE TABLE IF NOT EXISTS audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID,
  action TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id TEXT NOT NULL,
  details JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Ticket sources table
CREATE TABLE IF NOT EXISTS ticket_sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  provider TEXT NOT NULL CHECK (provider IN ('jira', 'github', 'linear')),
  base_url TEXT NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(org_id, provider)
);

-- Saved views table
CREATE TABLE IF NOT EXISTS saved_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  filters JSONB NOT NULL,
  is_default BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, org_id, name)
);

-- ============================================================================
-- INDEXES
-- ============================================================================

-- Bots indexes
CREATE INDEX IF NOT EXISTS idx_bots_org_id ON bots(org_id);
CREATE INDEX IF NOT EXISTS idx_bots_ingest_key ON bots(ingest_key);
CREATE INDEX IF NOT EXISTS idx_bots_handle ON bots(handle);

-- Activities indexes
CREATE INDEX IF NOT EXISTS idx_activities_bot_id ON activities(bot_id);
CREATE INDEX IF NOT EXISTS idx_activities_org_id ON activities(org_id);
CREATE INDEX IF NOT EXISTS idx_activities_occurred_at ON activities(occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_activities_event_type ON activities(event_type);
CREATE INDEX IF NOT EXISTS idx_activities_severity ON activities(severity);
CREATE INDEX IF NOT EXISTS idx_activities_tags ON activities USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_activities_event_uid ON activities(bot_id, event_uid);

-- Audit log indexes
CREATE INDEX IF NOT EXISTS idx_audit_log_org_id ON audit_log(org_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_created_at ON audit_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_log_user_id ON audit_log(user_id);

-- Members indexes
CREATE INDEX IF NOT EXISTS idx_members_user_id ON members(user_id);
CREATE INDEX IF NOT EXISTS idx_members_org_id ON members(org_id);

-- Projects indexes
CREATE INDEX IF NOT EXISTS idx_projects_org_id ON projects(org_id);

-- Tickets indexes
CREATE INDEX IF NOT EXISTS idx_tickets_org_id ON tickets(org_id);
CREATE INDEX IF NOT EXISTS idx_tickets_ticket_key ON tickets(ticket_key);

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE members ENABLE ROW LEVEL SECURITY;
ALTER TABLE bots ENABLE ROW LEVEL SECURITY;
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE ticket_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_views ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE organizations IS 'Multi-tenant organizations';
COMMENT ON TABLE projects IS 'Projects within organizations';
COMMENT ON TABLE members IS 'Organization membership with RBAC';
COMMENT ON TABLE bots IS 'Bot/avatar configurations';
COMMENT ON TABLE activities IS 'Bot activity events';
COMMENT ON TABLE audit_log IS 'Audit trail for all actions';
COMMENT ON TABLE ticket_sources IS 'External ticket system configurations';
COMMENT ON TABLE saved_views IS 'User-saved filter presets';
