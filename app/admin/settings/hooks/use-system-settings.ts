"use client"

import useSWR, { mutate } from "swr"
import { useCallback, useState } from "react"
import { toast } from "sonner"
import { useI18n } from "@/lib/i18n/context"

// Types for System Settings
export interface SystemSettings {
  // General
  system_general_site_name?: string
  system_general_site_tagline?: string
  system_general_contact_email?: string
  system_general_contact_phone?: string
  system_general_timezone?: string
  system_general_language?: string
  system_general_app_url?: string

  // Maintenance
  system_maintenance_enabled?: boolean
  system_maintenance_message?: string

  // Security
  system_security_activity_logging?: boolean
  system_security_limit_login_attempts?: boolean
  system_security_settings?: Record<string, any>

  // Email (SMTP)
  system_email_smtp_config?: {
    host?: string
    port?: number
    user?: string
    password?: string
    fromEmail?: string
    fromName?: string
    secure?: boolean
  }

  // Branding
  system_branding_assets?: {
    logoUrl?: string
    faviconUrl?: string
    dashboardLogoUrl?: string
  }

  // Contact
  system_contact_info?: {
    email?: string
    phone?: string
    address?: string
    social?: Record<string, string>
  }

  // Homepage settings (if managed globally)
  [key: string]: any
}

const fetcher = async (url: string) => {
  const res = await fetch(url)
  if (!res.ok) {
    const error = new Error("Failed to fetch settings")
    throw error
  }
  return res.json()
}

export function useSystemSettings() {
  const { t } = useI18n()
  const admin = (t as any).admin as Record<string, string> | undefined
  const [saving, setSaving] = useState(false)
  const [pendingChanges, setPendingChanges] = useState<Record<string, any>>({})

  // Fetch system settings
  const { data, error, isLoading } = useSWR(
    "/api/system/settings",
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      dedupingInterval: 60000,
    }
  )

  const settings: SystemSettings = {
    ...(data?.settings?.reduce((acc: any, s: any) => {
      acc[s.setting_key] = s.setting_value
      return acc
    }, {}) || {}),
    ...pendingChanges,
  }

  const metadata: Record<string, any> = data?.settings?.reduce(
    (acc: any, s: any) => {
      acc[s.setting_key] = {
        type: s.setting_type,
        updatedAt: s.updated_at,
        description: s.description,
      }
      return acc
    },
    {}
  ) || {}

  const hasUnsavedChanges = Object.keys(pendingChanges).length > 0
  const pendingCount      = Object.keys(pendingChanges).length

  // Accepts (updates: Record<string,any>) or (key: string, value: any)
  const updateSettings = useCallback(
    (updatesOrKey: Record<string, any> | string, value?: any) => {
      if (typeof updatesOrKey === "string") {
        setPendingChanges((prev) => ({ ...prev, [updatesOrKey]: value }))
      } else {
        setPendingChanges((prev) => ({ ...prev, ...updatesOrKey }))
      }
    },
    []
  )

  const saveChanges = useCallback(async () => {
    if (Object.keys(pendingChanges).length === 0) {
      toast.info(t.common?.noChanges || "No changes to save")
      return
    }

    setSaving(true)
    try {
      const res = await fetch("/api/system/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ settings: pendingChanges }),
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || "Failed to save settings")
      }

      const result = await res.json()
      if (result.warning) {
        toast.warning(result.warning)
      } else {
        toast.success(t.common?.saved || "Settings saved successfully")
      }
      setPendingChanges({})
      mutate("/api/system/settings")
    } catch (error: any) {
      console.error("[useSystemSettings] Save error:", error)
      toast.error(error.message || "Failed to save settings")
    } finally {
      setSaving(false)
    }
  }, [pendingChanges, t])

  const discardChanges = useCallback(() => {
    setPendingChanges({})
    toast.info(t.common?.discarded || "Changes discarded")
  }, [t])

  return {
    settings,
    metadata,
    isLoading,
    error,
    saving,
    hasUnsavedChanges,
    pendingCount,
    updateSettings,
    saveChanges,
    discardChanges,
  }
}
