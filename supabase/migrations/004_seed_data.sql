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
