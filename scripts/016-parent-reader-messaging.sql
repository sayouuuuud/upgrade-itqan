-- ============================================
-- Parent <-> Reader (مقرئ) messaging
-- Mirrors parent_teacher_conversations/messages but for readers.
-- ============================================

BEGIN;

CREATE TABLE IF NOT EXISTS parent_reader_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reader_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  child_id  UUID REFERENCES users(id) ON DELETE SET NULL,
  subject VARCHAR(255),
  last_message TEXT,
  last_message_at TIMESTAMPTZ,
  unread_count_parent INTEGER DEFAULT 0,
  unread_count_reader INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (parent_id, reader_id, child_id)
);

CREATE INDEX IF NOT EXISTS idx_pr_conversations_parent
  ON parent_reader_conversations(parent_id, last_message_at DESC NULLS LAST);
CREATE INDEX IF NOT EXISTS idx_pr_conversations_reader
  ON parent_reader_conversations(reader_id, last_message_at DESC NULLS LAST);

CREATE TABLE IF NOT EXISTS parent_reader_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES parent_reader_conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pr_messages_conv
  ON parent_reader_messages(conversation_id, created_at);

COMMIT;
