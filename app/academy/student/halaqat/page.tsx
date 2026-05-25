import { HalaqatList } from '@/components/halaqat/halaqat-list'

export const dynamic = 'force-dynamic'

export default function AcademyStudentHalaqatPage() {
  return (
    <HalaqatList
      platform="academy"
      role="student"
      basePath="/academy/student/halaqat"
      scope="enrolled"
    />
  )
}
