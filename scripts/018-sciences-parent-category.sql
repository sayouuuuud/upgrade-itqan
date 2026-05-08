-- =============================================================================
-- 018 — العلوم الشرعية (Sharia / Islamic Sciences) as a parent category
-- =============================================================================
-- Goal:
--   1. Allow the `categories` table to express a hierarchy (parent → children).
--   2. Insert a single root category "العلوم الشرعية" so every existing
--      academy category (الفقه، التفسير، السيرة، الحديث، التجويد، ...) sits
--      under it as a child.
--   3. Re-parent existing academy categories under that root.
--
-- IMPORTANT: This file is intentionally NOT auto-executed. Review the script,
-- then run it manually:
--     psql "$DATABASE_URL" -f scripts/018-sciences-parent-category.sql
-- =============================================================================

BEGIN;

-- ---------------------------------------------------------------------------
-- 1) Schema: add hierarchy + (optional) presentational fields to `categories`.
-- ---------------------------------------------------------------------------
ALTER TABLE categories
    ADD COLUMN IF NOT EXISTS parent_id UUID REFERENCES categories(id) ON DELETE SET NULL;

ALTER TABLE categories
    ADD COLUMN IF NOT EXISTS color VARCHAR(7);              -- e.g. "#1E3A5F"

ALTER TABLE categories
    ADD COLUMN IF NOT EXISTS short_description VARCHAR(255);

CREATE INDEX IF NOT EXISTS idx_categories_parent_id ON categories(parent_id);

-- Self-reference safety: parent_id must not equal id.
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'categories_no_self_parent'
    ) THEN
        ALTER TABLE categories
            ADD CONSTRAINT categories_no_self_parent CHECK (parent_id IS NULL OR parent_id <> id);
    END IF;
END $$;


-- ---------------------------------------------------------------------------
-- 2) Seed the root category "العلوم الشرعية".
--    Idempotent: only inserts if a category with slug='sharia-sciences' is
--    not already present.
-- ---------------------------------------------------------------------------
INSERT INTO categories (id, name, slug, description, short_description, display_order, is_active)
SELECT
    gen_random_uuid(),
    'العلوم الشرعية',
    'sharia-sciences',
    'القسم الجامع لكل التصنيفات الشرعية في الأكاديمية: الفقه، التفسير، الحديث، السيرة، العقيدة، التجويد، أصول الفقه، علوم القرآن، اللغة العربية، التزكية وغيرها.',
    'تصنيف رئيسي يندرج تحته كل تصنيفات الأكاديمية',
    -1,         -- always displayed first
    TRUE
WHERE NOT EXISTS (
    SELECT 1 FROM categories WHERE slug = 'sharia-sciences'
);


-- ---------------------------------------------------------------------------
-- 3) Re-parent existing academy categories under "العلوم الشرعية".
--
--    Decision: the user explicitly stated "كل التصنيفات اللي في الأكاديمية
--    الـ main بتاعها علوم شرعية" — so every existing category becomes a
--    child of the root. تلاوة (Tajweed) is one of the Islamic sciences, so
--    it goes under the root too.
--
--    Skip categories that are already roots themselves (parent_id IS NULL
--    AND slug = 'sharia-sciences') so we never re-parent the root onto
--    itself.
-- ---------------------------------------------------------------------------
WITH root AS (
    SELECT id FROM categories WHERE slug = 'sharia-sciences' LIMIT 1
)
UPDATE categories
SET parent_id = (SELECT id FROM root)
WHERE parent_id IS NULL
  AND slug IS DISTINCT FROM 'sharia-sciences';


-- ---------------------------------------------------------------------------
-- 4) (Optional) Seed common Sharia-science children if they don't exist yet.
--    Commented out by default — uncomment if you want a richer default set.
-- ---------------------------------------------------------------------------
-- WITH root AS (SELECT id FROM categories WHERE slug = 'sharia-sciences' LIMIT 1)
-- INSERT INTO categories (id, name, slug, parent_id, display_order, is_active)
-- SELECT gen_random_uuid(), v.name, v.slug, (SELECT id FROM root), v.ord, TRUE
-- FROM (
--     VALUES
--         ('التفسير',        'tafsir',         1),
--         ('علوم القرآن',    'quran-sciences', 2),
--         ('الحديث',         'hadith',         3),
--         ('السيرة النبوية', 'seerah',         4),
--         ('العقيدة',        'aqidah',         5),
--         ('أصول الفقه',     'usul-fiqh',      6),
--         ('اللغة العربية',  'arabic',         7),
--         ('التزكية والأخلاق','tazkiyah',      8)
-- ) AS v(name, slug, ord)
-- WHERE NOT EXISTS (
--     SELECT 1 FROM categories c WHERE c.slug = v.slug
-- );


-- ---------------------------------------------------------------------------
-- 5) Verification queries (run manually after migration).
-- ---------------------------------------------------------------------------
-- SELECT id, name, slug, parent_id, display_order
-- FROM categories
-- ORDER BY display_order, name;
--
-- SELECT
--     parent.name AS parent_category,
--     child.name  AS child_category,
--     child.slug  AS child_slug
-- FROM categories child
-- LEFT JOIN categories parent ON parent.id = child.parent_id
-- ORDER BY parent.name NULLS FIRST, child.display_order;

COMMIT;
