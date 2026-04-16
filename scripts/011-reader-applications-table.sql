-- Migration: Add reader_applications table for vetting system
-- This table stores trial audio submissions from readers awaiting approval

CREATE TABLE IF NOT EXISTS reader_applications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  audio_url TEXT NOT NULL,
  audio_duration_seconds INTEGER,
  status VARCHAR(20) NOT NULL DEFAULT 'pending' 
    CHECK (status IN ('pending', 'under_review', 'approved', 'rejected')),
  reviewer_id UUID REFERENCES users(id) ON DELETE SET NULL,
  reviewer_notes TEXT,
  review_scores JSONB DEFAULT '{}',
  submitted_at TIMESTAMPTZ DEFAULT NOW(),
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for quick lookups
CREATE INDEX IF NOT EXISTS idx_reader_applications_status ON reader_applications(status);
CREATE INDEX IF NOT EXISTS idx_reader_applications_user ON reader_applications(user_id);
CREATE INDEX IF NOT EXISTS idx_reader_applications_submitted ON reader_applications(submitted_at DESC);

-- Trigger to update updated_at
DROP TRIGGER IF EXISTS update_reader_applications_updated_at ON reader_applications;
CREATE TRIGGER update_reader_applications_updated_at 
  BEFORE UPDATE ON reader_applications 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- Add comment
COMMENT ON TABLE reader_applications IS 'طلبات انضمام المقرئين مع التسجيلات الصوتية للتقييم';
