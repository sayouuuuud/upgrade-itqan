-- =============================================================================
-- 019 — Courses Archive (تعطيل / أرشفة الدورات)
-- =============================================================================
-- Goal:
--   1. Allow teachers/admins to deactivate a course → it disappears from new
--      student browsing, but already-enrolled students keep going normally.
--   2. Power a fast, case-insensitive search over course title/description on
--      the new archive pages (student / admin / content-supervisor).
--
-- IMPORTANT: This file is intentionally NOT auto-executed. Review then run:
--     psql "$DATABASE_URL" -f scripts/019-courses-archive.sql
-- =============================================================================

BEGIN;

-- ---------------------------------------------------------------------------
-- 1) Add `is_active` flag on courses.
--    TRUE  = visible in browse + can enroll
--    FALSE = hidden from new enrollments, kept in archive
-- ---------------------------------------------------------------------------
ALTER TABLE courses
    ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT TRUE;

ALTER TABLE courses
    ADD COLUMN IF NOT EXISTS archived_at TIMESTAMP WITHOUT TIME ZONE;

ALTER TABLE courses
    ADD COLUMN IF NOT EXISTS archived_by UUID REFERENCES users(id) ON DELETE SET NULL;

-- Helpful filtering index — most archive queries use is_active first.
CREATE INDEX IF NOT EXISTS idx_courses_is_active ON courses(is_active);


-- ---------------------------------------------------------------------------
-- 2) Trigram indexes for fast ILIKE-based search on title/description.
--    pg_trgm makes "WHERE title ILIKE '%keyword%'" use an index instead of
--    a sequential scan.
-- ---------------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE INDEX IF NOT EXISTS idx_courses_title_trgm
    ON courses USING gin (title gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_courses_description_trgm
    ON courses USING gin (description gin_trgm_ops);

-- We also index lessons so future cross-search (over lesson titles/descriptions)
-- stays fast — even though current archive search is courses-only.
CREATE INDEX IF NOT EXISTS idx_lessons_title_trgm
    ON lessons USING gin (title gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_lessons_description_trgm
    ON lessons USING gin (description gin_trgm_ops);


-- ---------------------------------------------------------------------------
-- 3) Verification queries (run manually after migration).
-- ---------------------------------------------------------------------------
-- SELECT column_name, data_type
-- FROM information_schema.columns
-- WHERE table_name = 'courses' AND column_name IN ('is_active','archived_at','archived_by');
--
-- SELECT indexname FROM pg_indexes
-- WHERE tablename IN ('courses','lessons') AND indexname LIKE 'idx_%trgm';

COMMIT;
