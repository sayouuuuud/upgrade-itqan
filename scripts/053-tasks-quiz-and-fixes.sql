-- ============================================
-- Migration 053: Quiz tasks + task fixes
-- ============================================
-- Adds quiz support to the tasks system:
--   1. tasks.quiz_questions  — JSONB array of questions for "quiz" tasks
--   2. task_submissions.quiz_answers — JSONB array of the student answers
--   3. task_submissions.auto_score   — points auto-computed from MCQ answers
--
-- Question shape (stored in tasks.quiz_questions):
--   {
--     "id":       "q1",
--     "type":     "mcq" | "essay",
--     "question": "نص السؤال",
--     "options":  ["خيار 1", "خيار 2", ...],   -- mcq only
--     "correct":  0,                            -- mcq only, index of correct option
--     "points":   5
--   }
--
-- Answer shape (stored in task_submissions.quiz_answers):
--   { "questionId": "q1", "selected": 1 }      -- mcq
--   { "questionId": "q2", "text": "..." , "score": 8 }  -- essay (score set by teacher)
--
-- This migration is idempotent (safe to re-run).
-- Run manually against the LIVE database:
--   psql "$DATABASE_URL" -f scripts/053-tasks-quiz-and-fixes.sql
-- ============================================

BEGIN;

-- 1) Quiz questions on the task itself
ALTER TABLE tasks
  ADD COLUMN IF NOT EXISTS quiz_questions JSONB;

-- 2) Quiz answers + auto score on the submission
ALTER TABLE task_submissions
  ADD COLUMN IF NOT EXISTS quiz_answers JSONB;

ALTER TABLE task_submissions
  ADD COLUMN IF NOT EXISTS auto_score INTEGER;

-- 3) Make sure the submission_type check allows the 'quiz' kind
ALTER TABLE task_submissions DROP CONSTRAINT IF EXISTS task_submissions_submission_type_check;
ALTER TABLE task_submissions ADD CONSTRAINT task_submissions_submission_type_check
  CHECK (submission_type IN ('text','file','audio','video','image','mixed','quiz'));

COMMIT;

-- ============================================
-- DONE. Summary:
--   + tasks.quiz_questions            (JSONB)
--   + task_submissions.quiz_answers   (JSONB)
--   + task_submissions.auto_score     (INTEGER)
--   + submission_type check now accepts 'quiz'
-- ============================================
