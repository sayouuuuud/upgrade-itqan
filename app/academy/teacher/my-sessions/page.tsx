import { redirect } from 'next/navigation'

export default function TeacherMySessionsRedirect() {
  redirect('/academy/teacher/sessions?tab=history')
}
