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
