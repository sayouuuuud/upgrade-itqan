'use client'

import RoleCalendar from '@/components/calendar/role-calendar'
import { useI18n } from '@/lib/i18n/context'

export default function TeacherCalendarPage() {
  const { locale } = useI18n()
  const isAr = locale === 'ar'

  return (
    <RoleCalendar
      apiUrl="/api/academy/teacher/calendar/events"
      pageBadge={isAr ? 'تقويم المعلم' : 'Teacher calendar'}
      pageTitle={isAr ? 'التقويم والمواعيد' : 'Calendar & Schedule'}
    />
  )
}
