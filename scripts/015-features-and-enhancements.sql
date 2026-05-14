-- ============================================
-- Features & Enhancements Migration
-- Phase 1-6 (Calendar, Live, Chat, Fiqh, Teacher Profile, Parent Approval, Gamification, Supervisor)
-- Run this script manually against your Supabase / Postgres database.
-- All statements are idempotent (safe to re-run).
-- ============================================

BEGIN;

-- ============================================
-- 1. PARENT-CHILDREN TABLE (canonical, used across app)
--    Used by app/api/academy/parent/* — defines parent <> student
--    relationship with explicit approval workflow.
-- ============================================

CREATE TABLE IF NOT EXISTS parent_children (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  child_id  UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  relation  VARCHAR(30) NOT NULL DEFAULT 'guardian'
    CHECK (relation IN ('father', 'mother', 'guardian', 'other')),
  -- pending  = parent requested link, child has NOT approved yet
  -- active   = child approved, parent can see progress/reports
  -- rejected = child rejected the link
  -- inactive = parent or child unlinked the relationship
  status    VARCHAR(20) NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'active', 'rejected', 'inactive')),
  responded_at TIMESTAMPTZ,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(parent_id, child_id)
);

CREATE INDEX IF NOT EXISTS idx_parent_children_parent_id ON parent_children(parent_id);
CREATE INDEX IF NOT EXISTS idx_parent_children_child_id  ON parent_children(child_id);
CREATE INDEX IF NOT EXISTS idx_parent_children_status    ON parent_children(status);

-- ============================================
-- 2. ACADEMY CHAT (Conversations + Messages)
-- ============================================

CREATE TABLE IF NOT EXISTS academy_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  teacher_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  last_message      TEXT,
  last_message_at   TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(student_id, teacher_id)
);

CREATE INDEX IF NOT EXISTS idx_academy_conversations_student ON academy_conversations(student_id);
CREATE INDEX IF NOT EXISTS idx_academy_conversations_teacher ON academy_conversations(teacher_id);

CREATE TABLE IF NOT EXISTS academy_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES academy_conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content   TEXT NOT NULL,
  is_read   BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_academy_messages_conv    ON academy_messages(conversation_id, created_at);
CREATE INDEX IF NOT EXISTS idx_academy_messages_sender  ON academy_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_academy_messages_unread  ON academy_messages(conversation_id, is_read) WHERE is_read = FALSE;

-- ============================================
-- 3. TEACHER PROFILE EXTENSIONS
--    academy_teachers already exists in scripts/A-missing-schema.sql
--    Add certifications column for the teacher profile page.
-- ============================================

ALTER TABLE academy_teachers
  ADD COLUMN IF NOT EXISTS certifications TEXT[] DEFAULT '{}';

ALTER TABLE academy_teachers
  ADD COLUMN IF NOT EXISTS subjects TEXT[] DEFAULT '{}';

-- ============================================
-- 4. FIX course_sessions — allow 'live' status alias for in_progress
--    The existing schema only allows scheduled/in_progress/completed/cancelled.
--    We re-create the constraint to include 'live' as a synonym so the
--    teacher live-session API can use either word.
-- ============================================

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'course_sessions' AND column_name = 'status'
  ) THEN
    -- drop old check, add a wider one
    ALTER TABLE course_sessions DROP CONSTRAINT IF EXISTS course_sessions_status_check;
    ALTER TABLE course_sessions ADD CONSTRAINT course_sessions_status_check
      CHECK (status IN ('scheduled', 'live', 'in_progress', 'completed', 'cancelled'));
  END IF;
END $$;

-- Add a denormalised teacher_id to course_sessions for faster lookups by the
-- live-session endpoints. Backfill from the parent course.
ALTER TABLE course_sessions
  ADD COLUMN IF NOT EXISTS teacher_id UUID REFERENCES users(id) ON DELETE SET NULL;

UPDATE course_sessions cs
SET teacher_id = c.teacher_id
FROM courses c
WHERE cs.course_id = c.id AND cs.teacher_id IS NULL;

CREATE INDEX IF NOT EXISTS idx_course_sessions_teacher_id ON course_sessions(teacher_id);

-- Auto-fill teacher_id when new sessions are created
CREATE OR REPLACE FUNCTION fill_course_session_teacher_id()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.teacher_id IS NULL THEN
    SELECT teacher_id INTO NEW.teacher_id FROM courses WHERE id = NEW.course_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_fill_course_session_teacher_id ON course_sessions;
CREATE TRIGGER trg_fill_course_session_teacher_id
BEFORE INSERT ON course_sessions
FOR EACH ROW EXECUTE FUNCTION fill_course_session_teacher_id();

-- ============================================
-- 5. GAMIFICATION FIXES
--    The existing schema (011-academy-expansion.sql) calls the points
--    column `total_points` and the badges timestamp `awarded_at`. The
--    application code expects `points` and `earned_at` in some places, so
--    we add SQL views/columns to keep both names working.
--    We ALSO add a `badge_definitions` catalogue so the UI can show
--    locked/unlocked badges.
-- ============================================

-- Backwards-compat alias columns on user_points (writes go to total_points;
-- the alias is a generated column).
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_points' AND column_name = 'points'
  ) THEN
    ALTER TABLE user_points
      ADD COLUMN points INTEGER GENERATED ALWAYS AS (total_points) STORED;
  END IF;
END $$;

-- earned_at alias on badges
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'badges' AND column_name = 'earned_at'
  ) THEN
    ALTER TABLE badges
      ADD COLUMN earned_at TIMESTAMPTZ GENERATED ALWAYS AS (awarded_at) STORED;
  END IF;
END $$;

-- Catalogue of available badges (definitions). The earned `badges` table
-- references these by `badge_type`.
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

CREATE INDEX IF NOT EXISTS idx_badge_definitions_category ON badge_definitions(category);

-- Seed the catalogue. ON CONFLICT DO NOTHING so it's safe to re-run.
INSERT INTO badge_definitions (badge_type, name, description, category, icon, criteria_type, criteria_value, points_reward, display_order)
VALUES
  ('first_recitation',   'أول تلاوة',          'يسجل تلاوته الأولى على المنصة',                'التلاوة',  '🎙️',        'recitation', 1,    20,  1),
  ('hundred_recitations','مئة تلاوة',          'يسجل 100 تلاوة على المنصة',                    'التلاوة',  '💯',        'recitation', 100,  150, 2),
  ('tajweed_master',     'متقن التجويد',        'يجتاز مسار التجويد الكامل',                    'التجويد',  '⭐',        'recitation', 10,   300, 3),

  ('week_streak',        'أسبوع كامل',          '7 أيام Streak متواصلة',                       'المثابرة',  '🔥',        'streak',     7,    70,  10),
  ('month_streak',       'شهر متواصل',          'حافظت على نشاطك لمدة 30 يوم',                'المثابرة',  'flame',      'streak',     30,   100, 11),
  ('ramadan_badge',      'شهر رمضان',           'يسجل تلاوة كل يوم خلال الشهر',                'المثابرة',  '🌙',        'streak',     30,   250, 12),

  ('hafiz_juz_amma',     'حافظ جزء عمّ',        'يتقن جميع سور الجزء الثلاثين',                 'الحفظ',     '📖',        'memorization', 1,  200, 20),
  ('full_quran',         'الختمة الكاملة',      'يتقن القرآن كاملاً ويحصل على إجازة',           'الحفظ',     '👑',        'memorization', 30, 1000, 21),

  ('first_course',       'أول دورة',            'أكملت أول دورة لك',                          'الدورات',   'graduation', 'courses',    1,    50,  30),
  ('five_courses',       '5 دورات',             'أكملت 5 دورات',                              'الدورات',   'graduation', 'courses',    5,    200, 31),
  ('ten_courses',        '10 دورات',            'أكملت 10 دورات',                             'الدورات',   'graduation', 'courses',    10,   500, 32),

  ('first_task',         'أول مهمة',            'أنجزت أول مهمة',                             'المهام',    'check',      'tasks',      1,    15,  40),
  ('task_master',        'سيد المهام',          'أنجزت 50 مهمة',                              'المهام',    'check',      'tasks',      50,   250, 41),

  ('star_of_halaqah',    'نجم الحلقة',          'الأعلى نقاطاً في حلقته لمدة شهر',             'تكريم',     '🏆',        'custom',     NULL, 180, 50),
  ('helper',             'المُعين',              'ساعدت زملاءك في المنتدى',                    'تكريم',     'heart',      'custom',     NULL, 50,  51),
  ('early_bird',         'الباكر',               'دخلت المنصة قبل الفجر 7 أيام',              'تكريم',     'sun',        'custom',     7,    50,  52),
  ('night_owl',          'الساهر',               'تلوت بعد منتصف الليل 7 ليالي',              'تكريم',     'moon',       'custom',     7,    50,  53)
ON CONFLICT (badge_type) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  category = EXCLUDED.category,
  icon = EXCLUDED.icon,
  criteria_type = EXCLUDED.criteria_type,
  criteria_value = EXCLUDED.criteria_value,
  points_reward = EXCLUDED.points_reward,
  display_order = EXCLUDED.display_order;

-- ============================================
-- 6. Trigger: keep updated_at fresh on parent_children + chat tables
-- ============================================

CREATE OR REPLACE FUNCTION touch_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_parent_children_updated_at') THEN
    CREATE TRIGGER trg_parent_children_updated_at
      BEFORE UPDATE ON parent_children
      FOR EACH ROW EXECUTE FUNCTION touch_updated_at();
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_academy_conversations_updated_at') THEN
    CREATE TRIGGER trg_academy_conversations_updated_at
      BEFORE UPDATE ON academy_conversations
      FOR EACH ROW EXECUTE FUNCTION touch_updated_at();
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_academy_teachers_updated_at_2') THEN
    CREATE TRIGGER trg_academy_teachers_updated_at_2
      BEFORE UPDATE ON academy_teachers
      FOR EACH ROW EXECUTE FUNCTION touch_updated_at();
  END IF;
END $$;

COMMIT;

-- ============================================
-- DONE. Summary of what this migration adds:
--   - parent_children          (with pending/active/rejected approval workflow)
--   - academy_conversations    (chat conversations between students/teachers)
--   - academy_messages         (chat messages, with is_read)
--   - academy_teachers.certifications + subjects
--   - course_sessions.teacher_id (denormalised, auto-filled)
--   - course_sessions.status accepts 'live' as well as 'in_progress'
--   - user_points.points       (alias generated column)
--   - badges.earned_at         (alias generated column)
--   - badge_definitions        (catalogue of all badges + seed data)
-- ============================================
