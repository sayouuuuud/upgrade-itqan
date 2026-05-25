import {
  makeTemplateDetailGet,
  makeTemplateDetailPatch,
  makeTemplateDetailDelete,
} from "@/lib/certificate/admin-handlers"

const spec = {
  scope: "maqraa" as const,
  adminRoles: ["admin", "quality_supervisor"],
}

export const GET = makeTemplateDetailGet(spec)
export const PATCH = makeTemplateDetailPatch(spec)
export const DELETE = makeTemplateDetailDelete(spec)
