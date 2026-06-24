import { HalaqaVideoRoom } from '@/components/video/halaqa-video-room'

export const dynamic = 'force-dynamic'

export default async function ReaderHalaqaLivePage({
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
      subtitle="بوابة المقرئ"
      exitHref={`/reader/halaqat/${id}`}
      accent="emerald"
    />
  )
}
