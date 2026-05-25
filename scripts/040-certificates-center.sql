-- =============================================
-- Migration 040: Certificates Center
-- Unified certificates infrastructure for Academy + Maqraa
--   • Templates per scope/kind/language (with field positions JSON)
--   • Global certificate settings per scope
--   • Generic issuance requests pipeline
--   • Flags on competitions / paths / courses / series
-- =============================================

-- Required for gen_random_uuid (Supabase)
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ---------------------------------------------------------------------------
-- 1) certificate_templates
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS certificate_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scope VARCHAR(20) NOT NULL CHECK (scope IN ('academy','maqraa')),
  kind VARCHAR(40) NOT NULL CHECK (kind IN (
    'course','learning_path','memorization_path','tajweed_path',
    'series','competition','recitation','custom'
  )),
  language VARCHAR(5) NOT NULL DEFAULT 'ar' CHECK (language IN ('ar','en')),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  template_url TEXT NOT NULL,
  -- visual editor saves field anchors here.  Shape (per key):
  --   { "x": 0.5, "y": 0.4, "font_size": 64, "color": "#3D2B1F",
  --     "align": "center", "max_width": 0.6 }
  -- All x/y/max_width values are normalized (0..1) relative to the template
  field_positions JSONB DEFAULT '{}'::jsonb,
  background_color VARCHAR(20),
  is_default BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_certificate_templates_scope_kind
  ON certificate_templates(scope, kind, language) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_certificate_templates_default
  ON certificate_templates(scope, kind, language) WHERE is_default = TRUE;

-- Only one default per (scope, kind, language)
CREATE UNIQUE INDEX IF NOT EXISTS uq_certificate_templates_default
  ON certificate_templates(scope, kind, language)
  WHERE is_default = TRUE;

-- ---------------------------------------------------------------------------
-- 2) certificate_settings (key/value per scope)
--    Keys (recommended):
--      platform_name_ar, platform_name_en, watermark_url, logo_url,
--      signature_url, default_signer_name, default_signer_title,
--      auto_issue_on_eligibility (bool)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS certificate_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scope VARCHAR(20) NOT NULL CHECK (scope IN ('academy','maqraa')),
  key VARCHAR(80) NOT NULL,
  value JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  updated_by UUID REFERENCES users(id) ON DELETE SET NULL,
  UNIQUE(scope, key)
);

CREATE INDEX IF NOT EXISTS idx_certificate_settings_scope
  ON certificate_settings(scope);

-- ---------------------------------------------------------------------------
-- 3) certificate_issuance_requests (unified pipeline)
--    Status flow:
--      data_required → submitted → approved → issued
--                                 ↘ rejected
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS certificate_issuance_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scope VARCHAR(20) NOT NULL CHECK (scope IN ('academy','maqraa')),
  kind VARCHAR(40) NOT NULL CHECK (kind IN (
    'course','learning_path','memorization_path','tajweed_path',
    'series','competition','recitation','custom'
  )),
  student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Source reference (polymorphic — table name + record id)
  source_table VARCHAR(60),
  source_id UUID,
  source_label VARCHAR(255),

  -- For competitions: rank-based eligibility
  rank INTEGER,
  reason VARCHAR(255), -- "أعلى 10 في مسابقة رمضان 2025"

  -- Selected template + language at approval time
  template_id UUID REFERENCES certificate_templates(id) ON DELETE SET NULL,
  language VARCHAR(5) DEFAULT 'ar' CHECK (language IN ('ar','en')),

  status VARCHAR(20) NOT NULL DEFAULT 'data_required'
    CHECK (status IN ('data_required','submitted','approved','rejected','issued')),

  -- Student-submitted data (university, city, phone, age, etc.)
  data JSONB DEFAULT '{}'::jsonb,

  -- Issuance outputs
  certificate_number VARCHAR(80),
  serial_code VARCHAR(80),
  pdf_url TEXT,
  preview_url TEXT,

  -- Workflow timestamps
  requested_at TIMESTAMPTZ DEFAULT NOW(),
  submitted_at TIMESTAMPTZ,
  approved_at TIMESTAMPTZ,
  approved_by UUID REFERENCES users(id) ON DELETE SET NULL,
  issued_at TIMESTAMPTZ,
  rejection_reason TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cir_student
  ON certificate_issuance_requests(student_id, status);
CREATE INDEX IF NOT EXISTS idx_cir_scope_status
  ON certificate_issuance_requests(scope, status);
CREATE INDEX IF NOT EXISTS idx_cir_source
  ON certificate_issuance_requests(source_table, source_id);
CREATE INDEX IF NOT EXISTS idx_cir_kind
  ON certificate_issuance_requests(scope, kind, status);

-- A given student should not receive two duplicate requests for the same
-- (scope, kind, source_table, source_id) — except where source_id is NULL
-- (custom requests).  Partial unique index handles the NULL case.
CREATE UNIQUE INDEX IF NOT EXISTS uq_cir_unique_source
  ON certificate_issuance_requests(student_id, scope, kind, source_table, source_id)
  WHERE source_id IS NOT NULL;

-- ---------------------------------------------------------------------------
-- 4) Flags on existing tables
-- ---------------------------------------------------------------------------

