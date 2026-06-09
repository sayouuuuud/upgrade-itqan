-- Migration 056: Recitation stages for learning paths
-- Adds a "recitation" stage type where the student recites a Quran range (surah / ayah range / juz / pages)
-- and uploads/records their recitation to complete the stage.

-- 1) Allow 'recitation' as a stage_type (recreate the check constraint)
ALTER TABLE tajweed_path_stages DROP CONSTRAINT IF EXISTS tajweed_path_stages_stage_type_check;
ALTER TABLE tajweed_path_stages
  ADD CONSTRAINT tajweed_path_stages_stage_type_check
  CHECK (stage_type IN ('custom', 'course', 'halaqa', 'lesson', 'recitation'));

-- 2) Recitation target columns
-- recitation_mode: 'surah' (full surah) | 'ayah' (surah + ayah range) | 'juz' | 'page'
ALTER TABLE tajweed_path_stages ADD COLUMN IF NOT EXISTS recitation_mode VARCHAR(10)
  CHECK (recitation_mode IN ('surah', 'ayah', 'juz', 'page'));
ALTER TABLE tajweed_path_stages ADD COLUMN IF NOT EXISTS surah_number INT;
ALTER TABLE tajweed_path_stages ADD COLUMN IF NOT EXISTS ayah_from INT;
ALTER TABLE tajweed_path_stages ADD COLUMN IF NOT EXISTS ayah_to INT;
ALTER TABLE tajweed_path_stages ADD COLUMN IF NOT EXISTS juz_number INT;
ALTER TABLE tajweed_path_stages ADD COLUMN IF NOT EXISTS page_from INT;
ALTER TABLE tajweed_path_stages ADD COLUMN IF NOT EXISTS page_to INT;
