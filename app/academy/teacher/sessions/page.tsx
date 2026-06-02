import { Suspense } from 'react'
import { Loader2 } from 'lucide-react'
import { TeacherSessionsHub } from '@/components/academy/teacher/sessions-hub'

export default function TeacherSessionsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      }
    >
      <TeacherSessionsHub />
    </Suspense>
  )
}
