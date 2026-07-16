import { HalaqaVideoRoom } from '@/components/video/halaqa-video-room'

export default async function TeacherSessionLivePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  return (
    <HalaqaVideoRoom
      kind="course_session"
      refId={id}
      title={''}
      subtitle={''}
      exitHref="/academy/teacher/sessions"
      accent="indigo"
    />
  )
}
