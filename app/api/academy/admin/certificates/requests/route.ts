import { makeRequestsListGet } from "@/lib/certificate/admin-handlers"

const spec = {
  scope: "academy" as const,
  adminRoles: ["admin", "academy_admin"],
}

export const GET = makeRequestsListGet(spec)
