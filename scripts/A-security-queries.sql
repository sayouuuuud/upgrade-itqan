-- ============================================================================
-- Agent A Security Fixes - SQL Queries
-- ============================================================================
-- File: scripts/A-security-queries.sql
-- Purpose: Database setup for A-4 (Permission Flags), A-5 (User Session
--          Invalidation), A-6 (Reader Application Deletion).
-- Branch:  feature/plan-A-security
-- ============================================================================
--
-- HOW TO RUN
-- ----------
-- This file is split into two sections:
--
--   SECTION 1 (DDL): runnable as-is in the Supabase SQL editor or psql.
--                    Creates tables, functions and triggers used by the app.
--
--   SECTION 2 (REFERENCE TEMPLATES): copy/paste targets used from application
--                    code. They contain `$1`, `$2` placeholders and MUST be
--                    executed via parameterized queries (`pg`, `postgres-js`)
--                    — NOT pasted into the SQL editor as-is. They are kept
--                    here as commented-out documentation only.
--
-- SCHEMA NOTES
-- ------------
--   * `academy_roles` is NOT a table — it is a `VARCHAR(50)[]` column on
--     `users` (see scripts/011-academy-expansion.sql).
--   * `user_sessions` columns: id, user_id, token, ip_address, user_agent,
--     last_active_at, expires_at, created_at (see scripts/001-schema.sql).
--     There is NO `session_id` or `session_status` column.
-- ============================================================================


-- ////////////////////////////////////////////////////////////////////////////
-- SECTION 1 — DDL (runnable)
-- ////////////////////////////////////////////////////////////////////////////


-- ============================================================================
-- A-4: Real-time permission invalidation table + trigger
-- ============================================================================
-- When admin changes access flags, immediately notify active sessions.

CREATE TABLE IF NOT EXISTS permission_invalidations (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  invalidated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  reason TEXT,
  admin_id UUID REFERENCES users(id),
  indexed_for_realtime BOOLEAN DEFAULT FALSE
);

CREATE INDEX IF NOT EXISTS idx_permission_invalidations_user_id
  ON permission_invalidations(user_id, invalidated_at DESC);

-- Trigger function: when access flags change, log + broadcast.
CREATE OR REPLACE FUNCTION invalidate_user_permissions()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.is_active IS DISTINCT FROM NEW.is_active
    OR OLD.has_quran_access IS DISTINCT FROM NEW.has_quran_access
    OR OLD.has_academy_access IS DISTINCT FROM NEW.has_academy_access
    OR OLD.approval_status IS DISTINCT FROM NEW.approval_status
    OR OLD.academy_roles IS DISTINCT FROM NEW.academy_roles
  THEN
    INSERT INTO permission_invalidations (user_id, reason)
    VALUES (NEW.id, 'User permissions changed by admin');

    PERFORM pg_notify(
      'user_permission_changed',
      json_build_object(
        'user_id', NEW.id,
        'is_active', NEW.is_active,
        'has_quran_access', NEW.has_quran_access,
        'has_academy_access', NEW.has_academy_access,
        'approval_status', NEW.approval_status,
        'academy_roles', NEW.academy_roles,
        'timestamp', NOW()
      )::text
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_invalidate_permissions ON users;
CREATE TRIGGER trigger_invalidate_permissions
  AFTER UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION invalidate_user_permissions();


-- ============================================================================
-- A-5: Auto-revoke sessions when a user is deactivated
-- ============================================================================

CREATE OR REPLACE FUNCTION invalidate_user_sessions()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.is_active = TRUE AND NEW.is_active = FALSE THEN
    DELETE FROM user_sessions WHERE user_id = NEW.id;

    -- refresh_tokens may not exist in every environment.
    BEGIN
      DELETE FROM refresh_tokens WHERE user_id = NEW.id;
    EXCEPTION WHEN undefined_table THEN
      NULL;
    END;

    INSERT INTO activity_logs (user_id, action, entity_type, entity_id, description)
    VALUES (
      NULL,
      'session_revoked',
      'user',
      NEW.id,
      'All sessions revoked due to user deactivation'
    );

    PERFORM pg_notify(
      'user_session_revoked',
      json_build_object(
        'user_id', NEW.id,
        'reason', 'user_disabled',
        'timestamp', NOW()
      )::text
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_invalidate_sessions ON users;
CREATE TRIGGER trigger_invalidate_sessions
  AFTER UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION invalidate_user_sessions();


-- ============================================================================
-- A-6: Reusable function to delete a rejected reader application
-- ============================================================================
-- Wrap the cascade in a function so it can be called safely from anywhere:
--   SELECT delete_rejected_reader_application('USER_UUID_HERE'::uuid);

CREATE OR REPLACE FUNCTION delete_rejected_reader_application(p_user_id UUID)
RETURNS VOID AS $$
BEGIN
  DELETE FROM notifications
  WHERE user_id = p_user_id
    AND type IN ('reader_rejected', 'reader_approved');

  -- These are usually CASCADEd from users(id), but we clear them defensively
  -- in case a future migration removes the CASCADE.
  BEGIN
    DELETE FROM reader_profiles WHERE user_id = p_user_id;
  EXCEPTION WHEN undefined_table THEN
    NULL;
  END;

  DELETE FROM user_sessions WHERE user_id = p_user_id;

  DELETE FROM users
  WHERE id = p_user_id
    AND role = 'reader';

  INSERT INTO activity_logs (user_id, action, entity_type, entity_id, description)
  VALUES (NULL, 'reader_application_deleted', 'reader', p_user_id,
          'Rejected reader application deleted by admin');
END;
$$ LANGUAGE plpgsql;


-- ////////////////////////////////////////////////////////////////////////////
-- END OF EXECUTABLE SQL
-- ////////////////////////////////////////////////////////////////////////////
-- Application-level query templates that contain $1 / $2 placeholders are
-- documented in `scripts/A-security-queries.reference.md`. Those queries are
-- run from Node code via `pg` parameter binding and must NOT be pasted into
-- the SQL editor.
