-- ============================================
-- Phase 5: توسيع الأكاديمية
-- Academy Expansion Schema
-- Version: 1.0
-- ============================================

-- ============================================
-- 1. COURSE SESSIONS (جلسات الدروس)
-- ============================================

CREATE TABLE IF NOT EXISTS course_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  session_type VARCHAR(20) NOT NULL CHECK (session_type IN ('live', 'recorded')),
  scheduled_at TIMESTAMPTZ,
  recording_url TEXT,
  notes_url TEXT,
  duration_minutes INTEGER DEFAULT 60,
  meeting_link TEXT,
  meeting_password VARCHAR(100),
  status VARCHAR(20) DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'in_progress', 'completed', 'cancelled')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_course_sessions_course_id ON course_sessions(course_id);
CREATE INDEX IF NOT EXISTS idx_course_sessions_scheduled_at ON course_sessions(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_course_sessions_status ON course_sessions(status);

-- ============================================
-- 2. TASKS (المهام)
-- ============================================

CREATE TABLE IF NOT EXISTS tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assigned_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  assigned_to UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  course_id UUID REFERENCES courses(id) ON DELETE SET NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  due_date TIMESTAMPTZ,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'done', 'overdue')),
  points_reward INTEGER DEFAULT 15,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tasks_assigned_by ON tasks(assigned_by);
CREATE INDEX IF NOT EXISTS idx_tasks_assigned_to ON tasks(assigned_to);
CREATE INDEX IF NOT EXISTS idx_tasks_course_id ON tasks(course_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON tasks(due_date);

-- ============================================
-- 3. LEARNING PATHS (المسارات التعليمية)
-- ============================================

CREATE TABLE IF NOT EXISTS learning_paths (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  subject VARCHAR(50) CHECK (subject IN ('quran', 'tajweed', 'fiqh', 'aqeedah', 'seerah', 'tafseer', 'arabic', 'general')),
  level VARCHAR(20) DEFAULT 'beginner' CHECK (level IN ('beginner', 'intermediate', 'advanced')),
  thumbnail_url TEXT,
  is_published BOOLEAN DEFAULT FALSE,
  total_courses INTEGER DEFAULT 0,
  estimated_hours INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_learning_paths_created_by ON learning_paths(created_by);
CREATE INDEX IF NOT EXISTS idx_learning_paths_subject ON learning_paths(subject);
CREATE INDEX IF NOT EXISTS idx_learning_paths_level ON learning_paths(level);
CREATE INDEX IF NOT EXISTS idx_learning_paths_is_published ON learning_paths(is_published);

-- ============================================
-- 4. LEARNING PATH COURSES (ربط الدروس بالمسار)
-- ============================================

CREATE TABLE IF NOT EXISTS learning_path_courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  path_id UUID NOT NULL REFERENCES learning_paths(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  order_index INTEGER NOT NULL DEFAULT 0,
  is_required BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(path_id, course_id)
);

CREATE INDEX IF NOT EXISTS idx_learning_path_courses_path_id ON learning_path_courses(path_id);
CREATE INDEX IF NOT EXISTS idx_learning_path_courses_course_id ON learning_path_courses(course_id);
CREATE INDEX IF NOT EXISTS idx_learning_path_courses_order ON learning_path_courses(path_id, order_index);

-- ============================================
-- 5. STUDENT PATH PROGRESS (تقدم الطالب في المسار)
-- ============================================

CREATE TABLE IF NOT EXISTS student_path_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  path_id UUID NOT NULL REFERENCES learning_paths(id) ON DELETE CASCADE,
  current_course_id UUID REFERENCES courses(id) ON DELETE SET NULL,
  completed_courses UUID[] DEFAULT '{}',
  progress_percentage DECIMAL(5, 2) DEFAULT 0,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(student_id, path_id)
);

CREATE INDEX IF NOT EXISTS idx_student_path_progress_student_id ON student_path_progress(student_id);
CREATE INDEX IF NOT EXISTS idx_student_path_progress_path_id ON student_path_progress(path_id);

-- ============================================
-- 6. MEMORIZATION LOG (سجل الحفظ اليومي)
-- ============================================

CREATE TABLE IF NOT EXISTS memorization_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  log_date DATE NOT NULL DEFAULT CURRENT_DATE,
  new_verses INTEGER DEFAULT 0,
  revised_verses INTEGER DEFAULT 0,
  surah_number INTEGER CHECK (surah_number >= 1 AND surah_number <= 114),
  surah_name VARCHAR(100),
  juz_number INTEGER CHECK (juz_number >= 1 AND juz_number <= 30),
  notes TEXT,
  quality_rating INTEGER CHECK (quality_rating >= 1 AND quality_rating <= 5),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(student_id, log_date)
);

