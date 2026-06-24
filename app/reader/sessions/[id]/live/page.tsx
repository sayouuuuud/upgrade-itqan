import { HalaqaVideoRoom } from '@/components/video/halaqa-video-room'

export default async function ReaderBookingLivePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  return (
    <HalaqaVideoRoom
      kind="booking"
      refId={id}
      title="جلسة تلاوة مباشرة"
      subtitle="جلسة فردية مع الطالب"
      exitHref="/reader/sessions"
      accent="emerald"
    />
  )
}
