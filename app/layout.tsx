import type { Metadata, Viewport } from 'next'
import { Cairo, Amiri } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { AnalyticsTracker } from '@/components/analytics-tracker'
import { LanguageProvider } from '@/lib/i18n/context'
import { ThemeProvider } from '@/components/theme-provider'
import { ThemeStyleInjector } from '@/components/theme-style-injector'
import { SplashScreenWrapper } from '@/components/splash-screen-wrapper'
import { Suspense } from 'react'
import './globals.css'

const cairo = Cairo({
  subsets: ['arabic', 'latin'],
  weight: ['300', '400', '500', '600', '700', '800'],
  variable: '--font-cairo',
})

const amiri = Amiri({
  subsets: ['arabic', 'latin'],
  weight: ['400', '700'],
  style: ['normal', 'italic'],
  variable: '--font-amiri',
})

import { getSetting } from '@/lib/settings'

export async function generateMetadata(): Promise<Metadata> {
  const branding = await getSetting("branding", {
    logoUrl: "/branding/main-logo.png",
    dashboardLogoUrl: "/branding/dashboard-logo.png",
    faviconUrl: "/favicon.png"
  })

  return {
    title: 'منصة مُتْقِن',
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

import { cookies } from "next/headers"

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const cookieStore = await cookies()
  const localeCookie = cookieStore.get("NEXT_LOCALE")
  const locale = (localeCookie?.value === "en" ? "en" : "ar") as "ar" | "en"

  return (
    <html
      lang={locale}
      dir={locale === "ar" ? "rtl" : "ltr"}
      className={`${cairo.variable} ${amiri.variable} bg-background`}
      suppressHydrationWarning
    >
      <body className="font-sans antialiased overflow-x-hidden" suppressHydrationWarning>
        <Suspense fallback={null}>
          <ThemeStyleInjector />
        </Suspense>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <LanguageProvider initialLocale={locale}>
            <SplashScreenWrapper>
              {children}
            </SplashScreenWrapper>
          </LanguageProvider>
        </ThemeProvider>
        <Analytics />
        <AnalyticsTracker />
        {/* HMR Trigger */}
      </body>
    </html>
  )
}
