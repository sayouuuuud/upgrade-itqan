import { HalaqaVideoRoom } from '@/components/video/halaqa-video-room'

export const dynamic = 'force-dynamic'

export default async function MaqraaAdminHalaqaLivePage({
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
      subtitle="إدارة المقرأة"
      exitHref={`/admin/halaqat/${id}`}
      accent="emerald"
    />
  )
}
