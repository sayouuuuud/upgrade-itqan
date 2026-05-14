-- ============================================
-- Migration 021: Calendar + Tasks + Reminders
-- ============================================
-- Adds:
--   1. memorization_goals (weekly memorization plan per student)
--   2. notifications.dedup_key (idempotent reminders)
--   3. Wider notifications.category check (adds 'session', 'task', 'reminder', 'goal')
--   4. reminder_runs (audit log of cron runs)
--
-- This migration is idempotent (safe to re-run).
-- Run manually:
--   psql "$DATABASE_URL" -f scripts/021-calendar-tasks-reminders.sql
-- ============================================

BEGIN;

-- ============================================
-- 1. WEEKLY MEMORIZATION GOALS
-- ============================================
-- One row per student per week.  week_start is the Saturday (Arabic-week
-- start) that anchors the goal.  Set either by the student themselves or by
-- their teacher (`set_by`).  When the student finishes the goal they call
-- /api/academy/student/memorization-goals/:id PATCH which sets
-- completed_at + status='completed'.
-- ============================================

CREATE TABLE IF NOT EXISTS memorization_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  set_by         UUID REFERENCES users(id) ON DELETE SET NULL,
  week_start     DATE NOT NULL,
  surah_from     INTEGER CHECK (surah_from IS NULL OR (surah_from BETWEEN 1 AND 114)),
  ayah_from      INTEGER CHECK (ayah_from  IS NULL OR ayah_from  >= 1),
  surah_to       INTEGER CHECK (surah_to   IS NULL OR (surah_to   BETWEEN 1 AND 114)),
  ayah_to        INTEGER CHECK (ayah_to    IS NULL OR ayah_to    >= 1),
  target_verses  INTEGER NOT NULL DEFAULT 0,
  notes          TEXT,
  status         VARCHAR(20) NOT NULL DEFAULT 'active'
                 CHECK (status IN ('active', 'completed', 'missed')),
  completed_at   TIMESTAMPTZ,
  created_at     TIMESTAMPTZ DEFAULT NOW(),
  updated_at     TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (student_id, week_start)
);

CREATE INDEX IF NOT EXISTS idx_memorization_goals_student
  ON memorization_goals(student_id);
CREATE INDEX IF NOT EXISTS idx_memorization_goals_week
  ON memorization_goals(week_start);
CREATE INDEX IF NOT EXISTS idx_memorization_goals_student_week
  ON memorization_goals(student_id, week_start DESC);

-- Keep updated_at fresh
CREATE OR REPLACE FUNCTION touch_memorization_goals_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_memorization_goals_updated_at ON memorization_goals;
CREATE TRIGGER trg_memorization_goals_updated_at
  BEFORE UPDATE ON memorization_goals
  FOR EACH ROW EXECUTE FUNCTION touch_memorization_goals_updated_at();

-- ============================================
-- 2. NOTIFICATIONS — dedup_key + wider category
-- ============================================
-- dedup_key lets the reminder cron run safely on overlapping schedules
-- (e.g. every 5 minutes) without spamming the user.  We use a partial
-- unique index so existing rows that have no key are unaffected.
-- ============================================

ALTER TABLE notifications
  ADD COLUMN IF NOT EXISTS dedup_key VARCHAR(255);

CREATE UNIQUE INDEX IF NOT EXISTS uniq_notifications_dedup_key
  ON notifications(user_id, dedup_key) WHERE dedup_key IS NOT NULL;

-- Widen the category check so reminder notifications can be filed under
-- meaningful buckets in the bell dropdown.  Postgres requires drop + add.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'notifications' AND column_name = 'category'
  ) THEN
    ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_category_check;
    ALTER TABLE notifications ADD CONSTRAINT notifications_category_check
      CHECK (category IS NULL OR category IN (
        'recitation', 'booking', 'review', 'system', 'message',
        'session',    'task',    'reminder', 'goal',   'announcement',
        'account',    'general', 'course'
      ));
  END IF;
END $$;

-- ============================================
-- 3. REMINDER RUNS (audit / debugging)
-- ============================================

CREATE TABLE IF NOT EXISTS reminder_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kind                  VARCHAR(50) NOT NULL,  -- e.g. 'session_60', 'session_10', 'task_morning', 'task_overdue'
  ran_at                TIMESTAMPTZ DEFAULT NOW(),
  notifications_created INTEGER DEFAULT 0,
  errors                INTEGER DEFAULT 0,
  meta                  JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_reminder_runs_kind_at
  ON reminder_runs(kind, ran_at DESC);

COMMIT;

-- ============================================
-- DONE.  Summary:
--   + memorization_goals    (weekly per-student plan, status active/completed/missed)
--   + notifications.dedup_key + unique partial index
--   + notifications category accepts session/task/reminder/goal
--   + reminder_runs         (cron audit log)
-- ============================================
