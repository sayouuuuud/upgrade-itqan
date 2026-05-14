-- ============================================
-- Migration 028: Gamification points, levels, streak, and badges
-- ============================================
-- Aligns points/badge rewards with product rules:
-- recitation +10, mastered +30, task +15, session +20,
-- streak day +5, juz complete +100.
-- Levels: beginner 0, intermediate 500, advanced 2000, hafiz 5000.

BEGIN;

ALTER TABLE user_points DROP CONSTRAINT IF EXISTS user_points_level_check;
ALTER TABLE user_points
  ADD CONSTRAINT user_points_level_check
  CHECK (level IN ('beginner', 'intermediate', 'advanced', 'hafiz', 'master'));

UPDATE user_points
SET level = CASE
  WHEN total_points >= 5000 THEN 'hafiz'
  WHEN total_points >= 2000 THEN 'advanced'
  WHEN total_points >= 500 THEN 'intermediate'
  ELSE 'beginner'
END;

ALTER TABLE tasks ADD COLUMN IF NOT EXISTS max_score INTEGER DEFAULT 100;

CREATE TABLE IF NOT EXISTS task_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content TEXT,
  file_url TEXT,
  file_name VARCHAR(255),
  file_type VARCHAR(80),
  file_size BIGINT,
  audio_url TEXT,
  video_url TEXT,
  submission_type VARCHAR(20) DEFAULT 'text'
    CHECK (submission_type IN ('text','file','audio','video','image','mixed')),
  status VARCHAR(20) DEFAULT 'submitted'
    CHECK (status IN ('draft','submitted','late','returned','graded')),
  score INTEGER,
  feedback TEXT,
  attempts INTEGER DEFAULT 1,
  submitted_at TIMESTAMPTZ DEFAULT NOW(),
  graded_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_task_submissions_task_id ON task_submissions(task_id);
CREATE INDEX IF NOT EXISTS idx_task_submissions_student_id ON task_submissions(student_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_task_submissions_task_student
  ON task_submissions(task_id, student_id);

CREATE TABLE IF NOT EXISTS badge_definitions (
  badge_type   VARCHAR(50) PRIMARY KEY,
  name         VARCHAR(100) NOT NULL,
  description  TEXT NOT NULL,
  category     VARCHAR(40) NOT NULL,
  icon         TEXT,
  criteria_type  VARCHAR(30)  NOT NULL CHECK (criteria_type IN ('points','streak','courses','tasks','memorization','recitation','custom')),
  criteria_value INTEGER,
  points_reward  INTEGER DEFAULT 0,
  display_order  INTEGER DEFAULT 0,
  is_active      BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE badge_definitions ALTER COLUMN icon TYPE TEXT;

INSERT INTO badge_definitions (badge_type, name, description, category, icon, criteria_type, criteria_value, points_reward, display_order)
VALUES
  ('first_recitation',   'أول تلاوة',        'يسجل تلاوته الأولى على المنصة',                    'التلاوة',     '🎙️', 'recitation',   1,   20,   1),
  ('week_streak',        'أسبوع كامل',       '7 أيام Streak متواصلة',                            'الاستمرارية', '🔥', 'streak',       7,   70,   2),
  ('hafiz_juz_amma',     'حافظ جزء عم',      'يتقن جميع سور الجزء الثلاثين',                      'الحفظ',       '📖', 'memorization', 1,   200,  3),
  ('hundred_recitations','مئة تلاوة',        'يسجل 100 تلاوة على المنصة',                         'التلاوة',     '💯', 'recitation',   100, 150,  4),
  ('tajweed_master',     'متقن التجويد',      'يجتاز مسار التجويد الكامل',                         'التجويد',     '⭐', 'recitation',   10,  300,  5),
  ('ramadan_badge',      'شهر رمضان',        'يسجل تلاوة كل يوم خلال الشهر',                       'الاستمرارية', '🌙', 'streak',       30,  250,  6),
  ('full_quran',         'الختمة الكاملة',    'يتقن القرآن كاملاً ويحصل على إجازة',                 'الحفظ',       '👑', 'memorization', 30,  1000, 7),
  ('star_of_halaqah',    'نجم الحلقة',        'الأعلى نقاطاً في حلقته لمدة شهر',                    'تكريم',       '🏆', 'custom',       NULL, 180,  8)
ON CONFLICT (badge_type) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  category = EXCLUDED.category,
  icon = EXCLUDED.icon,
  criteria_type = EXCLUDED.criteria_type,
  criteria_value = EXCLUDED.criteria_value,
  points_reward = EXCLUDED.points_reward,
  display_order = EXCLUDED.display_order,
  is_active = TRUE;

COMMIT;

DO $$
BEGIN
  RAISE NOTICE 'Migration 028: gamification points, levels, and badges aligned';
END $$;
