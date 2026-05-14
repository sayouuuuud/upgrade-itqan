-- ============================================
-- Welcome flow + teacher followers
-- ============================================

-- 1. Mark a user as needing the welcome popup for a specific lesson referral.
--    Set on register when ?ref=lesson cookie is present; cleared once the
--    user dismisses the popup.
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS welcome_referral_id UUID;

-- 2. Following a teacher: triggers in-platform notifications when the teacher
--    publishes a new public lesson (in addition to anonymous mailing list).
CREATE TABLE IF NOT EXISTS teacher_followers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  teacher_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  followed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  source VARCHAR(40),
  UNIQUE (user_id, teacher_id)
);

CREATE INDEX IF NOT EXISTS idx_teacher_followers_teacher
  ON teacher_followers(teacher_id);
CREATE INDEX IF NOT EXISTS idx_teacher_followers_user
  ON teacher_followers(user_id);
