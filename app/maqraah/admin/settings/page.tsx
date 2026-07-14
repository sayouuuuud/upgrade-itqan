"use client"

import { useState, useEffect, useCallback } from "react"
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
import { ScrollArea } from "@/components/ui/scroll-area"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { toast } from "sonner"
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
      <div dir="rtl" className="space-y-4 p-4 md:p-6">
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
    <div dir="rtl" className="flex h-screen flex-col bg-background text-right">
      {/* Header */}
      <div className="border-b p-4 md:p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Settings className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-bold">
              {a.maqraahSettingsTitle || "إعدادات المقرأة"}
            </h1>
          </div>
          {hasUnsavedChanges && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-amber-600">
                {a.unsavedChanges || "Unsaved changes"}
              </span>
              <Button
                size="sm"
                variant="ghost"
                onClick={discardChanges}
                disabled={saving}
              >
                {a.discard || "Discard"}
              </Button>
              <Button
                size="sm"
                onClick={saveChanges}
                disabled={saving}
              >
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {a.save || "Save"}
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Info Alert */}
      <Alert className="m-4 md:m-6 border-blue-200 bg-blue-50">
        <AlertDescription className="text-blue-700">
          {a.maqraahSettingsHint ||
            "إعدادات خاصة بالمقرأة فقط. لا تؤثر هذه الإعدادات على الأكاديمية أو باقي الموقع."}
        </AlertDescription>
      </Alert>

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar Tabs */}
        <div
          className={cn(
            "border-l bg-muted/50 p-4",
            isMobile ? "hidden" : "w-48"
          )}
        >
          <ScrollArea className="h-full">
            <div className="space-y-2 pl-4">
              {tabs.map((tab) => {
                const Icon = tab.icon
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={cn(
                      "flex w-full items-center gap-2 rounded-lg px-3 py-2 text-right text-sm transition-colors",
                      activeTab === tab.id
                        ? "bg-primary text-primary-foreground"
                        : "hover:bg-accent text-foreground"
                    )}
                  >
                    <Icon className="h-4 w-4 flex-shrink-0" />
                    <span className="truncate">{tab.label}</span>
                  </button>
                )
              })}
            </div>
          </ScrollArea>
        </div>

        {/* Mobile Tab Selector */}
        {isMobile && (
          <div className="border-b p-2">
            <select
              value={activeTab}
              onChange={(e) => setActiveTab(e.target.value)}
              className="w-full rounded-lg border bg-background p-2 text-sm"
            >
              {tabs.map((tab) => (
                <option key={tab.id} value={tab.id}>
                  {tab.label}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Content Area */}
        <ScrollArea className="flex-1">
          <div className="p-4 md:p-6">
            {renderTabContent()}
          </div>
        </ScrollArea>
      </div>
    </div>
  )
}
