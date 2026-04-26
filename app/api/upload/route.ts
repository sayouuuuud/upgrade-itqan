import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { uploadToStorage, deleteFromStorage } from "@/lib/storage"

// POST /api/upload - upload audio or image file to UploadThing
// NOTE: Audio format conversion (WebM → WAV/MP4) now happens client-side
// in RecitationRecorder.tsx before the file reaches this endpoint.
export async function POST(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: "غير مصرح" }, { status: 401 })

    const formData = await req.formData()

    // Support both 'audio' and 'image' field names
    const file = (formData.get("audio") || formData.get("image") || formData.get("file")) as File | null
    const folder = (formData.get("folder") as string) || "uploads"

    if (!file) {
      return NextResponse.json({ error: "لم يتم تحميل ملف" }, { status: 400 })
    }

    // Validate file type
    const isAudio = file.type.startsWith("audio/") ||
      file.name.endsWith(".m4a") ||
      file.name.endsWith(".wav") ||
      file.name.endsWith(".caf")

    const isVideo = file.type.startsWith("video/") ||
      file.name.endsWith(".mp4") ||
      file.name.endsWith(".webm")

    const isImage = file.type.startsWith("image/")

    const isDocument = file.type === "application/pdf" ||
      file.name.endsWith(".pdf") ||
      file.name.endsWith(".doc") ||
      file.name.endsWith(".docx") ||
      file.type.includes("document")

    if (!isAudio && !isImage && !isVideo && !isDocument) {
      return NextResponse.json({ error: "نوع الملف غير مدعوم (صوت، فيديو، صورة أو مستند فقط)" }, { status: 400 })
    }

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Validate file size
    const maxSizeVideo = 500 * 1024 * 1024 // 500MB
    const maxSizeAudio = 32 * 1024 * 1024  // 32MB
    const maxSizeImage = 4 * 1024 * 1024   // 4MB
    const maxSizeDoc = 20 * 1024 * 1024    // 20MB

    let limitDesc = "4MB"
    let maxSize = maxSizeImage
    if (isVideo) { maxSize = maxSizeVideo; limitDesc = "500MB" }
    else if (isAudio) { maxSize = maxSizeAudio; limitDesc = "32MB" }
    else if (isDocument) { maxSize = maxSizeDoc; limitDesc = "20MB" }

    if (buffer.length > maxSize) {
      return NextResponse.json({ error: `حجم الملف يتجاوز ${limitDesc}` }, { status: 400 })
    }

    // Upload to storage as-is (conversion already done client-side)
    const result = await uploadToStorage(buffer, file.name, file.type)

    return NextResponse.json({
      url: result.url,
      audioUrl: isAudio ? result.url : undefined,
      imageUrl: isImage ? result.url : undefined,
      public_id: result.key,
    }, { status: 201 })
  } catch (error) {
    console.error("Upload error:", error)
    return NextResponse.json({ error: "فشل رفع الملف" }, { status: 500 })
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

    // Attempt to delete from UploadThing
    await deleteFromStorage(fileKey)

    return NextResponse.json({ success: true, message: "تم الحذف بنجاح" })
  } catch (error) {
    console.error("Delete upload error:", error)
    return NextResponse.json({ error: "فشل حذف الملف" }, { status: 500 })
  }
}