CREATE INDEX IF NOT EXISTS idx_memorization_log_student_id ON memorization_log(student_id);
CREATE INDEX IF NOT EXISTS idx_memorization_log_log_date ON memorization_log(log_date);
CREATE INDEX IF NOT EXISTS idx_memorization_log_student_date ON memorization_log(student_id, log_date DESC);

-- ============================================
-- 7. USER POINTS (نقاط المستخدمين)
-- ============================================

CREATE TABLE IF NOT EXISTS user_points (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  total_points INTEGER DEFAULT 0,
  level VARCHAR(20) DEFAULT 'beginner' CHECK (level IN ('beginner', 'intermediate', 'advanced', 'hafiz', 'master')),
  streak_days INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  last_activity_date DATE,
  total_verses_memorized INTEGER DEFAULT 0,
  total_verses_revised INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_points_user_id ON user_points(user_id);
CREATE INDEX IF NOT EXISTS idx_user_points_total_points ON user_points(total_points DESC);
CREATE INDEX IF NOT EXISTS idx_user_points_level ON user_points(level);
CREATE INDEX IF NOT EXISTS idx_user_points_streak ON user_points(streak_days DESC);

-- ============================================
-- 8. POINTS LOG (سجل كسب النقاط)
-- ============================================

CREATE TABLE IF NOT EXISTS points_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  points INTEGER NOT NULL,
  reason VARCHAR(50) NOT NULL CHECK (reason IN ('recitation', 'mastered', 'task', 'lesson', 'streak', 'juz_complete', 'course_complete', 'session_attend', 'daily_login', 'competition_win', 'badge_earned')),
  description TEXT,
  related_entity_type VARCHAR(50),
  related_entity_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_points_log_user_id ON points_log(user_id);
CREATE INDEX IF NOT EXISTS idx_points_log_reason ON points_log(reason);
CREATE INDEX IF NOT EXISTS idx_points_log_created_at ON points_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_points_log_user_date ON points_log(user_id, created_at DESC);

-- ============================================
-- 9. BADGES (الشارات)
-- ============================================

CREATE TABLE IF NOT EXISTS badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  badge_type VARCHAR(50) NOT NULL CHECK (badge_type IN (
    'first_recitation', 'week_streak', 'month_streak', 'hafiz_juz_amma', 
    'hundred_recitations', 'tajweed_master', 'ramadan_badge', 'full_quran',
    'star_of_halaqah', 'first_course', 'five_courses', 'ten_courses',
    'first_task', 'task_master', 'early_bird', 'night_owl', 'helper'
  )),
  badge_name VARCHAR(100),
  badge_description TEXT,
  badge_icon_url TEXT,
  points_awarded INTEGER DEFAULT 0,
  awarded_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, badge_type)
);

CREATE INDEX IF NOT EXISTS idx_badges_user_id ON badges(user_id);
CREATE INDEX IF NOT EXISTS idx_badges_badge_type ON badges(badge_type);
CREATE INDEX IF NOT EXISTS idx_badges_awarded_at ON badges(awarded_at DESC);

-- ============================================
-- 10. COMPETITIONS (المسابقات)
-- ============================================

CREATE TABLE IF NOT EXISTS competitions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  type VARCHAR(30) NOT NULL CHECK (type IN ('monthly', 'ramadan', 'tajweed', 'memorization', 'weekly', 'special')),
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ NOT NULL,
  status VARCHAR(20) DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'active', 'ended', 'cancelled')),
  max_participants INTEGER,
  prizes_description TEXT,
  rules TEXT,
  created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  winner_id UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_competitions_status ON competitions(status);
