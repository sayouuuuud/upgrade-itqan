-- ============================================
-- Migration 042: Academy Admin Settings Support
-- ============================================
-- Adds support for academy-specific settings in system_settings
-- Fixes setting_type CHECK constraint to allow new academy-related types
-- and seeds default values for all 9 settings sections.

-- 1) Drop the old restrictive CHECK constraint entirely (no replacement)
--    We intentionally do NOT re-add a CHECK constraint here, because existing
--    rows in production may use setting_type values outside any predefined list.
--    Instead we rely on the application layer to validate setting_type values.
ALTER TABLE system_settings DROP CONSTRAINT IF EXISTS system_settings_setting_type_check;

-- (Removed strict CHECK constraint to avoid violations from legacy rows)
-- The previous list is kept here as a comment for documentation only:
-- Allowed types in app layer:
--   'email','storage','workflow','security','general','payment','notification',
--   'academy_general','academy_registration','academy_courses','academy_sessions',
--   'academy_gamification','academy_notifications','academy_forum',
--   'academy_security','academy_maintenance','smtp'

-- 3) Seed default settings for each section (only if not exists)
-- 3.1 General
INSERT INTO system_settings (setting_key, setting_value, setting_type, description, is_editable)
VALUES
  ('academy_general_name',          '"أكاديمية إتقان"'::jsonb, 'academy_general', 'اسم الأكاديمية',           true),
  ('academy_general_logo',          '""'::jsonb,              'academy_general', 'شعار الأكاديمية',          true),
  ('academy_general_favicon',       '""'::jsonb,              'academy_general', 'أيقونة الموقع',            true),
  ('academy_general_description',   '""'::jsonb,              'academy_general', 'وصف الأكاديمية',           true),
  ('academy_general_email',         '""'::jsonb,              'academy_general', 'البريد الرسمي',            true),
  ('academy_general_whatsapp',      '""'::jsonb,              'academy_general', 'رقم الواتساب',             true),
  ('academy_general_timezone',      '"Asia/Riyadh"'::jsonb,    'academy_general', 'المنطقة الزمنية',          true),
  ('academy_general_language',      '"ar"'::jsonb,             'academy_general', 'اللغة الافتراضية',         true),
  ('academy_general_direction',     '"rtl"'::jsonb,            'academy_general', 'اتجاه الواجهة',            true)
ON CONFLICT (setting_key) DO NOTHING;

-- 3.2 Registration
INSERT INTO system_settings (setting_key, setting_value, setting_type, description, is_editable)
VALUES
  ('academy_registration_self_signup_students',     'true'::jsonb,  'academy_registration', 'تفعيل التسجيل الذاتي للطلاب', true),
  ('academy_registration_self_signup_teachers',     'true'::jsonb,  'academy_registration', 'تفعيل تسجيل الأساتذة',       true),
  ('academy_registration_require_admin_approval',   'false'::jsonb, 'academy_registration', 'موافقة أدمن قبل الدخول',     true),
  ('academy_registration_require_teacher_approval', 'true'::jsonb,  'academy_registration', 'موافقة قبل النشر',           true),
  ('academy_registration_required_fields',          '["birthdate","gender","country","level"]'::jsonb, 'academy_registration', 'الحقول الإلزامية', true),
  ('academy_registration_email_verification',       'true'::jsonb,  'academy_registration', 'التحقق من الإيميل',         true),
  ('academy_registration_welcome_message',          '""'::jsonb,    'academy_registration', 'الرسالة الترحيبية',         true),
  ('academy_registration_default_path',             'null'::jsonb,  'academy_registration', 'المسار الافتراضي',           true)
ON CONFLICT (setting_key) DO NOTHING;

