import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { uploadToStorage, deleteFromStorage } from "@/lib/storage"
import { transliterate } from "transliteration"

// POST /api/upload - upload file to UploadThing
export async function POST(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: "غير مصرح" }, { status: 401 })

    const formData = await req.formData()
    const file = (formData.get("audio") || formData.get("image") || formData.get("file")) as File | null

    if (!file) {
      return NextResponse.json({ error: "لم يتم تحميل ملف" }, { status: 400 })
    }

    // Detect file category
    const isAudio = file.type.startsWith("audio/") || [".m4a", ".wav", ".caf"].some(e => file.name.endsWith(e))
    const isVideo = file.type.startsWith("video/") || [".mp4", ".webm"].some(e => file.name.endsWith(e))
    const isImage = file.type.startsWith("image/")
    const isDocument = file.type === "application/pdf" ||
      [".pdf", ".doc", ".docx"].some(e => file.name.endsWith(e)) ||
      file.type.includes("document")

    if (!isAudio && !isImage && !isVideo && !isDocument) {
      return NextResponse.json({ error: "نوع الملف غير مدعوم" }, { status: 400 })
    }

    // Size limits check
    const maxSize = isVideo ? 500 * 1024 * 1024
      : isAudio ? 32 * 1024 * 1024
        : isDocument ? 20 * 1024 * 1024
          : 4 * 1024 * 1024

    if (file.size > maxSize) {
      return NextResponse.json({ error: `حجم الملف يتجاوز الحد المسموح` }, { status: 400 })
    }

    // Sanitize filename - remove any non-ASCII chars to avoid UploadThing 400
    const ext = file.name.includes('.') ? `.${file.name.split('.').pop()}` : ''
    let base = transliterate(file.name.replace(/\.[^/.]+$/, '')).replace(/[^a-zA-Z0-9\-_]/g, '_').slice(0, 60)
    if (base.length < 2) base = 'file'
    const safeName = `${base}_${Date.now()}${ext}`

    const result = await uploadToStorage(file, safeName, file.type)

    return NextResponse.json({
      url: result.url,
      audioUrl: isAudio ? result.url : undefined,
      imageUrl: isImage ? result.url : undefined,
      public_id: result.key,
    }, { status: 201 })

  } catch (error: any) {
    console.error("[Upload] Error:", error)
    return NextResponse.json({
      error: "فشل رفع الملف",
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
}

// DELETE /api/upload - delete file from UploadThing
export async function DELETE(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: "غير مصرح" }, { status: 401 })

    const { searchParams } = new URL(req.url)
    const fileKey = searchParams.get("publicId") || searchParams.get("fileKey")

    if (!fileKey) {
      return NextResponse.json({ error: "معرف الملف مطلوب" }, { status: 400 })
    }

    await deleteFromStorage(fileKey)
    return NextResponse.json({ success: true, message: "تم الحذف بنجاح" })
  } catch (error: any) {
    console.error("Delete upload error:", error)
    return NextResponse.json({ error: "فشل حذف الملف" }, { status: 500 })
  }
}
