-- ============================================================
-- CRAV BOT ACTIVITY LOG - COMPLETE DATABASE MIGRATION
-- Run this in Supabase SQL Editor
-- ============================================================

-- MIGRATION 1: BASE SCHEMA
-- ============================================================


-- ============================================================
-- MIGRATION: 001_base_schema.sql
-- ============================================================

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


-- ============================================================
-- MIGRATION: 002_rls_policies.sql
-- ============================================================

-- Migration 002: Row Level Security Policies
-- Implements comprehensive RLS policies for multi-tenant access control

-- ============================================================================
-- MEMBERS POLICIES
-- ============================================================================

CREATE POLICY "Users can view their own memberships"
  ON members FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage memberships in their org"
  ON members FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM members m
      WHERE m.org_id = members.org_id
      AND m.user_id = auth.uid()
      AND m.role = 'admin'
    )
  );

-- ============================================================================
-- ORGANIZATIONS POLICIES
-- ============================================================================

CREATE POLICY "Members can view their organizations"
  ON organizations FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM members
      WHERE members.org_id = organizations.id
      AND members.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can update their organizations"
  ON organizations FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM members
      WHERE members.org_id = organizations.id
      AND members.user_id = auth.uid()
      AND members.role = 'admin'
    )
  );

-- ============================================================================
-- PROJECTS POLICIES
-- ============================================================================

CREATE POLICY "Members can view organization projects"
  ON projects FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM members
      WHERE members.org_id = projects.org_id
      AND members.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage organization projects"
  ON projects FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM members
      WHERE members.org_id = projects.org_id
      AND members.user_id = auth.uid()
      AND members.role = 'admin'
    )
  );

-- ============================================================================
-- BOTS POLICIES
-- ============================================================================

CREATE POLICY "Members can view organization bots"
  ON bots FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM members
      WHERE members.org_id = bots.org_id
      AND members.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage organization bots"
  ON bots FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM members
      WHERE members.org_id = bots.org_id
      AND members.user_id = auth.uid()
      AND members.role = 'admin'
    )
  );

-- ============================================================================
-- ACTIVITIES POLICIES
-- ============================================================================

CREATE POLICY "Members can view organization activities"
  ON activities FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM members
      WHERE members.org_id = activities.org_id
      AND members.user_id = auth.uid()
    )
  );

-- Note: Activity insertion is handled via service role in API
-- to avoid RLS conflicts with HMAC-authenticated ingestion

-- ============================================================================
-- TICKETS POLICIES
-- ============================================================================

CREATE POLICY "Members can view organization tickets"
  ON tickets FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM members
      WHERE members.org_id = tickets.org_id
      AND members.user_id = auth.uid()
    )
  );

CREATE POLICY "Members can manage organization tickets"
  ON tickets FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM members
      WHERE members.org_id = tickets.org_id
      AND members.user_id = auth.uid()
    )
  );

-- ============================================================================
-- TICKET SOURCES POLICIES
-- ============================================================================

CREATE POLICY "Members can view organization ticket sources"
  ON ticket_sources FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM members
      WHERE members.org_id = ticket_sources.org_id
      AND members.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage organization ticket sources"
  ON ticket_sources FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM members
      WHERE members.org_id = ticket_sources.org_id
      AND members.user_id = auth.uid()
      AND members.role = 'admin'
    )
  );

-- ============================================================================
-- AUDIT LOG POLICIES
-- ============================================================================

CREATE POLICY "Members can view organization audit logs"
  ON audit_log FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM members
      WHERE members.org_id = audit_log.org_id
      AND members.user_id = auth.uid()
    )
  );

-- Note: Audit log writes are handled via service role function

-- ============================================================================
-- SAVED VIEWS POLICIES
-- ============================================================================

CREATE POLICY "Users can manage their own saved views"
  ON saved_views FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own saved views"
  ON saved_views FOR SELECT
  USING (auth.uid() = user_id);


-- ============================================================
-- MIGRATION: 003_functions_and_triggers.sql
-- ============================================================

-- Migration 003: Helper Functions and Triggers
-- Database functions for audit logging, timestamps, and automation

