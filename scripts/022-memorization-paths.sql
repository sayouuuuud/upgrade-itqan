-- =====================================================================
-- 022-memorization-paths.sql
-- Quran memorization paths (المقرأة): admin creates path → student enrolls
-- → student completes units sequentially (next unit locked until prev done)
-- =====================================================================
-- IMPORTANT: this file is NOT executed automatically. Run manually:
--   psql "$DATABASE_URL" -f scripts/022-memorization-paths.sql
-- =====================================================================

DO $$
BEGIN
  IF to_regclass('public.users') IS NULL THEN
    RAISE EXCEPTION 'scripts/022-memorization-paths.sql requires public.users. Verify DATABASE_URL/POSTGRES_URL points to the Itqan application database and run the base schema before this script.'
      USING ERRCODE = '42P01';
  END IF;

  IF to_regclass('public.recitations') IS NULL THEN
    RAISE EXCEPTION 'scripts/022-memorization-paths.sql requires public.recitations. Run the recitations/base schema before this script.'
      USING ERRCODE = '42P01';
  END IF;
END;
$$;

-- ---------------------------------------------------------------------
-- 1. memorization_paths
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS memorization_paths (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  unit_type VARCHAR(20) NOT NULL CHECK (unit_type IN ('juz', 'surah', 'hizb', 'page', 'custom')),
  -- range bounds (interpretation depends on unit_type):
  --   juz:   range_from..range_to in 1..30
  --   surah: range_from..range_to in 1..114
  --   hizb:  range_from..range_to in 1..60
  --   page:  range_from..range_to in 1..604
  --   custom: ignored (units inserted manually)
  range_from INTEGER,
  range_to INTEGER,
  -- direction: 'asc' = جزء عم → الفاتحة، 'desc' = الفاتحة → الناس
  direction VARCHAR(10) DEFAULT 'desc' CHECK (direction IN ('asc', 'desc')),
  level VARCHAR(20) DEFAULT 'beginner' CHECK (level IN ('beginner', 'intermediate', 'advanced')),
  thumbnail_url TEXT,
  total_units INTEGER NOT NULL DEFAULT 0,
  estimated_days INTEGER,
  require_audio BOOLEAN NOT NULL DEFAULT FALSE,   -- if TRUE, completing a unit requires recording_id
  is_published BOOLEAN NOT NULL DEFAULT FALSE,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,         -- soft-delete: archive
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_memorization_paths_published ON memorization_paths(is_published, is_active) WHERE is_published = TRUE AND is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_memorization_paths_created_by ON memorization_paths(created_by);

-- ---------------------------------------------------------------------
-- 2. memorization_path_units
--    auto-generated when path is created (or manually for custom paths)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS memorization_path_units (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  path_id UUID NOT NULL REFERENCES memorization_paths(id) ON DELETE CASCADE,
  position INTEGER NOT NULL,            -- 1, 2, 3, ... order in path
  unit_type VARCHAR(20) NOT NULL CHECK (unit_type IN ('juz', 'surah', 'hizb', 'page', 'range')),
  -- numeric pointers (depends on unit_type)
  juz_number INTEGER,                   -- 1..30
  surah_number INTEGER,                 -- 1..114
  hizb_number INTEGER,                  -- 1..60
  page_from INTEGER,                    -- for page/range
  page_to INTEGER,
  ayah_from INTEGER,                    -- for range with ayahs
  ayah_to INTEGER,
  surah_name VARCHAR(100),
  total_ayahs INTEGER,                  -- count of ayahs in this unit
  title VARCHAR(255),
  description TEXT,
  estimated_minutes INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(path_id, position)
);

CREATE INDEX IF NOT EXISTS idx_memorization_path_units_path ON memorization_path_units(path_id, position);

-- ---------------------------------------------------------------------
-- 3. memorization_path_enrollments
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS memorization_path_enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  path_id UUID NOT NULL REFERENCES memorization_paths(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'completed', 'dropped')),
  current_unit_id UUID REFERENCES memorization_path_units(id) ON DELETE SET NULL,
  units_completed INTEGER NOT NULL DEFAULT 0,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_activity_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  UNIQUE(path_id, student_id)
);

CREATE INDEX IF NOT EXISTS idx_memorization_path_enrollments_student ON memorization_path_enrollments(student_id, status);
CREATE INDEX IF NOT EXISTS idx_memorization_path_enrollments_path ON memorization_path_enrollments(path_id, status);

-- ---------------------------------------------------------------------
-- 4. memorization_path_progress (per-unit progress for each enrollment)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS memorization_path_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  enrollment_id UUID NOT NULL REFERENCES memorization_path_enrollments(id) ON DELETE CASCADE,
  unit_id UUID NOT NULL REFERENCES memorization_path_units(id) ON DELETE CASCADE,
  status VARCHAR(20) NOT NULL DEFAULT 'locked' CHECK (status IN ('locked', 'unlocked', 'in_progress', 'completed')),
  recitation_id UUID REFERENCES recitations(id) ON DELETE SET NULL,
  audio_url TEXT,                                -- shortcut so we don't need to join recitations every time
  audio_duration_seconds INTEGER,
  notes TEXT,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  UNIQUE(enrollment_id, unit_id)
);

CREATE INDEX IF NOT EXISTS idx_memorization_path_progress_enrollment ON memorization_path_progress(enrollment_id, status);
CREATE INDEX IF NOT EXISTS idx_memorization_path_progress_unit ON memorization_path_progress(unit_id);

-- ---------------------------------------------------------------------
-- 5. updated_at trigger for paths
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION memorization_paths_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_memorization_paths_updated_at ON memorization_paths;
CREATE TRIGGER trg_memorization_paths_updated_at
  BEFORE UPDATE ON memorization_paths
  FOR EACH ROW EXECUTE FUNCTION memorization_paths_set_updated_at();

-- ---------------------------------------------------------------------
-- DONE.
-- ---------------------------------------------------------------------
