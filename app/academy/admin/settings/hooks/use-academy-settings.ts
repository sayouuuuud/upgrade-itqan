"use client"

import useSWR from "swr"
import { useCallback, useState } from "react"
import { toast } from "sonner"
import { useI18n } from "@/lib/i18n/context"

// Types for all settings
export interface AcademySettings {
  // General
  academy_general_name?: string
  academy_general_logo?: string
  academy_general_favicon?: string
  academy_general_description?: string
  academy_general_contact_email?: string
  academy_general_whatsapp?: string
  academy_general_timezone?: string
  academy_general_language?: string
  academy_general_direction?: string
  app_url?: string

  // Registration
  academy_registration_student_enabled?: boolean
  academy_registration_teacher_enabled?: boolean
  academy_registration_student_approval?: boolean
  academy_registration_teacher_approval?: boolean
  academy_registration_required_fields?: string[]
  academy_registration_email_verification?: boolean
  academy_registration_welcome_message?: string
  academy_registration_default_course?: string

  // Courses & Content
  academy_courses_approval_required?: boolean
  academy_courses_max_video_size?: number
  academy_courses_max_attachment_size?: number
  academy_courses_allowed_formats?: string[]
  academy_courses_storage_provider?: string
  academy_courses_default_quality?: string
  academy_courses_download_enabled?: boolean
  academy_courses_watermark_enabled?: boolean
  academy_courses_watermark_text?: string
  academy_courses_watermark_position?: string

  // Live Sessions
  academy_sessions_provider?: string
  academy_sessions_default_duration?: number
  academy_sessions_reminder_first?: number
  academy_sessions_reminder_second?: number
  academy_sessions_auto_record?: boolean
  academy_sessions_auto_admit?: boolean
  academy_sessions_link_expiry?: number

  // Gamification
  academy_gamification_points_recitation?: number
  academy_gamification_points_mastery?: number
  academy_gamification_points_task?: number
  academy_gamification_points_attendance?: number
  academy_gamification_points_streak?: number
  academy_gamification_points_juz?: number
  academy_gamification_streak_multiplier?: number
  academy_gamification_level_beginner?: number
  academy_gamification_level_intermediate?: number
  academy_gamification_level_advanced?: number
  academy_gamification_level_hafiz?: number
  academy_gamification_points_enabled?: boolean
  academy_gamification_badges_enabled?: boolean
  academy_gamification_leaderboard_enabled?: boolean
  academy_gamification_streak_enabled?: boolean

  // Notifications & Email
  academy_notifications_in_app_enabled?: boolean
  academy_notifications_email_enabled?: boolean
  smtp_config?: {
    host?: string
    port?: string
    user?: string
    password?: string
    fromEmail?: string
    fromName?: string
  }
  academy_notifications_events?: Record<string, boolean> | string[]
  academy_notifications_parent_report_day?: string
  academy_notifications_parent_report_time?: string
  academy_notifications_werd_reminder_time?: string

  // Forum & Fiqh
  academy_forum_enabled?: boolean
  academy_forum_approval_required?: boolean
  academy_forum_min_points?: number
  academy_forum_banned_words?: string[]
  academy_fiqh_enabled?: boolean
  academy_fiqh_response_days?: number
  academy_fiqh_default_supervisor?: string

  // Security & Privacy
  academy_security_session_timeout?: number
  academy_security_max_login_attempts?: number
  academy_security_lockout_duration?: number
  academy_security_2fa_enabled?: boolean
  academy_security_2fa_method?: string
  academy_security_ip_whitelist_enabled?: boolean
  academy_security_ip_whitelist?: string[]
  academy_security_daily_upload_limit?: number
  academy_security_rate_limit?: number
  academy_security_password_min_length?: number
  academy_security_password_uppercase?: boolean
  academy_security_password_lowercase?: boolean
  academy_security_password_numbers?: boolean
  academy_security_password_symbols?: boolean
  academy_security_activity_logs?: boolean
  academy_security_logs_retention?: number

  // Maintenance
  academy_maintenance_enabled?: boolean
  academy_maintenance_message?: string
  academy_maintenance_allowed_ips?: string[]
}

