import { NextRequest, NextResponse } from "next/server"
import { getSession, isSuperAdmin } from "@/lib/auth"
import { query } from "@/lib/db"
import { getSetting, clearSettingCache } from "@/lib/settings"

const DEFAULT_BRANDING = {
  logoUrl: "/branding/main-logo.png",
  dashboardLogoUrl: "/branding/dashboard-logo.png",
  faviconUrl: "/favicon.png",
}

const DEFAULT_CONTACT = {
  email: "info@itqaan.com",
  phone: "+966 50 000 0000",
  address: "الرياض، المملكة العربية السعودية",
  social: { twitter: "", facebook: "", instagram: "", youtube: "", telegram: "", whatsapp: "" },
}

async function upsert(key: string, value: any, userId: string) {
  await query(
    `INSERT INTO system_settings (setting_key, setting_value, setting_type, description, is_public, updated_by, updated_at)
     VALUES ($1, $2::jsonb, 'general', $1, true, $3, NOW())
     ON CONFLICT (setting_key) DO UPDATE
        SET setting_value = EXCLUDED.setting_value,
            updated_by    = EXCLUDED.updated_by,
            updated_at    = NOW()`,
    [key, JSON.stringify(value), userId]
  )
  clearSettingCache(key)
}

// GET /api/admin/branding
export async function GET() {
  const session = await getSession()
  if (!isSuperAdmin(session)) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 403 })
  }

  const [branding, contactInfo] = await Promise.all([
    getSetting("branding", DEFAULT_BRANDING),
    getSetting("contact_info", DEFAULT_CONTACT),
  ])

  return NextResponse.json({ branding, contactInfo })
}

// PUT /api/admin/branding
export async function PUT(req: NextRequest) {
  const session = await getSession()
  if (!isSuperAdmin(session)) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 403 })
  }

  const body = await req.json().catch(() => ({}))

  if (body?.branding && typeof body.branding === "object") {
    const b = body.branding
    await upsert(
      "branding",
      {
        logoUrl: String(b.logoUrl ?? DEFAULT_BRANDING.logoUrl),
        dashboardLogoUrl: String(b.dashboardLogoUrl ?? DEFAULT_BRANDING.dashboardLogoUrl),
        faviconUrl: String(b.faviconUrl ?? DEFAULT_BRANDING.faviconUrl),
      },
      session!.sub
    )
  }

  if (body?.contactInfo && typeof body.contactInfo === "object") {
    const c = body.contactInfo
    await upsert(
      "contact_info",
      {
        email: String(c.email ?? ""),
        phone: String(c.phone ?? ""),
        address: String(c.address ?? ""),
        social: {
          twitter: String(c.social?.twitter ?? ""),
          facebook: String(c.social?.facebook ?? ""),
          instagram: String(c.social?.instagram ?? ""),
          youtube: String(c.social?.youtube ?? ""),
          telegram: String(c.social?.telegram ?? ""),
          whatsapp: String(c.social?.whatsapp ?? ""),
        },
      },
      session!.sub
    )
  }

  return NextResponse.json({ ok: true })
}
