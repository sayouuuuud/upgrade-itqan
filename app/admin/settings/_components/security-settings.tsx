"use client"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Shield, KeyRound, Activity } from "lucide-react"
import { SectionCard, ToggleRow } from "./section-card"
import { useI18n } from "@/lib/i18n/context"

interface Props {
  settings: Record<string, any>
  onUpdate: (updates: Record<string, any>) => void
}

export function SecuritySettings({ settings, onUpdate }: Props) {
  const { t } = useI18n()
  const admin = (t as any).admin as Record<string, string> | undefined
  const a = t.admin

  const sec = settings.security_settings ?? {}

  const updateSec = (patch: Record<string, any>) =>
    onUpdate({ security_settings: { ...sec, ...patch } })

  return (
    <div className="space-y-6">
      <SectionCard
        icon={Shield}
        title={a.secProtectionTitle}
        description={a.secProtectionDesc}
      >
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-1.5">
            <Label className="text-sm">{a.secSessionTimeout}</Label>
            <Input
              type="number"
              min={5}
              value={sec.session_timeout ?? 30}
              onChange={(e) => updateSec({ session_timeout: Number(e.target.value) })}
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-sm">{a.secMaxAttempts}</Label>
            <Input
              type="number"
              min={1}
              value={sec.max_login_attempts ?? 5}
              onChange={(e) => updateSec({ max_login_attempts: Number(e.target.value) })}
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-sm">{a.secLockoutDuration}</Label>
            <Input
              type="number"
              min={1}
              value={sec.lockout_duration ?? 15}
              onChange={(e) => updateSec({ lockout_duration: Number(e.target.value) })}
            />
          </div>
        </div>
      </SectionCard>

      <SectionCard
        icon={KeyRound}
        title={a.sec2FATitle}
        description={a.sec2FADesc}
      >
        <ToggleRow
          label={a.sec2FALabel}
          description={a.sec2FAToggleDesc}
          checked={settings.two_factor_auth ?? false}
          onChange={(v) => onUpdate({ two_factor_auth: v })}
        />
      </SectionCard>

      <SectionCard
        icon={Activity}
        title={a.secLogsTitle}
        description={a.secLogsDesc}
      >
        <ToggleRow
          label={a.secLogsLabel}
          description={a.secLogsToggleDesc}
          checked={settings.activity_logging ?? true}
          onChange={(v) => onUpdate({ activity_logging: v })}
        />
      </SectionCard>
    </div>
  )
}
