import type { Metadata, Viewport } from 'next'
import { Cairo, Amiri, Noto_Naskh_Arabic } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { AnalyticsTracker } from '@/components/analytics-tracker'
import { LanguageProvider } from '@/lib/i18n/context'
import { ThemeProvider } from '@/components/theme-provider'
import './globals.css'

const cairo = Cairo({
  subsets: ['arabic', 'latin'],
  weight: ['300', '400', '500', '600', '700', '800'],
  variable: '--font-cairo',
})

const amiri = Amiri({
  subsets: ['arabic'],
  weight: ['400', '700'],
  variable: '--font-amiri',
})

// Comprehensive Arabic naskh with full tashkeel coverage — used as a fallback
// inside `--font-quran` so any glyph Amiri lacks (rare shadda/fatha combos,
// Quranic small marks, etc.) is rendered cleanly instead of as tofu (��).
const notoNaskh = Noto_Naskh_Arabic({
  subsets: ['arabic'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-naskh',
})

import { getSetting } from '@/lib/settings'

export async function generateMetadata(): Promise<Metadata> {
  const branding = await getSetting("branding", {
    logoUrl: "/branding/main-logo.png",
    dashboardLogoUrl: "/branding/dashboard-logo.png",
    faviconUrl: "/favicon.png"
  })

  return {
    title: 'منصة إتقان التعليمية',
    description: 'منصة متكاملة لتحسين تلاوة القرآن الكريم - سجّل تلاوتك واحصل على تقييم من مقرئين معتمدين',
    generator: 'v0.app',
    icons: {
      icon: branding.faviconUrl || '/favicon.png',
      apple: branding.logoUrl || '/logo.png',
    },
  }
}

export const viewport: Viewport = {
  themeColor: '#1B5E3B',
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="ar"
      dir="rtl"
      className={`${cairo.variable} ${amiri.variable} ${notoNaskh.variable}`}
      suppressHydrationWarning
    >
      <body className="font-sans antialiased overflow-x-hidden" suppressHydrationWarning>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <LanguageProvider>
            {children}
          </LanguageProvider>
        </ThemeProvider>
        <Analytics />
        <AnalyticsTracker />
        {/* HMR Trigger */}
      </body>
    </html>
  )
}
