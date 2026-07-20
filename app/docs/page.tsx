import { Suspense } from 'react'
import { DocsExplorer } from '@/components/docs/docs-explorer'

export default function DocsPage() {
  return (
    <Suspense fallback={<main className="min-h-screen bg-background" />}>
      <DocsExplorer />
    </Suspense>
  )
}
