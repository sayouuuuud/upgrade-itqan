-- ============================================
-- 012: Fix tasks & task_submissions schema
-- - Make assigned_to nullable (course-wide tasks)
-- - Loosen status check constraints to match app states
-- - Add submission_type and file metadata to task_submissions
-- - Add helpful indexes
-- ============================================

-- 1) Tasks: assigned_to nullable for course-wide tasks
ALTER TABLE tasks ALTER COLUMN assigned_to DROP NOT NULL;

-- 2) Tasks status check: include submitted/graded/active/closed
ALTER TABLE tasks DROP CONSTRAINT IF EXISTS tasks_status_check;
ALTER TABLE tasks ADD CONSTRAINT tasks_status_check
  CHECK (status IN ('draft', 'pending', 'active', 'submitted', 'graded', 'done', 'overdue', 'closed'));

-- 3) Task submissions: extend with type & metadata
ALTER TABLE task_submissions ADD COLUMN IF NOT EXISTS submission_type VARCHAR(20)
  DEFAULT 'text';

-- Drop & recreate constraint to allow needed types
ALTER TABLE task_submissions DROP CONSTRAINT IF EXISTS task_submissions_submission_type_check;
ALTER TABLE task_submissions ADD CONSTRAINT task_submissions_submission_type_check
  CHECK (submission_type IN ('text','file','audio','video','image','mixed'));

ALTER TABLE task_submissions ADD COLUMN IF NOT EXISTS file_name VARCHAR(255);
ALTER TABLE task_submissions ADD COLUMN IF NOT EXISTS file_type VARCHAR(80);
ALTER TABLE task_submissions ADD COLUMN IF NOT EXISTS file_size BIGINT;
ALTER TABLE task_submissions ADD COLUMN IF NOT EXISTS audio_url TEXT;
ALTER TABLE task_submissions ADD COLUMN IF NOT EXISTS video_url TEXT;
ALTER TABLE task_submissions ADD COLUMN IF NOT EXISTS attempts INTEGER DEFAULT 1;

-- 4) Task submissions status: ensure constraint covers all states used by app
ALTER TABLE task_submissions DROP CONSTRAINT IF EXISTS task_submissions_status_check;
ALTER TABLE task_submissions ADD CONSTRAINT task_submissions_status_check
  CHECK (status IN ('draft','submitted','graded','returned','late','rejected'));

-- 5) Indexes
CREATE INDEX IF NOT EXISTS idx_task_submissions_status ON task_submissions(status);
CREATE INDEX IF NOT EXISTS idx_task_submissions_student_status ON task_submissions(student_id, status);
CREATE INDEX IF NOT EXISTS idx_tasks_course_status ON tasks(course_id, status);

-- 6) updated_at on submissions if missing
ALTER TABLE task_submissions ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();