CREATE INDEX IF NOT EXISTS idx_competitions_type ON competitions(type);
CREATE INDEX IF NOT EXISTS idx_competitions_dates ON competitions(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_competitions_created_by ON competitions(created_by);

-- ============================================
-- 11. COMPETITION ENTRIES (مشاركات المسابقات)
-- ============================================

CREATE TABLE IF NOT EXISTS competition_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  competition_id UUID NOT NULL REFERENCES competitions(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  recitation_id UUID REFERENCES recitations(id) ON DELETE SET NULL,
  score DECIMAL(5, 2),
  rank INTEGER,
  submission_url TEXT,
  notes TEXT,
  submitted_at TIMESTAMPTZ DEFAULT NOW(),
  evaluated_at TIMESTAMPTZ,
  evaluated_by UUID REFERENCES users(id) ON DELETE SET NULL,
  UNIQUE(competition_id, student_id)
);

CREATE INDEX IF NOT EXISTS idx_competition_entries_competition_id ON competition_entries(competition_id);
CREATE INDEX IF NOT EXISTS idx_competition_entries_student_id ON competition_entries(student_id);
CREATE INDEX IF NOT EXISTS idx_competition_entries_score ON competition_entries(score DESC);
CREATE INDEX IF NOT EXISTS idx_competition_entries_rank ON competition_entries(rank);

-- ============================================
-- 12. FORUM POSTS (منشورات المنتدى)
-- ============================================

CREATE TABLE IF NOT EXISTS forum_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  category VARCHAR(30) NOT NULL CHECK (category IN ('general', 'quran', 'fiqh', 'advice', 'youth', 'sisters', 'announcements', 'questions')),
  is_pinned BOOLEAN DEFAULT FALSE,
  is_locked BOOLEAN DEFAULT FALSE,
  is_approved BOOLEAN DEFAULT TRUE,
  views_count INTEGER DEFAULT 0,
  replies_count INTEGER DEFAULT 0,
  last_reply_at TIMESTAMPTZ,
  last_reply_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_forum_posts_author_id ON forum_posts(author_id);
CREATE INDEX IF NOT EXISTS idx_forum_posts_category ON forum_posts(category);
CREATE INDEX IF NOT EXISTS idx_forum_posts_is_pinned ON forum_posts(is_pinned);
CREATE INDEX IF NOT EXISTS idx_forum_posts_created_at ON forum_posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_forum_posts_last_reply ON forum_posts(last_reply_at DESC);

-- ============================================
-- 13. FORUM REPLIES (ردود المنتدى)
-- ============================================

CREATE TABLE IF NOT EXISTS forum_replies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES forum_posts(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  is_approved BOOLEAN DEFAULT TRUE,
  is_best_answer BOOLEAN DEFAULT FALSE,
  likes_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_forum_replies_post_id ON forum_replies(post_id);
CREATE INDEX IF NOT EXISTS idx_forum_replies_author_id ON forum_replies(author_id);
CREATE INDEX IF NOT EXISTS idx_forum_replies_created_at ON forum_replies(created_at);

-- ============================================
-- 14. FIQH QUESTIONS (الأسئلة الفقهية)
-- ============================================

CREATE TABLE IF NOT EXISTS fiqh_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  asked_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  answer TEXT,
  answered_by UUID REFERENCES users(id) ON DELETE SET NULL,
  category VARCHAR(30) NOT NULL CHECK (category IN ('taharah', 'salah', 'sawm', 'zakat', 'hajj', 'muamalat', 'nikah', 'general', 'other')),
  is_published BOOLEAN DEFAULT FALSE,
  is_anonymous BOOLEAN DEFAULT FALSE,
  views_count INTEGER DEFAULT 0,
  asked_at TIMESTAMPTZ DEFAULT NOW(),
  answered_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_fiqh_questions_asked_by ON fiqh_questions(asked_by);
CREATE INDEX IF NOT EXISTS idx_fiqh_questions_answered_by ON fiqh_questions(answered_by);
CREATE INDEX IF NOT EXISTS idx_fiqh_questions_category ON fiqh_questions(category);
CREATE INDEX IF NOT EXISTS idx_fiqh_questions_is_published ON fiqh_questions(is_published);
CREATE INDEX IF NOT EXISTS idx_fiqh_questions_asked_at ON fiqh_questions(asked_at DESC);

-- ============================================
-- 15. PUBLIC LESSON SUBSCRIBERS (مشتركو الدروس العامة)
-- ============================================

CREATE TABLE IF NOT EXISTS public_lesson_subscribers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) NOT NULL,
  teacher_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  course_id UUID REFERENCES courses(id) ON DELETE SET NULL,
  is_verified BOOLEAN DEFAULT FALSE,
  subscribed_at TIMESTAMPTZ DEFAULT NOW(),
  unsubscribed_at TIMESTAMPTZ,
  UNIQUE(email, teacher_id)
);

