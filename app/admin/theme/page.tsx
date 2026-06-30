import { redirect } from "next/navigation"
import { getSession, isSuperAdmin } from "@/lib/auth"
import { getSetting } from "@/lib/settings"
import { DEFAULT_THEME, normalizeTheme } from "@/lib/admin/theme"
import { ThemeEditor } from "./theme-editor"

export const dynamic = "force-dynamic"

export default async function AdminThemePage() {
  const session = await getSession()
  if (!isSuperAdmin(session)) {
    redirect("/admin")
  }

  let theme = DEFAULT_THEME
  try {
    const stored = await getSetting<any>("theme_config", null)
    if (stored) theme = normalizeTheme(stored)
  } catch {
    // use defaults
  }

  return <ThemeEditor initialTheme={theme} />
}
