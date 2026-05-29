-- ============================================
-- Migration 044: Maqraah System Settings Support
-- ============================================
-- Adds comprehensive maqraah-specific settings to system_settings.
-- The maqraah is the primary "system", so it owns the global/system-level
-- keys (smtp_config, storage_config, app_url, branding, contact_info,
-- reader_assignment_strategy) while academy_* and maqraah_* hold each
-- platform's domain-specific settings.
--
-- The setting_type CHECK constraint was already dropped in migration 042,
-- so new maqraah_* setting_type buckets are validated at the app layer only.

-- ────────────────────────────────────────────
-- 1) General / System (maqraah identity + locale)
-- ────────────────────────────────────────────
INSERT INTO system_settings (setting_key, setting_value, setting_type, description, is_editable)
VALUES
  ('maqraah_general_name',          '"مقرأة إتقان"'::jsonb,  'maqraah_general', 'اسم المنصة',         true),
  ('maqraah_general_description',   '""'::jsonb,            'maqraah_general', 'وصف المنصة',         true),
  ('maqraah_general_timezone',      '"Asia/Riyadh"'::jsonb, 'maqraah_general', 'المنطقة الزمنية',    true),
  ('maqraah_general_language',      '"ar"'::jsonb,          'maqraah_general', 'اللغة الافتراضية',   true),
  ('maqraah_general_direction',     '"rtl"'::jsonb,         'maqraah_general', 'اتجاه الواجهة',      true)
ON CONFLICT (setting_key) DO NOTHING;

-- ────────────────────────────────────────────
-- 2) Readers & Applications (المقرئون والطلبات)
-- ────────────────────────────────────────────
INSERT INTO system_settings (setting_key, setting_value, setting_type, description, is_editable)
VALUES
  ('maqraah_readers_student_self_signup',   'true'::jsonb,  'maqraah_readers', 'تسجيل ذاتي للطلاب',                  true),
  ('maqraah_readers_accept_applications',   'true'::jsonb,  'maqraah_readers', 'استقبال طلبات المقرئين',             true),
  ('maqraah_readers_require_approval',      'true'::jsonb,  'maqraah_readers', 'موافقة الأدمن على المقرئ',           true),
  ('maqraah_readers_require_ijazah',        'false'::jsonb, 'maqraah_readers', 'اشتراط الإجازة للمقرئ',              true),
  ('maqraah_readers_min_memorization_juz',  '0'::jsonb,     'maqraah_readers', 'الحد الأدنى لحفظ المقرئ (أجزاء)',    true),
  ('maqraah_readers_max_students',          '20'::jsonb,    'maqraah_readers', 'أقصى عدد طلاب لكل مقرئ',             true),
  ('maqraah_readers_allow_student_choose',  'true'::jsonb,  'maqraah_readers', 'السماح للطالب باختيار المقرئ',       true),
  ('maqraah_readers_gender_match',          'true'::jsonb,  'maqraah_readers', 'مطابقة الجنس بين المقرئ والطالب',    true)
ON CONFLICT (setting_key) DO NOTHING;

-- ────────────────────────────────────────────
-- 3) Halaqat & Sessions (الحلقات والجلسات)
-- ────────────────────────────────────────────
INSERT INTO system_settings (setting_key, setting_value, setting_type, description, is_editable)
VALUES
  ('maqraah_halaqat_max_students',              '8'::jsonb,         'maqraah_halaqat', 'عدد الطلاب في الحلقة',          true),
  ('maqraah_halaqat_session_duration',          '30'::jsonb,        'maqraah_halaqat', 'مدة الجلسة (دقائق)',            true),
  ('maqraah_halaqat_provider',                  '"livekit"'::jsonb, 'maqraah_halaqat', 'مزود الفيديو',                 true),
  ('maqraah_halaqat_first_reminder_minutes',    '60'::jsonb,        'maqraah_halaqat', 'التذكير الأول قبل (دقائق)',     true),
  ('maqraah_halaqat_second_reminder_minutes',   '10'::jsonb,        'maqraah_halaqat', 'التذكير الثاني قبل (دقائق)',    true),
  ('maqraah_halaqat_auto_record',               'false'::jsonb,     'maqraah_halaqat', 'التسجيل التلقائي',             true),
  ('maqraah_halaqat_allow_join_anytime',        'true'::jsonb,      'maqraah_halaqat', 'دخول الطلاب بدون موافقة',       true),
  ('maqraah_halaqat_link_validity_minutes',     '120'::jsonb,       'maqraah_halaqat', 'صلاحية رابط الجلسة (دقائق)',    true),
  ('maqraah_halaqat_late_grace_minutes',        '5'::jsonb,         'maqraah_halaqat', 'مهلة التأخير (دقائق)',          true),
  ('maqraah_halaqat_absence_limit',             '3'::jsonb,         'maqraah_halaqat', 'حد الغياب قبل الإنذار',         true)
