-- ============================================
-- Phase 5: Parent Account Enhancements
-- - Invitation/consent flow for parent-child linking
-- - Content restrictions (surahs / paths)
-- - Parent <-> Teacher direct messaging
-- - Weekly email reports tracking
-- ============================================

BEGIN;

-- ----------------------------------------
-- 1) Extend parent_children with invitation/consent fields
-- ----------------------------------------
ALTER TABLE parent_children
  ADD COLUMN IF NOT EXISTS link_code VARCHAR(8),
  ADD COLUMN IF NOT EXISTS link_code_expires_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS requested_at TIMESTAMPTZ DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS confirmed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS rejected_at TIMESTAMPTZ;

-- Update existing rows with default status if needed
UPDATE parent_children SET status = 'active' WHERE status = 'approved';

-- Allow extra statuses for the invitation flow
ALTER TABLE parent_children DROP CONSTRAINT IF EXISTS parent_children_status_check;
ALTER TABLE parent_children ADD CONSTRAINT parent_children_status_check
  CHECK (status IN ('pending', 'active', 'rejected', 'removed'));

-- Index for fast lookup of pending requests for a child
CREATE INDEX IF NOT EXISTS idx_parent_children_child_status
  ON parent_children(child_id, status);

CREATE INDEX IF NOT EXISTS idx_parent_children_parent_status
  ON parent_children(parent_id, status);

-- ----------------------------------------
-- 2) Content restrictions (surahs + paths)
-- ----------------------------------------
CREATE TABLE IF NOT EXISTS parent_content_restrictions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_child_id UUID NOT NULL REFERENCES parent_children(id) ON DELETE CASCADE,

  -- Type of restriction: 'surah' | 'memorization_path' | 'tajweed_path'
  restriction_type VARCHAR(32) NOT NULL CHECK (
    restriction_type IN ('surah', 'memorization_path', 'tajweed_path')
  ),

  -- For surah: surah number (1-114)
  -- For paths: path id (uuid stored as text)
  target_id VARCHAR(64) NOT NULL,

  -- TRUE = explicitly blocked. (Default model: allow-everything-except-blocked)
  is_blocked BOOLEAN NOT NULL DEFAULT TRUE,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(parent_child_id, restriction_type, target_id)
);

CREATE INDEX IF NOT EXISTS idx_parent_restrictions_link
  ON parent_content_restrictions(parent_child_id);
CREATE INDEX IF NOT EXISTS idx_parent_restrictions_lookup
  ON parent_content_restrictions(restriction_type, target_id);

-- ----------------------------------------
-- 3) Parent <-> Teacher messaging
-- ----------------------------------------
CREATE TABLE IF NOT EXISTS parent_teacher_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  teacher_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  child_id UUID REFERENCES users(id) ON DELETE SET NULL,
  subject VARCHAR(255),
  last_message TEXT,
  last_message_at TIMESTAMPTZ,
  unread_count_parent INTEGER DEFAULT 0,
  unread_count_teacher INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(parent_id, teacher_id, child_id)
);

CREATE INDEX IF NOT EXISTS idx_pt_conversations_parent
  ON parent_teacher_conversations(parent_id, last_message_at DESC NULLS LAST);
CREATE INDEX IF NOT EXISTS idx_pt_conversations_teacher
  ON parent_teacher_conversations(teacher_id, last_message_at DESC NULLS LAST);

CREATE TABLE IF NOT EXISTS parent_teacher_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES parent_teacher_conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pt_messages_conv
  ON parent_teacher_messages(conversation_id, created_at);

-- ----------------------------------------
-- 4) Weekly email reports tracking
-- ----------------------------------------
CREATE TABLE IF NOT EXISTS parent_weekly_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  child_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  parent_child_id UUID REFERENCES parent_children(id) ON DELETE SET NULL,

  week_start DATE NOT NULL,
  week_end DATE NOT NULL,

  -- Snapshot of stats at the time of sending (jsonb for forward compat)
  recitations_count INTEGER DEFAULT 0,
  sessions_attended INTEGER DEFAULT 0,
  badges_earned INTEGER DEFAULT 0,
  current_level VARCHAR(255),
  summary JSONB,

  email_sent BOOLEAN DEFAULT FALSE,
  email_error TEXT,

  sent_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_parent_weekly_reports_parent_child
  ON parent_weekly_reports(parent_id, child_id, week_start);

-- Avoid duplicate weekly reports for the same week
CREATE UNIQUE INDEX IF NOT EXISTS uniq_parent_weekly_reports_week
  ON parent_weekly_reports(parent_id, child_id, week_start);

COMMIT;