-- 3.3 Courses & Content
INSERT INTO system_settings (setting_key, setting_value, setting_type, description, is_editable)
VALUES
  ('academy_courses_require_supervisor_approval', 'true'::jsonb,                                   'academy_courses', 'موافقة مشرف المحتوى',  true),
  ('academy_courses_max_video_size_mb',            '500'::jsonb,                                   'academy_courses', 'الحد الأقصى للفيديو',  true),
  ('academy_courses_max_attachment_size_mb',       '50'::jsonb,                                    'academy_courses', 'الحد الأقصى للمرفق',   true),
  ('academy_courses_allowed_formats',              '["mp4","pdf","mp3","docx","pptx"]'::jsonb,     'academy_courses', 'الصيغ المسموح بها',    true),
  ('academy_courses_storage_provider',             '"uploadthing"'::jsonb,                         'academy_courses', 'مزود التخزين',         true),
  ('academy_courses_default_video_quality',        '"720p"'::jsonb,                                'academy_courses', 'جودة الفيديو',         true),
  ('academy_courses_allow_download',               'false'::jsonb,                                 'academy_courses', 'تفعيل التحميل',        true),
  ('academy_courses_watermark_enabled',            'false'::jsonb,                                 'academy_courses', 'العلامة المائية',      true),
  ('academy_courses_watermark_text',               '""'::jsonb,                                    'academy_courses', 'نص العلامة المائية',   true)
ON CONFLICT (setting_key) DO NOTHING;

-- 3.4 Live Sessions
INSERT INTO system_settings (setting_key, setting_value, setting_type, description, is_editable)
VALUES
  ('academy_sessions_provider',                 '"livekit"'::jsonb, 'academy_sessions', 'مزود الفيديو',                 true),
  ('academy_sessions_default_duration',          '60'::jsonb,        'academy_sessions', 'مدة الجلسة الافتراضية',         true),
  ('academy_sessions_first_reminder_minutes',   '60'::jsonb,        'academy_sessions', 'التذكير الأول قبل (دقائق)',    true),
  ('academy_sessions_second_reminder_minutes',  '10'::jsonb,        'academy_sessions', 'التذكير الثاني قبل (دقائق)',    true),
  ('academy_sessions_auto_record',              'false'::jsonb,     'academy_sessions', 'التسجيل التلقائي',             true),
  ('academy_sessions_allow_student_join_anytime','true'::jsonb,      'academy_sessions', 'دخول الطلاب بدون موافقة',      true),
  ('academy_sessions_link_validity_minutes',    '120'::jsonb,       'academy_sessions', 'صلاحية رابط الجلسة',           true)
ON CONFLICT (setting_key) DO NOTHING;

-- 3.5 Gamification
INSERT INTO system_settings (setting_key, setting_value, setting_type, description, is_editable)
VALUES
  ('academy_gamification_enabled',              'true'::jsonb,                                       'academy_gamification', 'تفعيل النقاط',         true),
  ('academy_gamification_badges_enabled',       'true'::jsonb,                                       'academy_gamification', 'تفعيل الشارات',        true),
  ('academy_gamification_leaderboard_enabled',  'true'::jsonb,                                       'academy_gamification', 'تفعيل الـ Leaderboard',true),
  ('academy_gamification_streak_enabled',       'true'::jsonb,                                       'academy_gamification', 'تفعيل الـ Streak',     true),
  ('academy_gamification_points_values',
    '{"recitation_submit":10,"recitation_excellent":30,"task_complete":15,"lesson_attended":20,"streak_day":5,"juz_completed":100}'::jsonb,
    'academy_gamification', 'قيم النقاط', true),
  ('academy_gamification_streak_multiplier',    '1.5'::jsonb,                                        'academy_gamification', 'مضاعف الـ Streak',     true),
  ('academy_gamification_streak_threshold',     '7'::jsonb,                                          'academy_gamification', 'حد الـ Streak',        true),
  ('academy_gamification_levels',
    '{"beginner":{"min":0,"max":500},"intermediate":{"min":500,"max":2000},"advanced":{"min":2000,"max":5000},"hafiz":{"min":5000,"max":null}}'::jsonb,
    'academy_gamification', 'حدود المستويات', true)
ON CONFLICT (setting_key) DO NOTHING;