ON CONFLICT (setting_key) DO NOTHING;

-- ────────────────────────────────────────────
-- 4) Recitations & Evaluation (التلاوات والتقييم)
-- ────────────────────────────────────────────
INSERT INTO system_settings (setting_key, setting_value, setting_type, description, is_editable)
VALUES
  ('maqraah_recitations_allowed_audio_formats', '["mp3","m4a","ogg","wav"]'::jsonb,        'maqraah_recitations', 'صيغ الصوت المسموحة',       true),
  ('maqraah_recitations_max_audio_size_mb',     '25'::jsonb,                               'maqraah_recitations', 'أقصى حجم تسجيل صوتي',       true),
  ('maqraah_recitations_allow_video',           'false'::jsonb,                            'maqraah_recitations', 'السماح بتلاوات فيديو',      true),
  ('maqraah_recitations_max_video_size_mb',     '100'::jsonb,                              'maqraah_recitations', 'أقصى حجم فيديو',            true),
  ('maqraah_recitations_default_riwayah',       '"hafs"'::jsonb,                           'maqraah_recitations', 'الرواية الافتراضية',        true),
  ('maqraah_recitations_available_riwayat',     '["hafs","warsh","qalun","duri"]'::jsonb,  'maqraah_recitations', 'الروايات المتاحة',          true),
  ('maqraah_recitations_rating_scale',          '5'::jsonb,                                'maqraah_recitations', 'سلم التقييم',               true),
  ('maqraah_recitations_passing_score',         '3'::jsonb,                                'maqraah_recitations', 'درجة النجاح',               true),
  ('maqraah_recitations_require_feedback',      'true'::jsonb,                             'maqraah_recitations', 'إلزام ملاحظات المقرئ',      true),
  ('maqraah_recitations_allow_retry',           'true'::jsonb,                             'maqraah_recitations', 'السماح بإعادة التلاوة',     true),
  ('maqraah_recitations_track_tajweed_errors',  'true'::jsonb,                             'maqraah_recitations', 'تتبع أخطاء التجويد',        true)
ON CONFLICT (setting_key) DO NOTHING;

-- ────────────────────────────────────────────
-- 5) Memorization & Tajweed Paths (مسارات الحفظ والتجويد)
-- ────────────────────────────────────────────
INSERT INTO system_settings (setting_key, setting_value, setting_type, description, is_editable)
VALUES
  ('maqraah_paths_memorization_enabled',  'true'::jsonb,           'maqraah_paths', 'تفعيل مسار الحفظ',                 true),
  ('maqraah_paths_tajweed_enabled',       'true'::jsonb,           'maqraah_paths', 'تفعيل مسار التجويد',               true),
  ('maqraah_paths_default_path',          '"memorization"'::jsonb, 'maqraah_paths', 'المسار الافتراضي',                 true),
  ('maqraah_paths_sequential_unlock',     'true'::jsonb,           'maqraah_paths', 'فتح المراحل بالترتيب',             true),
  ('maqraah_paths_unlock_threshold',      '80'::jsonb,             'maqraah_paths', 'نسبة الإتقان لفتح المرحلة (%)',    true),
  ('maqraah_paths_daily_target_verses',   '5'::jsonb,              'maqraah_paths', 'هدف الحفظ اليومي (آيات)',          true),
  ('maqraah_paths_weekly_target_verses',  '30'::jsonb,             'maqraah_paths', 'هدف الحفظ الأسبوعي (آيات)',        true),
  ('maqraah_paths_revision_ratio',        '5'::jsonb,              'maqraah_paths', 'نسبة المراجعة للحفظ الجديد',       true),
  ('maqraah_paths_memorization_order',    '"mushaf"'::jsonb,       'maqraah_paths', 'ترتيب الحفظ',                      true)
