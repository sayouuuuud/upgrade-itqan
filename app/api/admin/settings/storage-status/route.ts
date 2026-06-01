import { NextResponse } from "next/server"
import { getSession, requireRole } from "@/lib/auth"

export const dynamic = "force-dynamic"

// GET /api/admin/settings/storage-status
// Detects which storage providers are configured via env vars.
// Never exposes values — only a boolean per provider.
export async function GET() {
  const session = await getSession()
  if (!session || !requireRole(session, ["admin"])) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 401 })
  }

  const providers = {
    s3: Boolean(
      process.env.AWS_ACCESS_KEY_ID &&
        process.env.AWS_SECRET_ACCESS_KEY &&
        (process.env.AWS_S3_BUCKET_NAME || process.env.AWS_S3_BUCKET)
    ),
    cloudinary: Boolean(
      process.env.CLOUDINARY_URL ||
        (process.env.CLOUDINARY_CLOUD_NAME &&
          process.env.CLOUDINARY_API_KEY &&
          process.env.CLOUDINARY_API_SECRET)
    ),
    blob: Boolean(process.env.BLOB_READ_WRITE_TOKEN),
  }

  return NextResponse.json({ providers })
}
