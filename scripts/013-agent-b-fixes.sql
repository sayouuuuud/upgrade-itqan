ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_category_check;
ALTER TABLE notifications
  ADD CONSTRAINT notifications_category_check
  CHECK (category IN ('recitation','booking','review','system','message','session','account','general','announcement','course'));

ALTER TABLE enrollments DROP CONSTRAINT IF EXISTS enrollments_status_check;
ALTER TABLE enrollments
  ADD CONSTRAINT enrollments_status_check
  CHECK (status IN ('pending','active','accepted','rejected','ACTIVE','PAUSED','COMPLETED','DROPPED'));

ALTER TABLE enrollments
  ADD COLUMN IF NOT EXISTS rejection_reason TEXT;

ALTER TABLE enrollments
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

ALTER TABLE lessons
  ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'published';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'lessons_status_check'
  ) THEN
    ALTER TABLE lessons ADD CONSTRAINT lessons_status_check CHECK (status IN ('pending_review','published','rejected'));
  END IF;
END $$;

ALTER TABLE lessons
  ADD COLUMN IF NOT EXISTS order_index INTEGER;

UPDATE lessons SET order_index = lesson_order WHERE order_index IS NULL;

ALTER TABLE lessons
  ADD COLUMN IF NOT EXISTS submitted_by UUID REFERENCES users(id);

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS must_change_password BOOLEAN DEFAULT FALSE;

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS password_changed_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_enrollments_updated_at ON enrollments(updated_at);
CREATE INDEX IF NOT EXISTS idx_lessons_status ON lessons(status);
CREATE INDEX IF NOT EXISTS idx_users_must_change_password ON users(must_change_password) WHERE must_change_password = true;

CREATE OR REPLACE FUNCTION update_enrollments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_enrollments_updated_at ON enrollments;
CREATE TRIGGER update_enrollments_updated_at
  BEFORE UPDATE ON enrollments
  FOR EACH ROW EXECUTE FUNCTION update_enrollments_updated_at();
