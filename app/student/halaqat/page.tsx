import { HalaqatList } from '@/components/halaqat/halaqat-list'

export const dynamic = 'force-dynamic'

export default function MaqraaStudentHalaqatPage() {
  return (
    <HalaqatList
      platform="maqraa"
      role="student"
      basePath="/student/halaqat"
      scope="enrolled"
    />
  )
}
