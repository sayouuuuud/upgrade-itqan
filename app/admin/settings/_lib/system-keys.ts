// ============================================================================
// System (Super Admin) settings — canonical key → setting_type map.
// These are the ONLY keys the /api/system/settings endpoint may read or write.
// Keys are the real, consumed key names (no rename) — ownership is expressed by
// the setting_type value (system_*). Keep this in sync with migration 067.
// ============================================================================

export const SYSTEM_KEY_TYPES: Record<string, string> = {
  // Identity / general site config
  platform_name: "system_general",
  site_name: "system_general",
  site_tagline: "system_general",
  app_url: "system_general",
  site_default_language: "system_general",
  site_timezone: "system_general",
  site_contact_email: "system_general",
  site_contact_phone: "system_general",
  social_links: "system_general",
  site_social_links: "system_general",
  contact_info: "system_general",
  site_info: "system_general",

  // Email / SMTP
  smtp_host: "system_email",
  smtp_port: "system_email",
  smtp_user: "system_email",
  smtp_pass: "system_email",
  smtp_tls: "system_email",
  smtp_config: "system_email",

  // Security / privacy
  activity_logging: "system_security",
  limit_login_attempts: "system_security",
  two_factor_auth: "system_security",
  security_settings: "system_security",

  // Notifications
  resend_email_on_result_change: "system_notifications",
  resend_email_on_result_update: "system_notifications",
  notification_settings: "system_notifications",

  // Maintenance (with scope)
  maintenance_enabled: "system_maintenance",
  maintenance_scope: "system_maintenance",
  maintenance_message: "system_maintenance",

  // SEO
  seo_title: "system_seo",
  seo_description: "system_seo",
  seo_keywords: "system_seo",
  seo_og_image: "system_seo",
  seo_robots: "system_seo",
  seo_canonical_base: "system_seo",
  seo_google_verification: "system_seo",
  seo_twitter_site: "system_seo",
  // legacy aliases kept for backward compat
  seo_site_title: "system_seo",
  seo_site_description: "system_seo",
}

export function isSystemKey(key: string): boolean {
  return Object.prototype.hasOwnProperty.call(SYSTEM_KEY_TYPES, key)
}

export function systemTypeForKey(key: string): string | null {
  return SYSTEM_KEY_TYPES[key] ?? null
}

export type MaintenanceScope = "site" | "academy" | "maqraah"
