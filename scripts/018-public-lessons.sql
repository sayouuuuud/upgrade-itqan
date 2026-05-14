-- ============================================
-- Public Lessons (open lessons)
-- A teacher can host a public lesson with a shareable
-- slug-based URL. Anonymous visitors can view it; at the
-- end of the lesson a CTA invites them to sign up on the
-- platform. Sign-ups are attributed back to the lesson.
-- ============================================

CREATE TABLE IF NOT EXISTS public_lessons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  cover_image_url TEXT,
  public_slug VARCHAR(60) NOT NULL,
  meeting_link TEXT,
  meeting_provider VARCHAR(20)
    CHECK (meeting_provider IS NULL OR meeting_provider IN ('zoom', 'google_meet', 'other')),
  meeting_password VARCHAR(100),
  scheduled_at TIMESTAMPTZ NOT NULL,
  duration_minutes INTEGER DEFAULT 60,
  status VARCHAR(20) DEFAULT 'scheduled'
    CHECK (status IN ('scheduled', 'live', 'completed', 'cancelled')),
  is_published BOOLEAN DEFAULT true,
  view_count INTEGER DEFAULT 0,
  signup_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_public_lessons_slug
  ON public_lessons(public_slug);
CREATE INDEX IF NOT EXISTS idx_public_lessons_teacher_id
  ON public_lessons(teacher_id);
CREATE INDEX IF NOT EXISTS idx_public_lessons_scheduled_at
  ON public_lessons(scheduled_at);

-- Anonymous viewer tracking
CREATE TABLE IF NOT EXISTS public_lesson_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id UUID NOT NULL REFERENCES public_lessons(id) ON DELETE CASCADE,
  visitor_token VARCHAR(64) NOT NULL,
  ip_hash VARCHAR(64),
  user_agent TEXT,
  referrer TEXT,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  left_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_public_lesson_views_lesson_id
  ON public_lesson_views(lesson_id);
CREATE INDEX IF NOT EXISTS idx_public_lesson_views_visitor
  ON public_lesson_views(lesson_id, visitor_token);

-- Sign-up attribution
-- One row is created when a visitor clicks the "sign up"
-- CTA on a lesson page (intended_at). When they actually
-- finish creating their account, converted_user_id is set.
CREATE TABLE IF NOT EXISTS public_lesson_signup_referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id UUID NOT NULL REFERENCES public_lessons(id) ON DELETE CASCADE,
  visitor_token VARCHAR(64),
  ip_hash VARCHAR(64),
  intended_at TIMESTAMPTZ DEFAULT NOW(),
  converted_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  converted_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_public_lesson_signup_referrals_lesson_id
  ON public_lesson_signup_referrals(lesson_id);
CREATE INDEX IF NOT EXISTS idx_public_lesson_signup_referrals_user_id
  ON public_lesson_signup_referrals(converted_user_id);
