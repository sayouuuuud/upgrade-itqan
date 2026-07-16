"use client"

import { RecitationRecorder } from "@/components/student/RecitationRecorder"
import { useI18n } from "@/lib/i18n/context"

export default function SubmitRecitationPage() {
  const { t } = useI18n()
  const student = (t as any).student as Record<string, string> | undefined

  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-8 no-scrollbar h-full min-h-[85vh]">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">{t.student.submitTitleFatiha}</h1>
        <p className="text-muted-foreground">{t.student.submitDescFatiha}</p>
      </div>

      <RecitationRecorder />
    </div>
  )
}
