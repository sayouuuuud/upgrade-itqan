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
import { useI18n } from "@/lib/i18n/context"

interface ForumFiqhSettingsProps {
  settings: AcademySettings
  onUpdate: (updates: Partial<AcademySettings>) => void
  onReset?: () => void
}

export function ForumFiqhSettings({ settings, onUpdate, onReset }: ForumFiqhSettingsProps) {
  const { t } = useI18n()
  const academy = (t as any).academy as Record<string, string> | undefined
  const a = t.academyAdmin
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
                <CardTitle className="text-lg">{a.ffForumSettings}</CardTitle>
                <CardDescription className="text-xs mt-0.5">{a.ffForumSettingsDesc}</CardDescription>
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={() => onReset?.()} className="text-muted-foreground">
              <RotateCcw className="w-4 h-4 ml-1" />
              {a.gsRestore}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pt-6 space-y-6">
          <div className="flex items-center justify-between p-4 bg-muted/50 rounded-xl">
            <div className="space-y-0.5">
              <Label className="font-medium">{a.ffEnableForum}</Label>
              <p className="text-xs text-muted-foreground">{a.ffEnableForumDesc}</p>
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
                  <Label className="font-medium">{a.ffApprovalRequired}</Label>
                  <p className="text-xs text-muted-foreground">
                    {settings.academy_forum_approval_required
                      ? a.ffApprovalRequiredPending
                      : a.ffApprovalRequiredAuto}
                  </p>
                </div>
                <Switch
                  checked={settings.academy_forum_approval_required ?? false}
                  onCheckedChange={(v) => onUpdate({ academy_forum_approval_required: v })}
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label className="font-medium text-sm">{a.ffMinPoints}</Label>
                  <Input
                    type="number"
                    value={settings.academy_forum_min_points ?? 50}
                    onChange={(e) => onUpdate({ academy_forum_min_points: parseInt(e.target.value) || 0 })}
                    min={0}
                    max={10000}
                    className="h-11"
                  />
                  <p className="text-[11px] text-muted-foreground">{a.ffMinPointsHint}</p>
                </div>
              </div>

              <div className="space-y-3">
                <Label className="font-medium text-sm">{a.ffBannedWords}</Label>
                <Textarea
                  value={bannedWords.join(", ")}
                  onChange={(e) => updateBannedWords(e.target.value)}
                  placeholder={a.ffBannedWordsPlaceholder}
                  className="min-h-[100px] resize-none"
                />
                <p className="text-[11px] text-muted-foreground">
                  {a.ffBannedWordsHint}
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
                        +{bannedWords.length - 10} {a.ffMore}
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
              <CardTitle className="text-lg">{a.ffFiqhSettings}</CardTitle>
              <CardDescription className="text-xs mt-0.5">{a.ffFiqhSettingsDesc}</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6 space-y-6">
          <div className="flex items-center justify-between p-4 bg-muted/50 rounded-xl">
            <div className="space-y-0.5">
              <Label className="font-medium">{a.ffEnableFiqh}</Label>
              <p className="text-xs text-muted-foreground">{a.ffEnableFiqhDesc}</p>
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
                  <Label className="font-medium text-sm">{a.ffResponseDays}</Label>
                  <Input
                    type="number"
                    value={settings.academy_fiqh_response_days ?? 3}
                    onChange={(e) => onUpdate({ academy_fiqh_response_days: parseInt(e.target.value) || 3 })}
                    min={1}
                    max={30}
                    className="h-11"
                  />
                  <p className="text-[11px] text-muted-foreground">
                    {a.ffResponseDaysPreview.replace('{days}', String(settings.academy_fiqh_response_days ?? 3))}
                  </p>
                </div>

                <div className="space-y-2">
                  <Label className="font-medium text-sm">{a.ffDefaultSupervisor}</Label>
                  <Select
                    value={settings.academy_fiqh_default_supervisor || "none"}
                    onValueChange={(v) =>
                      onUpdate({ academy_fiqh_default_supervisor: v === "none" ? "" : v })
                    }
                  >
                    <SelectTrigger className="h-11">
                      <SelectValue placeholder={a.ffSelectSupervisor} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">{a.ffNoSupervisor}</SelectItem>
                      {activeOfficers.map((o) => (
                        <SelectItem key={o.user_id} value={o.user_id}>
                          {o.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-[11px] text-muted-foreground">{a.ffSupervisorHint}</p>
                </div>
              </div>

              {!settings.academy_fiqh_default_supervisor && (
                <Alert className="bg-warning/10 border-warning/30">
                  <AlertTriangle className="w-4 h-4 text-warning" />
                  <AlertDescription className="text-sm text-warning">
                    {a.ffWarning}
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
