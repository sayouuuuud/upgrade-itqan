import { HalaqatList } from '@/components/halaqat/halaqat-list'

export const dynamic = 'force-dynamic'

export default function ReaderHalaqatPage() {
  return (
    <HalaqatList
      platform="maqraa"
      role="host"
      basePath="/reader/halaqat"
      scope="mine"
    />
  )
}
