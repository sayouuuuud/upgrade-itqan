-- ============================================
-- Migration 012: Fix role CHECK constraint + Add missing columns
-- المشكلة: جدول users يرفض role = 'teacher', 'academy_admin', etc.
-- بسبب CHECK constraint القديم: CHECK (role IN ('student', 'reader', 'admin'))
-- ============================================

-- Step 1: حذف الـ CHECK constraint القديم وإعادة إنشائه بالأدوار الكاملة
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
    'reciter_supervisor'
  ));

-- Step 2: إضافة الأعمدة المفقودة التي يحتاجها نظام الأكاديمية وLogin
ALTER TABLE users ADD COLUMN IF NOT EXISTS gender VARCHAR(10) CHECK (gender IN ('male', 'female', 'MALE', 'FEMALE'));
ALTER TABLE users ADD COLUMN IF NOT EXISTS has_academy_access BOOLEAN DEFAULT false;
ALTER TABLE users ADD COLUMN IF NOT EXISTS has_quran_access BOOLEAN DEFAULT false;
ALTER TABLE users ADD COLUMN IF NOT EXISTS platform_choice VARCHAR(20) DEFAULT 'quran';
ALTER TABLE users ADD COLUMN IF NOT EXISTS platform_preference VARCHAR(20) DEFAULT 'quran';
ALTER TABLE users ADD COLUMN IF NOT EXISTS failed_login_count INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_failed_login_at TIMESTAMPTZ;
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMPTZ;
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_locked BOOLEAN DEFAULT false;
ALTER TABLE users ADD COLUMN IF NOT EXISTS locked_at TIMESTAMPTZ;
ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_code VARCHAR(6);
ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_expires_at TIMESTAMPTZ;
ALTER TABLE users ADD COLUMN IF NOT EXISTS verification_code VARCHAR(6);
ALTER TABLE users ADD COLUMN IF NOT EXISTS verification_expires_at TIMESTAMPTZ;
ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT false;
ALTER TABLE users ADD COLUMN IF NOT EXISTS approval_status VARCHAR(20) DEFAULT 'auto_approved'
  CHECK (approval_status IN ('auto_approved', 'pending_approval', 'approved', 'rejected'));

-- Step 3: تفعيل has_academy_access لكل المدرسين الموجودين (إن وجدوا)
UPDATE users SET has_academy_access = true WHERE role IN ('teacher', 'academy_admin');

-- Step 4: إضافة index للأداء
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_is_locked ON users(is_locked);
CREATE INDEX IF NOT EXISTS idx_users_has_academy_access ON users(has_academy_access);

-- Verification: التحقق من النتيجة
DO $$
BEGIN
  RAISE NOTICE '✅ Migration 012 complete: role constraint now allows teacher, academy_admin, parent, student_supervisor, reciter_supervisor';
END $$;
