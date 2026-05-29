"use client"

import { Route, Target, Lock } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { MaqraahSettings } from "../hooks/use-maqraah-settings"
import { SectionCard, ToggleRow } from "./section-card"

interface Props {
  settings: MaqraahSettings
  onUpdate: (updates: Partial<MaqraahSettings>) => void
  onReset: () => void
}

export function PathsSettings({ settings, onUpdate, onReset }: Props) {
  return (
    <div className="space-y-6">
      <SectionCard icon={Route} title="المسارات المتاحة" description="تفعيل مسارات الحفظ والتجويد" onReset={onReset}>
        <div className="grid gap-4 md:grid-cols-2">
          <ToggleRow
            label="مسار الحفظ"
            description="تفعيل برنامج الحفظ"
            checked={settings.maqraah_paths_memorization_enabled ?? true}
            onChange={(v) => onUpdate({ maqraah_paths_memorization_enabled: v })}
          />
          <ToggleRow
            label="مسار التجويد"
            description="تفعيل برنامج التجويد"
            checked={settings.maqraah_paths_tajweed_enabled ?? true}
            onChange={(v) => onUpdate({ maqraah_paths_tajweed_enabled: v })}
          />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label className="font-medium text-sm">المسار الافتراضي</Label>
            <Select
              value={settings.maqraah_paths_default_path || "memorization"}
              onValueChange={(v) => onUpdate({ maqraah_paths_default_path: v })}
            >
              <SelectTrigger className="h-11">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="memorization">الحفظ</SelectItem>
                <SelectItem value="tajweed">التجويد</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label className="font-medium text-sm">ترتيب الحفظ</Label>
            <Select
              value={settings.maqraah_paths_memorization_order || "mushaf"}
              onValueChange={(v) => onUpdate({ maqraah_paths_memorization_order: v })}
            >
              <SelectTrigger className="h-11">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="mushaf">ترتيب المصحف (البقرة ← الناس)</SelectItem>
                <SelectItem value="reverse">من جزء عمّ (الناس ← البقرة)</SelectItem>
                <SelectItem value="custom">مخصص حسب الخطة</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </SectionCard>

      <SectionCard icon={Lock} title="فتح المراحل" description="شروط الانتقال بين المراحل">
        <ToggleRow
          label="فتح المراحل بالترتيب"
          description="لا يمكن تخطي مرحلة قبل إتقانها"
          checked={settings.maqraah_paths_sequential_unlock ?? true}
          onChange={(v) => onUpdate({ maqraah_paths_sequential_unlock: v })}
        />
        <div className="space-y-2 max-w-sm">
          <Label className="font-medium text-sm">نسبة الإتقان لفتح المرحلة (%)</Label>
          <Input
            type="number"
            min={1}
            max={100}
            value={settings.maqraah_paths_unlock_threshold ?? 80}
            onChange={(e) => onUpdate({ maqraah_paths_unlock_threshold: Number(e.target.value) })}
            className="h-11"
          />
        </div>
      </SectionCard>

      <SectionCard icon={Target} title="أهداف الحفظ" description="الأهداف اليومية والأسبوعية">
        <div className="grid gap-4 md:grid-cols-3">
          <div className="space-y-2">
            <Label className="font-medium text-sm">الهدف اليومي (آيات)</Label>
            <Input
              type="number"
              min={1}
              value={settings.maqraah_paths_daily_target_verses ?? 5}
              onChange={(e) => onUpdate({ maqraah_paths_daily_target_verses: Number(e.target.value) })}
              className="h-11"
            />
          </div>
          <div className="space-y-2">
            <Label className="font-medium text-sm">الهدف الأسبوعي (آيات)</Label>
            <Input
              type="number"
              min={1}
              value={settings.maqraah_paths_weekly_target_verses ?? 30}
              onChange={(e) =>
                onUpdate({ maqraah_paths_weekly_target_verses: Number(e.target.value) })
              }
              className="h-11"
            />
          </div>
          <div className="space-y-2">
            <Label className="font-medium text-sm">نسبة المراجعة للحفظ</Label>
            <Input
              type="number"
              min={0}
              value={settings.maqraah_paths_revision_ratio ?? 5}
              onChange={(e) => onUpdate({ maqraah_paths_revision_ratio: Number(e.target.value) })}
              className="h-11"
            />
            <p className="text-[11px] text-muted-foreground">عدد صفحات المراجعة لكل صفحة جديدة</p>
          </div>
        </div>
      </SectionCard>
    </div>
  )
}