CREATE INDEX IF NOT EXISTS idx_public_lesson_subscribers_email ON public_lesson_subscribers(email);
CREATE INDEX IF NOT EXISTS idx_public_lesson_subscribers_teacher_id ON public_lesson_subscribers(teacher_id);
CREATE INDEX IF NOT EXISTS idx_public_lesson_subscribers_course_id ON public_lesson_subscribers(course_id);

-- ============================================
-- 16. SESSION ATTENDANCE (حضور الجلسات)
-- ============================================

CREATE TABLE IF NOT EXISTS session_attendance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES course_sessions(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  left_at TIMESTAMPTZ,
  duration_minutes INTEGER,
  attendance_status VARCHAR(20) DEFAULT 'present' CHECK (attendance_status IN ('present', 'late', 'left_early', 'absent')),
  UNIQUE(session_id, student_id)
);

CREATE INDEX IF NOT EXISTS idx_session_attendance_session_id ON session_attendance(session_id);
CREATE INDEX IF NOT EXISTS idx_session_attendance_student_id ON session_attendance(student_id);

-- ============================================
-- 17. UPDATE COURSES TABLE (تحديث جدول الدروس)
-- ============================================

-- Add share_link column for public courses
ALTER TABLE courses ADD COLUMN IF NOT EXISTS share_link VARCHAR(100) UNIQUE;
ALTER TABLE courses ADD COLUMN IF NOT EXISTS subject VARCHAR(50) CHECK (subject IN ('quran', 'tajweed', 'fiqh', 'aqeedah', 'seerah', 'tafseer', 'arabic', 'general'));

-- ============================================
-- 18. UPDATE INVITATIONS TABLE (تحديث جدول الدعوات)
-- ============================================

-- Add roles_to_assign as array for multiple roles
ALTER TABLE invitations ADD COLUMN IF NOT EXISTS roles_to_assign VARCHAR(50)[] DEFAULT '{}';

-- ============================================
-- 19. ADD academy_role TO USERS (إضافة دور الأكاديمية)
-- ============================================

-- Add academy-specific columns to users
ALTER TABLE users ADD COLUMN IF NOT EXISTS academy_roles VARCHAR(50)[] DEFAULT '{}';
ALTER TABLE users ADD COLUMN IF NOT EXISTS halaqah_id UUID;
ALTER TABLE users ADD COLUMN IF NOT EXISTS teacher_specializations VARCHAR(50)[] DEFAULT '{}';

CREATE INDEX IF NOT EXISTS idx_users_academy_roles ON users USING GIN(academy_roles);
CREATE INDEX IF NOT EXISTS idx_users_halaqah_id ON users(halaqah_id);

-- ============================================
-- 20. HALAQAT (الحلقات)
-- ============================================

