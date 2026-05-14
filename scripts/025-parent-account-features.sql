-- Parent account feature completion
-- Weekly reports + content restrictions. Safe to re-run.

BEGIN;

CREATE TABLE IF NOT EXISTS parent_weekly_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  child_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  parent_child_id UUID REFERENCES parent_children(id) ON DELETE CASCADE,
  week_start DATE NOT NULL,
  week_end DATE NOT NULL,
  recitations_count INTEGER NOT NULL DEFAULT 0,
  sessions_attended INTEGER NOT NULL DEFAULT 0,
  badges_earned INTEGER NOT NULL DEFAULT 0,
  current_level VARCHAR(50),
  summary JSONB DEFAULT '{}'::jsonb,
  email_sent BOOLEAN DEFAULT FALSE,
  email_error TEXT,
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(parent_child_id, week_start, week_end)
);

CREATE INDEX IF NOT EXISTS idx_parent_weekly_reports_parent ON parent_weekly_reports(parent_id, week_start DESC);
CREATE INDEX IF NOT EXISTS idx_parent_weekly_reports_child ON parent_weekly_reports(child_id, week_start DESC);
CREATE UNIQUE INDEX IF NOT EXISTS ux_parent_weekly_reports_parent_child_week
  ON parent_weekly_reports(parent_child_id, week_start, week_end);

CREATE TABLE IF NOT EXISTS parent_content_restrictions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_child_id UUID NOT NULL REFERENCES parent_children(id) ON DELETE CASCADE,
  restriction_type VARCHAR(40) NOT NULL
    CHECK (restriction_type IN ('surah', 'course', 'tajweed_path', 'memorization_path')),
  target_id TEXT NOT NULL,
  is_blocked BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(parent_child_id, restriction_type, target_id)
);

ALTER TABLE parent_content_restrictions
  DROP CONSTRAINT IF EXISTS parent_content_restrictions_restriction_type_check;

ALTER TABLE parent_content_restrictions
  ADD CONSTRAINT parent_content_restrictions_restriction_type_check
  CHECK (restriction_type IN ('surah', 'course', 'tajweed_path', 'memorization_path'));

CREATE INDEX IF NOT EXISTS idx_parent_content_restrictions_link ON parent_content_restrictions(parent_child_id);
CREATE INDEX IF NOT EXISTS idx_parent_content_restrictions_type_target ON parent_content_restrictions(restriction_type, target_id);

CREATE OR REPLACE FUNCTION touch_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_parent_weekly_reports_updated_at') THEN
    CREATE TRIGGER trg_parent_weekly_reports_updated_at
      BEFORE UPDATE ON parent_weekly_reports
      FOR EACH ROW EXECUTE FUNCTION touch_updated_at();
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_parent_content_restrictions_updated_at') THEN
    CREATE TRIGGER trg_parent_content_restrictions_updated_at
      BEFORE UPDATE ON parent_content_restrictions
      FOR EACH ROW EXECUTE FUNCTION touch_updated_at();
  END IF;
END $$;

COMMIT;
