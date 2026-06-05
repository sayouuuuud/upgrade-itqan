-- =============================================================================
-- 054 — Fix Archive Columns (إصلاح أعمدة الأرشيف للكورسات والحلقات)
-- =============================================================================
-- المشكلة:
--   نظام الأرشيف الشامل (صفحة /academy/admin/archive + حذف المدرّس التلقائي)
--   يعتمد على الأعمدة التالية في جدولي courses و halaqat:
--     is_active, archived_at, archived_by, archive_reason, original_teacher_id
--
--   لكن مايجريشن 019 أضاف لـ courses فقط: is_active, archived_at, archived_by
--   ولم يُضف: archive_reason, original_teacher_id — ولم يُضف أي شيء لـ halaqat.
--
--   النتيجة: أي استعلام أرشيف أو حذف مدرّس يفشل بخطأ "column does not exist"
--   فيظهر الأرشيف فارغاً / لا يعمل.
--
-- الحل: إضافة كل الأعمدة الناقصة بأمان (IF NOT EXISTS) على الجدولين.
--
-- IMPORTANT: شغّل هذا الملف يدوياً على قاعدة البيانات الحيّة:
--     psql "$DATABASE_URL" -f scripts/054-fix-archive-columns.sql
-- =============================================================================

BEGIN;

-- ---------------------------------------------------------------------------
-- 1) أعمدة الأرشيف الناقصة على جدول courses
-- ---------------------------------------------------------------------------
ALTER TABLE courses
    ADD COLUMN IF NOT EXISTS archive_reason TEXT;

ALTER TABLE courses
    ADD COLUMN IF NOT EXISTS original_teacher_id UUID REFERENCES users(id) ON DELETE SET NULL;

-- ---------------------------------------------------------------------------
-- 2) أعمدة الأرشيف على جدول halaqat (كلها مفقودة)
-- ---------------------------------------------------------------------------
ALTER TABLE halaqat
    ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT TRUE;

ALTER TABLE halaqat
    ADD COLUMN IF NOT EXISTS archived_at TIMESTAMP WITHOUT TIME ZONE;

ALTER TABLE halaqat
    ADD COLUMN IF NOT EXISTS archived_by UUID REFERENCES users(id) ON DELETE SET NULL;

ALTER TABLE halaqat
    ADD COLUMN IF NOT EXISTS archive_reason TEXT;

ALTER TABLE halaqat
    ADD COLUMN IF NOT EXISTS original_teacher_id UUID REFERENCES users(id) ON DELETE SET NULL;

-- ---------------------------------------------------------------------------
-- 3) فهارس تصفية مفيدة (الأرشيف يستعلم بـ is_active أولاً)
-- ---------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_halaqat_is_active ON halaqat(is_active);
CREATE INDEX IF NOT EXISTS idx_courses_archived_at ON courses(archived_at);
CREATE INDEX IF NOT EXISTS idx_halaqat_archived_at ON halaqat(archived_at);

-- ---------------------------------------------------------------------------
-- 4) استعلامات تحقق (شغّلها يدوياً بعد المايجريشن)
-- ---------------------------------------------------------------------------
-- SELECT column_name FROM information_schema.columns
-- WHERE table_name = 'courses'
--   AND column_name IN ('is_active','archived_at','archived_by','archive_reason','original_teacher_id');
--
-- SELECT column_name FROM information_schema.columns
-- WHERE table_name = 'halaqat'
--   AND column_name IN ('is_active','archived_at','archived_by','archive_reason','original_teacher_id');

COMMIT;
