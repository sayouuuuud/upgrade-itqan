-- ============================================================================
-- 058 — Multi-stage competitions
-- Adds a "stages" layer so a competition can run as several elimination rounds
-- (e.g. تمهيدي → نصف نهائي → نهائي). Each stage has its own submission window,
-- requirements, and an `advance_count` (top-N who move to the next stage).
--
-- Backwards compatible: every existing competition is backfilled with a single
-- implicit stage that owns all its current entries, so single-round
-- competitions keep working unchanged.
-- ============================================================================

-- 1) Stages table -----------------------------------------------------------
CREATE TABLE IF NOT EXISTS competition_stages (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  competition_id  UUID NOT NULL REFERENCES competitions(id) ON DELETE CASCADE,
  order_index     INTEGER NOT NULL DEFAULT 1,        -- 1-based ordering
  name            TEXT NOT NULL,                     -- "تمهيدي" / "نصف نهائي" / "نهائي"
  description      TEXT,
  -- How many top-scoring students advance from this stage to the next one.
  -- NULL on the final stage (no one advances; winners are awarded instead).
  advance_count   INTEGER,
  -- Per-stage submission requirements (mirrors the competition-level fields).
  min_verses      INTEGER,
  tajweed_rules   TEXT,
  start_date      TIMESTAMPTZ,
  end_date        TIMESTAMPTZ,
  -- locked  = not open yet (students can't submit)
  -- active  = open for submissions / judging
  -- completed = advanced or finalized
  status          TEXT NOT NULL DEFAULT 'locked',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (competition_id, order_index)
);

CREATE INDEX IF NOT EXISTS idx_competition_stages_competition
  ON competition_stages (competition_id, order_index);

-- 2) Competition-level pointers ---------------------------------------------
ALTER TABLE competitions
  ADD COLUMN IF NOT EXISTS current_stage_id UUID REFERENCES competition_stages(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS is_multi_stage   BOOLEAN NOT NULL DEFAULT FALSE;

-- 3) Entries belong to a stage ----------------------------------------------
ALTER TABLE competition_entries
  ADD COLUMN IF NOT EXISTS stage_id UUID REFERENCES competition_stages(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_competition_entries_stage
  ON competition_entries (stage_id);

-- 4) Backfill: one implicit stage per existing competition ------------------
-- Create a single "نهائي"/"المسابقة" stage for any competition that has none.
INSERT INTO competition_stages (competition_id, order_index, name, advance_count, min_verses, tajweed_rules, start_date, end_date, status)
SELECT c.id, 1,
       'المسابقة',
       NULL,                              -- single stage = final, no advancing
       c.min_verses,
       c.tajweed_rules,
       c.start_date,
       c.end_date,
       CASE WHEN c.status = 'ended' THEN 'completed' ELSE 'active' END
FROM competitions c
WHERE NOT EXISTS (SELECT 1 FROM competition_stages s WHERE s.competition_id = c.id);

-- Attach every existing entry to its competition's (single) stage.
UPDATE competition_entries ce
SET stage_id = s.id
FROM competition_stages s
WHERE s.competition_id = ce.competition_id
  AND ce.stage_id IS NULL;

-- Point each competition at its current (single) stage.
UPDATE competitions c
SET current_stage_id = s.id
FROM competition_stages s
WHERE s.competition_id = c.id
  AND c.current_stage_id IS NULL;

-- 5) Re-scope the entry uniqueness to be per-stage --------------------------
-- Old rule: one entry per (competition, student). New rule: one entry per
-- (competition, student, stage) so a student submits fresh each round.
ALTER TABLE competition_entries
  DROP CONSTRAINT IF EXISTS competition_entries_competition_id_student_id_key;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'competition_entries_comp_student_stage_key'
  ) THEN
    ALTER TABLE competition_entries
      ADD CONSTRAINT competition_entries_comp_student_stage_key
      UNIQUE (competition_id, student_id, stage_id);
  END IF;
END $$;
