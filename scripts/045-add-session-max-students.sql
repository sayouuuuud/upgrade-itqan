-- ============================================
-- Add max_students to course_sessions
-- ============================================

ALTER TABLE course_sessions 
ADD COLUMN IF NOT EXISTS max_students INTEGER DEFAULT 20;
