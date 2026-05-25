import {
  makeStudentRequestGet,
  makeStudentRequestPatch,
} from "@/lib/certificate/student-handlers"

export const GET = makeStudentRequestGet({ scope: "academy" })
export const PATCH = makeStudentRequestPatch({ scope: "academy" })
