-- ============================================================================
-- 051 - FIX announcements schema (root cause of #2: admin announcements 500)
-- ----------------------------------------------------------------------------
-- The `announcements` table was created with:
--   * title_en / content_en  -> NOT NULL
--   * target_audience CHECK   -> only ('all','students','readers','admins')
--
-- But the admin UI + API only send the Arabic fields and use audiences like
-- 'teachers' / 'parents'. So every "create announcement" insert violated either
-- the NOT NULL constraint or the CHECK constraint and returned HTTP 500.
--
-- This migration makes the English fields optional and widens the audience
-- whitelist so the page works. Idempotent / safe to re-run.
--
-- RUN (against the deployed DB, NOT the sandbox):
--   psql "$POSTGRES_URL" -f scripts/051-fix-announcements-schema.sql
-- ============================================================================

-- 1) English columns optional (Arabic-first content)
ALTER TABLE announcements ALTER COLUMN title_en   DROP NOT NULL;
ALTER TABLE announcements ALTER COLUMN content_en DROP NOT NULL;

-- 2) Widen the target_audience whitelist to match the UI options
ALTER TABLE announcements DROP CONSTRAINT IF EXISTS announcements_target_audience_check;
ALTER TABLE announcements ADD CONSTRAINT announcements_target_audience_check
  CHECK (target_audience IN ('all', 'students', 'teachers', 'parents', 'readers', 'admins'));
