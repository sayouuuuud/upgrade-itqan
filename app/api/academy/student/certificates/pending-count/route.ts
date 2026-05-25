import { makeStudentPendingCountGet } from "@/lib/certificate/student-handlers"

export const GET = makeStudentPendingCountGet({ scope: "academy" })
