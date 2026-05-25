import {
  makeStudentRequestGet,
  makeStudentRequestPatch,
} from "@/lib/certificate/student-handlers"

export const GET = makeStudentRequestGet({ scope: "maqraa" })
export const PATCH = makeStudentRequestPatch({ scope: "maqraa" })
