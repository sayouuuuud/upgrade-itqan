import { NextRequest, NextResponse } from "next/server"
import { UTApi } from "uploadthing/server"
import { getSession } from "@/lib/auth"

// Force Node.js runtime so Next.js doesn't try to evaluate the module during
// the Edge bundling pass (which previously broke prod builds when the
// UPLOADTHING_TOKEN env var wasn't available at build time).
export const runtime = "nodejs"
export const dynamic = "force-dynamic"

// Lazy singleton so `new UTApi()` doesn't run at module-evaluation time. If
// it does, Next's "collecting page data" build step crashes with
// "Missing or invalid API key" whenever the build environment lacks the
// UploadThing token.
let _utapi: UTApi | null = null
function getUtApi(): UTApi {
    if (!_utapi) _utapi = new UTApi()
    return _utapi
}

/**
 * Server-side audio upload helper used by the applicant audio recorder.
 * Accepts a multipart/form-data POST with field `file` and returns the
 * UploadThing URL.
 */
export async function POST(req: NextRequest) {
    const session = await getSession()
    if (!session) {
        return NextResponse.json({ error: "غير مصرح" }, { status: 401 })
    }

    try {
        const fd = await req.formData()
        const file = fd.get("file") as File | null
        if (!file) return NextResponse.json({ error: "لا يوجد ملف" }, { status: 400 })

        if (!file.type.startsWith("audio/")) {
            return NextResponse.json({ error: "الملف ليس صوتياً" }, { status: 400 })
        }
        if (file.size > 32 * 1024 * 1024) {
            return NextResponse.json({ error: "الحد الأقصى 32 ميجا" }, { status: 400 })
        }

        const res = await getUtApi().uploadFiles(file)
        if (res.error || !res.data) {
            return NextResponse.json({ error: res.error?.message || "فشل الرفع" }, { status: 500 })
        }
        return NextResponse.json({ url: res.data.url, key: res.data.key })
    } catch (err: any) {
        console.error("upload-audio error:", err)
        return NextResponse.json({ error: err?.message || "خطأ في الخادم" }, { status: 500 })
    }
}
