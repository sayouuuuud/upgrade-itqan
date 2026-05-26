'use client'

import RoleCalendar from '@/components/calendar/role-calendar'
import { useI18n } from '@/lib/i18n/context'

export default function ReaderCalendarPage() {
  const { locale } = useI18n()
  const isAr = locale === 'ar'

  return (
    <RoleCalendar
      apiUrl="/api/reader/calendar/events"
      pageBadge={isAr ? 'تقويم المقرئ' : 'Reader calendar'}
      pageTitle={isAr ? 'التقويم والمواعيد' : 'Calendar & Schedule'}
    />
  )
}
