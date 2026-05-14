-- ============================================
-- Phase: Fiqh Q&A end-to-end flow
-- - Categorization
-- - Specialized officers (mufti pool)
-- - Asker <-> officer threaded conversation
-- - Status tracking + publish-consent step
-- ============================================

BEGIN;

-- ----------------------------------------
-- 1) Categories (taxonomy for the public library)
-- ----------------------------------------
CREATE TABLE IF NOT EXISTS fiqh_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug VARCHAR(64) NOT NULL UNIQUE,
  name_ar VARCHAR(120) NOT NULL,
  name_en VARCHAR(120),
  description TEXT,
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO fiqh_categories (slug, name_ar, name_en, sort_order)
VALUES
  ('ibadat',          'العبادات',        'Worship',           1),
  ('muamalat',        'المعاملات',       'Transactions',      2),
  ('ahwal',           'الأحوال الشخصية', 'Family',            3),
  ('aqidah',          'العقيدة',         'Creed',             4),
  ('quran-tajweed',   'القرآن والتجويد', 'Quran & Tajweed',   5),
  ('seerah',          'السيرة والتاريخ', 'Seerah & History',  6),
  ('akhlaq',          'الآداب والأخلاق', 'Manners & Ethics',  7),
  ('aam',             'متفرقات',         'General',           8)
ON CONFLICT (slug) DO NOTHING;

-- ----------------------------------------
-- 2) Officers (mufti pool) — users empowered to answer
-- ----------------------------------------
CREATE TABLE IF NOT EXISTS fiqh_officers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  bio TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id)
);

CREATE INDEX IF NOT EXISTS idx_fiqh_officers_active
  ON fiqh_officers(is_active);

-- Many-to-many: which categories an officer handles
CREATE TABLE IF NOT EXISTS fiqh_officer_categories (
  officer_id UUID NOT NULL REFERENCES fiqh_officers(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES fiqh_categories(id) ON DELETE CASCADE,
  PRIMARY KEY (officer_id, category_id)
);

CREATE INDEX IF NOT EXISTS idx_fiqh_officer_categories_cat
  ON fiqh_officer_categories(category_id);

-- ----------------------------------------
-- 3) Extend fiqh_questions with workflow fields
-- ----------------------------------------
ALTER TABLE fiqh_questions
  ADD COLUMN IF NOT EXISTS title VARCHAR(240),
  ADD COLUMN IF NOT EXISTS category_id UUID REFERENCES fiqh_categories(id),
  ADD COLUMN IF NOT EXISTS assigned_to UUID REFERENCES users(id),
  ADD COLUMN IF NOT EXISTS status VARCHAR(32) DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS publish_consent VARCHAR(16) DEFAULT 'unrequested',
  ADD COLUMN IF NOT EXISTS publish_consent_requested_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS publish_consent_responded_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS published_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS asker_email VARCHAR(255),
  ADD COLUMN IF NOT EXISTS asker_name VARCHAR(120);

-- Backfill: any row with answer + is_published true → published, else map old states
UPDATE fiqh_questions
SET status = CASE
  WHEN is_published = TRUE AND answer IS NOT NULL THEN 'published'
  WHEN answer IS NOT NULL THEN 'awaiting_consent'
  ELSE 'pending'
END
WHERE status IS NULL OR status = 'pending';

UPDATE fiqh_questions
SET publish_consent = CASE
  WHEN is_published = TRUE THEN 'granted'
  ELSE 'unrequested'
END
WHERE publish_consent IS NULL;

UPDATE fiqh_questions
SET published_at = answered_at
WHERE is_published = TRUE AND published_at IS NULL;

ALTER TABLE fiqh_questions
  DROP CONSTRAINT IF EXISTS fiqh_questions_status_check;
ALTER TABLE fiqh_questions
  ADD CONSTRAINT fiqh_questions_status_check
  CHECK (status IN ('pending','assigned','in_progress','answered','awaiting_consent','published','declined','closed'));

ALTER TABLE fiqh_questions
  DROP CONSTRAINT IF EXISTS fiqh_questions_consent_check;
ALTER TABLE fiqh_questions
  ADD CONSTRAINT fiqh_questions_consent_check
  CHECK (publish_consent IN ('unrequested','requested','granted','denied'));

CREATE INDEX IF NOT EXISTS idx_fiqh_questions_status
  ON fiqh_questions(status);
CREATE INDEX IF NOT EXISTS idx_fiqh_questions_assigned
  ON fiqh_questions(assigned_to, status);
CREATE INDEX IF NOT EXISTS idx_fiqh_questions_asker
  ON fiqh_questions(asked_by, status);
CREATE INDEX IF NOT EXISTS idx_fiqh_questions_published
  ON fiqh_questions(is_published, published_at DESC);
CREATE INDEX IF NOT EXISTS idx_fiqh_questions_category
  ON fiqh_questions(category_id);

-- ----------------------------------------
-- 4) Threaded messages between asker and officer
-- ----------------------------------------
CREATE TABLE IF NOT EXISTS fiqh_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id UUID NOT NULL REFERENCES fiqh_questions(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  sender_role VARCHAR(16) NOT NULL CHECK (sender_role IN ('asker','officer','admin')),
  content TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_fiqh_messages_question
  ON fiqh_messages(question_id, created_at);
CREATE INDEX IF NOT EXISTS idx_fiqh_messages_sender
  ON fiqh_messages(sender_id);

COMMIT;
