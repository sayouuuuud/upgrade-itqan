"use client"

import { Users, Video, Bell } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { MaqraahSettings } from "../hooks/use-maqraah-settings"
import { SectionCard, ToggleRow } from "./section-card"
import { useI18n } from "@/lib/i18n/context"

interface Props {
  settings: MaqraahSettings
  onUpdate: (updates: Partial<MaqraahSettings>) => void
  onReset: () => void
}

export function HalaqatSettings({ settings, onUpdate, onReset }: Props) {
  const { t } = useI18n()
  const a = t.admin
  return (
    <div className="space-y-6">
      <SectionCard icon={Users} title={a.hsetHalaqat} description={a.hsetHalaqatDesc} onReset={onReset}>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label className="font-medium text-sm">{a.hsetMaxStudents}</Label>
            <Input type="number" min={1} value={settings.maqraah_halaqat_max_students ?? 8} onChange={(e) => onUpdate({ maqraah_halaqat_max_students: Number(e.target.value) })} className="h-11" />
          </div>
          <div className="space-y-2">
            <Label className="font-medium text-sm">{a.hsetSessionDuration}</Label>
            <Input type="number" min={5} value={settings.maqraah_halaqat_session_duration ?? 30} onChange={(e) => onUpdate({ maqraah_halaqat_session_duration: Number(e.target.value) })} className="h-11" />
          </div>
          <div className="space-y-2">
            <Label className="font-medium text-sm">{a.hsetLateGrace}</Label>
            <Input type="number" min={0} value={settings.maqraah_halaqat_late_grace_minutes ?? 5} onChange={(e) => onUpdate({ maqraah_halaqat_late_grace_minutes: Number(e.target.value) })} className="h-11" />
          </div>
          <div className="space-y-2">
            <Label className="font-medium text-sm">{a.hsetAbsenceLimit}</Label>
            <Input type="number" min={1} value={settings.maqraah_halaqat_absence_limit ?? 3} onChange={(e) => onUpdate({ maqraah_halaqat_absence_limit: Number(e.target.value) })} className="h-11" />
          </div>
        </div>
      </SectionCard>

      <SectionCard icon={Video} title={a.hsetLiveSessions} description={a.hsetLiveSessionsDesc}>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label className="font-medium text-sm">{a.hsetVideoProvider}</Label>
            <Select value={settings.maqraah_halaqat_provider || "livekit"} onValueChange={(v) => onUpdate({ maqraah_halaqat_provider: v })}>
              <SelectTrigger className="h-11"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="livekit">LiveKit</SelectItem>
                <SelectItem value="zoom">Zoom</SelectItem>
                <SelectItem value="google_meet">Google Meet</SelectItem>
                <SelectItem value="jitsi">Jitsi</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label className="font-medium text-sm">{a.hsetLinkValidity}</Label>
            <Input type="number" min={0} value={settings.maqraah_halaqat_link_validity_minutes ?? 120} onChange={(e) => onUpdate({ maqraah_halaqat_link_validity_minutes: Number(e.target.value) })} className="h-11" />
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <ToggleRow label={a.hsetAutoRecord} description={a.hsetAutoRecordDesc} checked={settings.maqraah_halaqat_auto_record ?? false} onChange={(v) => onUpdate({ maqraah_halaqat_auto_record: v })} />
          <ToggleRow label={a.hsetAllowJoinAnytime} description={a.hsetAllowJoinAnytimeDesc} checked={settings.maqraah_halaqat_allow_join_anytime ?? true} onChange={(v) => onUpdate({ maqraah_halaqat_allow_join_anytime: v })} />
        </div>
      </SectionCard>

      <SectionCard icon={Bell} title={a.hsetReminders} description={a.hsetRemindersDesc}>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label className="font-medium text-sm">{a.hsetFirstReminder}</Label>
            <Input type="number" min={0} value={settings.maqraah_halaqat_first_reminder_minutes ?? 60} onChange={(e) => onUpdate({ maqraah_halaqat_first_reminder_minutes: Number(e.target.value) })} className="h-11" />
          </div>
          <div className="space-y-2">
            <Label className="font-medium text-sm">{a.hsetSecondReminder}</Label>
            <Input type="number" min={0} value={settings.maqraah_halaqat_second_reminder_minutes ?? 10} onChange={(e) => onUpdate({ maqraah_halaqat_second_reminder_minutes: Number(e.target.value) })} className="h-11" />
          </div>
        </div>
      </SectionCard>
    </div>
  )
}
