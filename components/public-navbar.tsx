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
  const { t } = useI18n()
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
    <nav className={`${isHome ? 'absolute' : 'sticky bg-primary dark:bg-card shadow-md'} top-0 left-0 right-0 z-40 transition-all duration-300`}>
      <div className="container mx-auto px-6 py-4 flex justify-between items-center">
        <Link href="/" className="hover:opacity-80 transition-opacity flex-shrink-0">
          <Image 
            src={branding.logoUrl || "/branding/main-logo.png"} 
            alt={t.appName} 
            width={140}
            height={56}
            priority
            className="h-12 md:h-14 w-auto object-contain" 
          />
        </Link>

        {/* Desktop nav links */}
        <div className="hidden md:flex items-center gap-1">
          <Link
            href="/about"
            className="text-sm text-white/75 hover:text-white px-3 py-1.5 rounded-lg hover:bg-white/10 transition-colors"
          >
            {t.about}
          </Link>
          <Link
            href="/faq"
            className="text-sm text-white/75 hover:text-white px-3 py-1.5 rounded-lg hover:bg-white/10 transition-colors"
          >
            {t.footer.faq}
          </Link>
          <Link
            href="/contact"
            className="text-sm text-white/75 hover:text-white px-3 py-1.5 rounded-lg hover:bg-white/10 transition-colors"
          >
            {t.contact}
          </Link>
        </div>

        <div className="hidden md:flex items-center gap-4">
          <ThemeToggle className="text-white hover:text-white/80" />
          <LanguageSwitcher variant="ghost" className="text-white hover:text-white/80" />
          <div className="h-6 w-px bg-white/10 mx-1" />
          <div className="flex items-center gap-3">
            {!loading && (
              user ? (
                <Link 
                  href={["admin", "student_supervisor", "reciter_supervisor"].includes(user.role) ? "/admin" : `/${user.role}`} 
                  className="text-sm font-semibold px-6 py-2.5 rounded-full transition-all bg-primary text-white hover:bg-primary/90 shadow-lg shadow-primary/20 flex items-center gap-2"
                >
                  {t.locale === 'ar' ? 'الدخول للحساب' : 'Go to Account'}
                  <ArrowLeft className="w-4 h-4 rtl:rotate-0 ltr:rotate-180" />
                </Link>
              ) : (
                <Link href="/login" className="text-sm font-medium px-8 py-2.5 rounded-full transition-all text-white border border-primary/40 hover:bg-primary/10">
                  {t.login}
                </Link>
              )
            )}
          </div>

        </div>

        <div className="md:hidden flex items-center gap-3">
          <ThemeToggle className="text-white bg-white/10 hover:bg-white/20" />
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="p-2 text-white bg-white/10 rounded-full hover:bg-white/20 transition-colors"
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {
        mobileOpen && (
          <div className="md:hidden bg-primary/95 dark:bg-card/95 backdrop-blur-md border-t border-white/10">
            <div className="container mx-auto px-6 py-4 flex flex-col gap-3">
              {/* Mobile nav links */}
              <div className="flex flex-col gap-1 pb-3 border-b border-white/10">
                <Link href="/about" onClick={() => setMobileOpen(false)} className="text-sm text-white/80 hover:text-white py-2 px-3 rounded-lg hover:bg-white/10 transition-colors">
                  {t.about}
                </Link>
                <Link href="/faq" onClick={() => setMobileOpen(false)} className="text-sm text-white/80 hover:text-white py-2 px-3 rounded-lg hover:bg-white/10 transition-colors">
                  {t.footer.faq}
                </Link>
                <Link href="/contact" onClick={() => setMobileOpen(false)} className="text-sm text-white/80 hover:text-white py-2 px-3 rounded-lg hover:bg-white/10 transition-colors">
                  {t.contact}
                </Link>
              </div>

              {!loading && (
                user ? (
                  <Link 
                    href={["admin", "student_supervisor", "reciter_supervisor"].includes(user.role) ? "/admin" : `/${user.role}`} 
                    onClick={() => setMobileOpen(false)} 
                    className="flex-1 text-center text-sm font-semibold py-2.5 rounded-full bg-primary text-white flex items-center justify-center gap-2"
                  >
                    {t.locale === 'ar' ? 'الدخول للحساب' : 'Go to Account'}
                    <ArrowLeft className="w-4 h-4 rtl:rotate-0 ltr:rotate-180" />
                  </Link>
                ) : (
                  <>
                    <Link href="/login" onClick={() => setMobileOpen(false)} className="flex-1 text-center text-sm font-medium py-3 rounded-full text-white border border-primary/40">{t.login}</Link>
                  </>
                )
              )}
              <div className="flex justify-center items-center gap-4 pt-1 border-t border-white/10">
                <LanguageSwitcher variant="ghost" className="text-white border border-white/20 hover:bg-white/10 rounded-full px-8 h-12 w-full justify-center" />
              </div>
            </div>
          </div>
        )
      }
    </nav >
  )
}

