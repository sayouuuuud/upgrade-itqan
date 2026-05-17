-- =====================================================================
-- 024-learning-paths.sql
-- Generalize tajweed_paths into multi-subject "Learning Paths" supporting:
--   tajweed | fiqh | aqeedah | seerah | tafsir
--
-- Adds:
--   - subject column on tajweed_paths (default 'tajweed')
--   - manager_id column on tajweed_paths (admin can assign a teacher/reader
--     to manage the path's content even if they didn't create it)
--
-- Idempotent — safe to re-run.
-- =====================================================================

DO $$
BEGIN
  IF to_regclass('public.tajweed_paths') IS NULL THEN
    RAISE EXCEPTION 'scripts/023-tajweed-paths.sql must be applied before scripts/024-learning-paths.sql';
  END IF;

  IF to_regclass('public.users') IS NULL THEN
    RAISE EXCEPTION 'public.users is required before scripts/024-learning-paths.sql';
  END IF;
END$$;

-- 1. Add subject column
ALTER TABLE public.tajweed_paths
  ADD COLUMN IF NOT EXISTS subject VARCHAR(20) NOT NULL DEFAULT 'tajweed';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'tajweed_paths_subject_check'
  ) THEN
    ALTER TABLE public.tajweed_paths
      ADD CONSTRAINT tajweed_paths_subject_check
      CHECK (subject IN ('tajweed', 'fiqh', 'aqeedah', 'seerah', 'tafsir'));
  END IF;
END$$;

CREATE INDEX IF NOT EXISTS idx_tajweed_paths_subject
  ON public.tajweed_paths(subject)
  WHERE is_active = TRUE;

-- 2. Add manager_id column (path-level manager — admin/creator can assign
--    any teacher/reader to manage the path)
ALTER TABLE public.tajweed_paths
  ADD COLUMN IF NOT EXISTS manager_id UUID
    REFERENCES public.users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_tajweed_paths_manager
  ON public.tajweed_paths(manager_id)
  WHERE manager_id IS NOT NULL;

-- DONE.
