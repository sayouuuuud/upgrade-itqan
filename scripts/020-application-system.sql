-- ===========================================================================
-- 020-application-system.sql
-- Teacher / Reader application system enhancements
-- - Admin-configurable questions per role (application_questions)
-- - Audio test url + free-form responses on each applicant table
-- - Reader rejection_reason column (parity with teacher)
-- - Seeds the default question set for both roles
-- ---------------------------------------------------------------------------
-- This file is NOT executed automatically. Apply with:
--   psql "$DATABASE_URL" -f scripts/020-application-system.sql
-- ===========================================================================

BEGIN;

-- ----- teacher_applications additions -------------------------------------
ALTER TABLE teacher_applications ADD COLUMN IF NOT EXISTS audio_url     TEXT;
ALTER TABLE teacher_applications ADD COLUMN IF NOT EXISTS responses     JSONB DEFAULT '{}'::jsonb;
ALTER TABLE teacher_applications ADD COLUMN IF NOT EXISTS submitted_at  TIMESTAMPTZ;

-- ----- reader_profiles additions ------------------------------------------
ALTER TABLE reader_profiles ADD COLUMN IF NOT EXISTS audio_url        TEXT;
ALTER TABLE reader_profiles ADD COLUMN IF NOT EXISTS pdf_url          TEXT;
ALTER TABLE reader_profiles ADD COLUMN IF NOT EXISTS responses        JSONB DEFAULT '{}'::jsonb;
ALTER TABLE reader_profiles ADD COLUMN IF NOT EXISTS submitted_at     TIMESTAMPTZ;
ALTER TABLE reader_profiles ADD COLUMN IF NOT EXISTS rejection_reason TEXT;
ALTER TABLE reader_profiles ADD COLUMN IF NOT EXISTS rejection_count  INT DEFAULT 0;

-- ----- application_questions ----------------------------------------------
-- Admin-managed dynamic questions shown in the applicant's dashboard.
CREATE TABLE IF NOT EXISTS application_questions (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    role_target  VARCHAR(20) NOT NULL CHECK (role_target IN ('teacher', 'reader')),
    label        TEXT NOT NULL,
    description  TEXT,
    type         VARCHAR(20) NOT NULL CHECK (type IN ('text', 'textarea', 'select', 'audio', 'file')),
    options      JSONB,            -- for type='select': array of option strings
    is_required  BOOLEAN NOT NULL DEFAULT FALSE,
    sort_order   INT     NOT NULL DEFAULT 0,
    is_active    BOOLEAN NOT NULL DEFAULT TRUE,
    created_at   TIMESTAMPTZ DEFAULT NOW(),
    updated_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_application_questions_role
    ON application_questions(role_target, is_active, sort_order);

-- ----- seed defaults (idempotent: skip when rows already exist) -----------
INSERT INTO application_questions (role_target, label, description, type, is_required, sort_order)
SELECT * FROM (VALUES
    ('teacher', 'لماذا تريد الانضمام كأستاذ في الأكاديمية؟',
                'تكلم عن دوافعك ومجال تخصصك', 'textarea', TRUE, 10),
    ('teacher', 'الخبرات التدريسية السابقة',
                'حدد المؤسسات والفترات والمواد التي درّستها', 'textarea', TRUE, 20),
    ('teacher', 'الإجازات والشهادات (PDF)',
                'ارفع ملف PDF يحتوي على شهاداتك أو إجازاتك', 'file', FALSE, 30),
    ('teacher', 'تسجيل صوتي تعريفي (1-3 دقائق)',
                'سجّل مقطعاً صوتياً تشرح فيه عن نفسك ومنهجك في التدريس', 'audio', TRUE, 40),
    ('reader', 'لماذا تريد الانضمام كمقرئ في المنصة؟',
                'تكلم عن دوافعك للانضمام كمراجِع تلاوات', 'textarea', TRUE, 10),
    ('reader', 'تلاوة من المصحف الشريف (3-5 دقائق)',
                'سجّل تلاوة بصوتك من أي سورة تختارها', 'audio', TRUE, 20),
    ('reader', 'الإجازة في القرآن الكريم (PDF)',
                'ارفع ملف PDF بالإجازة (إن وجدت)', 'file', FALSE, 30)
) AS seed(role_target, label, description, type, is_required, sort_order)
WHERE NOT EXISTS (SELECT 1 FROM application_questions);

COMMIT;

-- Verification:
--   SELECT column_name FROM information_schema.columns
--    WHERE table_name = 'teacher_applications'
--      AND column_name IN ('audio_url','responses','submitted_at');
--   SELECT column_name FROM information_schema.columns
--    WHERE table_name = 'reader_profiles'
--      AND column_name IN ('audio_url','pdf_url','responses','submitted_at','rejection_reason','rejection_count');
--   SELECT * FROM application_questions ORDER BY role_target, sort_order;
