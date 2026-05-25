'use client'

import { use } from 'react'
import StudentCertificateRequestForm from '@/components/certificates-center/student-request-form'

export default function MaqraaCertificateRequestPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  return (
    <StudentCertificateRequestForm
      id={id}
      apiBase="/api/student/certificates"
      backHref="/student/certificates"
    />
  )
}
