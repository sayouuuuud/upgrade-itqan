import { HalaqaDetail } from '@/components/halaqat/halaqa-detail'

export const dynamic = 'force-dynamic'

export default async function MaqraaStudentHalaqaDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  return (
    <HalaqaDetail
      halaqaId={id}
      basePath="/student/halaqat"
      studentsCatalogEndpoint="/api/admin/students"
      platform="maqraa"
    />
  )
}
