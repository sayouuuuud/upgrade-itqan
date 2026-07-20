import { notFound } from 'next/navigation'
import { Suspense } from 'react'
import { DocsExplorer } from '@/components/docs/docs-explorer'
import { docsGuides, getGuide } from '@/lib/docs/content'

export function generateStaticParams() {
  return docsGuides.map((guide) => ({ slug: guide.slug }))
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const guide = getGuide(slug)
  if (!guide) return {}
  return {
    title: `${guide.title.ar} | مركز مساعدة مُتْقِن`,
    description: guide.description.ar,
  }
}

export default async function GuidePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  if (!getGuide(slug)) notFound()
  return (
    <Suspense fallback={<main className="min-h-screen bg-background" />}>
      <DocsExplorer slug={slug} />
    </Suspense>
  )
}
