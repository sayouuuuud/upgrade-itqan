-- Audit Log Table for tracking permission and account changes
-- Run this migration to create the audit_log table

CREATE TABLE IF NOT EXISTS audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID NOT NULL REFERENCES users(id) ON DELETE SET NULL,
  action_type VARCHAR(50) NOT NULL,
  target_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  old_value JSONB,
  new_value JSONB,
  description TEXT,
  ip_address VARCHAR(45),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_audit_log_admin_id ON audit_log(admin_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_target_user_id ON audit_log(target_user_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_action_type ON audit_log(action_type);
CREATE INDEX IF NOT EXISTS idx_audit_log_created_at ON audit_log(created_at DESC);

-- Common action types:
-- role_change: When a user's role is changed
-- user_disabled: When a user account is disabled
-- user_enabled: When a user account is enabled
-- permission_granted: When specific permissions are granted
-- permission_revoked: When specific permissions are revoked
-- user_created: When a new user is created by admin
-- user_deleted: When a user is deleted
-- settings_changed: When system settings are changed
