import {
  makeRequestDetailGet,
  makeRequestDetailPatch,
} from "@/lib/certificate/admin-handlers"

export const maxDuration = 60

const spec = {
  scope: "academy" as const,
  adminRoles: ["admin", "academy_admin"],
}

export const GET = makeRequestDetailGet(spec)
export const PATCH = makeRequestDetailPatch(spec)
