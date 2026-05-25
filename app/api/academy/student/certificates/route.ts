import { makeStudentCertificatesGet } from "@/lib/certificate/student-handlers"

export const GET = makeStudentCertificatesGet({ scope: "academy" })
