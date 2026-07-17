"use client"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Search } from "lucide-react"
import { SectionCard } from "./section-card"

interface Props {
  settings: Record<string, any>
  onUpdate: (updates: Record<string, any>) => void
}

export function SeoSettings({ settings, onUpdate }: Props) {
  return (
    <div className="space-y-6">
      <SectionCard
        icon={Search}
        title="إعدادات SEO"
        description="بيانات الموقع التي تظهر في محركات البحث"
      >
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label className="text-sm">عنوان الصفحة الرئيسية (Meta Title)</Label>
            <Input
              value={settings.seo_title ?? ""}
              onChange={(e) => onUpdate({ seo_title: e.target.value })}
              placeholder="ITQan — منصة تعليم القرآن الكريم"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-sm">وصف الموقع (Meta Description)</Label>
            <Textarea
              rows={2}
              value={settings.seo_description ?? ""}
              onChange={(e) => onUpdate({ seo_description: e.target.value })}
              placeholder="منصة تعليمية متكاملة لحفظ القرآن الكريم وتجويده..."
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-sm">الكلمات المفتاحية (Meta Keywords)</Label>
            <Input
              value={settings.seo_keywords ?? ""}
              onChange={(e) => onUpdate({ seo_keywords: e.target.value })}
              placeholder="قرآن، حفظ، تجويد، تعليم"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-sm">رابط صورة المشاركة (OG Image)</Label>
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
