ALTER TABLE users ADD COLUMN IF NOT EXISTS is_disabled BOOLEAN DEFAULT FALSE;

UPDATE users SET is_disabled = NOT is_active WHERE is_disabled IS NULL;

CREATE INDEX IF NOT EXISTS idx_users_is_disabled ON users(is_disabled);

CREATE TABLE IF NOT EXISTS teacher_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  full_name VARCHAR(255),
  phone VARCHAR(50),
  email VARCHAR(255),
  city VARCHAR(100),
  country VARCHAR(100),
  qualification TEXT,
  specialization TEXT,
  years_of_experience INTEGER DEFAULT 0,
  memorized_parts INTEGER DEFAULT 0,
  certificate_file_url TEXT,
  cv_file_url TEXT,
  bio TEXT,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  reviewed_at TIMESTAMPTZ,
  reviewed_by UUID REFERENCES users(id) ON DELETE SET NULL,
  rejection_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_teacher_applications_user_id ON teacher_applications(user_id);
CREATE INDEX IF NOT EXISTS idx_teacher_applications_status ON teacher_applications(status);
CREATE INDEX IF NOT EXISTS idx_teacher_applications_created_at ON teacher_applications(created_at DESC);

CREATE TABLE IF NOT EXISTS academy_teachers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  bio TEXT,
  specialization TEXT,
  years_of_experience INTEGER DEFAULT 0,
  total_students INTEGER DEFAULT 0,
  total_courses INTEGER DEFAULT 0,
  rating NUMERIC(3,2) DEFAULT 0,
  total_reviews INTEGER DEFAULT 0,
  is_verified BOOLEAN DEFAULT FALSE,
  is_accepting_students BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_academy_teachers_user_id ON academy_teachers(user_id);
CREATE INDEX IF NOT EXISTS idx_academy_teachers_is_verified ON academy_teachers(is_verified);

CREATE OR REPLACE FUNCTION sync_is_disabled_with_is_active()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_active IS DISTINCT FROM OLD.is_active THEN
    NEW.is_disabled := NOT NEW.is_active;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_sync_is_disabled ON users;
CREATE TRIGGER trigger_sync_is_disabled
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION sync_is_disabled_with_is_active();
