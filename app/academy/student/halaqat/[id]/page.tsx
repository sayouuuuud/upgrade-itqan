import { HalaqaDetail } from '@/components/halaqat/halaqa-detail'

export const dynamic = 'force-dynamic'

export default async function AcademyStudentHalaqaDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  return (
    <HalaqaDetail
      halaqaId={id}
      basePath="/academy/student/halaqat"
      studentsCatalogEndpoint="/api/academy/admin/students"
      platform="academy"
    />
  )
}
