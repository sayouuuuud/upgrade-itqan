-- ============================================================================
-- 067 — Settings Ownership Split (Non-Breaking)
-- ============================================================================
-- Goal: enforce clean ownership of settings across the 3 platforms WITHOUT
-- renaming any setting_key (so every getSetting(key) consumer keeps working).
--
-- Ownership model:
--   * SYSTEM  (Super Admin)   → setting_type LIKE 'system_%'
--       site-wide only: identity, email/SMTP, security, notifications,
--       maintenance (with scope), SEO, storage.
--   * ACADEMY (Academy Admin) → setting_key LIKE 'academy_%' (unchanged)
--   * MAQRAAH (Maqraah Admin) → setting_key LIKE 'maqraah_%' (unchanged)
--
-- We ONLY change setting_type (ownership label), delete the duplicated
-- security/maintenance rows in the academy/maqraah namespaces, and introduce a
-- single system maintenance set that carries a SCOPE. No key renames.
-- getSetting() reads rows by setting_key, so changing setting_type is safe.
-- ============================================================================

BEGIN;

-- 0) Safety backup (idempotent) -----------------------------------------------
DROP TABLE IF EXISTS system_settings_backup_067;
CREATE TABLE system_settings_backup_067 AS TABLE system_settings;

-- 1) SYSTEM: identity / general site config -----------------------------------
UPDATE system_settings SET setting_type = 'system_general'
WHERE setting_key IN (
  'platform_name','site_name','site_tagline','site_info','site_default_language',
  'site_timezone','app_url','branding','contact_info','social_links',
  'site_social_links','site_contact_email','site_contact_phone','theme_config'
);

-- 2) SYSTEM: email / SMTP ------------------------------------------------------
UPDATE system_settings SET setting_type = 'system_email'
WHERE setting_key IN (
  'smtp_config','smtp_host','smtp_port','smtp_user','smtp_pass','smtp_tls'
);

-- 3) SYSTEM: SEO ---------------------------------------------------------------
UPDATE system_settings SET setting_type = 'system_seo'
WHERE setting_key LIKE 'seo_%';

-- 4) SYSTEM: security / privacy ------------------------------------------------
UPDATE system_settings SET setting_type = 'system_security'
WHERE setting_key IN (
  'security_settings','activity_logging','limit_login_attempts','two_factor_auth'
);

-- 5) SYSTEM: notifications -----------------------------------------------------
UPDATE system_settings SET setting_type = 'system_notifications'
WHERE setting_key IN (
  'notification_settings','resend_email_on_result_change','resend_email_on_result_update'
);

-- 6) SYSTEM: storage -----------------------------------------------------------
UPDATE system_settings SET setting_type = 'system_storage'
WHERE setting_key IN (
  'storage_config','storage_provider','cloud_api_key','cloud_name','max_file_size_mb'
);

-- 7) Reclassify legacy operational keys out of the super-admin surface ---------
--    (reader/session/certificate/etc. — consumed by app code via getSetting,
--     NOT site-wide identity). Neutral 'platform_legacy' type keeps them working
--     while removing them from the System settings UI.
UPDATE system_settings SET setting_type = 'platform_legacy'
WHERE setting_key IN (
  'booking_settings','certificate_data_required','certificate_mandatory_for_mastered',
  'certificate_pdf_required','certificate_section_enabled','default_session_duration',
  'global_ceremony_date','max_daily_sessions_per_reader','max_sessions_per_reader_daily',
  'reader_assignment_strategy','reader_attachment_required','reader_certificate_field_visible',
  'reader_certificate_required','reader_experience_field_visible','recording_max_seconds',
  'session_duration_minutes','show_certificate_section','show_qualification_field',
  'show_years_of_experience','surah_name','workflow_statuses'
);

-- 8) SYSTEM maintenance — single source of truth, WITH scope ------------------
--    Migrate ON/OFF + message from the old maqraah/site values; default scope 'site'.
INSERT INTO system_settings (setting_key, setting_value, setting_type, updated_at)
VALUES
  (
    'maintenance_enabled',
    COALESCE(
      (SELECT setting_value FROM system_settings WHERE setting_key = 'maqraah_maintenance_mode'),
      (SELECT setting_value FROM system_settings WHERE setting_key = 'site_maintenance_enabled'),
      'false'::jsonb
    ),
    'system_maintenance',
    NOW()
  ),
  (
    'maintenance_message',
    COALESCE(
      (SELECT setting_value FROM system_settings WHERE setting_key = 'maqraah_maintenance_message'),
      (SELECT setting_value FROM system_settings WHERE setting_key = 'site_maintenance_message'),
      '"المنصة تحت الصيانة حالياً، نعود قريباً بإذن الله."'::jsonb
    ),
    'system_maintenance',
    NOW()
  ),
  (
    'maintenance_scope',
    '"site"'::jsonb,   -- one of: site | academy | maqraah
    'system_maintenance',
    NOW()
  )
ON CONFLICT (setting_key) DO UPDATE
  SET setting_type = EXCLUDED.setting_type,
      updated_at = NOW();

-- 9) DELETE duplicated / superseded rows --------------------------------------
--    Security & maintenance must live ONLY under system ownership.
DELETE FROM system_settings WHERE setting_key LIKE 'academy_security_%';
DELETE FROM system_settings WHERE setting_key LIKE 'academy_maintenance_%';
DELETE FROM system_settings WHERE setting_key LIKE 'maqraah_security_%';
DELETE FROM system_settings WHERE setting_key LIKE 'maqraah_maintenance_%';
DELETE FROM system_settings WHERE setting_key IN (
  'site_maintenance_enabled','site_maintenance_message'
);

COMMIT;

-- ============================================================================
-- Verification (run after commit):
--   SELECT setting_type, COUNT(*) FROM system_settings GROUP BY setting_type ORDER BY 1;
--   SELECT setting_key FROM system_settings WHERE setting_type LIKE 'system_%' ORDER BY 1;
-- Rollback (if needed):
--   BEGIN;
--   DELETE FROM system_settings;
--   INSERT INTO system_settings SELECT * FROM system_settings_backup_067;
--   COMMIT;
-- ============================================================================
