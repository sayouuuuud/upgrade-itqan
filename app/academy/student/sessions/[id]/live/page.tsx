import { HalaqaVideoRoom } from '@/components/video/halaqa-video-room'

export default async function StudentSessionLivePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  return (
    <HalaqaVideoRoom
      kind="course_session"
      refId={id}
      title="درس مباشر"
      subtitle="انضم إلى الدرس المباشر"
      exitHref="/academy/student/sessions"
      accent="indigo"
    />
  )
}
