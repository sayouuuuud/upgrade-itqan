-- ============================================
-- Fix: Tasks table and task_submissions
-- The API uses teacher_id, task_type, max_score
-- but the DB has assigned_by, assigned_to, points_reward
-- Also task_submissions table is completely missing
-- ============================================

-- Add missing columns to tasks table
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS teacher_id UUID REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS task_type VARCHAR(30) DEFAULT 'written'
  CHECK (task_type IN ('memorization', 'recitation', 'written', 'quiz'));
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS max_score INTEGER DEFAULT 100;

-- Backfill teacher_id from assigned_by for existing rows
UPDATE tasks SET teacher_id = assigned_by WHERE teacher_id IS NULL;

CREATE INDEX IF NOT EXISTS idx_tasks_teacher_id ON tasks(teacher_id);

-- Create task_submissions table
CREATE TABLE IF NOT EXISTS task_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content TEXT,
  file_url TEXT,
  status VARCHAR(20) DEFAULT 'submitted' CHECK (status IN ('submitted', 'graded', 'returned')),
  grade INTEGER,
  feedback TEXT,
  submitted_at TIMESTAMPTZ DEFAULT NOW(),
  graded_at TIMESTAMPTZ,
  graded_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(task_id, student_id)
);

CREATE INDEX IF NOT EXISTS idx_task_submissions_task ON task_submissions(task_id);
CREATE INDEX IF NOT EXISTS idx_task_submissions_student ON task_submissions(student_id);
CREATE INDEX IF NOT EXISTS idx_task_submissions_status ON task_submissions(status);
