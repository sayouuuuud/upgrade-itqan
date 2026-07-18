"use client"

import { Trophy, Star, Flame, Award, TrendingUp, RotateCcw } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Button } from "@/components/ui/button"
import { AcademySettings } from "../hooks/use-academy-settings"
import { useI18n } from "@/lib/i18n/context"

interface GamificationSettingsProps {
  settings: AcademySettings
  onUpdate: (updates: Partial<AcademySettings>) => void
  onReset?: () => void
}

export function GamificationSettings({ settings, onUpdate, onReset }: GamificationSettingsProps) {
  const { t } = useI18n()
  const academy = (t as any).academy as Record<string, string> | undefined
  const a = t.academyAdmin

  const pointsConfig = [
    { key: "academy_gamification_points_recitation", label: a.gmActivity, default: 10 },
    { key: "academy_gamification_points_mastery", label: a.gmActivity, default: 30 },
    { key: "academy_gamification_points_task", label: a.gmActivity, default: 15 },
    { key: "academy_gamification_points_attendance", label: a.gmActivity, default: 20 },
    { key: "academy_gamification_points_streak", label: a.gmActivity, default: 5 },
    { key: "academy_gamification_points_juz", label: a.gmActivity, default: 100 },
  ]

  const levelsConfig = [
    { key: "academy_gamification_level_beginner", label: a.gmLevelBeginner, color: "bg-blue-500" },
    { key: "academy_gamification_level_intermediate", label: a.gmLevelIntermediate, color: "bg-green-500" },
    { key: "academy_gamification_level_advanced", label: a.gmLevelAdvanced, color: "bg-purple-500" },
    { key: "academy_gamification_level_hafiz", label: a.gmLevelHafiz, color: "bg-yellow-500" },
  ]

  return (
    <div className="space-y-6">
      {/* Feature Toggles */}
      <Card className="border-border">
        <CardHeader className="bg-muted/30 border-b border-border">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-xl">
                <Trophy className="w-5 h-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-lg">{a.gmFeatures}</CardTitle>
                <CardDescription className="text-xs mt-0.5">{a.gmFeaturesDesc}</CardDescription>
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={() => onReset?.()} className="text-muted-foreground">
              <RotateCcw className="w-4 h-4 ml-1" />
              {a.gsRestore}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pt-6 grid gap-4 md:grid-cols-2">
          <div className="flex items-center justify-between p-4 bg-muted/50 rounded-xl">
            <div className="flex items-center gap-3">
              <Star className="w-5 h-5 text-yellow-500" />
              <div className="space-y-0.5">
                <Label className="font-medium">{a.gmPointsSystem}</Label>
                <p className="text-xs text-muted-foreground">{a.gmPointsSystemDesc}</p>
              </div>
            </div>
            <Switch
              checked={settings.academy_gamification_points_enabled ?? true}
              onCheckedChange={(v) => onUpdate({ academy_gamification_points_enabled: v })}
            />
          </div>

          <div className="flex items-center justify-between p-4 bg-muted/50 rounded-xl">
            <div className="flex items-center gap-3">
              <Award className="w-5 h-5 text-purple-500" />
              <div className="space-y-0.5">
                <Label className="font-medium">{a.gmBadges}</Label>
                <p className="text-xs text-muted-foreground">{a.gmBadgesDesc}</p>
              </div>
            </div>
            <Switch
              checked={settings.academy_gamification_badges_enabled ?? true}
              onCheckedChange={(v) => onUpdate({ academy_gamification_badges_enabled: v })}
            />
          </div>

          <div className="flex items-center justify-between p-4 bg-muted/50 rounded-xl">
            <div className="flex items-center gap-3">
              <TrendingUp className="w-5 h-5 text-green-500" />
              <div className="space-y-0.5">
                <Label className="font-medium">{a.gmLeaderboard}</Label>
                <p className="text-xs text-muted-foreground">{a.gmLeaderboardDesc}</p>
              </div>
            </div>
            <Switch
              checked={settings.academy_gamification_leaderboard_enabled ?? true}
              onCheckedChange={(v) => onUpdate({ academy_gamification_leaderboard_enabled: v })}
            />
          </div>

          <div className="flex items-center justify-between p-4 bg-muted/50 rounded-xl">
            <div className="flex items-center gap-3">
              <Flame className="w-5 h-5 text-orange-500" />
              <div className="space-y-0.5">
                <Label className="font-medium">{a.gmStreak}</Label>
                <p className="text-xs text-muted-foreground">{a.gmStreakDesc}</p>
              </div>
            </div>
            <Switch
              checked={settings.academy_gamification_streak_enabled ?? true}
              onCheckedChange={(v) => onUpdate({ academy_gamification_streak_enabled: v })}
            />
          </div>
        </CardContent>
      </Card>

      {/* Points Values */}
      <Card className="border-border">
        <CardHeader className="bg-muted/30 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-xl">
              <Star className="w-5 h-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">{a.gmPointsValues}</CardTitle>
              <CardDescription className="text-xs mt-0.5">{a.gmPointsValuesDesc}</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-right text-sm text-muted-foreground border-b">
                  <th className="pb-3 font-medium">{a.gmActivity}</th>
                  <th className="pb-3 font-medium w-32">{a.gmPoints}</th>
                </tr>
              </thead>
              <tbody>
                {pointsConfig.map((item) => (
                  <tr key={item.key} className="border-b last:border-0">
                    <td className="py-3">{item.label}</td>
                    <td className="py-3">
                      <Input
                        type="number"
                        value={(settings as any)[item.key] ?? item.default}
                        onChange={(e) =>
                          onUpdate({ [item.key]: parseInt(e.target.value) || item.default } as any)
                        }
                        min={0}
                        max={1000}
                        className="h-9 w-24"
                      />
                    </td>
                  </tr>
                ))}
                <tr className="bg-muted/30">
                  <td className="py-3 font-medium">{a.gmStreakMultiplier}</td>
                  <td className="py-3">
                    <div className="flex items-center gap-1">
                      <span className="text-muted-foreground">×</span>
                      <Input
                        type="number"
                        step="0.1"
                        value={settings.academy_gamification_streak_multiplier ?? 1.5}
                        onChange={(e) =>
                          onUpdate({ academy_gamification_streak_multiplier: parseFloat(e.target.value) || 1.5 })
                        }
                        min={1}
                        max={5}
                        className="h-9 w-20"
                      />
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Example */}
          <div className="mt-4 p-3 bg-success/10 text-success rounded-lg text-sm">
            {a.gmExampleText1}
            {(settings as any).academy_gamification_points_recitation ?? 10}{a.gmExampleText2}
            {" "}
            {Math.round(
              ((settings as any).academy_gamification_points_recitation ?? 10) *
                (settings.academy_gamification_streak_multiplier ?? 1.5)
            )}{a.gmExamplePoints}
          </div>
        </CardContent>
      </Card>

      {/* Level Thresholds */}
      <Card className="border-border">
        <CardHeader className="bg-muted/30 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-xl">
              <TrendingUp className="w-5 h-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">{a.gmLevelThresholds}</CardTitle>
              <CardDescription className="text-xs mt-0.5">{a.gmLevelThresholdsDesc}</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="grid gap-4 md:grid-cols-2">
            {levelsConfig.map((level, index) => (
              <div key={level.key} className="flex items-center gap-4 p-4 bg-muted/50 rounded-xl">
                <div className={`w-3 h-3 rounded-full ${level.color}`} />
                <div className="flex-1">
                  <Label className="font-medium">{level.label}</Label>
                  <p className="text-xs text-muted-foreground">
                    {index === 0 ? a.gmRangeFrom : a.gmRangeFromLabel} {(settings as any)[levelsConfig[index - 1]?.key] ?? (index === 0 ? 0 : "")}
                    {index < levelsConfig.length - 1 ? ` ${a.gmRangeTo}` : "+"}
                  </p>
                </div>
                <Input
                  type="number"
                  value={(settings as any)[level.key] ?? [500, 2000, 5000, 5000][index]}
                  onChange={(e) =>
                    onUpdate({ [level.key]: parseInt(e.target.value) || 0 } as any)
                  }
                  min={0}
                  className="h-9 w-24"
                />
              </div>
            ))}
          </div>

          {/* Visual Progress */}
          <div className="mt-6 p-4 bg-muted/30 rounded-xl">
            <Label className="text-sm text-muted-foreground mb-3 block">{a.gmLevelDiagram}</Label>
            <div className="relative h-3 bg-muted rounded-full overflow-hidden">
              <div className="absolute inset-y-0 right-0 w-[20%] bg-blue-500" />
              <div className="absolute inset-y-0 right-[20%] w-[30%] bg-green-500" />
              <div className="absolute inset-y-0 right-[50%] w-[30%] bg-purple-500" />
              <div className="absolute inset-y-0 right-[80%] w-[20%] bg-yellow-500" />
            </div>
            <div className="flex justify-between mt-2 text-[10px] text-muted-foreground">
              <span>0</span>
              <span>{(settings as any).academy_gamification_level_beginner ?? 500}</span>
              <span>{(settings as any).academy_gamification_level_intermediate ?? 2000}</span>
              <span>{(settings as any).academy_gamification_level_advanced ?? 5000}+</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
