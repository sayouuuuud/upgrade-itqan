"use client"

import { useState, useEffect, useMemo } from "react"
import Link from "next/link"
import { useTheme } from "next-themes"
import { motion, AnimatePresence } from "framer-motion"
import { Menu, X, Sun, Moon, Star, Globe } from "lucide-react"
import { useI18n } from "@/lib/i18n/context"

export default function HeaderNavClient({
  isLoggedIn,
  dashboardLink,
  dashboardText,
  userName,
}: {
  isLoggedIn: boolean
  dashboardLink: string | null
  dashboardText: string | null
  userName?: string | null
}) {
  const { theme, setTheme } = useTheme()
  const { locale, t, toggleLocale } = useI18n()
  const isAr = locale === "ar"
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const isDark = mounted && theme === "dark"
  const toggleTheme = () => setTheme(theme === "dark" ? "light" : "dark")

  const navItems = useMemo(
    () => [
      { href: "#features", label: t.nav?.features || "الميزات" },
      { href: "#courses", label: t.nav?.courses || "الدورات" },
      { href: "#testimonials", label: t.nav?.testimonials || "التقييمات" },
      { href: "#contact", label: t.nav?.contact || "التواصل" },
    ],
    [t]
  )

  return (
    <motion.header
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="sticky top-4 z-50 px-4 sm:px-8 lg:px-12"
    >
      <div className="w-full mx-auto h-[72px] px-5 sm:px-7 lg:px-8 flex items-center justify-between gap-6 bg-hp-parchment/96 dark:bg-hp-dark/96 backdrop-blur-md border border-hp-ink/12 dark:border-hp-cream/12 rounded-2xl shadow-[0_2px_16px_0_rgba(0,0,0,0.08)]">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 shrink-0">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-hp-green text-hp-gold shadow-sm">
            <Star className="w-5 h-5 fill-hp-gold" />
          </div>
          <div className="flex flex-col leading-tight">
            <span className="font-bold text-lg text-hp-navy dark:text-hp-gold">إتقان</span>
            <span className="hidden sm:block text-[10px] tracking-[0.25em] text-hp-ink/45 dark:text-hp-cream/45 font-semibold">
              ITQAN PLATFORM
            </span>
          </div>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden lg:flex items-center gap-8">
          {navItems.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="text-[15px] leading-none font-medium text-hp-ink/75 dark:text-hp-cream/75 hover:text-hp-navy dark:hover:text-hp-gold transition-colors"
            >
              {item.label}
            </a>
          ))}
        </nav>

        {/* Desktop Auth + Controls */}
        <div className="hidden lg:flex items-center gap-2.5">
          <button
            onClick={toggleLocale}
            aria-label={isAr ? "Switch to English" : "التبديل إلى العربية"}
            className="flex items-center gap-1.5 h-9 px-3 rounded-full border border-hp-ink/15 dark:border-hp-cream/15 text-sm font-semibold text-hp-navy dark:text-hp-cream hover:bg-hp-ink/5 dark:hover:bg-hp-cream/10 transition-colors"
          >
            <Globe className="w-4 h-4" />
            {isAr ? "EN" : "ع"}
          </button>

          <button
            onClick={toggleTheme}
            aria-label={t.common?.toggleTheme || "تبديل المظهر"}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-hp-ink/15 dark:border-hp-cream/15 text-hp-navy dark:text-hp-gold hover:bg-hp-ink/5 dark:hover:bg-hp-cream/10 transition-colors"
          >
            {mounted && (isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />)}
          </button>

          {isLoggedIn && dashboardLink ? (
            <Link
              href={dashboardLink}
              className="text-[15px] font-bold h-9 inline-flex items-center px-6 rounded-full bg-hp-navy text-hp-parchment dark:bg-hp-gold dark:text-hp-dark hover:bg-hp-green dark:hover:bg-hp-gold-light transition-colors duration-300 shadow-sm"
            >
              {dashboardText}
            </Link>
          ) : (
            <>
              <Link
                href="/login"
                className="text-[15px] font-medium h-9 inline-flex items-center px-3 text-hp-ink/75 dark:text-hp-cream/75 hover:text-hp-navy dark:hover:text-hp-gold transition-colors"
              >
                {t.auth?.login || "تسجيل الدخول"}
              </Link>
              <Link
                href="/register"
                className="text-[15px] font-bold h-9 inline-flex items-center px-6 rounded-full bg-hp-navy text-hp-parchment dark:bg-hp-gold dark:text-hp-dark hover:bg-hp-green dark:hover:bg-hp-gold-light transition-colors duration-300 shadow-sm"
              >
                {t.auth?.register || "إنشاء حساب"}
              </Link>
            </>
          )}
        </div>

        {/* Mobile Menu Button */}
        <div className="lg:hidden flex items-center gap-1">
          <button
            onClick={toggleLocale}
            aria-label={isAr ? "Switch to English" : "التبديل إلى العربية"}
            className="flex items-center gap-1 h-9 px-2.5 rounded-full text-sm font-semibold text-hp-navy dark:text-hp-cream"
          >
            <Globe className="w-4 h-4" />
            {isAr ? "EN" : "ع"}
          </button>
          <button
            onClick={toggleTheme}
            aria-label={t.common?.toggleTheme || "تبديل المظهر"}
            className="p-2 text-hp-navy dark:text-hp-gold"
          >
            {mounted && (isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />)}
          </button>
          <button
            className="p-2 text-hp-navy dark:text-hp-gold"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label={t.common?.menu || "القائمة"}
          >
            {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            key="mobile-menu"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="lg:hidden absolute top-[calc(100%+8px)] left-0 right-0 bg-hp-parchment/96 dark:bg-hp-dark/96 backdrop-blur-md border border-hp-ink/12 dark:border-hp-cream/12 rounded-2xl shadow-[0_2px_16px_0_rgba(0,0,0,0.08)] overflow-hidden"
          >
            <div className="px-4 sm:px-6 py-4 space-y-3">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsMenuOpen(false)}
                  className="block text-base font-medium px-5 py-3 rounded-xl text-hp-ink dark:text-hp-cream hover:bg-hp-ink/8 dark:hover:bg-hp-cream/8 transition-colors"
                >
                  {item.label}
                </Link>
              ))}
              <div className="border-t border-hp-ink/10 dark:border-hp-cream/10 pt-3 mt-3 space-y-2">
                {isLoggedIn && dashboardLink ? (
                  <Link
                    href={dashboardLink}
                    onClick={() => setIsMenuOpen(false)}
                    className="block text-center text-base font-bold px-5 py-3 rounded-xl bg-hp-navy text-hp-parchment dark:bg-hp-gold dark:text-hp-dark hover:bg-hp-green dark:hover:bg-hp-gold-light transition-all shadow-sm"
                  >
                    {dashboardText}
                  </Link>
                ) : (
                  <>
                    <Link
                      href="/login"
                      onClick={() => setIsMenuOpen(false)}
                      className="block text-center text-base font-medium px-5 py-3 rounded-xl text-hp-ink dark:text-hp-cream hover:bg-hp-ink/8 dark:hover:bg-hp-cream/8 transition-colors"
                    >
                      {t.auth?.login || "تسجيل الدخول"}
                    </Link>
                    <Link
                      href="/register"
                      onClick={() => setIsMenuOpen(false)}
                      className="block text-center text-base font-bold px-5 py-3 rounded-xl bg-hp-navy text-hp-parchment dark:bg-hp-gold dark:text-hp-dark hover:bg-hp-green dark:hover:bg-hp-gold-light transition-all shadow-sm"
                    >
                      {t.auth?.register || "إنشاء حساب"}
                    </Link>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  )
}
