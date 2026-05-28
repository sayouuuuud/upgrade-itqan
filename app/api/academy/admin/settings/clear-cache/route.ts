import { NextResponse } from "next/server"
import { revalidatePath, revalidateTag } from "next/cache"
import { getSession, requireRole } from "@/lib/auth"
import { clearSettingCache } from "@/lib/settings"

// POST /api/academy/admin/settings/clear-cache
export async function POST() {
  const session = await getSession()
  if (!session || !requireRole(session, ["admin", "academy_admin"])) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 401 })
  }

  try {
    // Clear in-memory settings cache
    clearSettingCache()

    // Best-effort revalidation of common cached layers
    const tags = ["settings", "courses", "users", "academy"]
    for (const tag of tags) {
      try {
        revalidateTag(tag)
      } catch {
        // ignore - tag may not exist
      }
    }

    try {
      revalidatePath("/", "layout")
    } catch {
      // ignore
    }

    return NextResponse.json({
      success: true,
      message: "تم مسح الـ Cache بنجاح",
      cleared: ["settings", ...tags],
    })
  } catch (error: any) {
    console.error("[clear-cache] Error:", error)
    return NextResponse.json(
      { error: "فشل في مسح الـ Cache", details: error?.message },
      { status: 500 }
    )
  }
}
