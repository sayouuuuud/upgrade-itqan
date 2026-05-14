-- ============================================
-- Migration 026: Fix role CHECK constraint to include supervisor roles
-- المشكلة: جدول users يرفض role = 'fiqh_supervisor', 'content_supervisor', 'supervisor'
-- بسبب CHECK constraint من Migration 012 الذي نسي هذه الأدوار
-- ============================================

ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;

ALTER TABLE users
  ADD CONSTRAINT users_role_check
  CHECK (role IN (
    'student',
    'reader',
    'admin',
    'teacher',
    'academy_admin',
    'parent',
    'student_supervisor',
    'reciter_supervisor',
    'fiqh_supervisor',
    'content_supervisor',
    'supervisor',
    'quality_supervisor'
  ));

UPDATE users
SET has_academy_access = true
WHERE role IN ('teacher', 'academy_admin', 'fiqh_supervisor', 'content_supervisor', 'supervisor', 'quality_supervisor');

-- ============================================
-- Add likes_count to forum_posts (referenced in admin UI but missing)
-- ============================================
ALTER TABLE forum_posts ADD COLUMN IF NOT EXISTS likes_count INTEGER DEFAULT 0;

-- ============================================
-- Expand forum_posts category to include articles/guidance
-- ============================================
ALTER TABLE forum_posts DROP CONSTRAINT IF EXISTS forum_posts_category_check;
ALTER TABLE forum_posts
  ADD CONSTRAINT forum_posts_category_check
  CHECK (category IN (
    'general', 'quran', 'fiqh', 'advice', 'youth',
    'sisters', 'announcements', 'questions',
    'articles', 'guidance'
  ));

DO $$
BEGIN
  RAISE NOTICE '✅ Migration 026: role constraint updated, likes_count added, forum categories expanded';
END $$;
