"use client"

import { Mic, Star, BookOpen } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { cn } from "@/lib/utils"
import type { MaqraahSettings } from "../hooks/use-maqraah-settings"
import { SectionCard, ToggleRow } from "./section-card"
import { useI18n } from "@/lib/i18n/context"

interface Props {
  settings: MaqraahSettings
  onUpdate: (updates: Partial<MaqraahSettings>) => void
  onReset?: () => void
}

const audioFormats = ["mp3", "m4a", "ogg", "wav", "aac"]

export function RecitationsSettings({ settings, onUpdate, onReset }: Props) {
  const { t } = useI18n()
  const a = t.admin
  const formats = settings.maqraah_recitations_allowed_audio_formats || []
  const riwayat = settings.maqraah_recitations_available_riwayat || []

  const riwayatList = [
    { value: "hafs", label: a.rhHafs },
    { value: "warsh", label: a.rhWarsh },
    { value: "qalun", label: a.rhQalun },
    { value: "duri", label: a.rhDuri },
    { value: "shubah", label: a.rhShubah },
    { value: "bazzi", label: a.rhBazzi },
  ]

  const toggleFormat = (f: string) => {
    const next = formats.includes(f) ? formats.filter((x: string) => x !== f) : [...formats, f]
    onUpdate({ maqraah_recitations_allowed_audio_formats: next })
  }

  const toggleRiwayah = (r: string) => {
    const next = riwayat.includes(r) ? riwayat.filter((x: string) => x !== r) : [...riwayat, r]
    onUpdate({ maqraah_recitations_available_riwayat: next })
  }

  return (
    <div className="space-y-6">
      <SectionCard icon={Mic} title={a.rsetAudioRecitations} description={a.rsetAudioRecitationsDesc} onReset={onReset}>
        <div className="space-y-2">
          <Label className="font-medium text-sm">{a.rsetAllowedFormats}</Label>
          <div className="flex flex-wrap gap-2">
            {audioFormats.map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => toggleFormat(f)}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors uppercase",
                  formats.includes(f)
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-muted/50 text-muted-foreground border-border hover:border-primary/30"
                )}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label className="font-medium text-sm">{a.rsetMaxAudioSize}</Label>
            <Input
              type="number"
              min={1}
              value={settings.maqraah_recitations_max_audio_size_mb ?? 25}
              onChange={(e) => onUpdate({ maqraah_recitations_max_audio_size_mb: Number(e.target.value) })}
              className="h-11"
            />
          </div>
          <div className="space-y-2">
            <Label className="font-medium text-sm">{a.rsetMaxVideoSize}</Label>
            <Input
              type="number"
              min={1}
              disabled={!settings.maqraah_recitations_allow_video}
              value={settings.maqraah_recitations_max_video_size_mb ?? 100}
              onChange={(e) => onUpdate({ maqraah_recitations_max_video_size_mb: Number(e.target.value) })}
              className="h-11"
            />
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <ToggleRow
            label={a.rsetAllowVideo}
            description={a.rsetAllowVideoDesc}
            checked={settings.maqraah_recitations_allow_video ?? false}
            onChange={(v) => onUpdate({ maqraah_recitations_allow_video: v })}
          />
          <ToggleRow
            label={a.rsetAllowRetry}
            description={a.rsetAllowRetryDesc}
            checked={settings.maqraah_recitations_allow_retry ?? true}
            onChange={(v) => onUpdate({ maqraah_recitations_allow_retry: v })}
          />
        </div>
      </SectionCard>

      <SectionCard icon={BookOpen} title={a.rsetRiwayat} description={a.rsetRiwayatDesc}>
        <div className="space-y-2">
          <Label className="font-medium text-sm">{a.rsetDefaultRiwayah}</Label>
          <Select
            value={settings.maqraah_recitations_default_riwayah || "hafs"}
            onValueChange={(v) => onUpdate({ maqraah_recitations_default_riwayah: v })}
          >
            <SelectTrigger className="h-11 max-w-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {riwayatList.map((r) => (
                <SelectItem key={r.value} value={r.value}>
                  {r.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label className="font-medium text-sm">{a.rsetAvailableRiwayat}</Label>
          <div className="flex flex-wrap gap-2">
            {riwayatList.map((r) => (
              <button
                key={r.value}
                type="button"
                onClick={() => toggleRiwayah(r.value)}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors",
                  riwayat.includes(r.value)
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-muted/50 text-muted-foreground border-border hover:border-primary/30"
                )}
              >
                {r.label}
              </button>
            ))}
          </div>
        </div>
      </SectionCard>

      <SectionCard icon={Star} title={a.rsetEvaluation} description={a.rsetEvaluationDesc}>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label className="font-medium text-sm">{a.rsetRatingScale}</Label>
            <Select
              value={String(settings.maqraah_recitations_rating_scale ?? 5)}
              onValueChange={(v) => onUpdate({ maqraah_recitations_rating_scale: Number(v) })}
            >
              <SelectTrigger className="h-11">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="5">{a.rsetScaleOf.replace('{scale}', '5')}</SelectItem>
                <SelectItem value="10">{a.rsetScaleOf.replace('{scale}', '10')}</SelectItem>
                <SelectItem value="100">{a.rsetScaleOf.replace('{scale}', '100')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label className="font-medium text-sm">{a.rsetPassingScore}</Label>
            <Input
              type="number"
              min={1}
              value={settings.maqraah_recitations_passing_score ?? 3}
              onChange={(e) => onUpdate({ maqraah_recitations_passing_score: Number(e.target.value) })}
              className="h-11"
            />
            <p className="text-[11px] text-muted-foreground flex items-center gap-1">
              <Badge variant="secondary" className="text-[10px]">
                {a.rsetScaleOf.replace('{scale}', String(settings.maqraah_recitations_rating_scale ?? 5))}
              </Badge>
              {a.rsetPassingScoreHint}
            </p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <ToggleRow
            label={a.rsetRequireFeedback}
            description={a.rsetRequireFeedbackDesc}
            checked={settings.maqraah_recitations_require_feedback ?? true}
            onChange={(v) => onUpdate({ maqraah_recitations_require_feedback: v })}
          />
          <ToggleRow
            label={a.rsetTrackTajweed}
            description={a.rsetTrackTajweedDesc}
            checked={settings.maqraah_recitations_track_tajweed_errors ?? true}
            onChange={(v) => onUpdate({ maqraah_recitations_track_tajweed_errors: v })}
          />
        </div>
      </SectionCard>
    </div>
  )
}
