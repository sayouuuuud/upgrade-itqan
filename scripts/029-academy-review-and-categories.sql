-- =============================================================================
-- 029 — Academy content review workflow + unified categories
-- =============================================================================
-- Goals:
--   1. Public lessons (الحلقات) must require admin/supervisor review before
--      being published publicly. Teachers can no longer auto-publish.
--   2. Allow categories to be applied to *any* academy content (courses,
--      lessons, public_lessons, fiqh_questions, …) by adding a generic
--      `category_id` column where it didn't exist yet, plus extra
--      presentational fields on the categories table itself.
--
-- Idempotent — safe to re-run.
-- =============================================================================

BEGIN;

-- ---------------------------------------------------------------------------
-- 1) public_lessons — add a review status separate from the existing
--    scheduling status (scheduled / live / completed / cancelled).
-- ---------------------------------------------------------------------------
ALTER TABLE public_lessons
    ADD COLUMN IF NOT EXISTS review_status VARCHAR(20) DEFAULT 'pending_review';

DO $$
BEGIN
    -- Drop any older constraint, in case we re-run after editing the values.
    IF EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'public_lessons_review_status_check'
    ) THEN
        ALTER TABLE public_lessons DROP CONSTRAINT public_lessons_review_status_check;
    END IF;

    ALTER TABLE public_lessons
        ADD CONSTRAINT public_lessons_review_status_check
        CHECK (review_status IN ('pending_review','approved','rejected'));
END $$;

ALTER TABLE public_lessons
    ADD COLUMN IF NOT EXISTS review_notes TEXT,
    ADD COLUMN IF NOT EXISTS reviewed_by UUID REFERENCES users(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMPTZ;

-- Backfill: anything previously marked is_published = true is treated as
-- already approved by an admin (pre-existing content); everything else is
-- moved into the review queue.
UPDATE public_lessons
   SET review_status = 'approved'
 WHERE is_published = TRUE
   AND review_status = 'pending_review';

UPDATE public_lessons
   SET review_status = 'pending_review',
       is_published   = FALSE
 WHERE review_status IS NULL;


-- ---------------------------------------------------------------------------
-- 2) Extra presentational fields on categories.
-- ---------------------------------------------------------------------------
ALTER TABLE categories
    ADD COLUMN IF NOT EXISTS icon VARCHAR(50);

-- Categories already has parent_id / color / short_description from migration
-- 018, so we only add the icon here. We also widen `color` to allow
-- background+foreground pairs if someone wants to store them later.


-- ---------------------------------------------------------------------------
-- 3) Add category_id to public_lessons so the unified Categories admin page
--    can classify episodes too.
-- ---------------------------------------------------------------------------
ALTER TABLE public_lessons
    ADD COLUMN IF NOT EXISTS category_id UUID REFERENCES categories(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_public_lessons_category_id
    ON public_lessons(category_id);


-- ---------------------------------------------------------------------------
-- 4) fiqh_questions already has a `category_id` (FK to fiqh_categories) — we
--    leave it alone. Lessons inherit their category from the parent course,
--    so we also leave the lessons table alone.
-- ---------------------------------------------------------------------------


-- ---------------------------------------------------------------------------
-- 5) Helper view used by the admin Categories page to count usage per
--    category across the whole academy in a single query.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE VIEW category_usage_v AS
WITH
    course_counts AS (
        SELECT category_id, COUNT(*)::int AS courses_count
          FROM courses
         WHERE category_id IS NOT NULL
         GROUP BY category_id
    ),
    lesson_counts AS (
        SELECT c.category_id, COUNT(l.id)::int AS lessons_count
          FROM lessons l
          JOIN courses c ON c.id = l.course_id
         WHERE c.category_id IS NOT NULL
         GROUP BY c.category_id
    ),
    public_lesson_counts AS (
        SELECT category_id, COUNT(*)::int AS public_lessons_count
          FROM public_lessons
         WHERE category_id IS NOT NULL
         GROUP BY category_id
    )
SELECT
    cat.id,
    COALESCE(cc.courses_count, 0)          AS courses_count,
    COALESCE(lc.lessons_count, 0)          AS lessons_count,
    COALESCE(plc.public_lessons_count, 0)  AS public_lessons_count,
    COALESCE(cc.courses_count, 0)
        + COALESCE(lc.lessons_count, 0)
        + COALESCE(plc.public_lessons_count, 0) AS total_usage
FROM categories cat
LEFT JOIN course_counts        cc  ON cc.category_id  = cat.id
LEFT JOIN lesson_counts        lc  ON lc.category_id  = cat.id
LEFT JOIN public_lesson_counts plc ON plc.category_id = cat.id;

COMMIT;
