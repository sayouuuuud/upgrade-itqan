import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'مركز المساعدة | مُتْقِن',
  description: 'دليل استخدام منصة مُتْقِن لكل المستخدمين والمعلمين والمقرئين والمشرفين والإدارة.',
  alternates: { canonical: '/docs' },
}

export default function DocsLayout({ children }: { children: React.ReactNode }) {
  return children
}
