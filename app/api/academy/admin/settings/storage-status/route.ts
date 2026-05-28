import { NextResponse } from "next/server"
import { getSession } from "@/lib/auth"

export const dynamic = "force-dynamic"

export async function GET() {
  const session = await getSession()
  if (!session || !["academy_admin", "super_admin", "admin"].includes(session.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  // Detect which storage providers are configured via environment variables.
  // We never expose the values themselves — only a boolean per provider.
  const providers = {
    uploadthing: Boolean(
      process.env.UPLOADTHING_TOKEN ||
        process.env.UPLOADTHING_SECRET ||
        process.env.UPLOADTHING_APP_ID
    ),
    cloudinary: Boolean(
      process.env.CLOUDINARY_URL ||
        (process.env.CLOUDINARY_CLOUD_NAME &&
          process.env.CLOUDINARY_API_KEY &&
          process.env.CLOUDINARY_API_SECRET)
    ),
    s3: Boolean(
      (process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY && process.env.AWS_S3_BUCKET) ||
        (process.env.S3_ACCESS_KEY_ID && process.env.S3_SECRET_ACCESS_KEY && process.env.S3_BUCKET)
    ),
    blob: Boolean(process.env.BLOB_READ_WRITE_TOKEN),
  }

  return NextResponse.json({ providers })
}
