import { redirect } from "next/navigation"
import { getSession, isMaqraaAdmin } from "@/lib/auth"
import { DashboardShell } from "@/components/dashboard-shell"
import { Toaster } from "@/components/ui/sonner"

// Force dynamic rendering so the auth check / redirect is never cached.
export const dynamic = "force-dynamic"

export default async function MaqraahAdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getSession()

  if (!session) {
    redirect("/login")
  }

  if (!isMaqraaAdmin(session)) {
    redirect("/login")
  }

  // Render the Maqraa-scoped sidebar (getMaqraaConfig) via DashboardShell.
  return (
    <DashboardShell role={session.role as any} adminMode="maqraa">
      {children}
      <Toaster richColors position="top-center" />
    </DashboardShell>
  )
}
