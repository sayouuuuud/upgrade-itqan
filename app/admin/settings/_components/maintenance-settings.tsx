"use client"

import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Wrench, Globe, BookOpen, BookMarked } from "lucide-react"
import { SectionCard, ToggleRow } from "./section-card"
import { useI18n } from "@/lib/i18n/context"
import { cn } from "@/lib/utils"

type MaintenanceScope = "site" | "academy" | "maqraah"

interface Props {
  settings: Record<string, any>
  onUpdate: (updates: Record<string, any>) => void
}

export function MaintenanceSettings({ settings, onUpdate }: Props) {
  const { t } = useI18n()
  const admin = (t as any).admin as Record<string, string> | undefined
  const a = t.admin

  const enabled = settings.maintenance_enabled === true || settings.maintenance_enabled === "true"
  const scope: MaintenanceScope = settings.maintenance_scope ?? "site"

  const SCOPE_OPTIONS: {
    value: MaintenanceScope
    label: string
    description: string
    icon: React.ElementType
    badgeClass: string
  }[] = [
    {
      value: "site",
      label: a.maintenanceScopeAll,
      description: a.maintenanceScopeAllDesc,
      icon: Globe,
      badgeClass: "bg-destructive/10 text-destructive border-destructive/20",
    },
    {
      value: "academy",
      label: a.maintenanceScopeAcademy,
      description: a.maintenanceScopeAcademyDesc,
      icon: BookOpen,
      badgeClass: "bg-amber-100 text-amber-700 border-amber-200",
    },
    {
      value: "maqraah",
      label: a.maintenanceScopeMaqraah,
      description: a.maintenanceScopeMaqraahDesc,
      icon: BookMarked,
      badgeClass: "bg-blue-100 text-blue-700 border-blue-200",
    },
  ]

  return (
    <div className="space-y-6">
      <SectionCard
        icon={Wrench}
        title={a.maintenanceModeTitle}
        description={a.maintenanceModeDesc}
      >
        <ToggleRow
          label={a.maintenanceModeToggle}
          description={
            enabled
              ? `${a.maintenanceModeActivePrefix} ${SCOPE_OPTIONS.find((s) => s.value === scope)?.label ?? scope}`
              : a.maintenanceModeOff
          }
          checked={enabled}
          onChange={(v) => onUpdate({ maintenance_enabled: v })}
          destructive
        />
      </SectionCard>

      {/* Scope selector — always visible so admin can prepare before enabling */}
      <SectionCard
        icon={Globe}
        title={a.maintenanceScopeTitle}
        description={a.maintenanceScopeDesc}
      >
        <div className="grid gap-3 md:grid-cols-3">
          {SCOPE_OPTIONS.map((option) => {
            const Icon = option.icon
            const isSelected = scope === option.value
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => onUpdate({ maintenance_scope: option.value })}
                className={cn(
                  "flex flex-col gap-2 rounded-xl border-2 p-4 text-right transition-all",
                  isSelected
                    ? "border-primary bg-primary/5 shadow-sm"
                    : "border-border hover:border-primary/40 hover:bg-muted/50"
                )}
              >
                <div className="flex items-center justify-between">
                  <Icon
                    className={cn(
                      "h-5 w-5",
                      isSelected ? "text-primary" : "text-muted-foreground"
                    )}
                  />
                  {isSelected && (
                    <Badge
                      variant="outline"
                      className={cn("text-xs font-medium", option.badgeClass)}
                    >
                      {a.maintenanceScopeSelected}
                    </Badge>
                  )}
                </div>
                <p
                  className={cn(
                    "font-semibold text-sm",
                    isSelected ? "text-foreground" : "text-muted-foreground"
                  )}
                >
                  {option.label}
                </p>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {option.description}
                </p>
              </button>
            )
          })}
        </div>
      </SectionCard>

      <SectionCard
        icon={Wrench}
        title={a.maintenanceMsgSectionTitle}
        description={a.maintenanceMsgSectionDesc}
      >
        <div className="space-y-1.5">
          <Label className="text-sm">{a.maintenanceMsgLabel}</Label>
          <Textarea
            rows={3}
            value={settings.maintenance_message ?? a.maintenanceMsgDefault}
            onChange={(e) => onUpdate({ maintenance_message: e.target.value })}
            placeholder={a.maintenanceMsgDefault}
          />
        </div>
      </SectionCard>
    </div>
  )
}
