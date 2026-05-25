import { HalaqaVideoRoom } from '@/components/video/halaqa-video-room'

export const dynamic = 'force-dynamic'

export default async function AcademyTeacherHalaqaLivePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  return (
    <HalaqaVideoRoom
      kind="halaqa"
      refId={id}
      title="غرفة الحلقة المباشرة"
      subtitle="بوابة المدرس — الأكاديمية"
      exitHref={`/academy/teacher/halaqat/${id}`}
      accent="indigo"
    />
  )
}
