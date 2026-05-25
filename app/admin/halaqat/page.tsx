import { HalaqatList } from '@/components/halaqat/halaqat-list'

export const dynamic = 'force-dynamic'

export default function MaqraaAdminHalaqatPage() {
  return (
    <HalaqatList
      platform="maqraa"
      role="admin"
      basePath="/admin/halaqat"
      teachersEndpoint="/api/admin/readers"
      scope="all"
    />
  )
}