ON CONFLICT (setting_key) DO NOTHING;

-- ────────────────────────────────────────────
-- 6) Points, Levels & Badges (النقاط والمستويات والشارات)
-- ────────────────────────────────────────────
INSERT INTO system_settings (setting_key, setting_value, setting_type, description, is_editable)
VALUES
  ('maqraah_points_enabled',             'true'::jsonb, 'maqraah_points', 'تفعيل النقاط',          true),
  ('maqraah_points_badges_enabled',      'true'::jsonb, 'maqraah_points', 'تفعيل الشارات',         true),
  ('maqraah_points_leaderboard_enabled', 'true'::jsonb, 'maqraah_points', 'تفعيل المتصدرين',       true),
  ('maqraah_points_streak_enabled',      'true'::jsonb, 'maqraah_points', 'تفعيل سلسلة الأيام',    true),
  ('maqraah_points_values',
    '{"recitation_submit":10,"recitation_excellent":30,"session_attended":20,"daily_target_met":15,"juz_completed":100,"khatma_completed":500,"streak_day":5}'::jsonb,
    'maqraah_points', 'قيم النقاط', true),
  ('maqraah_points_streak_multiplier',   '1.5'::jsonb,  'maqraah_points', 'مضاعف السلسلة',         true),
  ('maqraah_points_streak_threshold',    '7'::jsonb,    'maqraah_points', 'حد السلسلة',            true),
  ('maqraah_points_levels',
    '{"mubtadi":{"min":0,"max":500},"mutqin":{"min":500,"max":2000},"hafiz":{"min":2000,"max":5000},"mujaz":{"min":5000,"max":null}}'::jsonb,
    'maqraah_points', 'حدود المستويات', true)
ON CONFLICT (setting_key) DO NOTHING;

-- ────────────────────────────────────────────
-- 7) Competitions & Certificates (المسابقات والشهادات)
-- ────────────────────────────────────────────
INSERT INTO system_settings (setting_key, setting_value, setting_type, description, is_editable)
VALUES
  ('maqraah_competitions_enabled',                'true'::jsonb,      'maqraah_competitions', 'تفعيل المسابقات',                true),
  ('maqraah_competitions_auto_enroll',            'false'::jsonb,     'maqraah_competitions', 'التسجيل التلقائي بالمسابقات',     true),
  ('maqraah_competitions_min_level',              '"mutqin"'::jsonb,  'maqraah_competitions', 'أدنى مستوى للمشاركة',            true),
  ('maqraah_competitions_certificates_enabled',   'true'::jsonb,      'maqraah_competitions', 'تفعيل الشهادات',                 true),
  ('maqraah_competitions_certificate_signature',  '""'::jsonb,        'maqraah_competitions', 'اسم الموقّع على الشهادة',         true),
  ('maqraah_competitions_certificate_logo',       '""'::jsonb,        'maqraah_competitions', 'شعار الشهادة',                   true),
  ('maqraah_competitions_certificate_template',   '"classic"'::jsonb, 'maqraah_competitions', 'قالب الشهادة',                   true),
  ('maqraah_competitions_passing_percentage',     '80'::jsonb,        'maqraah_competitions', 'نسبة اجتياز الشهادة (%)',         true),
  ('maqraah_competitions_auto_issue_certificate', 'true'::jsonb,      'maqraah_competitions', 'إصدار الشهادة تلقائياً',          true)
ON CONFLICT (setting_key) DO NOTHING;

