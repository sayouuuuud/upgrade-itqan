import { redirect } from 'next/navigation'

export default function TeacherLiveRedirect() {
  redirect('/academy/teacher/sessions?tab=live')
}
