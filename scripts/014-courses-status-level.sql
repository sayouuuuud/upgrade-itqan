-- 014: Add `status` and `level` columns to `courses` table.
-- The application code references c.status = 'published' and c.level, but the
-- original schema (002) only has is_published (BOOLEAN) and difficulty_level
-- (UPPERCASE: BEGINNER/INTERMEDIATE/ADVANCED). This migration adds the missing
-- columns and backfills them so existing courses are visible in the browse
-- page and admin/teacher dashboards.

-- 1) Add `status` column (draft / pending_review / published / archived)
ALTER TABLE courses
  ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'draft';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'courses_status_check'
  ) THEN
    ALTER TABLE courses
      ADD CONSTRAINT courses_status_check
      CHECK (status IN ('draft', 'pending_review', 'published', 'archived', 'rejected'));
  END IF;
END $$;

-- 2) Add `level` column (lowercase: beginner / intermediate / advanced)
ALTER TABLE courses
  ADD COLUMN IF NOT EXISTS level VARCHAR(20) DEFAULT 'beginner';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'courses_level_check'
  ) THEN
    ALTER TABLE courses
      ADD CONSTRAINT courses_level_check
      CHECK (level IN ('beginner', 'intermediate', 'advanced'));
  END IF;
END $$;

-- 3) Backfill `status` from is_published flag for existing rows
UPDATE courses
SET status = CASE WHEN is_published = TRUE THEN 'published' ELSE 'draft' END
WHERE status IS NULL OR status = 'draft';

-- 4) Backfill `level` from difficulty_level (uppercase → lowercase)
UPDATE courses
SET level = CASE
  WHEN difficulty_level = 'BEGINNER' THEN 'beginner'
  WHEN difficulty_level = 'INTERMEDIATE' THEN 'intermediate'
  WHEN difficulty_level = 'ADVANCED' THEN 'advanced'
  ELSE COALESCE(level, 'beginner')
END
WHERE level IS NULL OR level = 'beginner';

-- 5) Indexes for the common filters used by browse and admin pages
CREATE INDEX IF NOT EXISTS idx_courses_status ON courses(status);
CREATE INDEX IF NOT EXISTS idx_courses_level ON courses(level);
