"use client"

import { useState, useEffect, useMemo } from "react"
import Link from "next/link"
import { useTheme } from "next-themes"
import { motion, AnimatePresence } from "framer-motion"
import { Menu, X, Sun, Moon } from "lucide-react"
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
  const { locale, t } = useI18n()
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
      className="sticky top-4 z-50 px-4 sm:px-6 relative"
    >
      <div className="max-w-6xl mx-auto bg-hp-parchment/90 dark:bg-hp-dark/90 backdrop-blur-md border border-hp-ink/10 dark:border-hp-cream/10 shadow-lg rounded-full px-4 sm:px-6 flex items-center justify-between h-14">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 shrink-0">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-hp-navy text-hp-parchment dark:bg-hp-gold dark:text-hp-dark font-bold text-sm">
            إ
          </div>
          <span className="hidden sm:inline font-bold text-hp-navy dark:text-hp-gold">إتقان</span>
        </Link>

        {/* Desktop Nav */}
        <div className="hidden lg:flex items-center gap-6">
          {navItems.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="text-sm font-medium text-hp-ink/70 dark:text-hp-cream/70 hover:text-hp-navy dark:hover:text-hp-gold transition-colors"
            >
              {item.label}
            </a>
          ))}
        </div>

        {/* Desktop Auth Buttons */}
        <div className="hidden lg:flex items-center gap-2">
          <button
            onClick={toggleTheme}
            aria-label={t.common?.toggleTheme || "تبديل المظهر"}
            className="p-2 text-hp-navy dark:text-hp-gold transition-colors"
          >
            {mounted && (isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />)}
          </button>

          {isLoggedIn && dashboardLink ? (
            <Link
              href={dashboardLink}
              className="text-base font-bold px-6 py-2.5 rounded-full bg-hp-navy text-hp-parchment dark:bg-hp-gold dark:text-hp-dark hover:bg-hp-green dark:hover:bg-hp-gold-light transition-all duration-500 shadow-sm hover:shadow-lg"
            >
              {dashboardText}
            </Link>
          ) : (
            <>
              <Link
                href="/login"
                className="text-base font-medium text-hp-ink/70 dark:text-hp-cream/70 hover:text-hp-navy dark:hover:text-hp-gold px-5 py-2.5 transition-colors"
              >
                {t.auth?.login || "تسجيل الدخول"}
              </Link>
              <Link
                href="/register"
                className="text-base font-bold px-6 py-2.5 rounded-full bg-hp-navy text-hp-parchment dark:bg-hp-gold dark:text-hp-dark hover:bg-hp-green dark:hover:bg-hp-gold-light transition-all duration-500 shadow-sm hover:shadow-lg"
              >
                {t.auth?.register || "إنشاء حساب"}
              </Link>
            </>
          )}
        </div>

        {/* Mobile Menu Button */}
        <div className="lg:hidden flex items-center gap-1">
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
            className="lg:hidden absolute top-full left-0 right-0 mt-2 mx-4 sm:mx-6 rounded-3xl border border-hp-ink/10 dark:border-hp-cream/10 bg-hp-parchment/95 dark:bg-hp-dark/95 backdrop-blur-md shadow-xl overflow-hidden"
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
