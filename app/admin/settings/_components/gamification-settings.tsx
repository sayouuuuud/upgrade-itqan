"use client"

import { Trophy, Star, Flame, BarChart3 } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { SectionCard, ToggleRow } from "./section-card"
import type { MaqraahSettings } from "../hooks/use-maqraah-settings"

interface Props {
  settings: MaqraahSettings
  onUpdate: (updates: Partial<MaqraahSettings>) => void
  onReset: () => void
}

const pointEventLabels: Record<string, string> = {
  recitation_submit: "تسليم تلاوة",
  recitation_excellent: "تلاوة ممتازة",
  session_attended: "حضور جلسة",
  daily_target_met: "تحقيق الهدف اليومي",
  juz_completed: "إتمام جزء",
  khatma_completed: "إتمام ختمة",
  streak_day: "يوم في سلسلة المواظبة",
}

const levelLabels: Record<string, string> = {
  mubtadi: "مبتدئ",
  mutqin: "متقن",
  hafiz: "حافظ",
  mujaz: "مُجاز",
}

export function GamificationSettings({ settings, onUpdate, onReset }: Props) {
  const pointValues = settings.maqraah_points_values || {}
  const levels = settings.maqraah_points_levels || {}

  const updatePointValue = (key: string, value: number) => {
    onUpdate({ maqraah_points_values: { ...pointValues, [key]: value } })
  }

  const updateLevel = (key: string, field: "min" | "max", value: number | null) => {
    const current = levels[key] || { min: 0, max: null }
    onUpdate({
      maqraah_points_levels: { ...levels, [key]: { ...current, [field]: value } },
    })
  }

  return (
    <div className="space-y-6">
      <SectionCard
        icon={Trophy}
        title="النقاط والتحفيز"
        description="تفعيل نظام النقاط والشارات ولوحة المتصدرين"
        onReset={onReset}
      >
        <ToggleRow
          label="تفعيل نظام النقاط"
          description="منح الطلاب نقاطاً مقابل أنشطتهم"
          checked={settings.maqraah_points_enabled ?? true}
          onChange={(v) => onUpdate({ maqraah_points_enabled: v })}
        />
        <ToggleRow
          label="تفعيل الشارات"
          description="منح شارات عند تحقيق إنجازات"
          checked={settings.maqraah_points_badges_enabled ?? true}
          onChange={(v) => onUpdate({ maqraah_points_badges_enabled: v })}
        />
        <ToggleRow
          label="لوحة المتصدرين"
          description="عرض ترتيب الطلاب حسب النقاط"
          checked={settings.maqraah_points_leaderboard_enabled ?? true}
          onChange={(v) => onUpdate({ maqraah_points_leaderboard_enabled: v })}
        />
      </SectionCard>

      <SectionCard icon={Star} title="قيم النقاط" description="عدد النقاط الممنوحة لكل نشاط">
        <div className="grid gap-4 md:grid-cols-2">
          {Object.entries(pointEventLabels).map(([key, label]) => (
            <div key={key} className="space-y-2">
              <Label className="text-sm">{label}</Label>
              <Input
                type="number"
                min={0}
                value={pointValues[key] ?? 0}
                onChange={(e) => updatePointValue(key, Number(e.target.value))}
              />
            </div>
          ))}
        </div>
      </SectionCard>

      <SectionCard icon={Flame} title="سلسلة المواظبة (Streak)" description="مكافأة الاستمرارية اليومية">
        <ToggleRow
          label="تفعيل سلسلة المواظبة"
          checked={settings.maqraah_points_streak_enabled ?? true}
          onChange={(v) => onUpdate({ maqraah_points_streak_enabled: v })}
        />
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label className="text-sm">عدد الأيام لتفعيل المضاعف</Label>
            <Input
              type="number"
              min={1}
              value={settings.maqraah_points_streak_threshold ?? 7}
              onChange={(e) => onUpdate({ maqraah_points_streak_threshold: Number(e.target.value) })}
            />
          </div>
          <div className="space-y-2">
            <Label className="text-sm">مضاعف النقاط</Label>
            <Input
              type="number"
              min={1}
              step={0.1}
              value={settings.maqraah_points_streak_multiplier ?? 1.5}
              onChange={(e) => onUpdate({ maqraah_points_streak_multiplier: Number(e.target.value) })}
            />
          </div>
        </div>
      </SectionCard>

      <SectionCard icon={BarChart3} title="المستويات" description="حدود النقاط لكل مستوى">
        <div className="space-y-3">
          {Object.entries(levelLabels).map(([key, label]) => {
            const level = levels[key] || { min: 0, max: null }
            return (
              <div key={key} className="grid grid-cols-3 gap-3 items-end p-3 bg-muted/50 rounded-xl">
                <div className="space-y-1">
                  <Label className="text-sm font-medium">{label}</Label>
                </div>
                <div className="space-y-1">
                  <Label className="text-[11px] text-muted-foreground">الحد الأدنى</Label>
                  <Input
                    type="number"
                    min={0}
                    value={level.min ?? 0}
                    onChange={(e) => updateLevel(key, "min", Number(e.target.value))}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-[11px] text-muted-foreground">الحد الأقصى</Label>
                  <Input
                    type="number"
                    min={0}
                    placeholder="∞"
                    value={level.max ?? ""}
                    onChange={(e) =>
                      updateLevel(key, "max", e.target.value === "" ? null : Number(e.target.value))
                    }
                  />
                </div>
              </div>
            )
          })}
        </div>
      </SectionCard>
    </div>
  )
}
