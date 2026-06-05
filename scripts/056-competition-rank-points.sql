-- ============================================
-- Competition Rank Points
-- ============================================
-- Adds configurable points awarded per finishing position (1st/2nd/3rd)
-- to each competition. Previously the code awarded a flat 50×multiplier to
-- the winner only, and wrote into a non-existent `student_points` table.
--
-- Points are now granted through the real gamification engine (user_points +
-- points_log) using these per-rank values. Safe to run multiple times.

ALTER TABLE competitions
  ADD COLUMN IF NOT EXISTS points_first  INTEGER NOT NULL DEFAULT 500,
  ADD COLUMN IF NOT EXISTS points_second INTEGER NOT NULL DEFAULT 300,
  ADD COLUMN IF NOT EXISTS points_third  INTEGER NOT NULL DEFAULT 150;

-- Backfill any existing rows that somehow have NULLs (defensive).
UPDATE competitions
   SET points_first  = COALESCE(points_first, 500),
       points_second = COALESCE(points_second, 300),
       points_third  = COALESCE(points_third, 150);
