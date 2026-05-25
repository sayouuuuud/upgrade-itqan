-- =============================================================================
-- 036 — Homepage CMS settings
-- =============================================================================
-- Goal:
--   Make /admin/homepage actually drive what visitors see on the public
--   homepage (app/page.tsx). Until now the admin page persisted settings into
--   system_settings.setting_type='homepage' but the homepage never read them.
--
--   This migration:
--     1) Extends the system_settings.setting_type CHECK constraint to allow
--        'homepage' (defensive — migrate-006b.js already does this, but we
--        ensure it's present so /api/admin/homepage doesn't 23514 on a fresh
--        environment that skipped the JS migrations).
--     2) Seeds default values for the homepage CMS keys (including the new
--        ones introduced in this PR: hero_description, cta_secondary_link,
--        primary_color, accent_color) so /api/homepage has something to
--        return even before an admin saves the form for the first time.
--
-- IMPORTANT: This file is intentionally NOT auto-executed. Review then run:
--     psql "$DATABASE_URL" -f scripts/036-homepage-cms.sql
-- =============================================================================

BEGIN;

ALTER TABLE system_settings DROP CONSTRAINT IF EXISTS system_settings_setting_type_check;
ALTER TABLE system_settings ADD CONSTRAINT system_settings_setting_type_check
  CHECK (setting_type IN (
    'email','storage','workflow','security','general',
    'payment','notification','seo','homepage'
  ));

-- ---------------------------------------------------------------------------
-- Seed homepage CMS defaults. ON CONFLICT DO NOTHING so existing admin
-- edits are never overwritten.
-- ---------------------------------------------------------------------------
INSERT INTO system_settings (setting_key, setting_value, setting_type, description, is_public) VALUES
  ('homepage_hero_title',         '"إتقانُ التِلاوة"',                                                                                                                                                                  'homepage', 'Hero headline',                          true),
  ('homepage_hero_subtitle',      '"ورحلةُ التَعَلُّم"',                                                                                                                                                                'homepage', 'Hero subheadline',                       true),
  ('homepage_hero_description',   '"مِنبرٌ علميٌّ يجمع بين أكاديميَّةٍ راسخةٍ للدُّروسِ والشَّهادات، ومَقْرأةٍ روحانيَّةٍ للحفظِ والتَّسميعِ بإشرافِ المقرِئينَ المُجازين."', 'homepage', 'Hero description paragraph',             true),
  ('homepage_cta_primary_text',   '"الأكاديميَّة"',                                                                                                                                                                     'homepage', 'Primary CTA label',                       true),
  ('homepage_cta_primary_link',   '"/academy/student"',                                                                                                                                                                  'homepage', 'Primary CTA destination',                 true),
  ('homepage_cta_secondary_text', '"المَقْرأة"',                                                                                                                                                                         'homepage', 'Secondary CTA label',                     true),
  ('homepage_cta_secondary_link', '"/student"',                                                                                                                                                                            'homepage', 'Secondary CTA destination',               true),
  ('homepage_primary_color',      '"#0F2A44"',                                                                                                                                                                              'homepage', 'Primary brand color (title)',             true),
  ('homepage_accent_color',       '"#B08D57"',                                                                                                                                                                              'homepage', 'Accent brand color (subtitle)',           true),
  ('homepage_show_stats',         'true',                                                                                                                                                                                   'homepage', 'Show the stats grid in the hero',         true),
  ('homepage_show_features',      'true',                                                                                                                                                                                   'homepage', 'Show the features section',               true),
  ('homepage_show_testimonials',  'true',                                                                                                                                                                                   'homepage', 'Show the testimonials marquee',           true),
  ('maintenance_mode',            'false',                                                                                                                                                                                  'homepage', 'Whether maintenance mode is enabled',     true),
  ('maintenance_message',         '"الموقع تحت الصيانة حاليًا، نعود قريبًا 🔧"',                                                                                                                                          'homepage', 'Maintenance banner / page message',       true),
  ('maintenance_banner_color',    '"#f59e0b"',                                                                                                                                                                              'homepage', 'Maintenance banner background color',     true),
  ('maintenance_full_page',       'false',                                                                                                                                                                                  'homepage', 'When true, replace homepage with full maintenance screen', true)
ON CONFLICT (setting_key) DO NOTHING;

COMMIT;

-- Verification:
--   SELECT setting_key, setting_value FROM system_settings WHERE setting_type = 'homepage' ORDER BY setting_key;
