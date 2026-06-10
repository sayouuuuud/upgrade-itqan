import { HalaqaDetail } from '@/components/halaqat/halaqa-detail'

export const dynamic = 'force-dynamic'

export default async function AcademyTeacherHalaqaDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  return (
    <HalaqaDetail
      halaqaId={id}
      basePath="/academy/teacher/halaqat"
      studentsCatalogEndpoint={`/api/halaqat/${id}/eligible-students`}
      platform="academy"
    />
  )
}
