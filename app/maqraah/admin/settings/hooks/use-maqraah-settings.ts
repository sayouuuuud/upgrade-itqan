"use client"

import useSWR, { mutate } from "swr"
import { useCallback, useState } from "react"
import { toast } from "sonner"
import { useI18n } from "@/lib/i18n/context"

export interface MaqraahSettings {
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

export function useMaqraahSettings() {
  const { t } = useI18n()
  const admin = (t as any).admin as Record<string, string> | undefined
  const [saving, setSaving] = useState(false)
  const [pendingChanges, setPendingChanges] = useState<Record<string, any>>({})

  // Fetch maqraah settings
  const { data, error, isLoading } = useSWR(
    "/api/maqraah/admin/settings",
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      dedupingInterval: 60000,
    }
  )

  const settings: MaqraahSettings = {
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

  // Accepts either (updates: Partial<MaqraahSettings>) or (key: string, value: any)
  // to stay compatible with both old-style object-spread components and new-style single-key calls
  const updateSettings = useCallback(
    (updatesOrKey: Partial<MaqraahSettings> | string, value?: any) => {
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
      const res = await fetch("/api/maqraah/admin/settings", {
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
      mutate("/api/maqraah/admin/settings")
    } catch (error: any) {
      console.error("[useMaqraahSettings] Save error:", error)
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
    updateSettings,
    saveChanges,
    discardChanges,
  }
}
