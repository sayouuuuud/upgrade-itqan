-- =============================================================================
-- 030 — Course review workflow (rejection reason + reviewer trace)
-- =============================================================================
-- Goal:
--   The admin must be able to approve or reject teacher-submitted courses.
--   When rejected, the admin writes a reason. The teacher sees the reason on
--   their course list/detail and can resubmit the course (which clears the
--   reason and bumps the status back to `pending_review`).
--
--   This migration adds the missing tracking columns on `courses`:
--     * rejection_reason         — reason text shown to the teacher
--     * reviewed_by              — admin/supervisor who last took action
--     * reviewed_at              — when the last review action happened
--     * submitted_for_review_at  — when the teacher last submitted/resubmitted
--
-- Idempotent — safe to re-run.
-- =============================================================================

BEGIN;

ALTER TABLE courses
    ADD COLUMN IF NOT EXISTS rejection_reason TEXT,
    ADD COLUMN IF NOT EXISTS reviewed_by UUID REFERENCES users(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS submitted_for_review_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_courses_reviewed_at ON courses(reviewed_at);

COMMIT;
