"use client"

import { Globe } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { SectionCard } from "./section-card"

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
  return (
    <SectionCard
      icon={Globe}
      title="هوية الموقع"
      description="الإعدادات العامة التي تخص المنصة بالكامل"
    >
      <div className="grid gap-4 md:grid-cols-2">
        <Field
          id="platform_name"
          label="اسم المنصة"
          value={settings.platform_name ?? settings.site_name}
          placeholder="منصة إتقان"
          onChange={(v) => onUpdate("platform_name", v)}
        />
        <Field
          id="site_tagline"
          label="الشعار النصي"
          value={settings.site_tagline}
          placeholder="لإتقان تلاوة القرآن الكريم"
          onChange={(v) => onUpdate("site_tagline", v)}
        />
        <Field
          id="app_url"
          label="رابط التطبيق"
          value={settings.app_url}
          placeholder="https://example.com"
          onChange={(v) => onUpdate("app_url", v)}
        />
        <Field
          id="site_default_language"
          label="اللغة الافتراضية"
          value={settings.site_default_language}
          placeholder="ar"
          onChange={(v) => onUpdate("site_default_language", v)}
        />
        <Field
          id="site_timezone"
          label="المنطقة الزمنية"
          value={settings.site_timezone}
          placeholder="Africa/Cairo"
          onChange={(v) => onUpdate("site_timezone", v)}
        />
        <Field
          id="site_contact_email"
          label="بريد التواصل"
          type="email"
          value={settings.site_contact_email}
          placeholder="info@example.com"
          onChange={(v) => onUpdate("site_contact_email", v)}
        />
        <Field
          id="site_contact_phone"
          label="هاتف التواصل"
          value={settings.site_contact_phone}
          placeholder="+20..."
          onChange={(v) => onUpdate("site_contact_phone", v)}
        />
      </div>
    </SectionCard>
  )
}
