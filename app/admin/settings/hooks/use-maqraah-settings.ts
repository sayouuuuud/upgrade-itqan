"use client"

import useSWR from "swr"
import { useCallback, useState } from "react"
import { toast } from "sonner"
import { useI18n } from "@/lib/i18n/context";

// Types for all maqraah settings
export interface MaqraahSettings {
  // General / System
  maqraah_general_name?: string
  maqraah_general_description?: string
  maqraah_general_timezone?: string
  maqraah_general_language?: string
  maqraah_general_direction?: string
  app_url?: string
  reader_assignment_strategy?: string
  // Shared/global keys consumed by the public site (layout, navbar, dashboards)
  branding?: {
    logoUrl?: string
    faviconUrl?: string
    dashboardLogoUrl?: string
  }
  contact_info?: {
    email?: string
    phone?: string
    address?: string
  }
  social_links?: {
    twitter?: string
    facebook?: string
    instagram?: string
    youtube?: string
  }

  // Readers & Applications
  maqraah_readers_student_self_signup?: boolean
  maqraah_readers_accept_applications?: boolean
  maqraah_readers_require_approval?: boolean
  maqraah_readers_require_ijazah?: boolean
  maqraah_readers_min_memorization_juz?: number
  maqraah_readers_max_students?: number
  maqraah_readers_allow_student_choose?: boolean
  maqraah_readers_gender_match?: boolean

  // Halaqat & Sessions
  maqraah_halaqat_max_students?: number
  maqraah_halaqat_session_duration?: number
  maqraah_halaqat_provider?: string
  maqraah_halaqat_first_reminder_minutes?: number
  maqraah_halaqat_second_reminder_minutes?: number
  maqraah_halaqat_auto_record?: boolean
  maqraah_halaqat_allow_join_anytime?: boolean
  maqraah_halaqat_link_validity_minutes?: number
  maqraah_halaqat_late_grace_minutes?: number
  maqraah_halaqat_absence_limit?: number

  // Recitations & Evaluation
  maqraah_recitations_allowed_audio_formats?: string[]
  maqraah_recitations_max_audio_size_mb?: number
  maqraah_recitations_allow_video?: boolean
  maqraah_recitations_max_video_size_mb?: number
  maqraah_recitations_default_riwayah?: string
  maqraah_recitations_available_riwayat?: string[]
  maqraah_recitations_rating_scale?: number
  maqraah_recitations_passing_score?: number
  maqraah_recitations_require_feedback?: boolean
  maqraah_recitations_allow_retry?: boolean
  maqraah_recitations_track_tajweed_errors?: boolean

  // Memorization & Tajweed Paths
  maqraah_paths_memorization_enabled?: boolean
  maqraah_paths_tajweed_enabled?: boolean
  maqraah_paths_default_path?: string
  maqraah_paths_sequential_unlock?: boolean
  maqraah_paths_unlock_threshold?: number
  maqraah_paths_daily_target_verses?: number
  maqraah_paths_weekly_target_verses?: number
  maqraah_paths_revision_ratio?: number
  maqraah_paths_memorization_order?: string

  // Points, Levels & Badges
  maqraah_points_enabled?: boolean
  maqraah_points_badges_enabled?: boolean
  maqraah_points_leaderboard_enabled?: boolean
  maqraah_points_streak_enabled?: boolean
  maqraah_points_values?: Record<string, number>
  maqraah_points_streak_multiplier?: number
  maqraah_points_streak_threshold?: number
  maqraah_points_levels?: Record<string, { min: number; max: number | null }>

  // Competitions & Certificates
  maqraah_competitions_enabled?: boolean
  maqraah_competitions_auto_enroll?: boolean
  maqraah_competitions_min_level?: string
  maqraah_competitions_certificates_enabled?: boolean
  maqraah_competitions_certificate_signature?: string
  maqraah_competitions_certificate_logo?: string
  maqraah_competitions_certificate_template?: string
  maqraah_competitions_passing_percentage?: number
  maqraah_competitions_auto_issue_certificate?: boolean

  // Notifications & Email
  maqraah_notifications_in_app_enabled?: boolean
  maqraah_notifications_email_enabled?: boolean
  maqraah_notifications_events?: Record<string, boolean>
  maqraah_notifications_parent_report_enabled?: boolean
  maqraah_notifications_parent_report_day?: string
  maqraah_notifications_parent_report_hour?: number
  maqraah_notifications_session_reminder_hour?: number
  smtp_config?: {
    host?: string
    port?: string | number
    user?: string
    password?: string
    secure?: boolean
    fromEmail?: string
    fromName?: string
  }

