import { redirect } from "next/navigation"
import { getSession, isSuperAdmin } from "@/lib/auth"
import { BrandingManager } from "./branding-manager"

export const dynamic = "force-dynamic"

export default async function AdminBrandingPage() {
  const session = await getSession()
  if (!isSuperAdmin(session)) {
    redirect("/admin")
  }
  return <BrandingManager />
}
