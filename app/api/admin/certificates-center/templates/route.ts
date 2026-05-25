import {
  makeTemplatesGet,
  makeTemplatesPost,
} from "@/lib/certificate/admin-handlers"

const spec = {
  scope: "maqraa" as const,
  adminRoles: ["admin", "quality_supervisor"],
}

export const GET = makeTemplatesGet(spec)
export const POST = makeTemplatesPost(spec)
