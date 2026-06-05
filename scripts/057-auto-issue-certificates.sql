-- 057: Enable automatic certificate issuance on eligibility.
--
-- Background: the certificates pipeline already creates an issuance request
-- whenever a student completes a course/path/competition, but it waited for an
-- admin to approve before anything was issued. The setting
-- `auto_issue_on_eligibility` gates the "issue without admin" behaviour, and it
-- shipped defaulting to FALSE (see scripts/040-certificates-center.sql), so no
-- certificate was ever issued automatically.
--
-- This migration flips it to TRUE for both scopes so that:
--   * Course completions (which skip the data step) issue immediately.
--   * Path/competition requests issue as soon as the student submits their data.
--
-- Admins can still turn this off from the certificates settings screen, in which
-- case requests fall back to the manual approve-then-issue flow.

INSERT INTO certificate_settings (scope, key, value)
VALUES
  ('academy', 'auto_issue_on_eligibility', 'true'::jsonb),
  ('maqraa',  'auto_issue_on_eligibility', 'true'::jsonb)
ON CONFLICT (scope, key) DO UPDATE
  SET value = EXCLUDED.value,
      updated_at = NOW();