CREATE TABLE IF NOT EXISTS halaqat (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  teacher_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  gender VARCHAR(10) CHECK (gender IN ('MALE', 'FEMALE', 'MIXED')),
  max_students INTEGER DEFAULT 20,
  current_students INTEGER DEFAULT 0,
  meeting_schedule TEXT,
  meeting_link TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_halaqat_teacher_id ON halaqat(teacher_id);
CREATE INDEX IF NOT EXISTS idx_halaqat_gender ON halaqat(gender);
CREATE INDEX IF NOT EXISTS idx_halaqat_is_active ON halaqat(is_active);

-- ============================================
-- 21. TRIGGERS FOR AUTO-UPDATE
-- ============================================

-- Trigger for updating timestamps
CREATE OR REPLACE FUNCTION update_academy_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply triggers to new tables
DO $$
BEGIN
  -- course_sessions
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_course_sessions_updated_at') THEN
    CREATE TRIGGER update_course_sessions_updated_at BEFORE UPDATE ON course_sessions FOR EACH ROW EXECUTE FUNCTION update_academy_updated_at();
  END IF;
  
  -- tasks
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_tasks_updated_at') THEN
    CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON tasks FOR EACH ROW EXECUTE FUNCTION update_academy_updated_at();
  END IF;
  
  -- learning_paths
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_learning_paths_updated_at') THEN
    CREATE TRIGGER update_learning_paths_updated_at BEFORE UPDATE ON learning_paths FOR EACH ROW EXECUTE FUNCTION update_academy_updated_at();
  END IF;
  
  -- student_path_progress
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_student_path_progress_updated_at') THEN
    CREATE TRIGGER update_student_path_progress_updated_at BEFORE UPDATE ON student_path_progress FOR EACH ROW EXECUTE FUNCTION update_academy_updated_at();
  END IF;
  
  -- memorization_log
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_memorization_log_updated_at') THEN
    CREATE TRIGGER update_memorization_log_updated_at BEFORE UPDATE ON memorization_log FOR EACH ROW EXECUTE FUNCTION update_academy_updated_at();
  END IF;
  
  -- user_points
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_user_points_updated_at') THEN
    CREATE TRIGGER update_user_points_updated_at BEFORE UPDATE ON user_points FOR EACH ROW EXECUTE FUNCTION update_academy_updated_at();
  END IF;
  
  -- competitions
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_competitions_updated_at') THEN
    CREATE TRIGGER update_competitions_updated_at BEFORE UPDATE ON competitions FOR EACH ROW EXECUTE FUNCTION update_academy_updated_at();
  END IF;
  
  -- forum_posts
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_forum_posts_updated_at') THEN
    CREATE TRIGGER update_forum_posts_updated_at BEFORE UPDATE ON forum_posts FOR EACH ROW EXECUTE FUNCTION update_academy_updated_at();
  END IF;
  
  -- forum_replies
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_forum_replies_updated_at') THEN
    CREATE TRIGGER update_forum_replies_updated_at BEFORE UPDATE ON forum_replies FOR EACH ROW EXECUTE FUNCTION update_academy_updated_at();
  END IF;
  
  -- fiqh_questions
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_fiqh_questions_updated_at') THEN
    CREATE TRIGGER update_fiqh_questions_updated_at BEFORE UPDATE ON fiqh_questions FOR EACH ROW EXECUTE FUNCTION update_academy_updated_at();
  END IF;
  
  -- halaqat
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_halaqat_updated_at') THEN
    CREATE TRIGGER update_halaqat_updated_at BEFORE UPDATE ON halaqat FOR EACH ROW EXECUTE FUNCTION update_academy_updated_at();
  END IF;
END $$;

-- ============================================
-- 22. FUNCTION: Update forum post reply count
-- ============================================

CREATE OR REPLACE FUNCTION update_forum_post_replies_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE forum_posts 
    SET replies_count = replies_count + 1,
        last_reply_at = NEW.created_at,
        last_reply_by = NEW.author_id
    WHERE id = NEW.post_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE forum_posts 
    SET replies_count = GREATEST(0, replies_count - 1)
    WHERE id = OLD.post_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_update_forum_replies_count ON forum_replies;
CREATE TRIGGER trg_update_forum_replies_count
AFTER INSERT OR DELETE ON forum_replies
FOR EACH ROW EXECUTE FUNCTION update_forum_post_replies_count();

-- ============================================
-- 23. FUNCTION: Auto-update task status to overdue
-- ============================================

CREATE OR REPLACE FUNCTION check_overdue_tasks()
RETURNS void AS $$
BEGIN
  UPDATE tasks 
  SET status = 'overdue', updated_at = NOW()
  WHERE status = 'pending' 
    AND due_date < NOW();
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- COMMIT
-- ============================================
COMMIT;