-- Competitions: enable certificates + top-N awarding
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'competitions') THEN
    ALTER TABLE competitions ADD COLUMN IF NOT EXISTS certificate_enabled BOOLEAN DEFAULT FALSE;
    ALTER TABLE competitions ADD COLUMN IF NOT EXISTS award_top_n INTEGER;
    ALTER TABLE competitions ADD COLUMN IF NOT EXISTS certificate_template_id UUID
      REFERENCES certificate_templates(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Learning paths
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'tajweed_paths') THEN
    ALTER TABLE tajweed_paths ADD COLUMN IF NOT EXISTS certificate_enabled BOOLEAN DEFAULT FALSE;
    ALTER TABLE tajweed_paths ADD COLUMN IF NOT EXISTS certificate_template_id UUID
      REFERENCES certificate_templates(id) ON DELETE SET NULL;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'memorization_paths') THEN
    ALTER TABLE memorization_paths ADD COLUMN IF NOT EXISTS certificate_enabled BOOLEAN DEFAULT FALSE;
    ALTER TABLE memorization_paths ADD COLUMN IF NOT EXISTS certificate_template_id UUID
      REFERENCES certificate_templates(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Courses
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'courses') THEN
    ALTER TABLE courses ADD COLUMN IF NOT EXISTS certificate_enabled BOOLEAN DEFAULT TRUE;
    ALTER TABLE courses ADD COLUMN IF NOT EXISTS certificate_template_id UUID
      REFERENCES certificate_templates(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Series (academy series)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'series') THEN
    ALTER TABLE series ADD COLUMN IF NOT EXISTS certificate_enabled BOOLEAN DEFAULT FALSE;
    ALTER TABLE series ADD COLUMN IF NOT EXISTS certificate_template_id UUID
      REFERENCES certificate_templates(id) ON DELETE SET NULL;
  END IF;
END $$;

-- ---------------------------------------------------------------------------
-- 5) Augment academy_certificates with issuance metadata (for backward compat)
-- ---------------------------------------------------------------------------
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'academy_certificates') THEN
    ALTER TABLE academy_certificates ADD COLUMN IF NOT EXISTS request_id UUID
      REFERENCES certificate_issuance_requests(id) ON DELETE SET NULL;
    ALTER TABLE academy_certificates ADD COLUMN IF NOT EXISTS template_id UUID
      REFERENCES certificate_templates(id) ON DELETE SET NULL;
    ALTER TABLE academy_certificates ADD COLUMN IF NOT EXISTS language VARCHAR(5) DEFAULT 'ar';
    ALTER TABLE academy_certificates ADD COLUMN IF NOT EXISTS kind VARCHAR(40) DEFAULT 'course';
    ALTER TABLE academy_certificates ADD COLUMN IF NOT EXISTS certificate_number VARCHAR(80);
    ALTER TABLE academy_certificates ADD COLUMN IF NOT EXISTS source_table VARCHAR(60);
    ALTER TABLE academy_certificates ADD COLUMN IF NOT EXISTS source_id UUID;
    -- Allow course_id to be nullable for non-course certificates
    BEGIN
      ALTER TABLE academy_certificates ALTER COLUMN course_id DROP NOT NULL;
    EXCEPTION WHEN OTHERS THEN NULL;
    END;
  END IF;
END $$;

-- ---------------------------------------------------------------------------
-- 6) Sequence for certificate serials (per scope)
-- ---------------------------------------------------------------------------
CREATE SEQUENCE IF NOT EXISTS certificate_academy_serial_seq START 1;
CREATE SEQUENCE IF NOT EXISTS certificate_maqraa_serial_seq  START 1;

-- ---------------------------------------------------------------------------
-- 7) Seed default settings entries (idempotent)
-- ---------------------------------------------------------------------------
INSERT INTO certificate_settings (scope, key, value)
VALUES
  ('academy', 'platform_name_ar', '"أكاديمية إتقان"'::jsonb),
  ('academy', 'platform_name_en', '"Itqan Academy"'::jsonb),
  ('academy', 'auto_issue_on_eligibility', 'false'::jsonb),
  ('maqraa',  'platform_name_ar', '"مقرأة إتقان"'::jsonb),
  ('maqraa',  'platform_name_en', '"Itqan Maqraa"'::jsonb),
  ('maqraa',  'auto_issue_on_eligibility', 'false'::jsonb)
ON CONFLICT (scope, key) DO NOTHING;

-- ---------------------------------------------------------------------------
-- 8) updated_at trigger helpers
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION cert_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END $$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_cert_templates_updated_at ON certificate_templates;
CREATE TRIGGER trg_cert_templates_updated_at
  BEFORE UPDATE ON certificate_templates
  FOR EACH ROW EXECUTE FUNCTION cert_set_updated_at();

DROP TRIGGER IF EXISTS trg_cert_settings_updated_at ON certificate_settings;
CREATE TRIGGER trg_cert_settings_updated_at
  BEFORE UPDATE ON certificate_settings
  FOR EACH ROW EXECUTE FUNCTION cert_set_updated_at();

DROP TRIGGER IF EXISTS trg_cert_requests_updated_at ON certificate_issuance_requests;
CREATE TRIGGER trg_cert_requests_updated_at
  BEFORE UPDATE ON certificate_issuance_requests
  FOR EACH ROW EXECUTE FUNCTION cert_set_updated_at();
