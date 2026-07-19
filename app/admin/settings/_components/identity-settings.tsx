"use client"

import { Globe } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { SectionCard } from "./section-card"
import { useI18n } from "@/lib/i18n/context"

interface Props {
  settings: Record<string, any>
  onUpdate: (key: string, value: any) => void
}

function Field({
  id,
  label,
  value,
  placeholder,
  type = "text",
  onChange,
}: {
  id: string
  label: string
  value: any
  placeholder?: string
  type?: string
  onChange: (v: string) => void
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        type={type}
        value={value ?? ""}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  )
}

export function IdentitySettings({ settings, onUpdate }: Props) {
  const { t } = useI18n()
  const a = t.admin

  return (
    <SectionCard
      icon={Globe}
      title={a.ssIdentity}
      description={a.ssIdentityDesc}
    >
      <div className="grid gap-4 md:grid-cols-2">
        <Field
          id="platform_name"
          label={a.ssPlatformName}
          value={settings.platform_name ?? settings.site_name}
          placeholder={a.ssPlatformNamePlaceholder}
          onChange={(v) => onUpdate("platform_name", v)}
        />
        <Field
          id="site_tagline"
          label={a.ssSiteTagline}
          value={settings.site_tagline}
          placeholder={a.ssSiteTaglinePlaceholder}
          onChange={(v) => onUpdate("site_tagline", v)}
        />
        <Field
          id="app_url"
          label={a.ssAppUrl}
          value={settings.app_url}
          placeholder={a.ssAppUrlHint || "https://example.com"}
          onChange={(v) => onUpdate("app_url", v)}
        />
        <Field
          id="site_default_language"
          label={a.ssDefaultLanguage}
          value={settings.site_default_language}
          placeholder="ar"
          onChange={(v) => onUpdate("site_default_language", v)}
        />
        <Field
          id="site_timezone"
          label={a.ssTimezone}
          value={settings.site_timezone}
          placeholder={a.ssTimezoneHint || "Africa/Cairo"}
          onChange={(v) => onUpdate("site_timezone", v)}
        />
        <Field
          id="site_contact_email"
          label={a.ssOfficialEmail}
          type="email"
          value={settings.site_contact_email}
          placeholder="info@example.com"
          onChange={(v) => onUpdate("site_contact_email", v)}
        />
        <Field
          id="site_contact_phone"
          label={a.ssPhone}
          value={settings.site_contact_phone}
          placeholder="+20..."
          onChange={(v) => onUpdate("site_contact_phone", v)}
        />
      </div>
    </SectionCard>
  )
}
