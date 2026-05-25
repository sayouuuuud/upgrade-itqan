import {
  makeSettingsGet,
  makeSettingsPut,
} from "@/lib/certificate/admin-handlers"

const spec = {
  scope: "maqraa" as const,
  adminRoles: ["admin", "quality_supervisor"],
}

export const GET = makeSettingsGet(spec)
export const PUT = makeSettingsPut(spec)
