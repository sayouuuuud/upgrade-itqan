import { makeRequestsListGet } from "@/lib/certificate/admin-handlers"

const spec = {
  scope: "maqraa" as const,
  adminRoles: ["admin", "quality_supervisor"],
}

export const GET = makeRequestsListGet(spec)
