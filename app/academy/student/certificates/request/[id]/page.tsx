'use client'

import { use } from 'react'
import StudentCertificateRequestForm from '@/components/certificates-center/student-request-form'

export default function AcademyCertificateRequestPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  return (
    <StudentCertificateRequestForm
      id={id}
      apiBase="/api/academy/student/certificates"
      backHref="/academy/student/certificates"
    />
  )
}
