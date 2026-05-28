"use client"

import useSWR from "swr"
import { MessageSquare, BookOpen, UserCheck, AlertTriangle, RotateCcw } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AcademySettings } from "../hooks/use-academy-settings"

interface ForumFiqhSettingsProps {
  settings: AcademySettings
  onUpdate: (updates: Partial<AcademySettings>) => void
  onReset: () => void
}

export function ForumFiqhSettings({ settings, onUpdate, onReset }: ForumFiqhSettingsProps) {
  const { data: officersData } = useSWR<{
    officers: Array<{ user_id: string; name: string; is_active: boolean }>
  }>("/api/academy/admin/fiqh/officers", (url: string) => fetch(url).then((r) => r.json()), {
    revalidateOnFocus: false,
    dedupingInterval: 60000,
  })
  const activeOfficers = (officersData?.officers || []).filter((o) => o.is_active)

  const bannedWords = settings.academy_forum_banned_words || []

  const updateBannedWords = (text: string) => {
    const words = text
      .split(/[,\n]/)
      .map((w) => w.trim())
      .filter(Boolean)
    onUpdate({ academy_forum_banned_words: words })
  }

  return (
    <div className="space-y-6">
      {/* Forum Settings */}
      <Card className="border-border">
        <CardHeader className="bg-muted/30 border-b border-border">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-xl">
                <MessageSquare className="w-5 h-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-lg">إعدادات المنتدى</CardTitle>
                <CardDescription className="text-xs mt-0.5">التحكم في منتدى النقاش</CardDescription>
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={onReset} className="text-muted-foreground">
              <RotateCcw className="w-4 h-4 ml-1" />
              استعادة
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pt-6 space-y-6">
          <div className="flex items-center justify-between p-4 bg-muted/50 rounded-xl">
            <div className="space-y-0.5">
              <Label className="font-medium">تفعيل المنتدى</Label>
              <p className="text-xs text-muted-foreground">السماح بإنشاء موضوعات والرد عليها</p>
            </div>
            <Switch
              checked={settings.academy_forum_enabled ?? true}
              onCheckedChange={(v) => onUpdate({ academy_forum_enabled: v })}
            />
          </div>

          {settings.academy_forum_enabled !== false && (
            <>
              <div className="flex items-center justify-between p-4 bg-muted/50 rounded-xl">
                <div className="space-y-0.5">
                  <Label className="font-medium">موافقة قبل النشر</Label>
                  <p className="text-xs text-muted-foreground">
                    {settings.academy_forum_approval_required
                      ? "الموضوعات تنتظر موافقة المشرف"
                      : "الموضوعات تُنشر مباشرة"}
                  </p>
                </div>
                <Switch
                  checked={settings.academy_forum_approval_required ?? false}
                  onCheckedChange={(v) => onUpdate({ academy_forum_approval_required: v })}
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label className="font-medium text-sm">الحد الأدنى للنقاط لإنشاء موضوع</Label>
                  <Input
                    type="number"
                    value={settings.academy_forum_min_points ?? 50}
                    onChange={(e) => onUpdate({ academy_forum_min_points: parseInt(e.target.value) || 0 })}
                    min={0}
                    max={10000}
                    className="h-11"
                  />
                  <p className="text-[11px] text-muted-foreground">0 = لا يوجد حد أدنى</p>
                </div>
              </div>

              <div className="space-y-3">
                <Label className="font-medium text-sm">الكلمات الممنوعة (Auto-moderation)</Label>
                <Textarea
                  value={bannedWords.join(", ")}
                  onChange={(e) => updateBannedWords(e.target.value)}
                  placeholder="كلمة1, كلمة2, كلمة3..."
                  className="min-h-[100px] resize-none"
                />
                <p className="text-[11px] text-muted-foreground">
                  افصل بين الكلمات بفاصلة أو سطر جديد. المنشورات المحتوية على هذه الكلمات ستُحجب تلقائياً.
                </p>
                {bannedWords.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {bannedWords.slice(0, 10).map((word, i) => (
                      <Badge key={i} variant="secondary" className="text-xs">
                        {word}
                      </Badge>
                    ))}
                    {bannedWords.length > 10 && (
                      <Badge variant="outline" className="text-xs">
                        +{bannedWords.length - 10} أخرى
                      </Badge>
                    )}
                  </div>
                )}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Fiqh Settings */}
      <Card className="border-border">
        <CardHeader className="bg-muted/30 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-xl">
              <BookOpen className="w-5 h-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">إعدادات الفقه</CardTitle>
              <CardDescription className="text-xs mt-0.5">التحكم في صفحة الأسئلة الفقهية</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6 space-y-6">
          <div className="flex items-center justify-between p-4 bg-muted/50 rounded-xl">
            <div className="space-y-0.5">
              <Label className="font-medium">تفعيل صفحة الفقه</Label>
              <p className="text-xs text-muted-foreground">السماح للطلاب بإرسال أسئلة فقهية</p>
            </div>
            <Switch
              checked={settings.academy_fiqh_enabled ?? true}
              onCheckedChange={(v) => onUpdate({ academy_fiqh_enabled: v })}
            />
          </div>

          {settings.academy_fiqh_enabled !== false && (
            <>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label className="font-medium text-sm">مدة الرد المتوقعة (أيام)</Label>
                  <Input
                    type="number"
                    value={settings.academy_fiqh_response_days ?? 3}
                    onChange={(e) => onUpdate({ academy_fiqh_response_days: parseInt(e.target.value) || 3 })}
                    min={1}
                    max={30}
                    className="h-11"
                  />
                  <p className="text-[11px] text-muted-foreground">
                    يظهر للطالب: &quot;الرد المتوقع خلال {settings.academy_fiqh_response_days ?? 3} أيام&quot;
                  </p>
                </div>

                <div className="space-y-2">
                  <Label className="font-medium text-sm">مشرف الفقه الافتراضي</Label>
                  <Select
                    value={settings.academy_fiqh_default_supervisor || "none"}
                    onValueChange={(v) =>
                      onUpdate({ academy_fiqh_default_supervisor: v === "none" ? "" : v })
                    }
                  >
                    <SelectTrigger className="h-11">
                      <SelectValue placeholder="اختر مشرف (اختياري)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">بدون مشرف افتراضي</SelectItem>
                      {activeOfficers.map((o) => (
                        <SelectItem key={o.user_id} value={o.user_id}>
                          {o.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-[11px] text-muted-foreground">للأسئلة بدون تصنيف</p>
                </div>
              </div>

              {!settings.academy_fiqh_default_supervisor && (
                <Alert className="bg-warning/10 border-warning/30">
                  <AlertTriangle className="w-4 h-4 text-warning" />
                  <AlertDescription className="text-sm text-warning">
                    الأسئلة الفقهية بدون مشرف معيّن قد لا تُرد بسرعة. يُنصح بتعيين مشرف افتراضي.
                  </AlertDescription>
                </Alert>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
