-- =================================================================
-- Phase 2 / 5 / 6 — Schema gaps
-- Adds the columns and tables that the new code depends on.
-- All statements are idempotent (safe to re-run).
-- =================================================================

-- ---------- 1) academy_teachers: verification & trust fields -----
ALTER TABLE academy_teachers
  ADD COLUMN IF NOT EXISTS verified_by         UUID REFERENCES users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS verified_at         TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS verification_notes  TEXT,
  ADD COLUMN IF NOT EXISTS trust_score         INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS documents_url       TEXT[] DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN IF NOT EXISTS experience_summary  TEXT;

CREATE INDEX IF NOT EXISTS idx_academy_teachers_is_verified
  ON academy_teachers (is_verified);

-- ---------- 2) teacher_verifications: full audit log -------------
CREATE TABLE IF NOT EXISTS teacher_verifications (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id    UUID NOT NULL REFERENCES academy_teachers(id) ON DELETE CASCADE,
  supervisor_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  action        TEXT NOT NULL CHECK (action IN ('verified', 'rejected', 'revoked', 'reviewed')),
  notes         TEXT,
  trust_score   INTEGER,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_teacher_verifications_teacher
  ON teacher_verifications (teacher_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_teacher_verifications_supervisor
  ON teacher_verifications (supervisor_id, created_at DESC);

-- ---------- 3) supervisor_assignments ----------------------------
-- Links supervisors to the scope they oversee (track / level / etc.)
CREATE TABLE IF NOT EXISTS supervisor_assignments (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  supervisor_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  scope_type    TEXT NOT NULL CHECK (scope_type IN ('global', 'track', 'level', 'specialization')),
  scope_value   TEXT,
  is_active     BOOLEAN NOT NULL DEFAULT TRUE,
  assigned_by   UUID REFERENCES users(id) ON DELETE SET NULL,
  assigned_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (supervisor_id, scope_type, scope_value)
);

CREATE INDEX IF NOT EXISTS idx_supervisor_assignments_supervisor
  ON supervisor_assignments (supervisor_id) WHERE is_active = TRUE;

-- ---------- 4) live_sessions.course_id ---------------------------
-- Allows attend route to award gamification points by course.
ALTER TABLE live_sessions
  ADD COLUMN IF NOT EXISTS course_id UUID REFERENCES courses(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_live_sessions_course
  ON live_sessions (course_id) WHERE course_id IS NOT NULL;

-- ---------- 5) Done ----------------------------------------------
SELECT
  (SELECT COUNT(*) FROM information_schema.columns
    WHERE table_name = 'academy_teachers'
      AND column_name IN ('verified_by','verified_at','verification_notes','trust_score','documents_url','experience_summary')) AS academy_teachers_added,
  (SELECT to_regclass('public.teacher_verifications')   IS NOT NULL) AS teacher_verifications_ok,
  (SELECT to_regclass('public.supervisor_assignments')  IS NOT NULL) AS supervisor_assignments_ok,
  (SELECT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'live_sessions' AND column_name = 'course_id')) AS live_sessions_course_id_ok;
