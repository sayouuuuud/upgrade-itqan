-- ============================================================
-- Itqan Gamification DB Update
-- ملف واحد لتشغيل تعديلات النقاط/المستويات/Streak/الشارات/المهام
-- Safe to re-run (idempotent)
-- ============================================================

BEGIN;

-- ------------------------------------------------------------
-- 1) Levels: مبتدئ 0، متوسط 500، متقدم 2000، حافظ 5000+
-- ------------------------------------------------------------

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

-- ------------------------------------------------------------
-- 2) Tasks DB support used by task submissions/grading APIs
-- ------------------------------------------------------------

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

CREATE INDEX IF NOT EXISTS idx_task_submissions_task_id
  ON task_submissions(task_id);

CREATE INDEX IF NOT EXISTS idx_task_submissions_student_id
  ON task_submissions(student_id);

CREATE UNIQUE INDEX IF NOT EXISTS idx_task_submissions_task_student
  ON task_submissions(task_id, student_id);

-- ------------------------------------------------------------
-- 3) Badge catalogue + admin customization support
-- ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS badge_definitions (
  badge_type   VARCHAR(50) PRIMARY KEY,
  name         VARCHAR(100) NOT NULL,
  description  TEXT NOT NULL,
  category     VARCHAR(40) NOT NULL,
  icon         TEXT,
  criteria_type  VARCHAR(30) NOT NULL
    CHECK (criteria_type IN ('points','streak','courses','tasks','memorization','recitation','custom')),
  criteria_value INTEGER,
  points_reward  INTEGER DEFAULT 0,
  display_order  INTEGER DEFAULT 0,
  is_active      BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE badge_definitions ADD COLUMN IF NOT EXISTS badge_type VARCHAR(50);
ALTER TABLE badge_definitions ADD COLUMN IF NOT EXISTS name VARCHAR(100);
ALTER TABLE badge_definitions ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE badge_definitions ADD COLUMN IF NOT EXISTS category VARCHAR(40);
ALTER TABLE badge_definitions ADD COLUMN IF NOT EXISTS icon TEXT;
ALTER TABLE badge_definitions ADD COLUMN IF NOT EXISTS criteria_type VARCHAR(30);
ALTER TABLE badge_definitions ADD COLUMN IF NOT EXISTS criteria_value INTEGER;
ALTER TABLE badge_definitions ADD COLUMN IF NOT EXISTS points_reward INTEGER DEFAULT 0;
ALTER TABLE badge_definitions ADD COLUMN IF NOT EXISTS display_order INTEGER DEFAULT 0;
ALTER TABLE badge_definitions ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;
ALTER TABLE badge_definitions ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE badge_definitions ADD COLUMN IF NOT EXISTS badge_key VARCHAR(100);
ALTER TABLE badge_definitions ADD COLUMN IF NOT EXISTS badge_name VARCHAR(100);
ALTER TABLE badge_definitions ADD COLUMN IF NOT EXISTS badge_description TEXT;
ALTER TABLE badge_definitions ADD COLUMN IF NOT EXISTS badge_icon TEXT;
ALTER TABLE badge_definitions ADD COLUMN IF NOT EXISTS icon_color VARCHAR(20) DEFAULT '#F59E0B';
ALTER TABLE badge_definitions ADD COLUMN IF NOT EXISTS points_required INTEGER DEFAULT 0;
ALTER TABLE badge_definitions ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

ALTER TABLE badge_definitions ALTER COLUMN icon TYPE TEXT;
ALTER TABLE badge_definitions DROP CONSTRAINT IF EXISTS badge_definitions_criteria_type_check;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'badge_definitions'
      AND column_name = 'badge_name'
  ) THEN
    EXECUTE $sql$
      UPDATE badge_definitions
      SET name = COALESCE(name, badge_name::text)
    $sql$;
  END IF;
END $$;

UPDATE badge_definitions
SET badge_type = COALESCE(badge_type, 'legacy_badge_' || replace(gen_random_uuid()::text, '-', ''));

UPDATE badge_definitions
SET badge_key = COALESCE(badge_key, badge_type);

