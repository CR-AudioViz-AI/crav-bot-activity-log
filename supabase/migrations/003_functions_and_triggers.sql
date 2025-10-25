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
