"use client"

import { Mic, Star, BookOpen } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { cn } from "@/lib/utils"
import type { MaqraahSettings } from "../hooks/use-maqraah-settings"
import { SectionCard, ToggleRow } from "./section-card"

interface Props {
  settings: MaqraahSettings
  onUpdate: (updates: Partial<MaqraahSettings>) => void
  onReset: () => void
}

const audioFormats = ["mp3", "m4a", "ogg", "wav", "aac"]
const riwayatList = [
  { value: "hafs", label: "حفص عن عاصم" },
  { value: "warsh", label: "ورش عن نافع" },
  { value: "qalun", label: "قالون عن نافع" },
  { value: "duri", label: "الدوري عن أبي عمرو" },
  { value: "shubah", label: "شعبة عن عاصم" },
  { value: "bazzi", label: "البزي عن ابن كثير" },
]

export function RecitationsSettings({ settings, onUpdate, onReset }: Props) {
  const formats = settings.maqraah_recitations_allowed_audio_formats || []
  const riwayat = settings.maqraah_recitations_available_riwayat || []

  const toggleFormat = (f: string) => {
    const next = formats.includes(f) ? formats.filter((x) => x !== f) : [...formats, f]
    onUpdate({ maqraah_recitations_allowed_audio_formats: next })
  }

  const toggleRiwayah = (r: string) => {
    const next = riwayat.includes(r) ? riwayat.filter((x) => x !== r) : [...riwayat, r]
    onUpdate({ maqraah_recitations_available_riwayat: next })
  }

  return (
    <div className="space-y-6">
      <SectionCard
        icon={Mic}
        title="التلاوات الصوتية"
        description="الصيغ المسموحة وحدود الحجم"
        onReset={onReset}
      >
        <div className="space-y-2">
          <Label className="font-medium text-sm">صيغ الصوت المسموحة</Label>
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
            <Label className="font-medium text-sm">أقصى حجم تسجيل صوتي (MB)</Label>
            <Input
              type="number"
              min={1}
              value={settings.maqraah_recitations_max_audio_size_mb ?? 25}
              onChange={(e) =>
                onUpdate({ maqraah_recitations_max_audio_size_mb: Number(e.target.value) })
              }
              className="h-11"
            />
          </div>
          <div className="space-y-2">
            <Label className="font-medium text-sm">أقصى حجم فيديو (MB)</Label>
            <Input
              type="number"
              min={1}
              disabled={!settings.maqraah_recitations_allow_video}
              value={settings.maqraah_recitations_max_video_size_mb ?? 100}
              onChange={(e) =>
                onUpdate({ maqraah_recitations_max_video_size_mb: Number(e.target.value) })
              }
              className="h-11"
            />
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <ToggleRow
            label="السماح بتلاوات فيديو"
            description="بالإضافة للتسجيل الصوتي"
            checked={settings.maqraah_recitations_allow_video ?? false}
            onChange={(v) => onUpdate({ maqraah_recitations_allow_video: v })}
          />
          <ToggleRow
            label="السماح بإعادة التلاوة"
            description="إعادة الإرسال بعد التقييم"
            checked={settings.maqraah_recitations_allow_retry ?? true}
            onChange={(v) => onUpdate({ maqraah_recitations_allow_retry: v })}
          />
        </div>
      </SectionCard>

      <SectionCard icon={BookOpen} title="الروايات" description="الروايات المتاحة للتلاوة">
        <div className="space-y-2">
          <Label className="font-medium text-sm">الرواية الافتراضية</Label>
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
          <Label className="font-medium text-sm">الروايات المتاحة</Label>
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

      <SectionCard icon={Star} title="التقييم" description="سلم وقواعد تقييم التلاوات">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label className="font-medium text-sm">سلم التقييم</Label>
            <Select
              value={String(settings.maqraah_recitations_rating_scale ?? 5)}
              onValueChange={(v) => onUpdate({ maqraah_recitations_rating_scale: Number(v) })}
            >
              <SelectTrigger className="h-11">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="5">من 5</SelectItem>
                <SelectItem value="10">من 10</SelectItem>
                <SelectItem value="100">من 100</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label className="font-medium text-sm">درجة النجاح</Label>
            <Input
              type="number"
              min={1}
              value={settings.maqraah_recitations_passing_score ?? 3}
              onChange={(e) =>
                onUpdate({ maqraah_recitations_passing_score: Number(e.target.value) })
              }
              className="h-11"
            />
            <p className="text-[11px] text-muted-foreground flex items-center gap-1">
              <Badge variant="secondary" className="text-[10px]">
                من {settings.maqraah_recitations_rating_scale ?? 5}
              </Badge>
              الحد الأدنى لاعتماد التلاوة
            </p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <ToggleRow
            label="إلزام ملاحظات المقرئ"
            description="كتابة ملاحظة مع كل تقييم"
            checked={settings.maqraah_recitations_require_feedback ?? true}
            onChange={(v) => onUpdate({ maqraah_recitations_require_feedback: v })}
          />
          <ToggleRow
            label="تتبع أخطاء التجويد"
            description="تسجيل الأخطاء لكل تلاوة"
            checked={settings.maqraah_recitations_track_tajweed_errors ?? true}
            onChange={(v) => onUpdate({ maqraah_recitations_track_tajweed_errors: v })}
          />
        </div>
      </SectionCard>
    </div>
  )
}
