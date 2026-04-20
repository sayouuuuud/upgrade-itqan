-- Fix NOT NULL constraints that are blocking inserts from admin panel
-- These columns should be nullable since admin-created content doesn't need a "creator user"

-- Fix learning_paths: created_by can be null (admin creates paths without linking to a user)
ALTER TABLE learning_paths ALTER COLUMN created_by DROP NOT NULL;

-- Fix competitions: created_by can be null
ALTER TABLE competitions ALTER COLUMN created_by DROP NOT NULL;

-- Fix fiqh_questions: asked_by can be null (admin can add Q&A directly)
ALTER TABLE fiqh_questions ALTER COLUMN asked_by DROP NOT NULL;

-- Fix halaqat: teacher_id can be null (can assign later)
ALTER TABLE halaqat ALTER COLUMN teacher_id DROP NOT NULL;

-- Fix announcements: title_en can be null (Arabic-only platform)
ALTER TABLE announcements ALTER COLUMN title_en DROP NOT NULL;

-- Also make content_en nullable in announcements
ALTER TABLE announcements ALTER COLUMN content_en DROP NOT NULL;
