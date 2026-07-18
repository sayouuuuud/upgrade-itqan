"use client"

import { useState } from "react"
import { ShieldCheck, GraduationCap, Mic, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { useI18n } from "@/lib/i18n/context"
import { switchAdminMode } from "@/lib/admin/switch-mode-action"

type Mode = "super" | "maqraa" | "academy"

// Segmented control that lets a Super Admin switch the lens they operate
// the dashboard through. Uses Server Action for instant mode switch + redirect
// without network latency or router.push() overhead.
export function AdminRoleSwitcher({
  currentMode,
  collapsed = false,
}: {
  currentMode: Mode
  collapsed?: boolean
}) {
  const [pending, setPending] = useState<Mode | null>(null)
  const { t } = useI18n()

  const MODES: {
    id: Mode
    label: string
    shortLabel: string
    icon: typeof ShieldCheck
    activeClass: string
    dotClass: string
  }[] = [
    {
      id: "super",
      label: t.adminRoleSwitcher?.superAdmin || "المدير العام",
      shortLabel: t.adminRoleSwitcher?.superAdminShort || "عام",
      icon: ShieldCheck,
      activeClass: "bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/40",
      dotClass: "bg-amber-500",
    },
    {
      id: "maqraa",
      label: t.adminRoleSwitcher?.maqraaAdmin || "مدير المقرأة",
      shortLabel: t.adminRoleSwitcher?.maqraaAdminShort || "المقرأة",
      icon: Mic,
      activeClass: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/40",
      dotClass: "bg-emerald-500",
    },
    {
      id: "academy",
      label: t.adminRoleSwitcher?.academyAdmin || "مدير الأكاديمية",
      shortLabel: t.adminRoleSwitcher?.academyAdminShort || "الأكاديمية",
      icon: GraduationCap,
      activeClass: "bg-blue-500/15 text-blue-700 dark:text-blue-400 border-blue-500/40",
      dotClass: "bg-blue-500",
    },
  ]

  async function pickMode(mode: Mode) {
    if (mode === currentMode || pending) return
    setPending(mode)
    try {
      // Server Action handles mode persistence + atomic redirect to mode home
      await switchAdminMode(mode)
    } catch (err) {
      console.error("Failed to switch mode:", err)
      setPending(null)
    }
  }

  // Collapsed sidebar → show only the active mode's icon with a coloured dot.
  if (collapsed) {
    const active = MODES.find((m) => m.id === currentMode) ?? MODES[0]
    const ActiveIcon = active.icon
    return (
      <TooltipProvider delayDuration={150}>
        <div className="flex flex-col items-center gap-1 w-full px-2">
          {MODES.map((m) => {
            const Icon = m.icon
            const isActive = m.id === currentMode
            const isLoading = pending === m.id
            return (
              <Tooltip key={m.id}>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    onClick={() => pickMode(m.id)}
                    disabled={!!pending}
                    className={cn(
                      "relative flex h-9 w-9 items-center justify-center rounded-xl border transition-all duration-200",
                      isActive
                        ? m.activeClass + " shadow-sm"
                        : "border-transparent text-muted-foreground hover:bg-muted hover:text-foreground"
                    )}
                    aria-label={m.label}
                    aria-pressed={isActive}
                  >
                    {isLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Icon className="h-4 w-4" />
                    )}
                    {isActive && (
                      <span className={cn("absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full border-2 border-card", m.dotClass)} />
                    )}
                  </button>
                </TooltipTrigger>
                <TooltipContent side="left">{m.label}</TooltipContent>
              </Tooltip>
            )
          })}
        </div>
      </TooltipProvider>
    )
  }

  // Expanded sidebar → full segmented control with labels.
  return (
    <div
      dir="rtl"
      className="w-full rounded-xl border border-border bg-muted/40 p-1"
      role="group"
      aria-label="تبديل وضع الإدارة"
    >
      <div className="flex items-center gap-1">
        {MODES.map((m) => {
          const Icon = m.icon
          const isActive = m.id === currentMode
          const isLoading = pending === m.id

          return (
            <button
              key={m.id}
              type="button"
              onClick={() => pickMode(m.id)}
              disabled={!!pending}
              aria-pressed={isActive}
              title={m.label}
              className={cn(
                "relative flex flex-1 flex-col items-center justify-center gap-1 rounded-lg border px-1 py-2 text-[10px] font-bold transition-all duration-200",
                isActive
                  ? m.activeClass + " shadow-sm"
                  : "border-transparent text-muted-foreground hover:bg-background hover:text-foreground"
              )}
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Icon className="h-4 w-4 shrink-0" />
              )}
              <span className="leading-none">{m.shortLabel}</span>
              {isActive && (
                <span className={cn("absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full border-2 border-card", m.dotClass)} />
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
