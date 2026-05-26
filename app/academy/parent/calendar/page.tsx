'use client'

import RoleCalendar from '@/components/calendar/role-calendar'
import { useI18n } from '@/lib/i18n/context'

export default function ParentCalendarPage() {
  const { locale } = useI18n()
  const isAr = locale === 'ar'

  return (
    <RoleCalendar
      apiUrl="/api/academy/parent/calendar/events"
      pageBadge={isAr ? 'تقويم ولي الأمر' : 'Parent calendar'}
      pageTitle={isAr ? 'مواعيد الأبناء' : "Children's Schedule"}
    />
  )
}
