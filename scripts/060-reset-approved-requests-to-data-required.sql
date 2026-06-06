-- 060 - Reset prematurely-approved certificate requests back to data_required
--
-- Context: the certificate flow now requires the student to fill in their data
-- first, after which an admin or the course teacher approves and issues the
-- certificate. Some requests were previously pushed straight to `approved`
-- (or `submitted`) by the old auto-issue behaviour without the student ever
-- entering their data. This resets those back to `data_required` so the new
-- flow can take over.
--
-- Safe and idempotent. It ONLY touches requests that:
--   - are still `submitted` or `approved` (NOT already `issued`), AND
--   - have no student-entered data yet (data is null or empty {}).
-- Issued certificates are never touched.

BEGIN;

-- Preview what will change (optional).
SELECT r.id, u.email, r.source_label, r.status, r.data
FROM certificate_issuance_requests r
JOIN users u ON u.id = r.student_id
WHERE r.status IN ('submitted', 'approved')
  AND (r.data IS NULL OR r.data = '{}'::jsonb);

-- Reset them to data_required and clear approval/issuance metadata.
UPDATE certificate_issuance_requests
SET status = 'data_required',
    approved_at = NULL,
    approved_by = NULL,
    issued_at = NULL,
    pdf_url = NULL,
    preview_url = NULL,
    serial_code = NULL,
    certificate_number = NULL,
    submitted_at = NULL,
    rejection_reason = NULL,
    updated_at = NOW()
WHERE status IN ('submitted', 'approved')
  AND (data IS NULL OR data = '{}'::jsonb);

-- Verify result.
SELECT r.id, u.email, r.source_label, r.status
FROM certificate_issuance_requests r
JOIN users u ON u.id = r.student_id
ORDER BY r.created_at DESC
LIMIT 20;

COMMIT;