  // Security & Privacy
  maqraah_security_session_timeout?: number
  maqraah_security_max_login_attempts?: number
  maqraah_security_lock_duration?: number
  maqraah_security_admin_2fa?: boolean
  maqraah_security_admin_ip_whitelist?: string[]
  maqraah_security_daily_upload_limit_mb?: number
  maqraah_security_api_rate_limit?: number
  maqraah_security_password_policy?: {
    min_length?: number
    require_uppercase?: boolean
    require_lowercase?: boolean
    require_numbers?: boolean
    require_special?: boolean
  }
  maqraah_security_activity_logs_enabled?: boolean

  // Maintenance
  maqraah_maintenance_mode?: boolean
  maqraah_maintenance_message?: string
  maqraah_maintenance_allowed_ips?: string[]
}

// Default values (mirror migration 044 seeds)
export const defaultMaqraahSettings: MaqraahSettings = {
  // General / System
  maqraah_general_name: "مقرأة إتقان",
  maqraah_general_timezone: "Asia/Riyadh",
  maqraah_general_language: "ar",
  maqraah_general_direction: "rtl",
  reader_assignment_strategy: "least_booked_today",
  branding: {
    logoUrl: "/branding/main-logo.png",
    faviconUrl: "/favicon.png",
    dashboardLogoUrl: "/branding/dashboard-logo.png",
  },
  contact_info: {
    email: "",
    phone: "",
    address: "",
  },
  social_links: {
    twitter: "",
    facebook: "",
    instagram: "",
    youtube: "",
  },

  // Readers
  maqraah_readers_student_self_signup: true,
  maqraah_readers_accept_applications: true,
  maqraah_readers_require_approval: true,
  maqraah_readers_require_ijazah: false,
  maqraah_readers_min_memorization_juz: 0,
  maqraah_readers_max_students: 20,
  maqraah_readers_allow_student_choose: true,
  maqraah_readers_gender_match: true,

  // Halaqat
  maqraah_halaqat_max_students: 8,
  maqraah_halaqat_session_duration: 30,
  maqraah_halaqat_provider: "livekit",
  maqraah_halaqat_first_reminder_minutes: 60,
  maqraah_halaqat_second_reminder_minutes: 10,
  maqraah_halaqat_auto_record: false,
  maqraah_halaqat_allow_join_anytime: true,
  maqraah_halaqat_link_validity_minutes: 120,
  maqraah_halaqat_late_grace_minutes: 5,
  maqraah_halaqat_absence_limit: 3,

  // Recitations
  maqraah_recitations_allowed_audio_formats: ["mp3", "m4a", "ogg", "wav"],
  maqraah_recitations_max_audio_size_mb: 25,
  maqraah_recitations_allow_video: false,
  maqraah_recitations_max_video_size_mb: 100,
  maqraah_recitations_default_riwayah: "hafs",
  maqraah_recitations_available_riwayat: ["hafs", "warsh", "qalun", "duri"],
  maqraah_recitations_rating_scale: 5,
  maqraah_recitations_passing_score: 3,
  maqraah_recitations_require_feedback: true,
  maqraah_recitations_allow_retry: true,
  maqraah_recitations_track_tajweed_errors: true,

  // Paths
  maqraah_paths_memorization_enabled: true,
  maqraah_paths_tajweed_enabled: true,
  maqraah_paths_default_path: "memorization",
  maqraah_paths_sequential_unlock: true,
  maqraah_paths_unlock_threshold: 80,
  maqraah_paths_daily_target_verses: 5,
  maqraah_paths_weekly_target_verses: 30,
  maqraah_paths_revision_ratio: 5,
  maqraah_paths_memorization_order: "mushaf",

  // Points
  maqraah_points_enabled: true,
  maqraah_points_badges_enabled: true,
  maqraah_points_leaderboard_enabled: true,
  maqraah_points_streak_enabled: true,
  maqraah_points_values: {
    recitation_submit: 10,
    recitation_excellent: 30,
    session_attended: 20,
    daily_target_met: 15,
    juz_completed: 100,
    khatma_completed: 500,
    streak_day: 5,
  },
  maqraah_points_streak_multiplier: 1.5,
  maqraah_points_streak_threshold: 7,
  maqraah_points_levels: {
    mubtadi: { min: 0, max: 500 },
    mutqin: { min: 500, max: 2000 },
    hafiz: { min: 2000, max: 5000 },
    mujaz: { min: 5000, max: null },
  },

  // Competitions
  maqraah_competitions_enabled: true,
  maqraah_competitions_auto_enroll: false,
  maqraah_competitions_min_level: "mutqin",
  maqraah_competitions_certificates_enabled: true,
  maqraah_competitions_certificate_template: "classic",
  maqraah_competitions_passing_percentage: 80,
  maqraah_competitions_auto_issue_certificate: true,

  // Notifications
  maqraah_notifications_in_app_enabled: true,
  maqraah_notifications_email_enabled: true,
  maqraah_notifications_events: {
    session_reminder: true,
    recitation_evaluated: true,
    new_badge: true,
    level_up: true,
    streak_warning: true,
    competition_announcement: true,
    certificate_issued: true,
  },
  maqraah_notifications_parent_report_enabled: true,
  maqraah_notifications_parent_report_day: "sunday",
  maqraah_notifications_parent_report_hour: 20,
  maqraah_notifications_session_reminder_hour: 5,

  // Security
  maqraah_security_session_timeout: 30,
  maqraah_security_max_login_attempts: 5,
  maqraah_security_lock_duration: 15,
  maqraah_security_admin_2fa: false,
  maqraah_security_admin_ip_whitelist: [],
  maqraah_security_daily_upload_limit_mb: 500,
  maqraah_security_api_rate_limit: 100,
  maqraah_security_password_policy: {
    min_length: 8,
    require_uppercase: true,
    require_lowercase: true,
    require_numbers: true,
    require_special: false,
  },
  maqraah_security_activity_logs_enabled: true,

  // Maintenance
  maqraah_maintenance_mode: false,
  maqraah_maintenance_message: "المقرأة تحت الصيانة، نعود قريباً.",
  maqraah_maintenance_allowed_ips: [],
}

