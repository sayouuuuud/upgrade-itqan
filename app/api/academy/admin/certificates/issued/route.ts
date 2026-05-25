import { makeIssuedGet } from "@/lib/certificate/admin-handlers"

const spec = {
  scope: "academy" as const,
  adminRoles: ["admin", "academy_admin"],
}

export const GET = makeIssuedGet(spec)
