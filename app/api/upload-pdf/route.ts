import { NextRequest, NextResponse } from "next/server"
import { UTApi } from "uploadthing/server"
import { getSession } from "@/lib/auth"

// Same reasoning as /api/upload-audio: avoid evaluating UploadThing at build
// time so a missing UPLOADTHING_TOKEN doesn't break `next build`.
export const runtime = "nodejs"
export const dynamic = "force-dynamic"

let _utapi: UTApi | null = null
function getUtApi(): UTApi {
    if (!_utapi) _utapi = new UTApi()
    return _utapi
}

/**
 * Server-side PDF upload helper used by the applicant PDF uploader.
 * Accepts multipart/form-data with field `file` and returns the
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

        if (file.type !== "application/pdf") {
            return NextResponse.json({ error: "الملف يجب أن يكون PDF" }, { status: 400 })
        }
        if (file.size > 8 * 1024 * 1024) {
            return NextResponse.json({ error: "الحد الأقصى 8 ميجا" }, { status: 400 })
        }

        const res = await getUtApi().uploadFiles(file)
        if (res.error || !res.data) {
            return NextResponse.json({ error: res.error?.message || "فشل الرفع" }, { status: 500 })
        }
        return NextResponse.json({ url: res.data.url, key: res.data.key })
    } catch (err: any) {
        console.error("upload-pdf error:", err)
        return NextResponse.json({ error: err?.message || "خطأ في الخادم" }, { status: 500 })
    }
}
