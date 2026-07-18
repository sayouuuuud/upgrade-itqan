"use client"

import { Bell } from "lucide-react"
import { SectionCard, ToggleRow } from "./section-card"
import { useI18n } from "@/lib/i18n/context"

interface Props {
  settings: Record<string, any>
  onUpdate: (updates: Record<string, any>) => void
}

export function NotificationsSettings({ settings, onUpdate }: Props) {
  const { t } = useI18n()
  const admin = (t as any).admin as Record<string, string> | undefined
  const a = t.admin

  const ns = settings.notification_settings ?? {}

  const updateNs = (patch: Record<string, any>) =>
    onUpdate({ notification_settings: { ...ns, ...patch } })

  return (
    <div className="space-y-6">
      <SectionCard
        icon={Bell}
        title={a.notifEmailTitle}
        description={a.notifEmailDesc}
      >
        <ToggleRow
          label={a.notifNewRegLabel}
          description={a.notifNewRegDesc}
          checked={ns.notify_on_registration ?? true}
          onChange={(v) => updateNs({ notify_on_registration: v })}
        />
        <ToggleRow
          label={a.notifPendingLabel}
          description={a.notifPendingDesc}
          checked={ns.notify_on_pending ?? true}
          onChange={(v) => updateNs({ notify_on_pending: v })}
        />
        <ToggleRow
          label={a.notifResendResultLabel}
          description={a.notifResendResultDesc}
          checked={settings.resend_email_on_result_change ?? false}
          onChange={(v) => onUpdate({ resend_email_on_result_change: v })}
        />
        <ToggleRow
          label={a.notifResendUpdateLabel}
          description={a.notifResendUpdateDesc}
          checked={settings.resend_email_on_result_update ?? false}
          onChange={(v) => onUpdate({ resend_email_on_result_update: v })}
        />
      </SectionCard>
    </div>
  )
}
