-- ============================================================================
-- Agent A Security Fixes - SQL Queries
-- ============================================================================
-- File: scripts/A-security-queries.sql
-- Purpose: Database queries for A-4 (Permission Flags), A-5 (User Session Invalidation)
-- Branch: feature/plan-A-security
-- ============================================================================

-- ============================================================================
-- A-4: Fetch actual permission flags from DB (not cached)
-- ============================================================================
-- Used when middleware or route handlers need fresh permission state
-- Query to get user's actual access flags from database

SELECT 
  u.id,
  u.role,
  u.name,
  u.email,
  u.is_active,
  u.has_quran_access,
  u.has_academy_access,
  u.platform_preference,
  u.approval_status,
  u.last_login_at,
  (
    SELECT json_agg(json_build_object('id', role_id, 'name', role_name))
    FROM academy_roles ar
    WHERE ar.user_id = u.id AND ar.is_active = true
  ) as academy_roles,
  EXISTS(
    SELECT 1 FROM user_sessions us 
    WHERE us.user_id = u.id 
    AND us.last_active_at > NOW() - INTERVAL '5 minutes'
  ) as is_online
FROM users u
WHERE u.id = $1;


-- ============================================================================
-- A-4: Real-time permission invalidation trigger
-- ============================================================================
-- When admin changes access flags, immediately notify active sessions

-- Create invalidation log table (if not exists)
CREATE TABLE IF NOT EXISTS permission_invalidations (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  invalidated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  reason TEXT,
  admin_id UUID REFERENCES users(id),
  indexed_for_realtime BOOLEAN DEFAULT FALSE
);

-- Create index for fast lookups
CREATE INDEX IF NOT EXISTS idx_permission_invalidations_user_id 
  ON permission_invalidations(user_id, invalidated_at DESC);

-- Trigger function: When user access flags change, invalidate sessions
CREATE OR REPLACE FUNCTION invalidate_user_permissions()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.is_active IS DISTINCT FROM NEW.is_active
    OR OLD.has_quran_access IS DISTINCT FROM NEW.has_quran_access
    OR OLD.has_academy_access IS DISTINCT FROM NEW.has_academy_access
    OR OLD.approval_status IS DISTINCT FROM NEW.approval_status
  THEN
    -- Log the invalidation
    INSERT INTO permission_invalidations (user_id, reason)
    VALUES (NEW.id, 'User permissions changed by admin');
    
    -- Notify via Realtime (broadcast to client)
    PERFORM pg_notify(
      'user_permission_changed',
      json_build_object(
        'user_id', NEW.id,
        'is_active', NEW.is_active,
        'has_quran_access', NEW.has_quran_access,
        'has_academy_access', NEW.has_academy_access,
        'timestamp', NOW()
      )::text
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Attach trigger to users table
DROP TRIGGER IF EXISTS trigger_invalidate_permissions ON users;
CREATE TRIGGER trigger_invalidate_permissions
  AFTER UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION invalidate_user_permissions();


-- ============================================================================
-- A-5: Session invalidation when user is disabled
-- ============================================================================
-- Immediately revoke all active sessions when user is deactivated

CREATE OR REPLACE FUNCTION invalidate_user_sessions()
RETURNS TRIGGER AS $$
BEGIN
  -- If user was deactivated (is_active changed from true to false)
  IF OLD.is_active = TRUE AND NEW.is_active = FALSE THEN
    -- Delete all active sessions
    DELETE FROM user_sessions 
    WHERE user_id = NEW.id
    AND session_status != 'revoked';
    
    -- Log the action
    INSERT INTO activity_logs (user_id, action, entity_type, entity_id, description)
    VALUES (
      NULL,
      'session_revoked',
      'user',
      NEW.id,
      'All sessions revoked due to user deactivation'
    );
    
    -- Notify via Realtime
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

-- Attach trigger to users table
DROP TRIGGER IF EXISTS trigger_invalidate_sessions ON users;
CREATE TRIGGER trigger_invalidate_sessions
  AFTER UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION invalidate_user_sessions();


-- ============================================================================
-- A-5: Query to get user's active sessions (for revocation)
-- ============================================================================
-- Used to revoke all sessions when user is disabled

SELECT 
  us.session_id,
  us.user_id,
  us.created_at,
  us.last_active_at,
  us.session_status,
  us.ip_address,
  us.user_agent
FROM user_sessions us
WHERE us.user_id = $1
  AND us.session_status != 'revoked'
  AND us.last_active_at > NOW() - INTERVAL '30 days'
ORDER BY us.last_active_at DESC;


-- ============================================================================
-- A-4: Mode Switcher - fetch actual DB flags instead of cache
-- ============================================================================
-- When user clicks Mode Switcher (Quran ↔ Academy), get fresh DB state

SELECT 
  u.id,
  u.has_quran_access,
  u.has_academy_access,
  u.platform_preference,
  u.role,
  (
    SELECT json_agg(DISTINCT ar.role_name)
    FROM academy_roles ar
    WHERE ar.user_id = u.id AND ar.is_active = true
  ) as academy_roles
FROM users u
WHERE u.id = $1;


-- ============================================================================
-- A-6: Delete rejected reader application (with cascading records)
-- ============================================================================
-- Safely delete reader applications and all related data

BEGIN;

-- Delete reader notifications
DELETE FROM notifications 
WHERE user_id = $1 
  AND (type = 'reader_rejected' OR type = 'reader_approved');

-- Delete reader profiles
DELETE FROM reader_profiles 
WHERE user_id = $1;

-- Delete user sessions
DELETE FROM user_sessions 
WHERE user_id = $1;

-- Delete user finally
DELETE FROM users 
WHERE id = $1 AND role = 'reader';

-- Log the action
INSERT INTO activity_logs (user_id, action, entity_type, entity_id, description)
VALUES (NULL, 'reader_application_deleted', 'reader', $1, 'Rejected reader application deleted by admin');

COMMIT;


-- ============================================================================
-- A-1: Check teacher trying to access student routes
-- ============================================================================
-- Query to verify role-based access control

SELECT 
  u.id,
  u.role,
  u.name,
  CASE 
    WHEN u.role = 'teacher' THEN 'DENY - /academy/student/*'
    WHEN u.role = 'student' THEN 'ALLOW - /academy/student/*'
    WHEN u.role IN ('supervisor', 'content_supervisor') THEN 'DENY - /academy/student/*'
    ELSE 'CHECK - /academy/student/*'
  END as student_path_access,
  (
    SELECT json_agg(ar.role_name)
    FROM academy_roles ar
    WHERE ar.user_id = u.id AND ar.is_active = true
  ) as academy_roles
FROM users u
WHERE u.id = $1;
