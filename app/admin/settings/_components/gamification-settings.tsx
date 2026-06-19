"use client"

import { Trophy, Star, Flame, BarChart3 } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { SectionCard, ToggleRow } from "./section-card"
import type { MaqraahSettings } from "../hooks/use-maqraah-settings"
import { useI18n } from "@/lib/i18n/context"

interface Props {
  settings: MaqraahSettings
  onUpdate: (updates: Partial<MaqraahSettings>) => void
  onReset: () => void
}

export function GamificationSettings({ settings, onUpdate, onReset }: Props) {
  const { t } = useI18n()
  const a = t.admin
  const pointValues = settings.maqraah_points_values || {}
  const levels = settings.maqraah_points_levels || {}

  const pointEventLabels: Record<string, string> = {
    recitation_submit: a.gsetEventRecitationSubmit,
    recitation_excellent: a.gsetEventRecitationExcellent,
    session_attended: a.gsetEventSessionAttended,
    daily_target_met: a.gsetEventDailyTargetMet,
    juz_completed: a.gsetEventJuzCompleted,
    khatma_completed: a.gsetEventKhatmaCompleted,
    streak_day: a.gsetEventStreakDay,
  }

  const levelLabels: Record<string, string> = {
    mubtadi: a.gsetLevelBeginner,
    mutqin: a.gsetLevelMastered,
    hafiz: a.gsetLevelHafiz,
    mujaz: a.gsetLevelCertified,
  }

  const updatePointValue = (key: string, value: number) => {
    onUpdate({ maqraah_points_values: { ...pointValues, [key]: value } })
  }

  const updateLevel = (key: string, field: "min" | "max", value: number | null) => {
    const current = levels[key] || { min: 0, max: null }
    onUpdate({ maqraah_points_levels: { ...levels, [key]: { ...current, [field]: value } } })
  }

  return (
    <div className="space-y-6">
      <SectionCard icon={Trophy} title={a.gsetPointsAndMotivation} description={a.gsetPointsAndMotivationDesc} onReset={onReset}>
        <ToggleRow label={a.gsetEnablePoints} description={a.gsetEnablePointsDesc} checked={settings.maqraah_points_enabled ?? true} onChange={(v) => onUpdate({ maqraah_points_enabled: v })} />
        <ToggleRow label={a.gsetEnableBadges} description={a.gsetEnableBadgesDesc} checked={settings.maqraah_points_badges_enabled ?? true} onChange={(v) => onUpdate({ maqraah_points_badges_enabled: v })} />
        <ToggleRow label={a.gsetEnableLeaderboard} description={a.gsetEnableLeaderboardDesc} checked={settings.maqraah_points_leaderboard_enabled ?? true} onChange={(v) => onUpdate({ maqraah_points_leaderboard_enabled: v })} />
      </SectionCard>

      <SectionCard icon={Star} title={a.gsetPointValues} description={a.gsetPointValuesDesc}>
        <div className="grid gap-4 md:grid-cols-2">
          {Object.entries(pointEventLabels).map(([key, label]) => (
            <div key={key} className="space-y-2">
              <Label className="text-sm">{label}</Label>
              <Input type="number" min={0} value={pointValues[key] ?? 0} onChange={(e) => updatePointValue(key, Number(e.target.value))} />
            </div>
          ))}
        </div>
      </SectionCard>

      <SectionCard icon={Flame} title={a.gsetStreak} description={a.gsetStreakDesc}>
        <ToggleRow label={a.gsetEnableStreak} checked={settings.maqraah_points_streak_enabled ?? true} onChange={(v) => onUpdate({ maqraah_points_streak_enabled: v })} />
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label className="text-sm">{a.gsetStreakThreshold}</Label>
            <Input type="number" min={1} value={settings.maqraah_points_streak_threshold ?? 7} onChange={(e) => onUpdate({ maqraah_points_streak_threshold: Number(e.target.value) })} />
          </div>
          <div className="space-y-2">
            <Label className="text-sm">{a.gsetPointsMultiplier}</Label>
            <Input type="number" min={1} step={0.1} value={settings.maqraah_points_streak_multiplier ?? 1.5} onChange={(e) => onUpdate({ maqraah_points_streak_multiplier: Number(e.target.value) })} />
          </div>
        </div>
      </SectionCard>

      <SectionCard icon={BarChart3} title={a.gsetLevels} description={a.gsetLevelsDesc}>
        <div className="space-y-3">
          {Object.entries(levelLabels).map(([key, label]) => {
            const level = levels[key] || { min: 0, max: null }
            return (
              <div key={key} className="grid grid-cols-3 gap-3 items-end p-3 bg-muted/50 rounded-xl">
                <div className="space-y-1"><Label className="text-sm font-medium">{label}</Label></div>
                <div className="space-y-1">
                  <Label className="text-[11px] text-muted-foreground">{a.gsetMinPoints}</Label>
                  <Input type="number" min={0} value={level.min ?? 0} onChange={(e) => updateLevel(key, "min", Number(e.target.value))} />
                </div>
                <div className="space-y-1">
                  <Label className="text-[11px] text-muted-foreground">{a.gsetMaxPoints}</Label>
                  <Input type="number" min={0} placeholder="∞" value={level.max ?? ""} onChange={(e) => updateLevel(key, "max", e.target.value === "" ? null : Number(e.target.value))} />
                </div>
              </div>
            )
          })}
        </div>
      </SectionCard>
    </div>
  )
}
