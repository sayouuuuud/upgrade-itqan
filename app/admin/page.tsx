import { cookies } from "next/headers"
import { getSession } from "@/lib/auth"
import { ADMIN_MODE_COOKIE, resolveAdminMode } from "@/lib/admin/roles"
import { DashboardSuper } from "@/components/admin/dashboard-super"
import { DashboardMaqraa } from "@/components/admin/dashboard-maqraa"
import { DashboardAcademy } from "@/components/admin/dashboard-academy"

export const dynamic = "force-dynamic"

export default async function AdminDashboard() {
  const session = await getSession()
  const cookieStore = await cookies()

  const adminMode = resolveAdminMode(
    cookieStore.get(ADMIN_MODE_COOKIE)?.value,
    session?.role ?? "",
    session?.academy_roles ?? [],
  )

  // Super admin in "super" overview mode
  if (
    (session?.role === "admin" || session?.role === "super_admin") &&
    adminMode === "super"
  ) {
    return <DashboardSuper />
  }

  // Academy mode (super admin switched, or scoped academy_admin)
  if (adminMode === "academy") {
    return <DashboardAcademy />
  }

  // Maqraa mode (default for maqraa_admin, or super admin switched)
  return <DashboardMaqraa />
}
