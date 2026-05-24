-- ============================================================
-- Phase: Fiqh Library polish
--   - Full-text search index (Arabic-friendly via simple config)
--   - Library / inbox helper indexes
--   - Add a `source_role` column on fiqh_questions so we know
--     where the asker came from (academy_student / maqraa_student
--     / reader / public). Optional but useful for analytics.
--   - Seed any missing finer-grained fiqh categories.
-- ============================================================

BEGIN;

-- ---------------------------------------------------------
-- 0) Drop the legacy CHECK constraint on the `category` slug
--    column. The new source of truth is `fiqh_categories.slug`
--    (which the admin can edit), so we no longer want a fixed
--    whitelist baked into the schema.
-- ---------------------------------------------------------
ALTER TABLE fiqh_questions
  DROP CONSTRAINT IF EXISTS fiqh_questions_category_check;

-- ---------------------------------------------------------
-- 1) Make sure all required workflow columns exist
--    (this is idempotent — already added in 014, but we re-run
--    it defensively in case 014 was skipped on some envs).
-- ---------------------------------------------------------
ALTER TABLE fiqh_questions
  ADD COLUMN IF NOT EXISTS title VARCHAR(240),
  ADD COLUMN IF NOT EXISTS category_id UUID REFERENCES fiqh_categories(id),
  ADD COLUMN IF NOT EXISTS assigned_to UUID REFERENCES users(id),
  ADD COLUMN IF NOT EXISTS status VARCHAR(32) DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS publish_consent VARCHAR(16) DEFAULT 'unrequested',
  ADD COLUMN IF NOT EXISTS publish_consent_requested_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS publish_consent_responded_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS published_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS source_role VARCHAR(32);

-- Backfill category_id from the legacy `category` slug column
-- so the new library view can join cleanly.
UPDATE fiqh_questions q
   SET category_id = c.id
  FROM fiqh_categories c
 WHERE q.category_id IS NULL
   AND q.category IS NOT NULL
   AND (
     c.slug = q.category
     OR c.slug = REPLACE(LOWER(q.category), ' ', '-')
     OR c.name_ar = q.category
   );

-- Backfill status if any rows are still null
UPDATE fiqh_questions
   SET status = CASE
     WHEN is_published = TRUE AND answer IS NOT NULL THEN 'published'
     WHEN answer IS NOT NULL THEN 'awaiting_consent'
     ELSE 'pending'
   END
 WHERE status IS NULL;

-- ---------------------------------------------------------
-- 2) Helper indexes for the library + inbox queries
-- ---------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_fiqh_questions_status
  ON fiqh_questions(status);
CREATE INDEX IF NOT EXISTS idx_fiqh_questions_assigned
  ON fiqh_questions(assigned_to, status);
CREATE INDEX IF NOT EXISTS idx_fiqh_questions_asker_status
  ON fiqh_questions(asked_by, status);
CREATE INDEX IF NOT EXISTS idx_fiqh_questions_published
  ON fiqh_questions(is_published, published_at DESC);
CREATE INDEX IF NOT EXISTS idx_fiqh_questions_category_id
  ON fiqh_questions(category_id);
CREATE INDEX IF NOT EXISTS idx_fiqh_questions_category_str
  ON fiqh_questions(category);

-- ---------------------------------------------------------
-- 3) Full-text search GIN index over title/question/answer.
--    Using the `simple` config (no stemmer) because Postgres
--    ships no Arabic stemmer by default; this still gives us
--    fast prefix + word matching which is far better than
--    ILIKE %x% over a growing library.
-- ---------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_fiqh_questions_fts
  ON fiqh_questions
  USING GIN (
    to_tsvector(
      'simple',
      COALESCE(title, '') || ' ' ||
      COALESCE(question, '') || ' ' ||
      COALESCE(answer, '')
    )
  );

-- ---------------------------------------------------------
-- 4) Seed finer-grained fiqh categories the academy admins
--    can use out of the box. The categories already inserted
--    in 014 remain (ibadat/muamalat/...) for legacy rows; we
--    just append more specific ones so the asker can pick a
--    tighter category. Admins can edit/disable them later
--    from the new /academy/admin/fiqh/settings page.
-- ---------------------------------------------------------
INSERT INTO fiqh_categories (slug, name_ar, name_en, sort_order)
VALUES
  ('tahara',         'الطهارة',                'Tahara (Purity)',           10),
  ('salah',          'الصلاة',                 'Salah (Prayer)',            11),
  ('sawm',           'الصيام',                 'Sawm (Fasting)',            12),
  ('zakah',          'الزكاة',                 'Zakah',                     13),
  ('hajj-umrah',     'الحج والعمرة',           'Hajj & Umrah',              14),
  ('janaiz',         'الجنائز',                'Janaiz (Funerals)',         15),
  ('buyu',           'البيوع والمعاملات المالية', 'Financial transactions',  20),
  ('nikah',          'النكاح',                 'Marriage',                  21),
  ('talaq',          'الطلاق والخلع',          'Divorce',                   22),
  ('mawarith',       'المواريث',               'Inheritance',               23),
  ('atimah',         'الأطعمة والأشربة',       'Food & drink rulings',      24),
  ('aymah',          'الأيمان والنذور',        'Oaths & vows',              25),
  ('tajweed',        'أحكام التجويد',          'Tajweed rulings',           30),
  ('quran-sciences', 'علوم القرآن',            'Quranic Sciences',          31),
  ('usul',           'أصول الفقه',             'Usul al-Fiqh',              40)
ON CONFLICT (slug) DO NOTHING;

COMMIT;