const fetcher = (url: string) => fetch(url).then((res) => res.json())

export function useMaqraahSettings() {
  const { t } = useI18n();
  const isAr = t.locale === "ar";
  const { data, error, isLoading, mutate } = useSWR("/api/admin/settings", fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 30000,
  })

  const [saving, setSaving] = useState(false)
  const [unsavedChanges, setUnsavedChanges] = useState<Partial<MaqraahSettings>>({})

  // Parse settings from API response ({ key: { value, ... } } shape)
  const settings: MaqraahSettings = Object.entries(data?.settings || {}).reduce(
    (acc, [key, val]: [string, any]) => {
      acc[key as keyof MaqraahSettings] = (val?.value ?? val) as any
      return acc
    },
    { ...defaultMaqraahSettings } as MaqraahSettings
  )

  // Metadata (updatedAt, modifiedBy) per setting
  const metadata: Record<string, { updatedAt?: string; modifiedBy?: string }> = Object.entries(
    data?.settings || {}
  ).reduce((acc, [key, val]: [string, any]) => {
    if (val?.updatedAt || val?.modifiedBy) {
      acc[key] = { updatedAt: val.updatedAt, modifiedBy: val.modifiedBy }
    }
    return acc
  }, {} as Record<string, any>)

  const updateSetting = useCallback(
    <K extends keyof MaqraahSettings>(key: K, value: MaqraahSettings[K]) => {
      setUnsavedChanges((prev) => ({ ...prev, [key]: value }))
    },
    []
  )

  const updateSettings = useCallback((updates: Partial<MaqraahSettings>) => {
    setUnsavedChanges((prev) => ({ ...prev, ...updates }))
  }, [])

  const saveChanges = useCallback(async () => {
    if (Object.keys(unsavedChanges).length === 0) {
      toast.info(isAr ? "لا توجد تغييرات للحفظ" : "Translated")
      return false
    }

    setSaving(true)
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ settings: unsavedChanges }),
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || "فشل في الحفظ")
      }

      toast.success(isAr ? "تم حفظ الإعدادات بنجاح" : "Translated")
      setUnsavedChanges({})
      mutate()
      return true
    } catch (err: any) {
      toast.error(err.message || "حدث خطأ أثناء الحفظ")
      return false
    } finally {
      setSaving(false)
    }
  }, [unsavedChanges, mutate])

  const discardChanges = useCallback(() => {
    setUnsavedChanges({})
  }, [])

  const resetSection = useCallback((prefix: string) => {
    const sectionDefaults: Partial<MaqraahSettings> = {}
    Object.entries(defaultMaqraahSettings).forEach(([key, value]) => {
      if (key.startsWith(prefix)) {
        sectionDefaults[key as keyof MaqraahSettings] = value as any
      }
    })
    setUnsavedChanges((prev) => ({ ...prev, ...sectionDefaults }))
  }, [])

  const testSmtp = useCallback(async (smtp: MaqraahSettings["smtp_config"]) => {
    try {
      const res = await fetch("/api/admin/settings/test-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ smtp }),
      })
      const result = await res.json()
      if (!res.ok) throw new Error(result.error || result.details)
      toast.success(result.message || "تم إرسال البريد التجريبي")
      return true
    } catch (err: any) {
      toast.error(err.message || "فشل في اختبار الاتصال")
      return false
    }
  }, [])

  const mergedSettings: MaqraahSettings = { ...settings, ...unsavedChanges }

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
