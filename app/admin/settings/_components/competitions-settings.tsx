"use client"

import { Award, ScrollText } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { SectionCard, ToggleRow } from "./section-card"
import type { MaqraahSettings } from "../hooks/use-maqraah-settings"

interface Props {
  settings: MaqraahSettings
  onUpdate: (updates: Partial<MaqraahSettings>) => void
  onReset: () => void
}

const levelOptions = [
  { value: "mubtadi", label: "مبتدئ" },
  { value: "mutqin", label: "متقن" },
  { value: "hafiz", label: "حافظ" },
  { value: "mujaz", label: "مُجاز" },
]

const templateOptions = [
  { value: "classic", label: "كلاسيكي" },
  { value: "modern", label: "عصري" },
  { value: "elegant", label: "أنيق" },
]

export function CompetitionsSettings({ settings, onUpdate, onReset }: Props) {
  return (
    <div className="space-y-6">
      <SectionCard
        icon={Award}
        title="المسابقات"
        description="إعدادات تفعيل المسابقات والتسجيل بها"
        onReset={onReset}
      >
        <ToggleRow
          label="تفعيل المسابقات"
          description="السماح بإنشاء مسابقات والاشتراك بها"
          checked={settings.maqraah_competitions_enabled ?? true}
          onChange={(v) => onUpdate({ maqraah_competitions_enabled: v })}
        />
        <ToggleRow
          label="التسجيل التلقائي"
          description="تسجيل الطلاب المؤهلين تلقائياً في المسابقات"
          checked={settings.maqraah_competitions_auto_enroll ?? false}
          onChange={(v) => onUpdate({ maqraah_competitions_auto_enroll: v })}
        />
        <div className="space-y-2">
          <Label className="text-sm">الحد الأدنى للمستوى للاشتراك</Label>
          <Select
            value={settings.maqraah_competitions_min_level ?? "mutqin"}
            onValueChange={(v) => onUpdate({ maqraah_competitions_min_level: v })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {levelOptions.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label className="text-sm">نسبة النجاح في المسابقة (%)</Label>
          <Input
            type="number"
            min={0}
            max={100}
            value={settings.maqraah_competitions_passing_percentage ?? 80}
            onChange={(e) => onUpdate({ maqraah_competitions_passing_percentage: Number(e.target.value) })}
          />
        </div>
      </SectionCard>

      <SectionCard icon={ScrollText} title="الشهادات" description="إعدادات إصدار شهادات الإتمام">
        <ToggleRow
          label="تفعيل الشهادات"
          description="إصدار شهادات للطلاب عند الإتمام"
          checked={settings.maqraah_competitions_certificates_enabled ?? true}
          onChange={(v) => onUpdate({ maqraah_competitions_certificates_enabled: v })}
        />
        <ToggleRow
          label="إصدار الشهادة تلقائياً"
          description="إصدار الشهادة فور تحقيق شروط الإتمام"
          checked={settings.maqraah_competitions_auto_issue_certificate ?? true}
          onChange={(v) => onUpdate({ maqraah_competitions_auto_issue_certificate: v })}
        />
        <div className="space-y-2">
          <Label className="text-sm">قالب الشهادة</Label>
          <Select
            value={settings.maqraah_competitions_certificate_template ?? "classic"}
            onValueChange={(v) => onUpdate({ maqraah_competitions_certificate_template: v })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {templateOptions.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label className="text-sm">نص التوقيع على الشهادة</Label>
          <Input
            value={settings.maqraah_competitions_certificate_signature ?? ""}
            onChange={(e) => onUpdate({ maqraah_competitions_certificate_signature: e.target.value })}
            placeholder="اسم المشرف العام / المدير"
          />
        </div>
      </SectionCard>
    </div>
  )
}
