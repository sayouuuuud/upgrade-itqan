-- ============================================
-- Badge Definitions & Achievement System
-- ============================================

-- 1. Drop old badge_definitions if it exists with wrong schema
DROP TABLE IF EXISTS badge_definitions CASCADE;

-- 2. Create badge_definitions table
CREATE TABLE badge_definitions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  badge_key VARCHAR(50) NOT NULL UNIQUE,
  badge_name VARCHAR(100) NOT NULL,
  badge_description TEXT,
  badge_icon VARCHAR(10) DEFAULT '🏆',
  badge_image_url TEXT,
  badge_color VARCHAR(20) DEFAULT '#F59E0B',
  points_awarded INTEGER DEFAULT 0,
  criteria_type VARCHAR(30) NOT NULL DEFAULT 'manual'
    CHECK (criteria_type IN ('recitation_count','streak_days','juz_memorized','recitation_total','tajweed_path','ramadan','quran_complete','top_student','points_threshold','manual')),
  criteria_value INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  category VARCHAR(30) DEFAULT 'achievement'
    CHECK (category IN ('recitation','memorization','streak','mastery','special','achievement')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Update badges table: remove old CHECK constraint, add new columns
ALTER TABLE badges DROP CONSTRAINT IF EXISTS badges_badge_type_check;
ALTER TABLE badges ADD COLUMN IF NOT EXISTS badge_definition_id UUID;
ALTER TABLE badges ADD COLUMN IF NOT EXISTS badge_key VARCHAR(50);

-- Add foreign key separately (safer)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'badges_badge_definition_id_fkey'
  ) THEN
    ALTER TABLE badges ADD CONSTRAINT badges_badge_definition_id_fkey
      FOREIGN KEY (badge_definition_id) REFERENCES badge_definitions(id) ON DELETE SET NULL;
  END IF;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'FK constraint skipped: %', SQLERRM;
END $$;

-- Replace unique constraint
ALTER TABLE badges DROP CONSTRAINT IF EXISTS badges_user_id_badge_type_key;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'badges_user_id_badge_key_key'
  ) THEN
    ALTER TABLE badges ADD CONSTRAINT badges_user_id_badge_key_key UNIQUE(user_id, badge_key);
  END IF;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Unique constraint skipped: %', SQLERRM;
END $$;

-- 4. Migrate existing badge records to use badge_key
UPDATE badges SET badge_key = badge_type WHERE badge_key IS NULL AND badge_type IS NOT NULL;

-- 5. Seed default badge definitions
INSERT INTO badge_definitions (badge_key, badge_name, badge_description, badge_icon, badge_color, points_awarded, criteria_type, criteria_value, category, display_order)
VALUES
  ('first_recitation', 'أول تلاوة', 'سجّل تلاوتك الأولى على المنصة', '🎤', '#10B981', 20, 'recitation_count', 1, 'recitation', 1),
  ('week_streak', 'أسبوع كامل', '7 أيام Streak متواصلة', '🔥', '#F97316', 70, 'streak_days', 7, 'streak', 2),
  ('hafiz_juz_amma', 'حافظ جزء عم', 'أتقن جميع سور الجزء الثلاثين', '📖', '#8B5CF6', 200, 'juz_memorized', 30, 'memorization', 3),
  ('hundred_recitations', 'مئة تلاوة', 'سجّل 100 تلاوة على المنصة', '💯', '#3B82F6', 150, 'recitation_total', 100, 'recitation', 4),
  ('tajweed_master', 'متقن التجويد', 'اجتز مسار التجويد الكامل', '⭐', '#EC4899', 300, 'tajweed_path', 1, 'mastery', 5),
  ('ramadan_badge', 'شهر رمضان', 'سجّل تلاوة كل يوم خلال شهر رمضان', '🌙', '#6366F1', 250, 'ramadan', 30, 'special', 6),
  ('full_quran', 'الختمة الكاملة', 'أتقن القرآن كاملاً وحصلت على إجازة', '👑', '#EAB308', 1000, 'quran_complete', 1, 'memorization', 7),
  ('star_of_halaqah', 'نجم الحلقة', 'الأعلى نقاطاً في حلقتك لمدة شهر', '🌟', '#F59E0B', 180, 'top_student', 1, 'special', 8)
ON CONFLICT (badge_key) DO UPDATE SET
  badge_name = EXCLUDED.badge_name,
  badge_description = EXCLUDED.badge_description,
  badge_icon = EXCLUDED.badge_icon,
  badge_color = EXCLUDED.badge_color,
  points_awarded = EXCLUDED.points_awarded,
  criteria_type = EXCLUDED.criteria_type,
  criteria_value = EXCLUDED.criteria_value,
  category = EXCLUDED.category,
  display_order = EXCLUDED.display_order;
