-- ============================================
-- Points System Enhancement
-- ============================================

-- Expand points_log reason constraint to include admin_adjust
ALTER TABLE points_log DROP CONSTRAINT IF EXISTS points_log_reason_check;
ALTER TABLE points_log ADD CONSTRAINT points_log_reason_check
  CHECK (reason IN (
    'recitation', 'mastered', 'task', 'lesson', 'streak',
    'juz_complete', 'course_complete', 'session_attend',
    'daily_login', 'competition_win', 'badge_earned', 'admin_adjust'
  ));

-- Update user_points level constraint to remove 'master' (not used)
-- and ensure consistency with the code
ALTER TABLE user_points DROP CONSTRAINT IF EXISTS user_points_level_check;
ALTER TABLE user_points ADD CONSTRAINT user_points_level_check
  CHECK (level IN ('beginner', 'intermediate', 'advanced', 'hafiz'));
