"use client"

import { UserCheck, Users } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import type { MaqraahSettings } from "../hooks/use-maqraah-settings"
import { SectionCard, ToggleRow } from "./section-card"
import { useI18n } from "@/lib/i18n/context"

interface Props {
  settings: MaqraahSettings
  onUpdate: (updates: Partial<MaqraahSettings>) => void
  onReset?: () => void
}

export function ReadersSettings({ settings, onUpdate, onReset }: Props) {
  const { t } = useI18n()
  const a = t.admin
  return (
    <div className="space-y-6">
      <SectionCard icon={UserCheck} title={a.rdsetRegistration} description={a.rdsetRegistrationDesc} onReset={onReset}>
        <div className="grid gap-4 md:grid-cols-2">
          <ToggleRow label={a.rdsetStudentSelfSignup} description={a.rdsetStudentSelfSignupDesc} checked={settings.maqraah_readers_student_self_signup ?? true} onChange={(v) => onUpdate({ maqraah_readers_student_self_signup: v })} />
          <ToggleRow label={a.rdsetAcceptApplications} description={a.rdsetAcceptApplicationsDesc} checked={settings.maqraah_readers_accept_applications ?? true} onChange={(v) => onUpdate({ maqraah_readers_accept_applications: v })} />
          <ToggleRow label={a.rdsetRequireApproval} description={a.rdsetRequireApprovalDesc} checked={settings.maqraah_readers_require_approval ?? true} onChange={(v) => onUpdate({ maqraah_readers_require_approval: v })} />
          <ToggleRow label={a.rdsetRequireIjazah} description={a.rdsetRequireIjazahDesc} checked={settings.maqraah_readers_require_ijazah ?? false} onChange={(v) => onUpdate({ maqraah_readers_require_ijazah: v })} />
        </div>
      </SectionCard>

      <SectionCard icon={Users} title={a.rdsetMatching} description={a.rdsetMatchingDesc}>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label className="font-medium text-sm">{a.rdsetMinMemorization}</Label>
            <Input type="number" min={0} max={30} value={settings.maqraah_readers_min_memorization_juz ?? 0} onChange={(e) => onUpdate({ maqraah_readers_min_memorization_juz: Number(e.target.value) })} className="h-11" />
          </div>
          <div className="space-y-2">
            <Label className="font-medium text-sm">{a.rdsetMaxStudents}</Label>
            <Input type="number" min={1} value={settings.maqraah_readers_max_students ?? 20} onChange={(e) => onUpdate({ maqraah_readers_max_students: Number(e.target.value) })} className="h-11" />
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <ToggleRow label={a.rdsetAllowStudentChoose} description={a.rdsetAllowStudentChooseDesc} checked={settings.maqraah_readers_allow_student_choose ?? true} onChange={(v) => onUpdate({ maqraah_readers_allow_student_choose: v })} />
          <ToggleRow label={a.rdsetGenderMatch} description={a.rdsetGenderMatchDesc} checked={settings.maqraah_readers_gender_match ?? true} onChange={(v) => onUpdate({ maqraah_readers_gender_match: v })} />
        </div>
      </SectionCard>
    </div>
  )
}
