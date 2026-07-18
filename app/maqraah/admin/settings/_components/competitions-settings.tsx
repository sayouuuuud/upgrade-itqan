"use client"

import { Award, ScrollText } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { SectionCard, ToggleRow } from "./section-card"
import type { MaqraahSettings } from "../hooks/use-maqraah-settings"
import { useI18n } from "@/lib/i18n/context"

interface Props {
  settings: MaqraahSettings
  onUpdate: (updates: Partial<MaqraahSettings>) => void
  onReset?: () => void
}

export function CompetitionsSettings({ settings, onUpdate, onReset }: Props) {
  const { t } = useI18n()
  const admin = (t as any).admin as Record<string, string> | undefined
  const a = t.admin

  const levelOptions = [
    { value: "mubtadi", label: a.csetLevelBeginner },
    { value: "mutqin", label: a.csetLevelMastered },
    { value: "hafiz", label: a.csetLevelHafiz },
    { value: "mujaz", label: a.csetLevelCertified },
  ]

  const templateOptions = [
    { value: "classic", label: a.csetTemplateClassic },
    { value: "modern", label: a.csetTemplateModern },
    { value: "elegant", label: a.csetTemplateElegant },
  ]

  return (
    <div className="space-y-6">
      <SectionCard icon={Award} title={a.csetCompetitions} description={a.csetCompetitionsDesc} onReset={onReset}>
        <ToggleRow label={a.csetEnableCompetitions} description={a.csetEnableCompetitionsDesc} checked={settings.maqraah_competitions_enabled ?? true} onChange={(v) => onUpdate({ maqraah_competitions_enabled: v })} />
        <ToggleRow label={a.csetAutoEnroll} description={a.csetAutoEnrollDesc} checked={settings.maqraah_competitions_auto_enroll ?? false} onChange={(v) => onUpdate({ maqraah_competitions_auto_enroll: v })} />
        <div className="space-y-2">
          <Label className="text-sm">{a.csetMinLevel}</Label>
          <Select value={settings.maqraah_competitions_min_level ?? "mutqin"} onValueChange={(v) => onUpdate({ maqraah_competitions_min_level: v })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {levelOptions.map((o) => (<SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label className="text-sm">{a.csetPassingPercentage}</Label>
          <Input type="number" min={0} max={100} value={settings.maqraah_competitions_passing_percentage ?? 80} onChange={(e) => onUpdate({ maqraah_competitions_passing_percentage: Number(e.target.value) })} />
        </div>
      </SectionCard>

      <SectionCard icon={ScrollText} title={a.csetCertificates} description={a.csetCertificatesDesc}>
        <ToggleRow label={a.csetEnableCertificates} description={a.csetEnableCertificatesDesc} checked={settings.maqraah_competitions_certificates_enabled ?? true} onChange={(v) => onUpdate({ maqraah_competitions_certificates_enabled: v })} />
        <ToggleRow label={a.csetAutoIssue} description={a.csetAutoIssueDesc} checked={settings.maqraah_competitions_auto_issue_certificate ?? true} onChange={(v) => onUpdate({ maqraah_competitions_auto_issue_certificate: v })} />
        <div className="space-y-2">
          <Label className="text-sm">{a.csetTemplate}</Label>
          <Select value={settings.maqraah_competitions_certificate_template ?? "classic"} onValueChange={(v) => onUpdate({ maqraah_competitions_certificate_template: v })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {templateOptions.map((o) => (<SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label className="text-sm">{a.csetSignatureText}</Label>
          <Input value={settings.maqraah_competitions_certificate_signature ?? ""} onChange={(e) => onUpdate({ maqraah_competitions_certificate_signature: e.target.value })} placeholder={a.csetSignaturePlaceholder} />
        </div>
      </SectionCard>
    </div>
  )
}
