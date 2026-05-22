import { redirect } from 'next/navigation'

/**
 * Legacy admin paths page — fully replaced by the unified learning paths
 * manager at /academy/admin/learning-paths.
 *
 * Kept as a server-side redirect so any existing bookmarks / deep links
 * continue to work without showing a 404.
 */
export default function AdminPathsRedirectPage() {
  redirect('/academy/admin/learning-paths')
}
