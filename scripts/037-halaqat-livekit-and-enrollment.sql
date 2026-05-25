-- ============================================
-- 037: Halaqat enhancements - LiveKit video calls,
-- student enrollment, attendance, live sessions
-- ============================================
-- Adds the missing student/attendance tables that the
-- existing /api/academy/admin/halaqat/[id]/students and
-- /api/academy/admin/halaqat/[id]/attendance endpoints
-- already reference, plus LiveKit-related metadata and a
-- new live-session log so we can track when a halaqa is
-- actively meeting.
-- ============================================

-- 1. Halaqat platform (academy vs maqra'a/reciter side)
ALTER TABLE halaqat
  ADD COLUMN IF NOT EXISTS platform VARCHAR(16) NOT NULL DEFAULT 'academy';

ALTER TABLE halaqat
  DROP CONSTRAINT IF EXISTS halaqat_platform_check;
ALTER TABLE halaqat
  ADD CONSTRAINT halaqat_platform_check
  CHECK (platform IN ('academy', 'maqraa'));

CREATE INDEX IF NOT EXISTS idx_halaqat_platform ON halaqat(platform);

-- 2. LiveKit room metadata (we generate a stable room name per halaqa)
ALTER TABLE halaqat
  ADD COLUMN IF NOT EXISTS livekit_room_name VARCHAR(128);
ALTER TABLE halaqat
  ADD COLUMN IF NOT EXISTS scheduled_at TIMESTAMPTZ;
ALTER TABLE halaqat
  ADD COLUMN IF NOT EXISTS duration_minutes INTEGER DEFAULT 60;

-- Backfill room names for existing halaqat
UPDATE halaqat
SET livekit_room_name = 'halaqa-' || REPLACE(id::text, '-', '')
WHERE livekit_room_name IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS uq_halaqat_livekit_room
  ON halaqat(livekit_room_name)
  WHERE livekit_room_name IS NOT NULL;

-- 3. halaqat_students: enrollment of students in halaqat
CREATE TABLE IF NOT EXISTS halaqat_students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  halaqah_id UUID NOT NULL REFERENCES halaqat(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  UNIQUE (halaqah_id, student_id)
);

CREATE INDEX IF NOT EXISTS idx_halaqat_students_halaqah ON halaqat_students(halaqah_id);
CREATE INDEX IF NOT EXISTS idx_halaqat_students_student ON halaqat_students(student_id);

-- 4. halaqat_attendance: per-session attendance records
CREATE TABLE IF NOT EXISTS halaqat_attendance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  halaqah_id UUID NOT NULL REFERENCES halaqat(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  session_date DATE NOT NULL,
  status VARCHAR(16) NOT NULL DEFAULT 'present',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (halaqah_id, student_id, session_date)
);

ALTER TABLE halaqat_attendance
  DROP CONSTRAINT IF EXISTS halaqat_attendance_status_check;
ALTER TABLE halaqat_attendance
  ADD CONSTRAINT halaqat_attendance_status_check
  CHECK (status IN ('present', 'absent', 'excused', 'late'));

CREATE INDEX IF NOT EXISTS idx_halaqat_attendance_halaqah
  ON halaqat_attendance(halaqah_id);
CREATE INDEX IF NOT EXISTS idx_halaqat_attendance_session_date
  ON halaqat_attendance(halaqah_id, session_date);

-- 5. halaqat_live_sessions: marker for an active LiveKit room
CREATE TABLE IF NOT EXISTS halaqat_live_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  halaqah_id UUID NOT NULL REFERENCES halaqat(id) ON DELETE CASCADE,
  started_by UUID REFERENCES users(id) ON DELETE SET NULL,
  livekit_room_name VARCHAR(128) NOT NULL,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ended_at TIMESTAMPTZ,
  participants_count INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_halaqat_live_sessions_halaqah
  ON halaqat_live_sessions(halaqah_id);
CREATE INDEX IF NOT EXISTS idx_halaqat_live_sessions_active
  ON halaqat_live_sessions(halaqah_id)
  WHERE ended_at IS NULL;
