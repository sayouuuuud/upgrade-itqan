import { StudentHalaqaDetail } from '@/components/halaqat/student-halaqa-detail'

export const dynamic = 'force-dynamic'

export default async function AcademyStudentHalaqaDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  return <StudentHalaqaDetail halaqaId={id} basePath="/academy/student/halaqat" />
}
