import {
  makeTemplateDetailGet,
  makeTemplateDetailPatch,
  makeTemplateDetailDelete,
} from "@/lib/certificate/admin-handlers"

const spec = {
  scope: "academy" as const,
  adminRoles: ["admin", "academy_admin"],
}

export const GET = makeTemplateDetailGet(spec)
export const PATCH = makeTemplateDetailPatch(spec)
export const DELETE = makeTemplateDetailDelete(spec)