UPDATE badge_definitions
SET
  badge_name = COALESCE(badge_name, name, badge_type),
  badge_description = COALESCE(badge_description, description, name, badge_type),
  badge_icon = COALESCE(badge_icon, icon, '🏆'),
  icon_color = COALESCE(icon_color, '#F59E0B'),
  points_required = COALESCE(points_required, criteria_value, 0),
  updated_at = COALESCE(updated_at, NOW());

CREATE UNIQUE INDEX IF NOT EXISTS idx_badge_definitions_badge_type_unique
  ON badge_definitions(badge_type);

ALTER TABLE badge_definitions ALTER COLUMN badge_type SET NOT NULL;
ALTER TABLE badge_definitions ALTER COLUMN badge_key SET NOT NULL;

WITH required_badges(badge_key, badge_type, name, description, category, icon, criteria_type, criteria_value, points_reward, display_order) AS (
  VALUES
    ('first_recitation',    'first_recitation',    'أول تلاوة',      'يسجل تلاوته الأولى على المنصة',          'التلاوة',     '🎙️', 'recitation',   1,   20,   1),
    ('week_streak',         'week_streak',         'أسبوع كامل',     '7 أيام Streak متواصلة',                  'الاستمرارية', '🔥', 'streak',       7,   70,   2),
    ('hafiz_juz_amma',      'hafiz_juz_amma',      'حافظ جزء عم',    'يتقن جميع سور الجزء الثلاثين',            'الحفظ',       '📖', 'memorization', 1,   200,  3),
    ('hundred_recitations', 'hundred_recitations', 'مئة تلاوة',      'يسجل 100 تلاوة على المنصة',               'التلاوة',     '💯', 'recitation',   100, 150,  4),
    ('tajweed_master',      'tajweed_master',      'متقن التجويد',    'يجتاز مسار التجويد الكامل',               'التجويد',     '⭐', 'recitation',   10,  300,  5),
    ('ramadan_badge',       'ramadan_badge',       'شهر رمضان',      'يسجل تلاوة كل يوم خلال الشهر',             'الاستمرارية', '🌙', 'streak',       30,  250,  6),
    ('full_quran',          'full_quran',          'الختمة الكاملة',  'يتقن القرآن كاملاً ويحصل على إجازة',       'الحفظ',       '👑', 'memorization', 30,  1000, 7),
    ('star_of_halaqah',     'star_of_halaqah',     'نجم الحلقة',      'الأعلى نقاطاً في حلقته لمدة شهر',          'تكريم',       '🏆', 'custom',       NULL, 180,  8)
)
UPDATE badge_definitions bd
SET
  badge_type = rb.badge_type,
  name = rb.name,
  description = rb.description,
  category = rb.category,
  icon = rb.icon,
  criteria_type = rb.criteria_type,
  criteria_value = rb.criteria_value,
  points_reward = rb.points_reward,
  display_order = rb.display_order,
  badge_name = rb.name,
  badge_description = rb.description,
  badge_icon = rb.icon,
  icon_color = '#F59E0B',
  points_required = COALESCE(rb.criteria_value, 0),
  is_active = TRUE,
  updated_at = NOW()
FROM required_badges rb
WHERE bd.badge_key = rb.badge_key;

UPDATE badge_definitions
SET
  name = COALESCE(name, badge_type),
  description = COALESCE(description, name, badge_type),
  category = COALESCE(category, 'عام'),
  criteria_type = CASE
    WHEN criteria_type IN ('points','streak','courses','tasks','memorization','recitation','custom')
      THEN criteria_type
    ELSE 'custom'
  END,
  points_reward = COALESCE(points_reward, 0),
  display_order = COALESCE(display_order, 0),
  is_active = COALESCE(is_active, TRUE),
  created_at = COALESCE(created_at, NOW()),
  badge_name = COALESCE(badge_name, name, badge_type),
  badge_description = COALESCE(badge_description, description, name, badge_type),
  badge_icon = COALESCE(badge_icon, icon, '🏆'),
  icon_color = COALESCE(icon_color, '#F59E0B'),
  points_required = COALESCE(points_required, criteria_value, 0),
  updated_at = COALESCE(updated_at, NOW());

ALTER TABLE badge_definitions
  ADD CONSTRAINT badge_definitions_criteria_type_check
  CHECK (criteria_type IN ('points','streak','courses','tasks','memorization','recitation','custom'));

