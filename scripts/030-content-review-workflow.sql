-- =====================================================================
-- 030-content-review-workflow.sql
-- Content moderation workflow for content_supervisor.
-- Adds a unified review workflow to series, tajweed_paths and
-- memorization_paths so a content supervisor reviews them BEFORE they
-- are published (just like courses already have).
-- =====================================================================
-- IMPORTANT: this file is NOT executed automatically. Run manually:
--   psql "$DATABASE_URL" -f scripts/030-content-review-workflow.sql
-- =====================================================================

DO $$
BEGIN
  IF to_regclass('public.users') IS NULL THEN
    RAISE EXCEPTION 'scripts/030-content-review-workflow.sql requires public.users.'
      USING ERRCODE = '42P01';
  END IF;
END;
$$;

-- ---------------------------------------------------------------------
-- Helper note: status lifecycle
--   draft           -> author still editing
--   pending_review  -> submitted, waiting for content supervisor
--   published       -> approved (is_published = TRUE)
--   rejected        -> sent back with rejection_reason
-- is_published stays TRUE only while status = 'published'.
-- ---------------------------------------------------------------------

-- ====================== SERIES ======================
ALTER TABLE series
  ADD COLUMN IF NOT EXISTS status VARCHAR(20) NOT NULL DEFAULT 'draft',
  ADD COLUMN IF NOT EXISTS rejection_reason TEXT,
  ADD COLUMN IF NOT EXISTS reviewed_by UUID REFERENCES users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS submitted_for_review_at TIMESTAMPTZ;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.constraint_column_usage
    WHERE table_name = 'series' AND constraint_name = 'chk_series_status'
  ) THEN
    ALTER TABLE series ADD CONSTRAINT chk_series_status
      CHECK (status IN ('draft', 'pending_review', 'published', 'rejected'));
  END IF;
END;
$$;

-- Backfill: anything already published keeps its visibility.
UPDATE series SET status = 'published' WHERE is_published = TRUE AND status = 'draft';

CREATE INDEX IF NOT EXISTS idx_series_status ON series(status);

-- ====================== TAJWEED PATHS ======================
ALTER TABLE tajweed_paths
  ADD COLUMN IF NOT EXISTS status VARCHAR(20) NOT NULL DEFAULT 'draft',
  ADD COLUMN IF NOT EXISTS rejection_reason TEXT,
  ADD COLUMN IF NOT EXISTS reviewed_by UUID REFERENCES users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS submitted_for_review_at TIMESTAMPTZ;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.constraint_column_usage
    WHERE table_name = 'tajweed_paths' AND constraint_name = 'chk_tajweed_paths_status'
  ) THEN
    ALTER TABLE tajweed_paths ADD CONSTRAINT chk_tajweed_paths_status
      CHECK (status IN ('draft', 'pending_review', 'published', 'rejected'));
  END IF;
END;
$$;

UPDATE tajweed_paths SET status = 'published' WHERE is_published = TRUE AND status = 'draft';

CREATE INDEX IF NOT EXISTS idx_tajweed_paths_status ON tajweed_paths(status);

-- ====================== MEMORIZATION PATHS ======================
ALTER TABLE memorization_paths
  ADD COLUMN IF NOT EXISTS status VARCHAR(20) NOT NULL DEFAULT 'draft',
  ADD COLUMN IF NOT EXISTS rejection_reason TEXT,
  ADD COLUMN IF NOT EXISTS reviewed_by UUID REFERENCES users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS submitted_for_review_at TIMESTAMPTZ;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.constraint_column_usage
    WHERE table_name = 'memorization_paths' AND constraint_name = 'chk_memorization_paths_status'
  ) THEN
    ALTER TABLE memorization_paths ADD CONSTRAINT chk_memorization_paths_status
      CHECK (status IN ('draft', 'pending_review', 'published', 'rejected'));
  END IF;
END;
$$;

UPDATE memorization_paths SET status = 'published' WHERE is_published = TRUE AND status = 'draft';

CREATE INDEX IF NOT EXISTS idx_memorization_paths_status ON memorization_paths(status);

-- ====================== LEARNING PATHS (Academy) ======================
ALTER TABLE learning_paths
  ADD COLUMN IF NOT EXISTS is_published BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS status VARCHAR(20) NOT NULL DEFAULT 'draft',
  ADD COLUMN IF NOT EXISTS rejection_reason TEXT,
  ADD COLUMN IF NOT EXISTS reviewed_by UUID REFERENCES users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS submitted_for_review_at TIMESTAMPTZ;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.constraint_column_usage
    WHERE table_name = 'learning_paths' AND constraint_name = 'chk_learning_paths_status'
  ) THEN
    ALTER TABLE learning_paths ADD CONSTRAINT chk_learning_paths_status
      CHECK (status IN ('draft', 'pending_review', 'published', 'rejected'));
  END IF;
END;
$$;

-- Backfill: existing paths are assumed published (admin created & live).
UPDATE learning_paths SET status = 'published', is_published = TRUE WHERE status = 'draft';

CREATE INDEX IF NOT EXISTS idx_learning_paths_status ON learning_paths(status);

-- ---------------------------------------------------------------------
-- DONE.
-- ---------------------------------------------------------------------
