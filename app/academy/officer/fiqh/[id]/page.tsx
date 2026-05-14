'use client'

import { use } from 'react'
import FiqhQuestionThread from '@/components/fiqh-question-thread'

export default function OfficerFiqhDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  return (
    <FiqhQuestionThread
      questionId={id}
      perspective="officer"
      backHref="/academy/officer/fiqh"
    />
  )
}
