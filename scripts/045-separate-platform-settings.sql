-- Separate global system settings from academy and maqraah operational settings.
-- Idempotent: existing global values always win; legacy values are only copied once.

INSERT INTO system_settings (setting_key, setting_value, setting_type, updated_at)
SELECT 'system_name', setting_value, 'general', NOW()
FROM system_settings
WHERE setting_key = 'maqraah_general_name'
ON CONFLICT (setting_key) DO NOTHING;

INSERT INTO system_settings (setting_key, setting_value, setting_type, updated_at)
SELECT 'system_description', setting_value, 'general', NOW()
FROM system_settings
WHERE setting_key = 'maqraah_general_description'
ON CONFLICT (setting_key) DO NOTHING;

INSERT INTO system_settings (setting_key, setting_value, setting_type, updated_at)
SELECT 'system_timezone', setting_value, 'general', NOW()
FROM system_settings
WHERE setting_key IN ('maqraah_general_timezone', 'academy_general_timezone')
ORDER BY CASE WHEN setting_key = 'maqraah_general_timezone' THEN 0 ELSE 1 END
LIMIT 1
ON CONFLICT (setting_key) DO NOTHING;

INSERT INTO system_settings (setting_key, setting_value, setting_type, updated_at)
SELECT 'system_language', setting_value, 'general', NOW()
FROM system_settings
WHERE setting_key IN ('maqraah_general_language', 'academy_general_language')
ORDER BY CASE WHEN setting_key = 'maqraah_general_language' THEN 0 ELSE 1 END
LIMIT 1
ON CONFLICT (setting_key) DO NOTHING;

INSERT INTO system_settings (setting_key, setting_value, setting_type, updated_at)
VALUES
  ('system_name', '"إتقان"'::jsonb, 'general', NOW()),
  ('system_description', '""'::jsonb, 'general', NOW()),
  ('system_timezone', '"Asia/Riyadh"'::jsonb, 'general', NOW()),
  ('system_language', '"ar"'::jsonb, 'general', NOW()),
  ('system_maintenance', '{"enabled":false,"message":"الموقع تحت الصيانة، نعود قريباً."}'::jsonb, 'general', NOW()),
  ('system_security', '{"sessionTimeout":30,"maxLoginAttempts":5,"require2fa":false}'::jsonb, 'general', NOW()),
  ('system_privacy', '{"analyticsEnabled":true,"cookieConsentRequired":true}'::jsonb, 'general', NOW()),
  ('system_notifications', '{"inAppEnabled":true,"emailEnabled":true}'::jsonb, 'general', NOW())
ON CONFLICT (setting_key) DO NOTHING;

INSERT INTO system_settings (setting_key, setting_value, setting_type, updated_at)
SELECT 'maqraah_readers_assignment_strategy', setting_value, 'maqraah_readers', NOW()
FROM system_settings
WHERE setting_key = 'reader_assignment_strategy'
ON CONFLICT (setting_key) DO NOTHING;

COMMENT ON TABLE system_settings IS
  'Scoped settings: system_* and global keys are owned by the super administrator; maqraah_* and academy_* are operational settings owned by their respective platform administrators.';
