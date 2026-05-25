import { makeRequestPreviewGet } from "@/lib/certificate/admin-handlers"

export const maxDuration = 60

const spec = {
  scope: "maqraa" as const,
  adminRoles: ["admin", "quality_supervisor"],
}

export const GET = makeRequestPreviewGet(spec)