-- ============================================================================
-- AUDIT LOG FUNCTION
-- ============================================================================

CREATE OR REPLACE FUNCTION audit_log(
  p_org_id UUID,
  p_user_id UUID,
  p_action TEXT,
  p_resource_type TEXT,
  p_resource_id TEXT,
  p_details JSONB DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
  INSERT INTO audit_log (org_id, user_id, action, resource_type, resource_id, details)
  VALUES (p_org_id, p_user_id, p_action, p_resource_type, p_resource_id, p_details);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION audit_log IS 'Creates audit log entries for all admin actions';

-- ============================================================================
-- UPDATE TIMESTAMP TRIGGER
-- ============================================================================

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION update_updated_at IS 'Automatically updates updated_at timestamp on row changes';

-- ============================================================================
-- APPLY TRIGGERS TO TABLES
-- ============================================================================

-- Organizations
DROP TRIGGER IF EXISTS update_organizations_updated_at ON organizations;
CREATE TRIGGER update_organizations_updated_at
  BEFORE UPDATE ON organizations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Projects
DROP TRIGGER IF EXISTS update_projects_updated_at ON projects;
CREATE TRIGGER update_projects_updated_at
  BEFORE UPDATE ON projects
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Members
DROP TRIGGER IF EXISTS update_members_updated_at ON members;
CREATE TRIGGER update_members_updated_at
  BEFORE UPDATE ON members
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Bots
DROP TRIGGER IF EXISTS update_bots_updated_at ON bots;
CREATE TRIGGER update_bots_updated_at
  BEFORE UPDATE ON bots
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Tickets
DROP TRIGGER IF EXISTS update_tickets_updated_at ON tickets;
CREATE TRIGGER update_tickets_updated_at
  BEFORE UPDATE ON tickets
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Ticket Sources
DROP TRIGGER IF EXISTS update_ticket_sources_updated_at ON ticket_sources;
CREATE TRIGGER update_ticket_sources_updated_at
  BEFORE UPDATE ON ticket_sources
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Saved Views
DROP TRIGGER IF EXISTS update_saved_views_updated_at ON saved_views;
CREATE TRIGGER update_saved_views_updated_at
  BEFORE UPDATE ON saved_views
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================================
-- HELPER FUNCTIONS FOR ANALYTICS
-- ============================================================================

-- Get activity counts by severity for a bot
CREATE OR REPLACE FUNCTION get_bot_activity_counts(p_bot_id UUID, p_days INTEGER DEFAULT 7)
RETURNS TABLE (
  severity TEXT,
  count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    a.severity,
    COUNT(*)::BIGINT as count
  FROM activities a
  WHERE a.bot_id = p_bot_id
    AND a.occurred_at >= NOW() - (p_days || ' days')::INTERVAL
  GROUP BY a.severity
  ORDER BY 
    CASE a.severity
      WHEN 'error' THEN 1
      WHEN 'needs_attention' THEN 2
      WHEN 'warning' THEN 3
      WHEN 'success' THEN 4
      WHEN 'info' THEN 5
    END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION get_bot_activity_counts IS 'Returns activity counts by severity for analytics';

-- Get recent activity summary for a bot
CREATE OR REPLACE FUNCTION get_bot_summary(p_bot_id UUID)
RETURNS TABLE (
  total_activities BIGINT,
  last_activity_at TIMESTAMP WITH TIME ZONE,
  error_count BIGINT,
  warning_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*)::BIGINT as total_activities,
    MAX(a.occurred_at) as last_activity_at,
    COUNT(*) FILTER (WHERE a.severity = 'error')::BIGINT as error_count,
    COUNT(*) FILTER (WHERE a.severity = 'warning')::BIGINT as warning_count
  FROM activities a
  WHERE a.bot_id = p_bot_id
    AND a.occurred_at >= NOW() - INTERVAL '30 days';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION get_bot_summary IS 'Returns summary statistics for bot dashboard';


-- ============================================================
-- MIGRATION: 004_seed_data.sql
-- ============================================================

-- Migration 004: Seed Demo Data
-- Creates default organization, project, and demo bot

-- ============================================================================
-- INSERT DEFAULT ORGANIZATION
-- ============================================================================

INSERT INTO organizations (slug, name, metadata)
VALUES ('crav', 'CR AudioViz AI', '{"type": "default", "created_by": "seed_migration"}')
ON CONFLICT (slug) DO NOTHING;

-- ============================================================================
-- CREATE DEFAULT PROJECT AND DEMO BOT
-- ============================================================================

DO $$
DECLARE
  v_org_id UUID;
  v_project_id UUID;
  v_bot_id UUID;
BEGIN
  -- Get org_id
  SELECT id INTO v_org_id FROM organizations WHERE slug = 'crav';
  
  IF v_org_id IS NULL THEN
    RAISE EXCEPTION 'Organization not found. Run base schema migration first.';
  END IF;
  
  -- Create default project
  INSERT INTO projects (org_id, slug, name, metadata)
  VALUES (
    v_org_id,
    'main',
    'Main Project',
    '{"type": "default", "created_by": "seed_migration"}'
  )
  ON CONFLICT (org_id, slug) DO NOTHING
  RETURNING id INTO v_project_id;
  
  -- Get project_id if it already existed
  IF v_project_id IS NULL THEN
    SELECT id INTO v_project_id FROM projects WHERE org_id = v_org_id AND slug = 'main';
  END IF;
  
  -- Create demo bot
  INSERT INTO bots (
    org_id,
    project_id,
    handle,
    display_name,
    ingest_key,
    hmac_secret,
    default_tags,
    metadata
  )
  VALUES (
    v_org_id,
    v_project_id,
    'jabari',
    'Jabari AI Assistant',
    'ingest_' || encode(gen_random_bytes(32), 'hex'),
    'hmac_' || encode(gen_random_bytes(32), 'hex'),
    '["demo", "assistant", "jabari"]'::jsonb,
    '{"description": "Demo bot for testing", "created_by": "seed_migration"}'::jsonb
  )
  ON CONFLICT (org_id, handle) DO NOTHING
  RETURNING id INTO v_bot_id;
  
  -- Log the created bot
  IF v_bot_id IS NOT NULL THEN
    RAISE NOTICE 'Created demo bot "jabari" with id: %', v_bot_id;
  ELSE
    RAISE NOTICE 'Demo bot "jabari" already exists';
  END IF;
  
  -- Important reminder for the user
  RAISE NOTICE '======================================================================';
  RAISE NOTICE 'IMPORTANT: Add your user to the organization!';
  RAISE NOTICE 'Run this SQL after this migration completes:';
  RAISE NOTICE '';
  RAISE NOTICE 'SELECT id, email FROM auth.users WHERE email = ''royhenderson@craudiovizai.com'';';
  RAISE NOTICE '';
  RAISE NOTICE 'Then replace YOUR_USER_ID below and run:';
  RAISE NOTICE '';
  RAISE NOTICE 'INSERT INTO members (org_id, user_id, role)';
  RAISE NOTICE 'VALUES (';
  RAISE NOTICE '  (SELECT id FROM organizations WHERE slug = ''crav''),';
  RAISE NOTICE '  ''YOUR_USER_ID'',';
  RAISE NOTICE '  ''admin''';
  RAISE NOTICE ');';
  RAISE NOTICE '======================================================================';
  
END $$;

-- ============================================================================
-- VERIFY SEED DATA
-- ============================================================================

DO $$
DECLARE
  v_org_count INTEGER;
  v_project_count INTEGER;
  v_bot_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_org_count FROM organizations WHERE slug = 'crav';
  SELECT COUNT(*) INTO v_project_count FROM projects WHERE slug = 'main';
  SELECT COUNT(*) INTO v_bot_count FROM bots WHERE handle = 'jabari';
  
  RAISE NOTICE '✅ Seed Data Verification:';
  RAISE NOTICE '   Organizations: %', v_org_count;
  RAISE NOTICE '   Projects: %', v_project_count;
  RAISE NOTICE '   Bots: %', v_bot_count;
  
  IF v_org_count = 0 OR v_project_count = 0 OR v_bot_count = 0 THEN
    RAISE WARNING 'Some seed data may not have been created. Check for conflicts.';
  END IF;
END $$;

