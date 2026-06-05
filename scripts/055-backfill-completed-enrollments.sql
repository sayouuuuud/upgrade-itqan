-- 055-backfill-completed-enrollments.sql
-- Fix: completed courses were never marked as `status = 'completed'` on the
-- enrollments table (only progress_percentage / completed_at were updated),
-- so the student "Archive" page (which filters on status) always showed empty.
--
-- This backfills the status for any enrollment that is effectively complete.
-- Safe + idempotent: only touches rows that aren't already 'completed'.

UPDATE enrollments
SET status = 'completed',
    completed_at = COALESCE(completed_at, NOW()),
    updated_at = NOW()
WHERE LOWER(status) <> 'completed'
  AND (
    completed_at IS NOT NULL
    OR COALESCE(progress_percentage, 0) >= 100
  );

-- Report how many rows now count as completed (optional, for sanity check).
-- SELECT COUNT(*) AS completed_enrollments FROM enrollments WHERE LOWER(status) = 'completed';
