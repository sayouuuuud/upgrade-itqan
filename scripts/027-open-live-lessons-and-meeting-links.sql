-- ============================================
-- Migration 027: Meeting links, open public lessons, and lesson series
-- ============================================

CREATE TABLE IF NOT EXISTS lesson_series (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  public_slug VARCHAR(255) UNIQUE DEFAULT replace(gen_random_uuid()::text, '-', ''),
  is_public BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_lesson_series_teacher_id ON lesson_series(teacher_id);
CREATE INDEX IF NOT EXISTS idx_lesson_series_public_slug ON lesson_series(public_slug);

ALTER TABLE course_sessions ADD COLUMN IF NOT EXISTS meeting_platform VARCHAR(30) DEFAULT 'custom';
ALTER TABLE course_sessions ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT FALSE;
ALTER TABLE course_sessions ADD COLUMN IF NOT EXISTS public_join_token VARCHAR(80) UNIQUE;
ALTER TABLE course_sessions ADD COLUMN IF NOT EXISTS series_id UUID REFERENCES lesson_series(id) ON DELETE SET NULL;
ALTER TABLE course_sessions ADD COLUMN IF NOT EXISTS announcement_id UUID REFERENCES announcements(id) ON DELETE SET NULL;
ALTER TABLE course_sessions ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE course_sessions ADD COLUMN IF NOT EXISTS attachments JSONB DEFAULT '[]'::jsonb;
ALTER TABLE course_sessions ADD COLUMN IF NOT EXISTS ended_at TIMESTAMPTZ;

UPDATE course_sessions
SET public_join_token = replace(gen_random_uuid()::text, '-', '')
WHERE is_public = TRUE AND public_join_token IS NULL;

ALTER TABLE public_lesson_subscribers ADD COLUMN IF NOT EXISTS lesson_id UUID;
ALTER TABLE public_lesson_subscribers ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE public_lesson_subscribers ADD COLUMN IF NOT EXISTS session_id UUID REFERENCES course_sessions(id) ON DELETE CASCADE;
ALTER TABLE public_lesson_subscribers ADD COLUMN IF NOT EXISTS reminder_enabled BOOLEAN DEFAULT TRUE;
ALTER TABLE public_lesson_subscribers ADD COLUMN IF NOT EXISTS last_reminder_sent_at TIMESTAMPTZ;
ALTER TABLE public_lesson_subscribers ADD COLUMN IF NOT EXISTS source VARCHAR(30) DEFAULT 'public_lesson';

CREATE INDEX IF NOT EXISTS idx_public_lesson_subscribers_teacher_email
  ON public_lesson_subscribers(teacher_id, email)
  WHERE unsubscribed_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_public_lesson_subscribers_session_id
  ON public_lesson_subscribers(session_id);
CREATE INDEX IF NOT EXISTS idx_course_sessions_public_token
  ON course_sessions(public_join_token)
  WHERE is_public = TRUE;
CREATE INDEX IF NOT EXISTS idx_course_sessions_series_id
  ON course_sessions(series_id);

DO $$
BEGIN
  RAISE NOTICE 'Migration 027: meeting links, public sessions, subscribers, and lesson series ready';
END $$;
