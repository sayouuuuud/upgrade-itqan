-- ============================================
-- Phase: Session Meeting Links
-- Allows a teacher to send a Zoom / Google Meet link
-- to all students in a course session, or to specific
-- students only, and optionally publish it as an
-- announcement.
-- ============================================

-- 1. Add meeting_provider to course_sessions
ALTER TABLE course_sessions
  ADD COLUMN IF NOT EXISTS meeting_provider VARCHAR(20)
    CHECK (meeting_provider IS NULL OR meeting_provider IN ('zoom', 'google_meet', 'other'));

-- 2. Link announcements back to a course session (optional)
ALTER TABLE announcements
  ADD COLUMN IF NOT EXISTS course_session_id UUID
    REFERENCES course_sessions(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_announcements_course_session_id
  ON announcements(course_session_id);

-- 3. Per-student meeting link overrides
-- When a teacher wants to send a different link to a
-- specific student (e.g. a private 1:1 meeting), an
-- entry here takes priority over course_sessions.meeting_link.
CREATE TABLE IF NOT EXISTS session_meeting_invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES course_sessions(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  meeting_link TEXT NOT NULL,
  meeting_provider VARCHAR(20)
    CHECK (meeting_provider IS NULL OR meeting_provider IN ('zoom', 'google_meet', 'other')),
  meeting_password VARCHAR(100),
  sent_by UUID REFERENCES users(id) ON DELETE SET NULL,
  sent_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(session_id, student_id)
);

CREATE INDEX IF NOT EXISTS idx_session_meeting_invites_session_id
  ON session_meeting_invites(session_id);
CREATE INDEX IF NOT EXISTS idx_session_meeting_invites_student_id
  ON session_meeting_invites(student_id);
