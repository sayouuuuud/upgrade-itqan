"use client"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Search } from "lucide-react"
import { SectionCard } from "./section-card"
import { useI18n } from "@/lib/i18n/context"

interface Props {
  settings: Record<string, any>
  onUpdate: (updates: Record<string, any>) => void
}

export function SeoSettings({ settings, onUpdate }: Props) {
  const { t } = useI18n()
  const a = t.admin

  return (
    <div className="space-y-6">
      <SectionCard
        icon={Search}
        title={a.ssSeoSettings}
        description={a.ssSeoDesc}
      >
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label className="text-sm">{a.ssSeoTitle}</Label>
            <Input
              value={settings.seo_title ?? ""}
              onChange={(e) => onUpdate({ seo_title: e.target.value })}
              placeholder={a.ssSeoTitlePlaceholder}
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-sm">{a.ssSeoDescription}</Label>
            <Textarea
              rows={2}
              value={settings.seo_description ?? ""}
              onChange={(e) => onUpdate({ seo_description: e.target.value })}
              placeholder={a.ssSeoDescPlaceholder}
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-sm">{a.ssSeoKeywords}</Label>
            <Input
              value={settings.seo_keywords ?? ""}
              onChange={(e) => onUpdate({ seo_keywords: e.target.value })}
              placeholder={a.ssSeoKeywordsPlaceholder}
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-sm">{a.ssSeoOgImage}</Label>
            <Input
              dir="ltr"
              value={settings.seo_og_image ?? ""}
              onChange={(e) => onUpdate({ seo_og_image: e.target.value })}
              placeholder="https://..."
            />
          </div>
        </div>
      </SectionCard>
    </div>
  )
}
