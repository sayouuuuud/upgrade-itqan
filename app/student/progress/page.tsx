import { redirect } from 'next/navigation'

// The canonical student progress dashboard lives under the academy section at
// /academy/student/progress. Some links/tests (and older bookmarks) point at the
// bare /student/progress path, which previously 404'd. Redirect to the real page
// so direct navigation always resolves to the student learning summary.
export default function StudentProgressRedirect() {
  redirect('/academy/student/progress')
}
