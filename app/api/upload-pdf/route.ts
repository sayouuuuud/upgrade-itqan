import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { uploadToStorage } from "@/lib/storage"
import { transliterate } from "transliteration"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

/**
 * Server-side PDF upload helper used by the applicant PDF uploader.
 * Accepts multipart/form-data with field `file` and uploads the file to
 * AWS S3, returning the public URL.
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
        if (file.size > 20 * 1024 * 1024) {
            return NextResponse.json({ error: "الحد الأقصى 20 ميجا" }, { status: 400 })
        }

        // Sanitize filename to keep the S3 key clean.
        const ext = file.name.includes(".") ? `.${file.name.split(".").pop()}` : ".pdf"
        let base = transliterate(file.name.replace(/\.[^/.]+$/, "")).replace(/[^a-zA-Z0-9\-_]/g, "_").slice(0, 60)
        if (base.length < 2) base = "document"
        const safeName = `${base}_${Date.now()}${ext}`

        const result = await uploadToStorage(file, safeName, file.type)
        return NextResponse.json({ url: result.url, key: result.key })
    } catch (err: any) {
        console.error("upload-pdf error:", err)
        return NextResponse.json({ error: err?.message || "خطأ في الخادم" }, { status: 500 })
    }
}
