import { NextRequest, NextResponse } from "next/server"
import { UTApi } from "uploadthing/server"
import { getSession } from "@/lib/auth"

const utapi = new UTApi()

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

        const res = await utapi.uploadFiles(file)
        if (res.error || !res.data) {
            return NextResponse.json({ error: res.error?.message || "فشل الرفع" }, { status: 500 })
        }
        return NextResponse.json({ url: res.data.url, key: res.data.key })
    } catch (err: any) {
        console.error("upload-audio error:", err)
        return NextResponse.json({ error: err?.message || "خطأ في الخادم" }, { status: 500 })
    }
}
