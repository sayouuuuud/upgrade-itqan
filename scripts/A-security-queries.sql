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

CREATE OR REPLACE FUNCTION invalidate_user_sessions()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.is_active = TRUE AND NEW.is_active = FALSE THEN
    DELETE FROM user_sessions WHERE user_id = NEW.id;

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

CREATE OR REPLACE FUNCTION delete_rejected_reader_application(p_user_id UUID)
RETURNS VOID AS $$
BEGIN
  DELETE FROM notifications
  WHERE user_id = p_user_id
    AND type IN ('reader_rejected', 'reader_approved');

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