-- ────────────────────────────────────────────
-- 8) Notifications & Email (الإشعارات والبريد)
--    SMTP itself is stored in the global smtp_config key (shared/system-wide)
-- ────────────────────────────────────────────
INSERT INTO system_settings (setting_key, setting_value, setting_type, description, is_editable)
VALUES
  ('maqraah_notifications_in_app_enabled',      'true'::jsonb,      'maqraah_notifications', 'إشعارات المنصة',          true),
  ('maqraah_notifications_email_enabled',       'true'::jsonb,      'maqraah_notifications', 'إشعارات البريد',          true),
  ('maqraah_notifications_events',
    '{"session_reminder":true,"recitation_evaluated":true,"new_badge":true,"level_up":true,"streak_warning":true,"competition_announcement":true,"certificate_issued":true}'::jsonb,
    'maqraah_notifications', 'أحداث الإيميل', true),
  ('maqraah_notifications_parent_report_enabled', 'true'::jsonb,    'maqraah_notifications', 'تقرير ولي الأمر',         true),
  ('maqraah_notifications_parent_report_day',     '"sunday"'::jsonb, 'maqraah_notifications', 'يوم تقرير ولي الأمر',    true),
  ('maqraah_notifications_parent_report_hour',    '20'::jsonb,       'maqraah_notifications', 'ساعة تقرير ولي الأمر',   true),
  ('maqraah_notifications_session_reminder_hour', '5'::jsonb,        'maqraah_notifications', 'وقت تذكير الجلسة',       true)
ON CONFLICT (setting_key) DO NOTHING;

-- ────────────────────────────────────────────
-- 9) Security & Privacy (الأمان والخصوصية)
-- ────────────────────────────────────────────
INSERT INTO system_settings (setting_key, setting_value, setting_type, description, is_editable)
VALUES
  ('maqraah_security_session_timeout',       '30'::jsonb,    'maqraah_security', 'مدة الجلسة (دقائق)',            true),
  ('maqraah_security_max_login_attempts',    '5'::jsonb,     'maqraah_security', 'حد محاولات الدخول الفاشلة',      true),
  ('maqraah_security_lock_duration',         '15'::jsonb,    'maqraah_security', 'مدة الحظر (دقائق)',              true),
  ('maqraah_security_admin_2fa',             'false'::jsonb, 'maqraah_security', 'تفعيل 2FA للأدمن',              true),
  ('maqraah_security_admin_ip_whitelist',    '[]'::jsonb,    'maqraah_security', 'قائمة IPs المسموح بها للأدمن',  true),
  ('maqraah_security_daily_upload_limit_mb', '500'::jsonb,   'maqraah_security', 'حد رفع الملفات اليومي',         true),
  ('maqraah_security_api_rate_limit',        '100'::jsonb,   'maqraah_security', 'حد طلبات API/دقيقة',            true),
  ('maqraah_security_password_policy',
    '{"min_length":8,"require_uppercase":true,"require_lowercase":true,"require_numbers":true,"require_special":false}'::jsonb,
    'maqraah_security', 'سياسة كلمة السر', true),
  ('maqraah_security_activity_logs_enabled', 'true'::jsonb,  'maqraah_security', 'تفعيل سجل الأنشطة', true)
ON CONFLICT (setting_key) DO NOTHING;

-- ────────────────────────────────────────────
-- 10) Maintenance (الصيانة)
-- ────────────────────────────────────────────
INSERT INTO system_settings (setting_key, setting_value, setting_type, description, is_editable)
VALUES
  ('maqraah_maintenance_mode',        'false'::jsonb,                              'maqraah_maintenance', 'وضع الصيانة',            true),
  ('maqraah_maintenance_message',     '"المقرأة تحت الصيانة، نعود قريباً."'::jsonb,   'maqraah_maintenance', 'رسالة الصيانة',          true),
  ('maqraah_maintenance_allowed_ips', '[]'::jsonb,                                 'maqraah_maintenance', 'IPs مستثناة من الصيانة', true)
ON CONFLICT (setting_key) DO NOTHING;

-- ────────────────────────────────────────────
-- 11) Ensure global/system keys exist (owned by the maqraah system tab)
--     Sensitive keys (smtp_config, storage_config) are NOT seeded here;
--     they are written only when an admin saves real credentials.
-- ────────────────────────────────────────────
INSERT INTO system_settings (setting_key, setting_value, setting_type, description, is_editable)
VALUES
  ('reader_assignment_strategy', '"least_booked_today"'::jsonb, 'general', 'استراتيجية توزيع المقرئين', true),
  ('app_url',                    '""'::jsonb,                   'general', 'رابط الموقع',               true),
  ('branding',                   '{}'::jsonb,                   'general', 'هوية العلامة التجارية',     true),
  ('contact_info',               '{}'::jsonb,                   'general', 'معلومات التواصل',           true)
ON CONFLICT (setting_key) DO NOTHING;
