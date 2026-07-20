const { Pool } = require('pg')

const pool = new Pool({
    connectionString: 'postgresql://postgres.yonstxadonhuchfierux:5MLfJX0Il4NkvA9X@aws-1-eu-west-1.pooler.supabase.com:6543/postgres',
    ssl: { rejectUnauthorized: false }
})

async function run() {
    const steps = [
        // Fix the setting_type CHECK constraint to allow 'seo' and 'homepage'
        `ALTER TABLE system_settings DROP CONSTRAINT IF EXISTS system_settings_setting_type_check`,
        `ALTER TABLE system_settings ADD CONSTRAINT system_settings_setting_type_check
     CHECK (setting_type IN ('email','storage','workflow','security','general','payment','notification','seo','homepage'))`,

        // SEO settings
        `INSERT INTO system_settings (setting_key, setting_value, setting_type, description, is_public) VALUES ('seo_site_title', '"متقن الفاتحة | منصة تعلم القرآن الكريم"', 'seo', 'Site title', true) ON CONFLICT (setting_key) DO NOTHING`,
        `INSERT INTO system_settings (setting_key, setting_value, setting_type, description, is_public) VALUES ('seo_site_description', '"منصة متقن الفاتحة - سجّل تلاوتك واحصل على تقييم مفصّل من مقرئين معتمدين"', 'seo', 'Meta description', true) ON CONFLICT (setting_key) DO NOTHING`,
        `INSERT INTO system_settings (setting_key, setting_value, setting_type, description, is_public) VALUES ('seo_keywords', '"تلاوة القرآن, متقن الفاتحة, تعلم القرآن, مقرئين معتمدين, تجويد"', 'seo', 'Keywords', true) ON CONFLICT (setting_key) DO NOTHING`,
        `INSERT INTO system_settings (setting_key, setting_value, setting_type, description, is_public) VALUES ('seo_og_image', '""', 'seo', 'OG Image URL', true) ON CONFLICT (setting_key) DO NOTHING`,
        `INSERT INTO system_settings (setting_key, setting_value, setting_type, description, is_public) VALUES ('seo_robots', '"index, follow"', 'seo', 'Robots meta', false) ON CONFLICT (setting_key) DO NOTHING`,
        `INSERT INTO system_settings (setting_key, setting_value, setting_type, description, is_public) VALUES ('seo_google_verification', '""', 'seo', 'Google verification', false) ON CONFLICT (setting_key) DO NOTHING`,
        `INSERT INTO system_settings (setting_key, setting_value, setting_type, description, is_public) VALUES ('seo_twitter_site', '""', 'seo', 'Twitter/X account', false) ON CONFLICT (setting_key) DO NOTHING`,
        `INSERT INTO system_settings (setting_key, setting_value, setting_type, description, is_public) VALUES ('seo_canonical_base', '"https://itqaan.com"', 'seo', 'Canonical base URL', true) ON CONFLICT (setting_key) DO NOTHING`,

        // Homepage CMS
        `INSERT INTO system_settings (setting_key, setting_value, setting_type, description, is_public) VALUES ('homepage_hero_title', '"أتقِن سورة الفاتحة"', 'homepage', 'Hero title', true) ON CONFLICT (setting_key) DO NOTHING`,
        `INSERT INTO system_settings (setting_key, setting_value, setting_type, description, is_public) VALUES ('homepage_hero_subtitle', '"سجّل تلاوتك واحصل على تقييم مفصّل من مقرئين معتمدين. تعلّم أحكام التجويد وحسّن أداءك خطوة بخطوة"', 'homepage', 'Hero subtitle', true) ON CONFLICT (setting_key) DO NOTHING`,
        `INSERT INTO system_settings (setting_key, setting_value, setting_type, description, is_public) VALUES ('homepage_cta_primary_text', '"سجّل تلاوتك الآن"', 'homepage', 'CTA primary button text', true) ON CONFLICT (setting_key) DO NOTHING`,
        `INSERT INTO system_settings (setting_key, setting_value, setting_type, description, is_public) VALUES ('homepage_cta_primary_link', '"/register"', 'homepage', 'CTA primary button link', true) ON CONFLICT (setting_key) DO NOTHING`,
        `INSERT INTO system_settings (setting_key, setting_value, setting_type, description, is_public) VALUES ('homepage_cta_secondary_text', '"تعرف على المنصة"', 'homepage', 'CTA secondary text', true) ON CONFLICT (setting_key) DO NOTHING`,
        `INSERT INTO system_settings (setting_key, setting_value, setting_type, description, is_public) VALUES ('homepage_show_stats', 'true', 'homepage', 'Show statistics section', true) ON CONFLICT (setting_key) DO NOTHING`,
        `INSERT INTO system_settings (setting_key, setting_value, setting_type, description, is_public) VALUES ('homepage_show_features', 'true', 'homepage', 'Show features section', true) ON CONFLICT (setting_key) DO NOTHING`,
        `INSERT INTO system_settings (setting_key, setting_value, setting_type, description, is_public) VALUES ('homepage_show_testimonials', 'true', 'homepage', 'Show testimonials section', true) ON CONFLICT (setting_key) DO NOTHING`,
        `INSERT INTO system_settings (setting_key, setting_value, setting_type, description, is_public) VALUES ('maintenance_mode', 'false', 'homepage', 'Maintenance mode active', true) ON CONFLICT (setting_key) DO NOTHING`,
        `INSERT INTO system_settings (setting_key, setting_value, setting_type, description, is_public) VALUES ('maintenance_message', '"الموقع تحت الصيانة حاليًا، نعود قريبًا 🔧"', 'homepage', 'Maintenance message', true) ON CONFLICT (setting_key) DO NOTHING`,
        `INSERT INTO system_settings (setting_key, setting_value, setting_type, description, is_public) VALUES ('maintenance_banner_color', '"#f59e0b"', 'homepage', 'Maintenance banner color', true) ON CONFLICT (setting_key) DO NOTHING`,
        `INSERT INTO system_settings (setting_key, setting_value, setting_type, description, is_public) VALUES ('maintenance_full_page', 'false', 'homepage', 'Full maintenance page mode', true) ON CONFLICT (setting_key) DO NOTHING`,
    ]

    for (const sql of steps) {
        try {
            await pool.query(sql)
            console.log('OK:', sql.replace(/\s+/g, ' ').substring(0, 70))
        } catch (e) {
            console.error('ERR:', sql.replace(/\s+/g, ' ').substring(0, 70), '->', e.message)
        }
    }
    await pool.end()
    console.log('Done!')
}
run()
