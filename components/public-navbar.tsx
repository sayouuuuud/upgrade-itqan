"use client"

import Link from 'next/link'
import { useState, useEffect } from 'react'
import { Menu, X, ArrowLeft } from 'lucide-react'
import { useI18n } from '@/lib/i18n/context'
import { LanguageSwitcher } from '@/components/language-switcher'
import { ThemeToggle } from '@/components/theme-toggle'
import { usePathname } from 'next/navigation'
import { usePublicSettings } from '@/lib/hooks/use-public-settings'
import Image from 'next/image'

export function PublicNavbar({ initialUser = null }: { initialUser?: { role: string } | null }) {
  const pathname = usePathname()
  const isHome = pathname === '/'
  const [mobileOpen, setMobileOpen] = useState(false)
  const [user, setUser] = useState<{ role: string } | null>(initialUser)
  const [loading, setLoading] = useState(!initialUser)
  const { t, locale } = useI18n()
  const app = (t as any).app as Record<string, string> | undefined
  const auth = (t as any).auth as Record<string, string> | undefined
  const { branding } = usePublicSettings()

  useEffect(() => {
    async function checkAuth() {
      try {
        const res = await fetch('/api/auth/status')
        if (res.ok) {
          const data = await res.json()
          if (data.authenticated) {
            setUser(data.user)
          } else {
            setUser(null)
          }
        }
      } catch (err) {
        console.error("Failed to check auth state", err)
      } finally {
        setLoading(false)
      }
    }
    checkAuth()
  }, [])

  return (
    <nav className="absolute top-4 inset-x-4 md:inset-x-6 z-40">
      {/* Floating pill card */}
      <div className="bg-white/95 dark:bg-card/95 backdrop-blur-md rounded-2xl shadow-md shadow-black/8 border border-black/6 dark:border-white/10 px-4 md:px-6 py-3 flex justify-between items-center max-w-screen-xl mx-auto">

        {/* Logo — right side in RTL */}
        <Link href="/" className="hover:opacity-80 transition-opacity flex-shrink-0">
          <Image
            src={branding.logoUrl || "/branding/main-logo.png"}
            alt={t.appName}
            width={140}
            height={56}
            priority
            className="h-11 md:h-13 w-auto object-contain"
          />
        </Link>

        {/* Desktop nav links — centre */}
        <div className="hidden md:flex items-center gap-1">
          <Link
            href="/about"
            className="text-sm text-foreground/70 hover:text-foreground px-3 py-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
          >
            {t.about}
          </Link>
          <Link
            href="/faq"
            className="text-sm text-foreground/70 hover:text-foreground px-3 py-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
          >
            {t.footer.faq}
          </Link>
          <Link
            href="/contact"
            className="text-sm text-foreground/70 hover:text-foreground px-3 py-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
          >
            {t.contact}
          </Link>
        </div>

        {/* Desktop right controls */}
        <div className="hidden md:flex items-center gap-3">
          <ThemeToggle className="text-foreground/70 hover:text-foreground" />
          <LanguageSwitcher variant="ghost" className="text-foreground/70 hover:text-foreground" />
          <div className="h-5 w-px bg-foreground/15 mx-1" />
          {!loading && (
            user ? (
              <Link
                href={["admin", "student_supervisor", "reciter_supervisor"].includes(user.role) ? "/admin" : `/${user.role}`}
                className="text-sm font-semibold px-5 py-2 rounded-full transition-all bg-primary text-white hover:bg-primary/90 shadow-sm flex items-center gap-2"
              >
                {auth?.goToAccount || (locale === 'ar' ? 'الدخول للحساب' : 'Go to Account')}
                <ArrowLeft className="w-4 h-4 rtl:rotate-0 ltr:rotate-180" />
              </Link>
            ) : (
              <>
                <Link
                  href="/login"
                  className="text-sm font-medium px-4 py-2 rounded-full transition-all text-foreground/80 hover:text-foreground hover:bg-black/5 dark:hover:bg-white/10"
                >
                  {t.login}
                </Link>
                <Link
                  href="/register"
                  className="text-sm font-semibold px-5 py-2 rounded-full bg-primary text-white hover:bg-primary/90 transition-all shadow-sm"
                >
                  {t.register}
                </Link>
              </>
            )
          )}
        </div>

        {/* Mobile controls */}
        <div className="md:hidden flex items-center gap-2">
          <ThemeToggle className="text-foreground/70" />
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="p-2 text-foreground/70 bg-black/5 dark:bg-white/10 rounded-full hover:bg-black/10 dark:hover:bg-white/20 transition-colors"
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile dropdown — extends below the pill */}
      {mobileOpen && (
        <div className="md:hidden mt-2 bg-white/95 dark:bg-card/95 backdrop-blur-md rounded-2xl shadow-md border border-black/6 dark:border-white/10 overflow-hidden">
          <div className="px-4 py-4 flex flex-col gap-2">
            {/* Nav links */}
            <div className="flex flex-col gap-1 pb-3 border-b border-black/8 dark:border-white/10">
              <Link href="/about" onClick={() => setMobileOpen(false)} className="text-sm text-foreground/80 hover:text-foreground py-2 px-3 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 transition-colors">
                {t.about}
              </Link>
              <Link href="/faq" onClick={() => setMobileOpen(false)} className="text-sm text-foreground/80 hover:text-foreground py-2 px-3 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 transition-colors">
                {t.footer.faq}
              </Link>
              <Link href="/contact" onClick={() => setMobileOpen(false)} className="text-sm text-foreground/80 hover:text-foreground py-2 px-3 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 transition-colors">
                {t.contact}
              </Link>
            </div>

            {/* Auth + language */}
            {!loading && (
              user ? (
                <Link
                  href={["admin", "student_supervisor", "reciter_supervisor"].includes(user.role) ? "/admin" : `/${user.role}`}
                  onClick={() => setMobileOpen(false)}
                  className="text-center text-sm font-semibold py-2.5 rounded-full bg-primary text-white flex items-center justify-center gap-2"
                >
                  {auth?.goToAccount || (locale === 'ar' ? 'الدخول للحساب' : 'Go to Account')}
                  <ArrowLeft className="w-4 h-4 rtl:rotate-0 ltr:rotate-180" />
                </Link>
              ) : (
                <div className="flex gap-2">
                  <Link href="/login" onClick={() => setMobileOpen(false)} className="flex-1 text-center text-sm font-medium py-2.5 rounded-full text-foreground border border-black/15 dark:border-white/20 hover:bg-black/5">
                    {t.login}
                  </Link>
                  <Link href="/register" onClick={() => setMobileOpen(false)} className="flex-1 text-center text-sm font-semibold py-2.5 rounded-full bg-primary text-white">
                    {t.register}
                  </Link>
                </div>
              )
            )}

            <div className="pt-1 border-t border-black/8 dark:border-white/10">
              <LanguageSwitcher variant="ghost" className="text-foreground/70 border border-black/15 dark:border-white/20 hover:bg-black/5 rounded-full px-8 h-10 w-full justify-center" />
            </div>
          </div>
        </div>
      )}
    </nav>
  )
}