-- 3.6 Notifications & Email
INSERT INTO system_settings (setting_key, setting_value, setting_type, description, is_editable)
VALUES
  ('academy_notifications_in_app_enabled', 'true'::jsonb, 'academy_notifications', 'إشعارات المنصة',  true),
  ('academy_notifications_email_enabled',  'true'::jsonb, 'academy_notifications', 'إشعارات البريد',  true),
  ('academy_notifications_events',
    '{"course_decision":true,"new_task":true,"session_reminder":true,"new_badge":true,"level_up":true,"streak_warning":true,"parent_weekly_report":true}'::jsonb,
    'academy_notifications', 'أحداث الإيميل', true),
  ('academy_notifications_parent_report_day',  '"sunday"'::jsonb, 'academy_notifications', 'يوم تقرير ولي الأمر',  true),
  ('academy_notifications_parent_report_hour', '20'::jsonb,        'academy_notifications', 'ساعة تقرير ولي الأمر', true),
  ('academy_notifications_werd_reminder_hour', '5'::jsonb,         'academy_notifications', 'وقت تذكير الورد',       true)
ON CONFLICT (setting_key) DO NOTHING;

-- 3.7 Forum & Fiqh
INSERT INTO system_settings (setting_key, setting_value, setting_type, description, is_editable)
VALUES
  ('academy_forum_enabled',                  'true'::jsonb,  'academy_forum', 'تفعيل المنتدى',                  true),
  ('academy_forum_require_approval',         'false'::jsonb, 'academy_forum', 'موافقة قبل النشر',                true),
  ('academy_forum_min_points_to_post',       '0'::jsonb,     'academy_forum', 'الحد الأدنى للنقاط',              true),
  ('academy_forum_banned_words',             '[]'::jsonb,    'academy_forum', 'الكلمات الممنوعة',                true),
  ('academy_forum_fiqh_enabled',             'true'::jsonb,  'academy_forum', 'تفعيل صفحة الفقه',                true),
  ('academy_forum_fiqh_response_days',       '3'::jsonb,     'academy_forum', 'مدة الرد المتوقعة على الفقه',     true),
  ('academy_forum_fiqh_default_supervisor',  'null'::jsonb,  'academy_forum', 'مشرف فقه افتراضي',                true)
ON CONFLICT (setting_key) DO NOTHING;

-- 3.8 Security & Privacy
INSERT INTO system_settings (setting_key, setting_value, setting_type, description, is_editable)
VALUES
  ('academy_security_session_timeout',         '30'::jsonb,     'academy_security', 'مدة الجلسة (دقائق)',             true),
  ('academy_security_max_login_attempts',      '5'::jsonb,      'academy_security', 'حد محاولات الدخول الفاشلة',        true),
  ('academy_security_lock_duration',           '15'::jsonb,     'academy_security', 'مدة الحظر (دقائق)',                true),
  ('academy_security_admin_2fa',               'false'::jsonb,  'academy_security', 'تفعيل 2FA للأدمن',                true),
  ('academy_security_admin_ip_whitelist',      '[]'::jsonb,     'academy_security', 'قائمة IPs المسموح بها للأدمن',   true),
  ('academy_security_daily_upload_limit_mb',   '500'::jsonb,    'academy_security', 'حد رفع الملفات اليومي',           true),
  ('academy_security_api_rate_limit',          '100'::jsonb,    'academy_security', 'حد طلبات API/دقيقة',              true),
  ('academy_security_password_policy',
    '{"min_length":8,"require_uppercase":true,"require_lowercase":true,"require_numbers":true,"require_special":false}'::jsonb,
    'academy_security', 'سياسة كلمة السر', true),
  ('academy_security_activity_logs_enabled',   'true'::jsonb,   'academy_security', 'تفعيل سجل الأنشطة', true)
ON CONFLICT (setting_key) DO NOTHING;

-- 3.9 Maintenance
INSERT INTO system_settings (setting_key, setting_value, setting_type, description, is_editable)
VALUES
  ('academy_maintenance_mode',         'false'::jsonb,                                  'academy_maintenance', 'وضع الصيانة',                       true),
  ('academy_maintenance_message',      '"الموقع تحت الصيانة، نعود قريباً."'::jsonb,        'academy_maintenance', 'رسالة الصيانة',                     true),
  ('academy_maintenance_allowed_ips',  '[]'::jsonb,                                     'academy_maintenance', 'IPs مستثناة من الصيانة',            true)
ON CONFLICT (setting_key) DO NOTHING;

-- 4) Helpful index for fast prefix lookups
CREATE INDEX IF NOT EXISTS idx_system_settings_type ON system_settings(setting_type);
CREATE INDEX IF NOT EXISTS idx_system_settings_key_prefix ON system_settings(setting_key text_pattern_ops);
