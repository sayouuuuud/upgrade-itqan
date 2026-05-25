import { HalaqaDetail } from '@/components/halaqat/halaqa-detail'

export const dynamic = 'force-dynamic'

export default async function MaqraaAdminHalaqaDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  return (
    <HalaqaDetail
      halaqaId={id}
      basePath="/admin/halaqat"
      studentsCatalogEndpoint="/api/admin/students"
      platform="maqraa"
    />
  )
}