ALTER TABLE badge_definitions ALTER COLUMN name SET NOT NULL;
ALTER TABLE badge_definitions ALTER COLUMN description SET NOT NULL;
ALTER TABLE badge_definitions ALTER COLUMN category SET NOT NULL;
ALTER TABLE badge_definitions ALTER COLUMN criteria_type SET NOT NULL;
ALTER TABLE badge_definitions ALTER COLUMN badge_name SET NOT NULL;
ALTER TABLE badge_definitions ALTER COLUMN badge_description SET NOT NULL;
ALTER TABLE badge_definitions ALTER COLUMN badge_key SET NOT NULL;
CREATE INDEX IF NOT EXISTS idx_badge_definitions_category
  ON badge_definitions(category);

INSERT INTO badge_definitions (
  badge_key,
  badge_name,
  badge_description,
  badge_icon,
  icon_color,
  points_required,
  badge_type,
  name,
  description,
  category,
  icon,
  criteria_type,
  criteria_value,
  points_reward,
  display_order
)
VALUES
  ('first_recitation',    'أول تلاوة',      'يسجل تلاوته الأولى على المنصة',    '🎙️', '#F59E0B', 1,   'first_recitation',    'أول تلاوة',      'يسجل تلاوته الأولى على المنصة',          'التلاوة',     '🎙️', 'recitation',   1,   20,   1),
  ('week_streak',         'أسبوع كامل',     '7 أيام Streak متواصلة',            '🔥', '#F59E0B', 7,   'week_streak',         'أسبوع كامل',     '7 أيام Streak متواصلة',                  'الاستمرارية', '🔥', 'streak',       7,   70,   2),
  ('hafiz_juz_amma',      'حافظ جزء عم',    'يتقن جميع سور الجزء الثلاثين',      '📖', '#F59E0B', 1,   'hafiz_juz_amma',      'حافظ جزء عم',    'يتقن جميع سور الجزء الثلاثين',            'الحفظ',       '📖', 'memorization', 1,   200,  3),
  ('hundred_recitations', 'مئة تلاوة',      'يسجل 100 تلاوة على المنصة',         '💯', '#F59E0B', 100, 'hundred_recitations', 'مئة تلاوة',      'يسجل 100 تلاوة على المنصة',               'التلاوة',     '💯', 'recitation',   100, 150,  4),
  ('tajweed_master',      'متقن التجويد',    'يجتاز مسار التجويد الكامل',         '⭐', '#F59E0B', 10,  'tajweed_master',      'متقن التجويد',    'يجتاز مسار التجويد الكامل',               'التجويد',     '⭐', 'recitation',   10,  300,  5),
  ('ramadan_badge',       'شهر رمضان',      'يسجل تلاوة كل يوم خلال الشهر',       '🌙', '#F59E0B', 30,  'ramadan_badge',       'شهر رمضان',      'يسجل تلاوة كل يوم خلال الشهر',             'الاستمرارية', '🌙', 'streak',       30,  250,  6),
  ('full_quran',          'الختمة الكاملة',  'يتقن القرآن كاملاً ويحصل على إجازة', '👑', '#F59E0B', 30,  'full_quran',          'الختمة الكاملة',  'يتقن القرآن كاملاً ويحصل على إجازة',       'الحفظ',       '👑', 'memorization', 30,  1000, 7),
  ('star_of_halaqah',     'نجم الحلقة',      'الأعلى نقاطاً في حلقته لمدة شهر',    '🏆', '#F59E0B', 0,   'star_of_halaqah',     'نجم الحلقة',      'الأعلى نقاطاً في حلقته لمدة شهر',          'تكريم',       '🏆', 'custom',       NULL, 180,  8)
ON CONFLICT (badge_type) DO UPDATE SET
  badge_key = EXCLUDED.badge_key,
  badge_name = EXCLUDED.badge_name,
  badge_description = EXCLUDED.badge_description,
  badge_icon = EXCLUDED.badge_icon,
  icon_color = EXCLUDED.icon_color,
  points_required = EXCLUDED.points_required,
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
  RAISE NOTICE 'Gamification DB update completed successfully';
END $$;
