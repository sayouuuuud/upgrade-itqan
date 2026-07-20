const { Pool } = require('pg')

const pool = new Pool({
    connectionString: 'postgresql://postgres.yonstxadonhuchfierux:5MLfJX0Il4NkvA9X@aws-1-eu-west-1.pooler.supabase.com:6543/postgres',
    ssl: { rejectUnauthorized: false }
})

async function run() {
    const steps = [
        // Page views table
        `CREATE TABLE IF NOT EXISTS page_views (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      path VARCHAR(500) NOT NULL,
      country VARCHAR(100),
      device_type VARCHAR(20) CHECK (device_type IN ('desktop','mobile','tablet','bot','unknown')),
      user_agent TEXT,
      ip_hash VARCHAR(64),
      user_id UUID REFERENCES users(id) ON DELETE SET NULL,
      referrer TEXT,
      session_id VARCHAR(64),
      created_at TIMESTAMPTZ DEFAULT NOW()
    )`,
        `CREATE INDEX IF NOT EXISTS idx_page_views_path ON page_views(path, created_at DESC)`,
        `CREATE INDEX IF NOT EXISTS idx_page_views_created ON page_views(created_at DESC)`,
        `CREATE INDEX IF NOT EXISTS idx_page_views_device ON page_views(device_type)`,

        // Security columns
        `ALTER TABLE users ADD COLUMN IF NOT EXISTS is_locked BOOLEAN DEFAULT false`,
        `ALTER TABLE users ADD COLUMN IF NOT EXISTS locked_at TIMESTAMPTZ`,
        `ALTER TABLE users ADD COLUMN IF NOT EXISTS failed_login_count INTEGER DEFAULT 0`,
        `ALTER TABLE users ADD COLUMN IF NOT EXISTS last_failed_login_at TIMESTAMPTZ`,

        // SEO settings
        `INSERT INTO system_settings (setting_key, setting_value, setting_type, description, is_public) VALUES ('seo_site_title', '"متقن الفاتحة | منصة تعلم القرآن الكريم"', 'seo', 'Site title for SEO', true) ON CONFLICT (setting_key) DO NOTHING`,
        `INSERT INTO system_settings (setting_key, setting_value, setting_type, description, is_public) VALUES ('seo_site_description', '"منصة متقن الفاتحة - سجّل تلاوتك واحصل على تقييم مفصّل من مقرئين معتمدين. احتراف سورة الفاتحة خطوة بخطوة"', 'seo', 'Meta description', true) ON CONFLICT (setting_key) DO NOTHING`,
        `INSERT INTO system_settings (setting_key, setting_value, setting_type, description, is_public) VALUES ('seo_keywords', '"تلاوة القرآن, متقن الفاتحة, تعلم القرآن, مقرئين معتمدين, تجويد"', 'seo', 'Keywords', true) ON CONFLICT (setting_key) DO NOTHING`,
        `INSERT INTO system_settings (setting_key, setting_value, setting_type, description, is_public) VALUES ('seo_og_image', '""', 'seo', 'OG Image URL', true) ON CONFLICT (setting_key) DO NOTHING`,
        `INSERT INTO system_settings (setting_key, setting_value, setting_type, description, is_public) VALUES ('seo_robots', '"index, follow"', 'seo', 'Robots meta', false) ON CONFLICT (setting_key) DO NOTHING`,
        `INSERT INTO system_settings (setting_key, setting_value, setting_type, description, is_public) VALUES ('seo_google_verification', '""', 'seo', 'Google verification token', false) ON CONFLICT (setting_key) DO NOTHING`,
        `INSERT INTO system_settings (setting_key, setting_value, setting_type, description, is_public) VALUES ('seo_twitter_site', '""', 'seo', 'Twitter/X username', false) ON CONFLICT (setting_key) DO NOTHING`,
        `INSERT INTO system_settings (setting_key, setting_value, setting_type, description, is_public) VALUES ('seo_canonical_base', '"https://itqaan.com"', 'seo', 'Canonical base URL', true) ON CONFLICT (setting_key) DO NOTHING`,

        // Homepage CMS settings
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
        `INSERT INTO system_settings (setting_key, setting_value, setting_type, description, is_public) VALUES ('maintenance_banner_color', '"#f59e0b"', 'homepage', 'Maintenance banner background color', true) ON CONFLICT (setting_key) DO NOTHING`,
        `INSERT INTO system_settings (setting_key, setting_value, setting_type, description, is_public) VALUES ('maintenance_full_page', 'false', 'homepage', 'Show full maintenance page (else just banner)', true) ON CONFLICT (setting_key) DO NOTHING`,

        // Analytics index
        `CREATE INDEX IF NOT EXISTS idx_activity_logs_action_created ON activity_logs(action, created_at DESC)`,
    ]

    for (const sql of steps) {
        try {
            await pool.query(sql)
            const short = sql.replace(/\s+/g, ' ').substring(0, 70)
            console.log('OK:', short)
        } catch (e) {
            const short = sql.replace(/\s+/g, ' ').substring(0, 70)
            console.error('ERR:', short, '->', e.message)
        }
    }
    await pool.end()
    console.log('\nDone!')
}
run()
