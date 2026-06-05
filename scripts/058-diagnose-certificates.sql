-- =====================================================================
-- Read-only diagnostic for the auto-issue certificate flow.
-- Run on the LIVE DB. Replace 'STUDENT_EMAIL_HERE' with the student email.
-- Plain SQL (no psql meta-commands). Nothing here writes data.
-- =====================================================================

-- 1) The user
SELECT id, name, email, role
FROM users
WHERE email = 'STUDENT_EMAIL_HERE';

-- 2) Their course enrollments (is anything actually completed?)
SELECT e.course_id, c.title, e.status, e.progress_percentage, e.completed_at
FROM enrollments e
JOIN courses c ON c.id = e.course_id
WHERE e.student_id = (SELECT id FROM users WHERE email = 'STUDENT_EMAIL_HERE')
ORDER BY e.completed_at DESC NULLS LAST;

-- 3) Their certificate issuance requests (new pipeline)
SELECT id, scope, kind, status, template_id, source_label,
       requested_at, submitted_at, issued_at, pdf_url
FROM certificate_issuance_requests
WHERE student_id = (SELECT id FROM users WHERE email = 'STUDENT_EMAIL_HERE')
ORDER BY requested_at DESC;

-- 4) Legacy academy certificates
SELECT id, course_id, certificate_number, issued_at, pdf_url
FROM academy_certificates
WHERE student_id = (SELECT id FROM users WHERE email = 'STUDENT_EMAIL_HERE')
ORDER BY issued_at DESC;

-- 5) Is there a usable default template for the academy scope?
SELECT id, scope, kind, language, is_active, is_default
FROM certificate_templates
WHERE scope = 'academy'
ORDER BY is_default DESC, is_active DESC, created_at DESC;

-- 6) The auto-issue setting (optional now — page self-heals regardless)
SELECT scope, key, value
FROM certificate_settings
WHERE key = 'auto_issue_on_eligibility';
