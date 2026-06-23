-- ============================================
-- 057 - Per-judge competition scores
-- ============================================
-- Previously every competition entry stored a SINGLE score/feedback/evaluated_by,
-- so when a competition had multiple judges each new evaluation OVERWROTE the
-- previous judge's grade ("last judge wins"). The whole judging-panel concept
-- was effectively broken.
--
-- This table records one row PER (entry, judge). The entry's aggregate
-- `competition_entries.score` is now recomputed as the AVERAGE of all judge
-- scores for that entry, so a panel of judges produces a fair combined result.
--
-- Safe to run multiple times.
-- ============================================

CREATE TABLE IF NOT EXISTS competition_judge_scores (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entry_id      UUID NOT NULL REFERENCES competition_entries(id) ON DELETE CASCADE,
  judge_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  score         NUMERIC NOT NULL CHECK (score >= 0 AND score <= 100),
  tajweed_scores JSONB DEFAULT '{}',
  feedback      TEXT,
  evaluated_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (entry_id, judge_id)
);

CREATE INDEX IF NOT EXISTS idx_competition_judge_scores_entry ON competition_judge_scores(entry_id);
CREATE INDEX IF NOT EXISTS idx_competition_judge_scores_judge ON competition_judge_scores(judge_id);

-- Backfill existing single-score evaluations into the per-judge table so no
-- historical grade is lost. Each already-evaluated entry becomes one judge row
-- keyed to whoever evaluated it.
INSERT INTO competition_judge_scores (entry_id, judge_id, score, tajweed_scores, feedback, evaluated_at)
SELECT ce.id, ce.evaluated_by, ce.score,
       COALESCE(ce.tajweed_scores, '{}'::jsonb), ce.feedback,
       COALESCE(ce.evaluated_at, NOW())
FROM competition_entries ce
WHERE ce.evaluated_by IS NOT NULL
  AND ce.score IS NOT NULL
ON CONFLICT (entry_id, judge_id) DO NOTHING;
