-- ============================================
-- Lesson mailing list — extend public_lesson_subscribers
-- to support double-opt-in (verification token) and
-- one-click unsubscribe (unsubscribe token).
-- ============================================

ALTER TABLE public_lesson_subscribers
  ADD COLUMN IF NOT EXISTS name VARCHAR(255),
  ADD COLUMN IF NOT EXISTS verification_token VARCHAR(64),
  ADD COLUMN IF NOT EXISTS unsubscribe_token VARCHAR(64),
  ADD COLUMN IF NOT EXISTS verified_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS verification_sent_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS source VARCHAR(40);
  -- source examples: 'public_lesson_post_cta', 'public_lesson_pre_cta'

-- Backfill unsubscribe tokens for any existing rows
UPDATE public_lesson_subscribers
   SET unsubscribe_token = encode(gen_random_bytes(24), 'hex')
 WHERE unsubscribe_token IS NULL;

-- Tokens must be unique to look up directly from links
CREATE UNIQUE INDEX IF NOT EXISTS idx_pls_verification_token
  ON public_lesson_subscribers(verification_token)
  WHERE verification_token IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_pls_unsubscribe_token
  ON public_lesson_subscribers(unsubscribe_token)
  WHERE unsubscribe_token IS NOT NULL;
