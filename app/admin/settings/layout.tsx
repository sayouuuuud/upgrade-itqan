"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import useSWR from "swr"
import { Loader2 } from "lucide-react"
import { isSuperAdmin } from "@/lib/auth"

const fetcher = async (url: string) => {
  const res = await fetch(url)
  if (!res.ok) throw new Error("Failed to fetch session")
  const data = await res.json()
  // /api/auth/me returns { user: {...} }
  return data.user ?? null
}

export default function AdminSettingsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const { data: session, isLoading } = useSWR("/api/auth/me", fetcher)
  const [isAuthorized, setIsAuthorized] = useState(false)

  useEffect(() => {
    if (isLoading) return

    if (!session || !isSuperAdmin(session)) {
      router.push("/login")
      return
    }

    setIsAuthorized(true)
  }, [session, isLoading, router])

  if (isLoading || !isAuthorized) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return <>{children}</>
}
