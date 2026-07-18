"use client"

import { useState, useEffect } from "react"
import {
  Settings,
  Globe,
  UserPlus,
  Video,
  VideoIcon,
  Trophy,
  Bell,
  MessageSquare,
  Save,
  X,
  Loader2,
  AlertCircle,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { cn } from "@/lib/utils"
import { useI18n } from "@/lib/i18n/context"
import { useAcademySettings } from "./hooks/use-academy-settings"
import {
  GeneralSettings,
  RegistrationSettings,
  CoursesContentSettings,
  LiveSessionsSettings,
  GamificationSettings,
  NotificationsEmailSettings,
  ForumFiqhSettings,
} from "./_components"

const getTabs = (a: any) => [
  {
    id: "general",
    label: a.settingsGeneral || "General",
    icon: Globe,
    prefix: "academy_general_",
  },
  {
    id: "registration",
    label: a.settingsRegistration || "Registration",
    icon: UserPlus,
    prefix: "academy_registration_",
  },
  {
    id: "courses",
    label: a.settingsCourses || "Courses & Content",
    icon: Video,
    prefix: "academy_courses_",
  },
  {
    id: "sessions",
    label: a.settingsLiveSessions || "Live Sessions",
    icon: VideoIcon,
    prefix: "academy_sessions_",
  },
  {
    id: "gamification",
    label: a.settingsGamification || "Gamification",
    icon: Trophy,
    prefix: "academy_gamification_",
  },
  {
    id: "notifications",
    label: a.settingsNotifications || "Notifications & Email",
    icon: Bell,
    prefix: "academy_notifications_",
  },
  {
    id: "forum",
    label: a.settingsForum || "Forum & Fiqh",
    icon: MessageSquare,
    prefix: "academy_forum_",
  },
]

export default function AcademyAdminSettingsPage() {
  const { t, locale } = useI18n()
  const a = t.academyAdmin || {}
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
  } = useAcademySettings()

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
      case "registration":
        return (
          <RegistrationSettings
            settings={settings}
            onUpdate={updateSettings}
          />
        )
      case "courses":
        return (
          <CoursesContentSettings
            settings={settings}
            onUpdate={updateSettings}
          />
        )
      case "sessions":
        return (
          <LiveSessionsSettings
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
      case "notifications":
        return (
          <NotificationsEmailSettings
            settings={settings}
            onUpdate={updateSettings}
          />
        )
      case "forum":
        return (
          <ForumFiqhSettings
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
              {a.settingsTitle || (isAr ? "إعدادات الأكاديمية" : "Academy Settings")}
            </h1>
          </div>
        </div>
        {hasUnsavedChanges && (
          <div className="flex items-center gap-2">
            <span className="hidden text-sm text-amber-600 sm:block">
              {a.unsavedChanges || (isAr ? "تعديلات غير محفوظة" : "Unsaved Changes")}
            </span>
            <Button size="sm" variant="ghost" onClick={discardChanges} disabled={saving}>
              <X className="h-3.5 w-3.5 me-1" />
              {a.discard || (isAr ? "تجاهل" : "Discard")}
            </Button>
            <Button size="sm" onClick={saveChanges} disabled={saving}>
              {saving ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin me-1" />
              ) : (
                <Save className="h-3.5 w-3.5 me-1" />
              )}
              {a.save || (isAr ? "حفظ" : "Save")}
            </Button>
          </div>
        )}
      </div>

      {/* Info Alert */}
      <Alert className="border-blue-200 bg-blue-50">
        <AlertCircle className="h-4 w-4 text-blue-600" />
        <AlertDescription className="text-blue-700">
          {a.settingsHint || (isAr ? "إعدادات خاصة بالأكاديمية فقط. الإعدادات العامة للموقع يديرها المدير العام." : "Academy-specific settings only. General site settings are managed by the General Manager.")}
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
