نا مثلا لو عن-- ============================================
-- 052 - Add missing `scope` column to competitions
-- ============================================
-- The application code (lib/academy/competitions.ts and all competition API
-- routes) filters and inserts competitions by a `scope` column with values
-- 'academy' (Academy platform) and 'library' (Maqraah / Quran library platform).
-- This column was never created in any prior migration, which caused EVERY
-- competition query to fail (500), breaking listing, submissions and judging.
--
-- This migration adds the column, backfills existing rows with a best-effort
-- heuristic, then enforces a default + CHECK constraint and adds an index.
-- ============================================

-- 1) Add the column (nullable first so we can backfill safely)
ALTER TABLE competitions
  ADD COLUMN IF NOT EXISTS scope VARCHAR(20);

-- 2) Backfill existing rows.
--    Academy competitions: created by an academy_admin OR tied to a halqa.
UPDATE competitions c
SET scope = 'academy'
WHERE scope IS NULL
  AND (
    c.halqa_id IS NOT NULL
    OR EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = c.created_by
        AND u.role = 'academy_admin'
    )
  );

--    Everything else defaults to the Maqraah / library platform.
UPDATE competitions
SET scope = 'library'
WHERE scope IS NULL;

-- 3) Enforce a sensible default + NOT NULL going forward.
ALTER TABLE competitions
  ALTER COLUMN scope SET DEFAULT 'library';

ALTER TABLE competitions
  ALTER COLUMN scope SET NOT NULL;

-- 4) Constrain the allowed values.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'competitions_scope_check'
  ) THEN
    ALTER TABLE competitions
      ADD CONSTRAINT competitions_scope_check
      CHECK (scope IN ('academy', 'library'));
  END IF;
END $$;

-- 5) Index for the very common `WHERE scope = $1` filter.
CREATE INDEX IF NOT EXISTS idx_competitions_scope ON competitions(scope);

-- ============================================
-- 6) Safety net: ensure users.created_by exists
-- ============================================
-- The teacher "my students" queries (list + profile) treat a student as
-- belonging to a teacher when `users.created_by = <teacher id>` (a student the
-- teacher added directly) OR the student is enrolled in one of the teacher's
-- courses. The `created_by` column is referenced by these queries but is not
-- created by any tracked migration; add it defensively so the queries never
-- 500 (which previously surfaced as a misleading "student not found" page).
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_users_created_by ON users(created_by);
