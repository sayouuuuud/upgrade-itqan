'use client'

import { use } from 'react'
import FiqhQuestionThread from '@/components/fiqh-question-thread'

export default function StudentFiqhDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  return (
    <FiqhQuestionThread
      questionId={id}
      perspective="asker"
      backHref="/academy/student/fiqh"
    />
  )
}