// Default values
export const defaultSettings: AcademySettings = {
  // General
  academy_general_name: "أكاديمية إتقان",
  academy_general_timezone: "Asia/Riyadh",
  academy_general_language: "ar",
  academy_general_direction: "rtl",

  // Registration
  academy_registration_student_enabled: true,
  academy_registration_teacher_enabled: true,
  academy_registration_student_approval: false,
  academy_registration_teacher_approval: true,
  academy_registration_required_fields: ["gender", "country"],
  academy_registration_email_verification: true,

  // Courses
  academy_courses_approval_required: true,
  academy_courses_max_video_size: 500,
  academy_courses_max_attachment_size: 50,
  academy_courses_allowed_formats: ["mp4", "webm", "pdf", "mp3"],
  academy_courses_storage_provider: "s3",
  academy_courses_default_quality: "720p",
  academy_courses_download_enabled: false,
  academy_courses_watermark_enabled: false,
  academy_courses_watermark_position: "bottom-right",

  // Sessions
  academy_sessions_provider: "livekit",
  academy_sessions_default_duration: 60,
  academy_sessions_reminder_first: 60,
  academy_sessions_reminder_second: 10,
  academy_sessions_auto_record: false,
  academy_sessions_auto_admit: true,
  academy_sessions_link_expiry: 0,

  // Gamification
  academy_gamification_points_recitation: 10,
  academy_gamification_points_mastery: 30,
  academy_gamification_points_task: 15,
  academy_gamification_points_attendance: 20,
  academy_gamification_points_streak: 5,
  academy_gamification_points_juz: 100,
  academy_gamification_streak_multiplier: 1.5,
  academy_gamification_level_beginner: 500,
  academy_gamification_level_intermediate: 2000,
  academy_gamification_level_advanced: 5000,
  academy_gamification_level_hafiz: 10000,
  academy_gamification_points_enabled: true,
  academy_gamification_badges_enabled: true,
  academy_gamification_leaderboard_enabled: true,
  academy_gamification_streak_enabled: true,

  // Notifications
  academy_notifications_in_app_enabled: true,
  academy_notifications_email_enabled: true,
  academy_notifications_events: [
    "course_approved",
    "new_task",
    "session_reminder",
    "new_badge",
    "level_up",
    "streak_warning",
    "parent_report",
  ],
  academy_notifications_parent_report_day: "sunday",
  academy_notifications_parent_report_time: "08:00",
  academy_notifications_werd_reminder_time: "06:00",

  // Forum & Fiqh
  academy_forum_enabled: true,
  academy_forum_approval_required: false,
  academy_forum_min_points: 50,
  academy_forum_banned_words: [],
  academy_fiqh_enabled: true,
  academy_fiqh_response_days: 3,

  // Security
  academy_security_session_timeout: 30,
  academy_security_max_login_attempts: 5,
  academy_security_lockout_duration: 15,
  academy_security_2fa_enabled: false,
  academy_security_2fa_method: "email",
  academy_security_ip_whitelist_enabled: false,
  academy_security_ip_whitelist: [],
  academy_security_daily_upload_limit: 1,
  academy_security_rate_limit: 1000,
  academy_security_password_min_length: 8,
  academy_security_password_uppercase: true,
  academy_security_password_lowercase: true,
  academy_security_password_numbers: true,
  academy_security_password_symbols: false,
  academy_security_activity_logs: true,
  academy_security_logs_retention: 90,

  // Maintenance
  academy_maintenance_enabled: false,
  academy_maintenance_message: "المنصة تحت الصيانة، سنعود قريباً",
  academy_maintenance_allowed_ips: [],
}

const fetcher = (url: string) => fetch(url).then((res) => res.json())

