"use client"

import { Route, Target, Lock } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { MaqraahSettings } from "../hooks/use-maqraah-settings"
import { SectionCard, ToggleRow } from "./section-card"
import { useI18n } from "@/lib/i18n/context"

interface Props {
  settings: MaqraahSettings
  onUpdate: (updates: Partial<MaqraahSettings>) => void
  onReset?: () => void
}

export function PathsSettings({ settings, onUpdate, onReset }: Props) {
  const { t } = useI18n()
  const admin = (t as any).admin as Record<string, string> | undefined
  const a = t.admin
  return (
    <div className="space-y-6">
      <SectionCard icon={Route} title={a.psetAvailablePaths} description={a.psetAvailablePathsDesc} onReset={onReset}>
        <div className="grid gap-4 md:grid-cols-2">
          <ToggleRow label={a.psetMemorizationPath} description={a.psetMemorizationPathDesc} checked={settings.maqraah_paths_memorization_enabled ?? true} onChange={(v) => onUpdate({ maqraah_paths_memorization_enabled: v })} />
          <ToggleRow label={a.psetTajweedPath} description={a.psetTajweedPathDesc} checked={settings.maqraah_paths_tajweed_enabled ?? true} onChange={(v) => onUpdate({ maqraah_paths_tajweed_enabled: v })} />
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label className="font-medium text-sm">{a.psetDefaultPath}</Label>
            <Select value={settings.maqraah_paths_default_path || "memorization"} onValueChange={(v) => onUpdate({ maqraah_paths_default_path: v })}>
              <SelectTrigger className="h-11"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="memorization">{a.psetPathMemorization}</SelectItem>
                <SelectItem value="tajweed">{a.psetPathTajweed}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label className="font-medium text-sm">{a.psetMemorizationOrder}</Label>
            <Select value={settings.maqraah_paths_memorization_order || "mushaf"} onValueChange={(v) => onUpdate({ maqraah_paths_memorization_order: v })}>
              <SelectTrigger className="h-11"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="mushaf">{a.psetOrderMushaf}</SelectItem>
                <SelectItem value="reverse">{a.psetOrderReverse}</SelectItem>
                <SelectItem value="custom">{a.psetOrderCustom}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </SectionCard>

      <SectionCard icon={Lock} title={a.psetStageUnlock} description={a.psetStageUnlockDesc}>
        <ToggleRow label={a.psetSequentialUnlock} description={a.psetSequentialUnlockDesc} checked={settings.maqraah_paths_sequential_unlock ?? true} onChange={(v) => onUpdate({ maqraah_paths_sequential_unlock: v })} />
        <div className="space-y-2 max-w-sm">
          <Label className="font-medium text-sm">{a.psetUnlockThreshold}</Label>
          <Input type="number" min={1} max={100} value={settings.maqraah_paths_unlock_threshold ?? 80} onChange={(e) => onUpdate({ maqraah_paths_unlock_threshold: Number(e.target.value) })} className="h-11" />
        </div>
      </SectionCard>

      <SectionCard icon={Target} title={a.psetMemorizationGoals} description={a.psetMemorizationGoalsDesc}>
        <div className="grid gap-4 md:grid-cols-3">
          <div className="space-y-2">
            <Label className="font-medium text-sm">{a.psetDailyTarget}</Label>
            <Input type="number" min={1} value={settings.maqraah_paths_daily_target_verses ?? 5} onChange={(e) => onUpdate({ maqraah_paths_daily_target_verses: Number(e.target.value) })} className="h-11" />
          </div>
          <div className="space-y-2">
            <Label className="font-medium text-sm">{a.psetWeeklyTarget}</Label>
            <Input type="number" min={1} value={settings.maqraah_paths_weekly_target_verses ?? 30} onChange={(e) => onUpdate({ maqraah_paths_weekly_target_verses: Number(e.target.value) })} className="h-11" />
          </div>
          <div className="space-y-2">
            <Label className="font-medium text-sm">{a.psetRevisionRatio}</Label>
            <Input type="number" min={0} value={settings.maqraah_paths_revision_ratio ?? 5} onChange={(e) => onUpdate({ maqraah_paths_revision_ratio: Number(e.target.value) })} className="h-11" />
            <p className="text-[11px] text-muted-foreground">{a.psetRevisionRatioHint}</p>
          </div>
        </div>
      </SectionCard>
    </div>
  )
}
