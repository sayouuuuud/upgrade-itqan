import { redirect } from 'next/navigation'

export default function TeacherRecordingsRedirect() {
  redirect('/academy/teacher/sessions?tab=recordings')
}