export function useAcademySettings() {
  const { t } = useI18n()
  const academy = (t as any).academy as Record<string, string> | undefined
  const a = t.academyAdmin

  const { data, error, isLoading, mutate } = useSWR(
    "/api/academy/admin/settings",
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 30000,
    }
  )

  const [saving, setSaving] = useState(false)
  const [unsavedChanges, setUnsavedChanges] = useState<Partial<AcademySettings>>({})

  // Parse settings from API response — handles both array (rows) and object (legacy) shapes
  const rawSettingsMap: Record<string, any> = Array.isArray(data?.settings)
    ? data.settings.reduce((acc: Record<string, any>, row: any) => {
        acc[row.setting_key] = row.setting_value
        return acc
      }, {})
    : Object.entries(data?.settings || {}).reduce(
        (acc: Record<string, any>, [key, val]: [string, any]) => {
          acc[key] = (val as any)?.value ?? val
          return acc
        },
        {}
      )

  const settings: AcademySettings = { ...defaultSettings, ...rawSettingsMap }

  // Get metadata (updatedAt, modifiedBy) for each setting
  const metadata: Record<string, { updatedAt?: string; modifiedBy?: string }> =
    Array.isArray(data?.settings)
      ? data.settings.reduce((acc: Record<string, any>, row: any) => {
          acc[row.setting_key] = {
            updatedAt: row.updated_at,
            modifiedBy: row.modified_by,
          }
          return acc
        }, {})
      : Object.entries(data?.settings || {}).reduce(
          (acc: Record<string, any>, [key, val]: [string, any]) => {
            const v = val as any
            if (v?.updatedAt || v?.modifiedBy) {
              acc[key] = { updatedAt: v.updatedAt, modifiedBy: v.modifiedBy }
            }
            return acc
          },
          {}
        )

  // Update a single setting locally (track unsaved changes)
  const updateSetting = useCallback(
    <K extends keyof AcademySettings>(key: K, value: AcademySettings[K]) => {
      setUnsavedChanges((prev) => ({ ...prev, [key]: value }))
    },
    []
  )

  // Update multiple settings locally
  const updateSettings = useCallback((updates: Partial<AcademySettings>) => {
    setUnsavedChanges((prev) => ({ ...prev, ...updates }))
  }, [])

  // Save all unsaved changes
  const saveChanges = useCallback(async () => {
    if (Object.keys(unsavedChanges).length === 0) {
      toast.info(a.settingsNoChanges || "No changes to save")
      return false
    }

    setSaving(true)
    try {
      const res = await fetch("/api/academy/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ settings: unsavedChanges }),
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || a.settingsSaveFailed)
      }

      toast.success(a.settingsSavedSuccess)
      setUnsavedChanges({})
      mutate() // Revalidate
      return true
    } catch (err: any) {
      toast.error(err.message || a.settingsSaveFailed)
      return false
    } finally {
      setSaving(false)
    }
  }, [unsavedChanges, mutate, a])

  // Discard unsaved changes
  const discardChanges = useCallback(() => {
    setUnsavedChanges({})
  }, [])

  // Reset a section to defaults
  const resetSection = useCallback((prefix: string) => {
    const sectionDefaults: Partial<AcademySettings> = {}
    Object.entries(defaultSettings).forEach(([key, value]) => {
      if (key.startsWith(prefix)) {
        sectionDefaults[key as keyof AcademySettings] = value as any
      }
    })
    setUnsavedChanges((prev) => ({ ...prev, ...sectionDefaults }))
  }, [])

  // Test SMTP connection
  const testSmtp = useCallback(async (smtp: AcademySettings["smtp_config"]) => {
    try {
      const res = await fetch("/api/academy/admin/settings/test-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ smtp }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || data.details)

      toast.success(data.message || a.settingsSmtpSuccess)
      return true
    } catch (err: any) {
      toast.error(err.message || a.settingsSmtpFailed)
      return false
    }
  }, [a])

  // Get merged settings (saved + unsaved)
  const mergedSettings: AcademySettings = { ...settings, ...unsavedChanges }

  return {
    settings: mergedSettings,
    metadata,
    isLoading,
    error,
    saving,
    unsavedChanges,
    hasUnsavedChanges: Object.keys(unsavedChanges).length > 0,
    unsavedCount: Object.keys(unsavedChanges).length,
    updateSetting,
    updateSettings,
    saveChanges,
    discardChanges,
    resetSection,
    testSmtp,
    refresh: mutate,
  }
}
