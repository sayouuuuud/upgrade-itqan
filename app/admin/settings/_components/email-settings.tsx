"use client"

import { Mail } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { SectionCard } from "./section-card"

interface EmailSettingsProps {
  settings: Record<string, any>
  onUpdate: (key: string, value: any) => void
}

export function EmailSettings({ settings, onUpdate }: EmailSettingsProps) {
  // Canonical consumer is getSetting("smtp_config") in lib/settings.ts
  const smtp = settings.smtp_config || {}

  const handleSmtpChange = (field: string, value: any) => {
    onUpdate("smtp_config", { ...smtp, [field]: value })
  }

  return (
    <SectionCard
      icon={Mail}
      title="إعدادات البريد (SMTP)"
      description="تُستخدم لإرسال جميع رسائل المنصة"
    >
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="smtp_host">خادم SMTP</Label>
          <Input
            id="smtp_host"
            value={smtp.host || ""}
            onChange={(e) => handleSmtpChange("host", e.target.value)}
            placeholder="smtp.gmail.com"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="smtp_port">المنفذ</Label>
          <Input
            id="smtp_port"
            type="number"
            value={smtp.port || ""}
            onChange={(e) => handleSmtpChange("port", e.target.value)}
            placeholder="465"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="smtp_user">اسم المستخدم</Label>
          <Input
            id="smtp_user"
            type="email"
            value={smtp.user || ""}
            onChange={(e) => handleSmtpChange("user", e.target.value)}
            placeholder="your-email@gmail.com"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="smtp_password">كلمة المرور</Label>
          <Input
            id="smtp_password"
            type="password"
            value={smtp.password || ""}
            onChange={(e) => handleSmtpChange("password", e.target.value)}
            placeholder="••••••••"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="from_email">البريد المُرسِل</Label>
          <Input
            id="from_email"
            type="email"
            value={smtp.fromEmail || ""}
            onChange={(e) => handleSmtpChange("fromEmail", e.target.value)}
            placeholder="noreply@example.com"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="from_name">اسم المُرسِل</Label>
          <Input
            id="from_name"
            value={smtp.fromName || ""}
            onChange={(e) => handleSmtpChange("fromName", e.target.value)}
            placeholder="منصة إتقان"
          />
        </div>
      </div>
    </SectionCard>
  )
}
