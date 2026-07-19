"use client"

import { Mail } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { SectionCard } from "./section-card"
import { useI18n } from "@/lib/i18n/context"

interface EmailSettingsProps {
  settings: Record<string, any>
  onUpdate: (key: string, value: any) => void
}

export function EmailSettings({ settings, onUpdate }: EmailSettingsProps) {
  const { t } = useI18n()
  const a = t.admin
  
  // Canonical consumer is getSetting("smtp_config") in lib/settings.ts
  const smtp = settings.smtp_config || {}

  const handleSmtpChange = (field: string, value: any) => {
    onUpdate("smtp_config", { ...smtp, [field]: value })
  }

  return (
    <SectionCard
      icon={Mail}
      title={a.ssEmailSmtpSettings}
      description={a.ssEmailSmtpDesc}
    >
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="smtp_host">{a.ssSmtpServer}</Label>
          <Input
            id="smtp_host"
            value={smtp.host || ""}
            onChange={(e) => handleSmtpChange("host", e.target.value)}
            placeholder="smtp.gmail.com"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="smtp_port">{a.ssSmtpPort}</Label>
          <Input
            id="smtp_port"
            type="number"
            value={smtp.port || ""}
            onChange={(e) => handleSmtpChange("port", e.target.value)}
            placeholder="465"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="smtp_user">{a.ssSmtpUsername}</Label>
          <Input
            id="smtp_user"
            type="email"
            value={smtp.user || ""}
            onChange={(e) => handleSmtpChange("user", e.target.value)}
            placeholder="your-email@gmail.com"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="smtp_password">{a.ssSmtpPassword}</Label>
          <Input
            id="smtp_password"
            type="password"
            value={smtp.password || ""}
            onChange={(e) => handleSmtpChange("password", e.target.value)}
            placeholder="••••••••"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="from_email">{a.ssSmtpSenderEmail}</Label>
          <Input
            id="from_email"
            type="email"
            value={smtp.fromEmail || ""}
            onChange={(e) => handleSmtpChange("fromEmail", e.target.value)}
            placeholder="noreply@example.com"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="from_name">{a.ssSmtpSenderName}</Label>
          <Input
            id="from_name"
            value={smtp.fromName || ""}
            onChange={(e) => handleSmtpChange("fromName", e.target.value)}
            placeholder={a.ssPlatformNamePlaceholder || "منصة إتقان"}
          />
        </div>
      </div>
    </SectionCard>
  )
}
