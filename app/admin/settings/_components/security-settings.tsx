"use client"

import { Shield, KeyRound, Lock, Activity } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { SectionCard, ToggleRow } from "./section-card"
import type { MaqraahSettings } from "../hooks/use-maqraah-settings"
import { useI18n } from "@/lib/i18n/context"

interface Props {
  settings: MaqraahSettings
  onUpdate: (updates: Partial<MaqraahSettings>) => void
  onReset: () => void
}

export function SecuritySettings({ settings, onUpdate, onReset }: Props) {
  const { t } = useI18n()
  const a = t.admin
  const ipWhitelist = settings.maqraah_security_admin_ip_whitelist || []
  const policy = settings.maqraah_security_password_policy || {}

  const updatePolicy = (updates: Partial<NonNullable<MaqraahSettings["maqraah_security_password_policy"]>>) => {
    onUpdate({ maqraah_security_password_policy: { ...policy, ...updates } })
  }

  const updateIps = (text: string) => {
    const ips = text
      .split(/[\n,]/)
      .map((ip) => ip.trim())
      .filter(Boolean)
    onUpdate({ maqraah_security_admin_ip_whitelist: ips })
  }

  return (
    <div className="space-y-6">
      <SectionCard icon={Shield} title={a.secSessionsLogin} description={a.secSessionsLoginDesc} onReset={onReset}>
        <div className="grid gap-4 md:grid-cols-3">
          <div className="space-y-2">
            <Label className="text-sm">{a.secSessionTimeout}</Label>
            <Input
              type="number"
              min={5}
              value={settings.maqraah_security_session_timeout ?? 30}
              onChange={(e) => onUpdate({ maqraah_security_session_timeout: Number(e.target.value) })}
            />
          </div>
          <div className="space-y-2">
            <Label className="text-sm">{a.secMaxLoginAttempts}</Label>
            <Input
              type="number"
              min={1}
              value={settings.maqraah_security_max_login_attempts ?? 5}
              onChange={(e) => onUpdate({ maqraah_security_max_login_attempts: Number(e.target.value) })}
            />
          </div>
          <div className="space-y-2">
            <Label className="text-sm">{a.secLockDuration}</Label>
            <Input
              type="number"
              min={1}
              value={settings.maqraah_security_lock_duration ?? 15}
              onChange={(e) => onUpdate({ maqraah_security_lock_duration: Number(e.target.value) })}
            />
          </div>
        </div>
      </SectionCard>

      <SectionCard icon={KeyRound} title={a.secPasswordPolicy} description={a.secPasswordPolicyDesc}>
        <div className="space-y-2 max-w-xs">
          <Label className="text-sm">{a.secMinLength}</Label>
          <Input
            type="number"
            min={6}
            value={policy.min_length ?? 8}
            onChange={(e) => updatePolicy({ min_length: Number(e.target.value) })}
          />
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          <ToggleRow
            label={a.secUppercase}
            checked={policy.require_uppercase ?? true}
            onChange={(v) => updatePolicy({ require_uppercase: v })}
          />
          <ToggleRow
            label={a.secLowercase}
            checked={policy.require_lowercase ?? true}
            onChange={(v) => updatePolicy({ require_lowercase: v })}
          />
          <ToggleRow
            label={a.secNumbers}
            checked={policy.require_numbers ?? true}
            onChange={(v) => updatePolicy({ require_numbers: v })}
          />
          <ToggleRow
            label={a.secSpecialChars}
            checked={policy.require_special ?? false}
            onChange={(v) => updatePolicy({ require_special: v })}
          />
        </div>
      </SectionCard>

      <SectionCard icon={Lock} title={a.secAdminProtection} description={a.secAdminProtectionDesc}>
        <ToggleRow
          label={a.secTwoFactor}
          description={a.secTwoFactorDesc}
          checked={settings.maqraah_security_admin_2fa ?? false}
          onChange={(v) => onUpdate({ maqraah_security_admin_2fa: v })}
        />
        <div className="space-y-2">
          <Label className="text-sm">{a.secIpWhitelist}</Label>
          <Textarea
            dir="ltr"
            rows={3}
            value={ipWhitelist.join("\n")}
            onChange={(e) => updateIps(e.target.value)}
            placeholder={a.secIpWhitelistPlaceholder}
          />
          <p className="text-[11px] text-muted-foreground">{a.secIpWhitelistHint}</p>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label className="text-sm">{a.secDailyUploadLimit}</Label>
            <Input
              type="number"
              min={0}
              value={settings.maqraah_security_daily_upload_limit_mb ?? 500}
              onChange={(e) => onUpdate({ maqraah_security_daily_upload_limit_mb: Number(e.target.value) })}
            />
          </div>
          <div className="space-y-2">
            <Label className="text-sm">{a.secApiRateLimit}</Label>
            <Input
              type="number"
              min={0}
              value={settings.maqraah_security_api_rate_limit ?? 100}
              onChange={(e) => onUpdate({ maqraah_security_api_rate_limit: Number(e.target.value) })}
            />
          </div>
        </div>
      </SectionCard>

      <SectionCard icon={Activity} title={a.secActivityLogs} description={a.secActivityLogsDesc}>
        <ToggleRow
          label={a.secEnableActivityLogs}
          description={a.secActivityLogsHint}
          checked={settings.maqraah_security_activity_logs_enabled ?? true}
          onChange={(v) => onUpdate({ maqraah_security_activity_logs_enabled: v })}
        />
      </SectionCard>
    </div>
  )
}
