-- =============================================
-- Migration: Certificate Enhancements
-- =============================================

-- 1) Create authorized_entities table
CREATE TABLE IF NOT EXISTS authorized_entities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  seal_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2) Create universities table
CREATE TABLE IF NOT EXISTS universities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3) Update certificate_data table
ALTER TABLE certificate_data ADD COLUMN IF NOT EXISTS entity_id UUID REFERENCES authorized_entities(id) ON DELETE SET NULL;
-- We keep gender for now to avoid data loss, but we will hide it in UI as requested.

-- 4) Add common universities if table is empty (Seed)
INSERT INTO universities (name) 
VALUES 
  ('جامعة الملك سعود'),
  ('جامعة أم القرى'),
  ('جامعة الإمام محمد بن سعود الإسلامية'),
  ('الجامعة الإسلامية بالمدينة المنورة'),
  ('جامعة الملك عبد العزيز'),
  ('جامعة الأزهر')
ON CONFLICT (name) DO NOTHING;

-- 5) Add some default entities if empty
INSERT INTO authorized_entities (name)
VALUES
  ('منصة متقن الفاتحة (الافتراضي)')
ON CONFLICT (name) DO NOTHING;
