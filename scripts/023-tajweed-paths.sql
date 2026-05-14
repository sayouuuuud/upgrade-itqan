-- =====================================================================
-- 023-tajweed-paths.sql
-- Tajweed mastery paths (المقرأة): admin/reader creates a path of staged
-- lessons → student enrolls → stages unlock sequentially as student
-- completes each one.
-- =====================================================================
-- IMPORTANT: this file is NOT executed automatically. Run manually:
--   psql "$DATABASE_URL" -f scripts/023-tajweed-paths.sql
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. tajweed_paths
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS tajweed_paths (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  level VARCHAR(20) DEFAULT 'beginner' CHECK (level IN ('beginner', 'intermediate', 'advanced')),
  thumbnail_url TEXT,
  total_stages INTEGER NOT NULL DEFAULT 0,
  estimated_days INTEGER,
  require_audio BOOLEAN NOT NULL DEFAULT FALSE,
  is_published BOOLEAN NOT NULL DEFAULT FALSE,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tajweed_paths_published ON tajweed_paths(is_published, is_active) WHERE is_published = TRUE AND is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_tajweed_paths_created_by ON tajweed_paths(created_by);

-- ---------------------------------------------------------------------
-- 2. tajweed_path_stages
--    Manually authored — each stage is a tajweed lesson/topic
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS tajweed_path_stages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  path_id UUID NOT NULL REFERENCES tajweed_paths(id) ON DELETE CASCADE,
  position INTEGER NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  content TEXT,                                 -- rich/markdown body
  video_url TEXT,                               -- optional youtube/vimeo/cloudinary
  pdf_url TEXT,                                 -- optional notes PDF
  passage_text TEXT,                            -- reference verses to recite for this stage
  estimated_minutes INTEGER DEFAULT 30,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(path_id, position)
);

CREATE INDEX IF NOT EXISTS idx_tajweed_path_stages_path ON tajweed_path_stages(path_id, position);

-- ---------------------------------------------------------------------
-- 3. tajweed_path_enrollments
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS tajweed_path_enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  path_id UUID NOT NULL REFERENCES tajweed_paths(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'completed', 'dropped')),
  current_stage_id UUID REFERENCES tajweed_path_stages(id) ON DELETE SET NULL,
  stages_completed INTEGER NOT NULL DEFAULT 0,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_activity_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  UNIQUE(path_id, student_id)
);

CREATE INDEX IF NOT EXISTS idx_tajweed_path_enrollments_student ON tajweed_path_enrollments(student_id, status);
CREATE INDEX IF NOT EXISTS idx_tajweed_path_enrollments_path ON tajweed_path_enrollments(path_id, status);

-- ---------------------------------------------------------------------
-- 4. tajweed_path_progress (per-stage)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS tajweed_path_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  enrollment_id UUID NOT NULL REFERENCES tajweed_path_enrollments(id) ON DELETE CASCADE,
  stage_id UUID NOT NULL REFERENCES tajweed_path_stages(id) ON DELETE CASCADE,
  status VARCHAR(20) NOT NULL DEFAULT 'locked' CHECK (status IN ('locked', 'unlocked', 'in_progress', 'completed')),
  recitation_id UUID REFERENCES recitations(id) ON DELETE SET NULL,
  audio_url TEXT,
  audio_duration_seconds INTEGER,
  reviewer_feedback TEXT,                       -- optional reciter notes after review
  notes TEXT,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  UNIQUE(enrollment_id, stage_id)
);

CREATE INDEX IF NOT EXISTS idx_tajweed_path_progress_enrollment ON tajweed_path_progress(enrollment_id, status);
CREATE INDEX IF NOT EXISTS idx_tajweed_path_progress_stage ON tajweed_path_progress(stage_id);

-- ---------------------------------------------------------------------
-- 5. updated_at trigger
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION tajweed_paths_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_tajweed_paths_updated_at ON tajweed_paths;
CREATE TRIGGER trg_tajweed_paths_updated_at
  BEFORE UPDATE ON tajweed_paths
  FOR EACH ROW EXECUTE FUNCTION tajweed_paths_set_updated_at();

-- ---------------------------------------------------------------------
-- DONE.
-- ---------------------------------------------------------------------
