"use client"

import { useState, useEffect } from "react"
import {
  Settings,
  Globe,
  Users,
  BookOpen,
  Mic,
  Route,
  Trophy,
  Award,
  Bell,
  Save,
  X,
  Loader2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { cn } from "@/lib/utils"
import { useI18n } from "@/lib/i18n/context"
import { useMaqraahSettings } from "./hooks/use-maqraah-settings"
import {
  GeneralSettings,
  ReadersSettings,
  HalaqatSettings,
  RecitationsSettings,
  PathsSettings,
  GamificationSettings,
  CompetitionsSettings,
  NotificationsSettings,
} from "./_components"

const getTabs = (a: any) => [
  {
    id: "general",
    label: a.setTabGeneral || "عام",
    icon: Globe,
    prefix: "maqraah_general_",
  },
  {
    id: "readers",
    label: a.setTabReaders || "المقرئون والطلاب",
    icon: Users,
    prefix: "maqraah_readers_",
  },
  {
    id: "halaqat",
    label: a.setTabHalaqat || "الحلقات والجلسات",
    icon: BookOpen,
    prefix: "maqraah_halaqat_",
  },
  {
    id: "recitations",
    label: a.setTabRecitations || "التلاوات والتقييم",
    icon: Mic,
    prefix: "maqraah_recitations_",
  },
  {
    id: "paths",
    label: a.setTabPaths || "مسارات الحفظ والتجويد",
    icon: Route,
    prefix: "maqraah_paths_",
  },
  {
    id: "gamification",
    label: a.setTabGamification || "النقاط والمستويات",
    icon: Trophy,
    prefix: "maqraah_points_",
  },
  {
    id: "competitions",
    label: a.setTabCompetitions || "المسابقات والشهادات",
    icon: Award,
    prefix: "maqraah_competitions_",
  },
  {
    id: "notifications",
    label: a.setTabNotifications || "الإشعارات والبريد",
    icon: Bell,
    prefix: "maqraah_notifications_",
  },
]

export default function MaqraahAdminSettingsPage() {
  const { t, locale } = useI18n()
  const a = t.admin || {}
  const tabs = getTabs(a)

  const {
    settings,
    metadata,
    isLoading,
    saving,
    hasUnsavedChanges,
    updateSettings,
    saveChanges,
    discardChanges,
  } = useMaqraahSettings()

  const [activeTab, setActiveTab] = useState("general")
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768)
    checkMobile()
    window.addEventListener("resize", checkMobile)
    return () => window.removeEventListener("resize", checkMobile)
  }, [])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "s") {
        e.preventDefault()
        if (hasUnsavedChanges) saveChanges()
      }
      if (e.key === "Escape") {
        if (hasUnsavedChanges) discardChanges()
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [hasUnsavedChanges, saveChanges, discardChanges])

  const renderTabContent = () => {
    switch (activeTab) {
      case "general":
        return (
          <GeneralSettings
            settings={settings}
            metadata={metadata}
            onUpdate={updateSettings}
          />
        )
      case "readers":
        return (
          <ReadersSettings
            settings={settings}
            onUpdate={updateSettings}
          />
        )
      case "halaqat":
        return (
          <HalaqatSettings
            settings={settings}
            onUpdate={updateSettings}
          />
        )
      case "recitations":
        return (
          <RecitationsSettings
            settings={settings}
            onUpdate={updateSettings}
          />
        )
      case "paths":
        return (
          <PathsSettings
            settings={settings}
            onUpdate={updateSettings}
          />
        )
      case "gamification":
        return (
          <GamificationSettings
            settings={settings}
            onUpdate={updateSettings}
          />
        )
      case "competitions":
        return (
          <CompetitionsSettings
            settings={settings}
            onUpdate={updateSettings}
          />
        )
      case "notifications":
        return (
          <NotificationsSettings
            settings={settings}
            onUpdate={updateSettings}
          />
        )
      default:
        return null
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-48" />
        <div className="space-y-2">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-card px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
            <Settings className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-lg font-bold leading-none">
              {a.maqraahSettingsTitle || "إعدادات المقرأة"}
            </h1>
          </div>
        </div>
        {hasUnsavedChanges && (
          <div className="flex items-center gap-2">
            <span className="hidden text-sm text-amber-600 sm:block">
              {a.unsavedChanges || "تعديلات غير محفوظة"}
            </span>
            <Button size="sm" variant="ghost" onClick={discardChanges} disabled={saving}>
              <X className="h-3.5 w-3.5 me-1" />
              {a.discard || "تجاهل"}
            </Button>
            <Button size="sm" onClick={saveChanges} disabled={saving}>
              {saving ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin me-1" />
              ) : (
                <Save className="h-3.5 w-3.5 me-1" />
              )}
              {a.save || "حفظ"}
            </Button>
          </div>
        )}
      </div>

      {/* Info Alert */}
      <Alert className="border-blue-200 bg-blue-50">
        <AlertDescription className="text-blue-700">
          {a.maqraahSettingsHint || "إعدادات خاصة بالمقرأة فقط. لا تؤثر على الأكاديمية أو باقي الموقع."}
        </AlertDescription>
      </Alert>

      {/* Grid: sidebar أولاً في JSX = يمين في RTL */}
      <div className="grid gap-6 lg:grid-cols-[200px_minmax(0,1fr)]">

        {/* Desktop Sidebar */}
        {!isMobile && (
          <aside className="lg:sticky lg:top-6 lg:self-start">
            <nav className="space-y-1 rounded-xl border bg-card p-2">
              {tabs.map((tab) => {
                const Icon = tab.icon
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id)}
                    className={cn(
                      "flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                      activeTab === tab.id
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:bg-accent hover:text-foreground"
                    )}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    <span className="truncate">{tab.label}</span>
                  </button>
                )
              })}
            </nav>
          </aside>
        )}

        {/* Mobile Selector */}
        {isMobile && (
          <div className="w-full">
            <select
              value={activeTab}
              onChange={(e) => setActiveTab(e.target.value)}
              className="w-full rounded-lg border bg-card px-3 py-2.5 text-sm font-medium"
            >
              {tabs.map((tab) => (
                <option key={tab.id} value={tab.id}>{tab.label}</option>
              ))}
            </select>
          </div>
        )}

        {/* Content */}
        <div className="min-w-0">
          {renderTabContent()}
        </div>
      </div>
    </div>
  )
}
