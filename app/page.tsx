"use client"

import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import { useTheme } from "next-themes"
import { motion, useScroll, useTransform, AnimatePresence, useInView } from "framer-motion"
import {
  BookOpen,
  GraduationCap,
  ArrowLeft,
  Menu,
  X,
  Star,
  Award,
  Users,
  Mic,
  Calendar,
  ScrollText,
  Sparkles,
  Quote,
  ChevronDown,
  Sun,
  Moon,
} from "lucide-react"

/* ============================================================
   ISLAMIC ORNAMENTAL SVG COMPONENTS
   ============================================================ */

const OrnamentDivider = ({ className = "", color = "currentColor" }: { className?: string; color?: string }) => (
  <svg viewBox="0 0 400 40" className={className} fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
    <line x1="0" y1="20" x2="140" y2="20" stroke={color} strokeWidth="0.5" opacity="0.4" />
    <line x1="260" y1="20" x2="400" y2="20" stroke={color} strokeWidth="0.5" opacity="0.4" />
    <g transform="translate(200,20)">
      <circle r="14" stroke={color} strokeWidth="0.6" fill="none" opacity="0.6" />
      <circle r="8" stroke={color} strokeWidth="0.6" fill="none" opacity="0.5" />
      <g stroke={color} strokeWidth="0.6" opacity="0.7">
        <line x1="-18" y1="0" x2="-26" y2="0" />
        <line x1="18" y1="0" x2="26" y2="0" />
        <line x1="0" y1="-18" x2="0" y2="-26" />
        <line x1="0" y1="18" x2="0" y2="26" />
      </g>
      <circle r="2" fill={color} opacity="0.8" />
    </g>
  </svg>
)

const EightStar = ({ size = 60, className = "", color = "currentColor", strokeWidth = 0.8 }: any) => (
  <svg viewBox="-50 -50 100 100" width={size} height={size} className={className} fill="none" stroke={color} strokeWidth={strokeWidth} aria-hidden>
    <polygon points="0,-40 11,-11 40,0 11,11 0,40 -11,11 -40,0 -11,-11" />
    <polygon points="0,-28 8,-8 28,0 8,8 0,28 -8,8 -28,0 -8,-8" transform="rotate(22.5)" />
    <circle r="6" />
  </svg>
)

const ArchFrame = ({ className = "", color = "currentColor" }: any) => (
  <svg viewBox="0 0 200 280" className={className} fill="none" stroke={color} strokeWidth="0.8" aria-hidden preserveAspectRatio="none">
    <path d="M 10 280 L 10 100 Q 10 10 100 10 Q 190 10 190 100 L 190 280" />
    <path d="M 24 280 L 24 105 Q 24 24 100 24 Q 176 24 176 105 L 176 280" opacity="0.5" />
  </svg>
)

const ArabesqueCorner = ({ size = 100, className = "", color = "currentColor" }: any) => (
  <svg viewBox="0 0 100 100" width={size} height={size} className={className} fill="none" stroke={color} strokeWidth="0.7" aria-hidden>
    <path d="M 0 0 L 100 0 L 100 30 Q 70 30 70 60 Q 70 100 30 100 L 0 100 Z" opacity="0.15" fill={color} />
    <path d="M 0 0 L 100 0 L 100 30 Q 70 30 70 60 Q 70 100 30 100 L 0 100" />
    <path d="M 20 0 Q 20 50 50 50 Q 80 50 80 30" opacity="0.6" />
    <circle cx="50" cy="50" r="3" fill={color} />
    <circle cx="20" cy="20" r="1.5" fill={color} />
    <circle cx="80" cy="20" r="1.5" fill={color} />
  </svg>
)

const TessellatedBg = ({ className = "", color = "#0F2A44", opacity = 0.04 }: any) => (
  <svg className={className} aria-hidden>
    <defs>
      <pattern id={`tess-${color.replace("#", "")}`} x="0" y="0" width="80" height="80" patternUnits="userSpaceOnUse">
        <g fill="none" stroke={color} strokeWidth="0.6" opacity={opacity * 12}>
          <polygon points="40,5 47,33 75,40 47,47 40,75 33,47 5,40 33,33" />
          <circle cx="40" cy="40" r="22" />
          <circle cx="40" cy="40" r="3" fill={color} />
        </g>
      </pattern>
    </defs>
    <rect width="100%" height="100%" fill={`url(#tess-${color.replace("#", "")})`} />
  </svg>
)

/* ============================================================
   ANIMATION HELPERS
   ============================================================ */

function Reveal({ children, delay = 0, y = 40, className = "" }: any) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: "-80px" })
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.9, delay, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

function CountUp({ value, suffix = "", duration = 2 }: { value: number; suffix?: string; duration?: number }) {
  const ref = useRef<HTMLSpanElement>(null)
  const inView = useInView(ref, { once: true })
  const [n, setN] = useState(0)
  useEffect(() => {
    if (!inView) return
    const start = performance.now()
    let raf = 0
    const tick = (now: number) => {
      const t = Math.min((now - start) / (duration * 1000), 1)
      const eased = 1 - Math.pow(1 - t, 3)
      setN(Math.floor(eased * value))
      if (t < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [inView, value, duration])
  return <span ref={ref}>{n.toLocaleString("ar-EG")}{suffix}</span>
}

/* ============================================================
   PAGE
   ============================================================ */

export default function Home() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [mounted, setMounted] = useState(false)
  const { resolvedTheme, setTheme } = useTheme()
  const heroRef = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ["start start", "end start"] })
  const heroY = useTransform(scrollYProgress, [0, 1], [0, 200])
  const heroOpacity = useTransform(scrollYProgress, [0, 0.8], [1, 0])

  useEffect(() => {
    setMounted(true)
    const handler = () => setScrolled(window.scrollY > 30)
    window.addEventListener("scroll", handler)
    return () => window.removeEventListener("scroll", handler)
  }, [])

  const isDark = mounted && resolvedTheme === "dark"
  const toggleTheme = () => setTheme(isDark ? "light" : "dark")

  return (
    <div className="min-h-screen bg-[#F7F2E9] text-[#1A1A1A] dark:bg-[#0B1217] dark:text-[#F2EBDD] overflow-x-hidden font-sans transition-colors duration-500" dir="rtl">
      {/* ============ HEADER ============ */}
      <motion.header
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.7 }}
        className={`fixed top-0 inset-x-0 z-50 transition-all duration-500 ${
          scrolled
            ? "bg-[#F7F2E9]/85 dark:bg-[#0B1217]/85 backdrop-blur-xl border-b border-[#1A1A1A]/10 dark:border-[#F2EBDD]/10 py-3"
            : "bg-transparent py-5"
        }`}
      >
        <div className="container mx-auto px-6 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <div className="relative w-11 h-11">
              <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-[#0F2A44] to-[#1B4332]" />
              <svg viewBox="0 0 44 44" className="absolute inset-0 w-full h-full p-2.5 text-[#C9A962]" fill="currentColor" aria-hidden>
                <path d="M22 4 L26 18 L40 18 L29 27 L33 41 L22 32 L11 41 L15 27 L4 18 L18 18 Z" opacity="0.95" />
              </svg>
            </div>
            <div className="leading-tight">
              <div className="text-xl font-bold tracking-tight text-[#0F2A44] dark:text-[#C9A962]" style={{ fontFamily: "var(--font-quran)" }}>
                إتْقان
              </div>
              <div className="text-[10px] tracking-[0.2em] text-[#1A1A1A]/55 dark:text-[#F2EBDD]/55 uppercase">
                Itqan Platform
              </div>
            </div>
          </Link>

          <nav className="hidden lg:flex items-center gap-10">
            {[
              { href: "#sections", label: "المنصات" },
              { href: "#features", label: "المميزات" },
              { href: "#journey", label: "المسار" },
              { href: "#voices", label: "آراؤهم" },
            ].map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="text-sm text-[#1A1A1A]/70 dark:text-[#F2EBDD]/70 hover:text-[#0F2A44] dark:hover:text-[#C9A962] transition-colors relative group"
              >
                {item.label}
                <span className="absolute -bottom-1.5 right-0 h-px w-0 bg-[#B08D57] transition-all duration-500 group-hover:w-full" />
              </Link>
            ))}
          </nav>

          <div className="hidden lg:flex items-center gap-3">
            <button
              onClick={toggleTheme}
              aria-label="تبديل المظهر"
              className="relative w-10 h-10 rounded-full border border-[#1A1A1A]/15 dark:border-[#F2EBDD]/20 flex items-center justify-center text-[#0F2A44] dark:text-[#C9A962] hover:border-[#B08D57] dark:hover:border-[#C9A962] transition-all duration-500 hover:scale-105 overflow-hidden"
            >
              <AnimatePresence mode="wait" initial={false}>
                {mounted && (
                  <motion.span
                    key={isDark ? "sun" : "moon"}
                    initial={{ rotate: -90, opacity: 0, scale: 0.6 }}
                    animate={{ rotate: 0, opacity: 1, scale: 1 }}
                    exit={{ rotate: 90, opacity: 0, scale: 0.6 }}
                    transition={{ duration: 0.4 }}
                    className="absolute inset-0 flex items-center justify-center"
                  >
                    {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                  </motion.span>
                )}
              </AnimatePresence>
            </button>
            <Link
              href="/login"
              className="text-sm text-[#1A1A1A]/70 dark:text-[#F2EBDD]/70 hover:text-[#0F2A44] dark:hover:text-[#C9A962] px-4 py-2 transition-colors"
            >
              دخول
            </Link>
            <Link
              href="/register"
              className="text-sm font-medium px-5 py-2.5 rounded-full bg-[#0F2A44] text-[#F7F2E9] dark:bg-[#C9A962] dark:text-[#0B1217] hover:bg-[#1B4332] dark:hover:bg-[#D4B27A] transition-all duration-500 shadow-sm hover:shadow-lg"
            >
              التسجيل
            </Link>
          </div>

          <div className="lg:hidden flex items-center gap-1">
            <button
              onClick={toggleTheme}
              aria-label="تبديل المظهر"
              className="p-2 text-[#0F2A44] dark:text-[#C9A962]"
            >
              {mounted && (isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />)}
            </button>
            <button
              className="p-2 text-[#0F2A44] dark:text-[#C9A962]"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              aria-label="القائمة"
            >
              {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        <AnimatePresence>
          {isMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="lg:hidden bg-[#F7F2E9] dark:bg-[#0B1217] border-t border-[#1A1A1A]/10 dark:border-[#F2EBDD]/10 overflow-hidden"
            >
              <div className="container mx-auto px-6 py-6 space-y-3">
                {[
                  { href: "#sections", label: "المنصات" },
                  { href: "#features", label: "المميزات" },
                  { href: "#journey", label: "المسار" },
                  { href: "#voices", label: "آراؤهم" },
                ].map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setIsMenuOpen(false)}
                    className="block py-2 text-[#1A1A1A]/75 dark:text-[#F2EBDD]/75 hover:text-[#0F2A44] dark:hover:text-[#C9A962]"
                  >
                    {item.label}
                  </Link>
                ))}
                <div className="pt-4 border-t border-[#1A1A1A]/10 dark:border-[#F2EBDD]/10 flex gap-3">
                  <Link href="/login" className="flex-1 py-3 text-center border border-[#0F2A44]/20 dark:border-[#C9A962]/30 dark:text-[#C9A962] rounded-full">
                    دخول
                  </Link>
                  <Link href="/register" className="flex-1 py-3 text-center bg-[#0F2A44] text-[#F7F2E9] dark:bg-[#C9A962] dark:text-[#0B1217] rounded-full">
                    تسجيل
                  </Link>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.header>

      {/* ============ HERO ============ */}
      <section ref={heroRef} className="relative min-h-screen flex items-center pt-32 pb-20 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          {/* Ottoman carpet pattern — desaturated to remove red, sepia warm tone */}
          <div
            className="absolute inset-0 bg-repeat opacity-[0.18] dark:opacity-[0.26]"
            style={{
              backgroundImage: "url(/patterns/ottoman-carpet.jpg)",
              backgroundSize: "440px",
              filter: "grayscale(1) sepia(0.45) brightness(1.05) contrast(0.95)",
            }}
          />
          {/* Soft parchment / dark wash so text stays readable */}
          <div className="absolute inset-0 bg-gradient-to-b from-[#F7F2E9]/85 via-[#F7F2E9]/70 to-[#F7F2E9] dark:from-[#0B1217]/85 dark:via-[#0B1217]/75 dark:to-[#0B1217]" />
          {/* Warm radial glow behind the headline */}
          <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[60vw] h-[60vw] rounded-full blur-[140px] bg-[#B08D57]/15 dark:bg-[#C9A962]/10" />

          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 90, repeat: Infinity, ease: "linear" }}
            className="absolute top-32 -right-20 text-[#0F2A44]/10 dark:text-[#C9A962]/15"
          >
            <EightStar size={400} strokeWidth={0.4} />
          </motion.div>
          <motion.div
            animate={{ rotate: -360 }}
            transition={{ duration: 110, repeat: Infinity, ease: "linear" }}
            className="absolute bottom-20 -left-20 text-[#1B4332]/10 dark:text-[#C9A962]/10"
          >
            <EightStar size={340} strokeWidth={0.4} />
          </motion.div>
          <ArabesqueCorner size={180} className="absolute top-24 right-0 text-[#B08D57]/30 dark:text-[#C9A962]/30" />
          <ArabesqueCorner size={180} className="absolute bottom-10 left-0 text-[#B08D57]/30 dark:text-[#C9A962]/30 rotate-180" />
        </div>

        <motion.div style={{ y: heroY, opacity: heroOpacity }} className="container mx-auto px-6 relative z-10">
          <div className="max-w-5xl mx-auto text-center">
            <Reveal delay={0} y={20}>
              <div className="inline-flex items-center gap-3 mb-10">
                <div className="h-px w-12 bg-[#B08D57]" />
                <span className="text-xs tracking-[0.4em] text-[#B08D57] uppercase font-medium">
                  بِسْمِ اللهِ الرَّحْمَنِ الرَّحِيم
                </span>
                <div className="h-px w-12 bg-[#B08D57]" />
              </div>
            </Reveal>

            <Reveal delay={0.15}>
              <h1
                className="text-[14vw] sm:text-[10vw] md:text-8xl lg:text-9xl font-bold leading-[0.95] tracking-tight text-[#0F2A44] dark:text-[#F2EBDD] mb-10 md:mb-14"
                style={{ fontFamily: "var(--font-quran)" }}
              >
                إتقانُ التِلاوة
              </h1>
            </Reveal>

            <Reveal delay={0.28}>
              <div className="flex items-center justify-center gap-5 mb-10 md:mb-12" aria-hidden>
                <div className="h-px w-14 md:w-20 bg-[#B08D57]/50 dark:bg-[#C9A962]/40" />
                <span className="text-xs tracking-[0.5em] text-[#B08D57] dark:text-[#C9A962]">٭</span>
                <div className="h-px w-14 md:w-20 bg-[#B08D57]/50 dark:bg-[#C9A962]/40" />
              </div>
            </Reveal>

            <Reveal delay={0.38}>
              <h2
                className="text-[10vw] sm:text-[7vw] md:text-6xl lg:text-7xl font-light italic text-[#B08D57] dark:text-[#C9A962] mb-12 md:mb-14"
                style={{ fontFamily: "var(--font-quran)" }}
              >
                ورحلةُ التَعَلُّم
              </h2>
            </Reveal>

            <Reveal delay={0.5}>
              <OrnamentDivider className="w-72 h-10 mx-auto mb-10 text-[#B08D57] dark:text-[#C9A962]" />
            </Reveal>

            <Reveal delay={0.6}>
              <p className="text-base md:text-lg text-[#1A1A1A]/70 dark:text-[#F2EBDD]/70 leading-loose max-w-2xl mx-auto mb-14 px-4">
                مِنبرٌ علميٌّ يجمع بين <span className="text-[#0F2A44] dark:text-[#C9A962] font-semibold">أكاديميَّةٍ</span> راسخةٍ للدُّروسِ والشَّهادات،
                و<span className="text-[#1B4332] dark:text-[#C9A962] font-semibold">مَقْرأةٍ</span> روحانيَّةٍ للحفظِ والتَّسميعِ بإشرافِ المقرِئينَ المُجازين.
              </p>
            </Reveal>

            <Reveal delay={0.75}>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-20">
                <Link
                  href="/academy/student"
                  className="group relative h-14 px-8 inline-flex items-center gap-3 bg-[#0F2A44] text-[#F7F2E9] dark:bg-[#C9A962] dark:text-[#0B1217] rounded-full overflow-hidden transition-all duration-500 hover:gap-5 shadow-lg shadow-[#0F2A44]/20 dark:shadow-[#C9A962]/20 hover:shadow-2xl"
                >
                  <span className="absolute inset-0 bg-[#1B4332] dark:bg-[#D4B27A] translate-y-full group-hover:translate-y-0 transition-transform duration-500" />
                  <GraduationCap className="w-5 h-5 relative z-10" />
                  <span className="relative z-10 font-medium">الأكاديميَّة</span>
                  <ArrowLeft className="w-4 h-4 relative z-10" />
                </Link>
                <Link
                  href="/student"
                  className="group relative h-14 px-8 inline-flex items-center gap-3 border border-[#0F2A44]/25 dark:border-[#C9A962]/35 text-[#0F2A44] dark:text-[#C9A962] rounded-full hover:gap-5 transition-all duration-500 hover:border-[#1B4332] hover:bg-[#1B4332] hover:text-[#F7F2E9] dark:hover:border-[#C9A962] dark:hover:bg-[#C9A962] dark:hover:text-[#0B1217]"
                >
                  <BookOpen className="w-5 h-5" />
                  <span className="font-medium">المَقْرأة</span>
                  <ArrowLeft className="w-4 h-4" />
                </Link>
              </div>
            </Reveal>

            <Reveal delay={0.9}>
              <div className="grid grid-cols-2 md:grid-cols-4 max-w-4xl mx-auto border-y border-[#1A1A1A]/10 dark:border-[#F2EBDD]/10 divide-x divide-[#1A1A1A]/10 dark:divide-[#F2EBDD]/10 divide-x-reverse">
                {[
                  { v: 12500, s: "+", l: "طالب وطالبة" },
                  { v: 320, s: "+", l: "معلِّم ومُقرئ" },
                  { v: 85, s: "%", l: "نسبة الإتقان" },
                  { v: 24, s: "/7", l: "متابعة دائمة" },
                ].map((s, i) => (
                  <div key={i} className="py-8 px-2 text-center">
                    <div className="text-3xl md:text-4xl font-bold text-[#0F2A44] dark:text-[#C9A962]" style={{ fontFamily: "var(--font-quran)" }}>
                      <CountUp value={s.v} suffix={s.s} />
                    </div>
                    <div className="text-xs md:text-sm text-[#1A1A1A]/60 dark:text-[#F2EBDD]/60 mt-2 tracking-wide">{s.l}</div>
                  </div>
                ))}
              </div>
            </Reveal>

            <motion.div
              animate={{ y: [0, 12, 0] }}
              transition={{ duration: 2.5, repeat: Infinity }}
              className="mt-16 text-[#1A1A1A]/40 dark:text-[#F2EBDD]/40 inline-flex flex-col items-center gap-2"
            >
              <span className="text-xs tracking-[0.3em]">تَصَفَّح</span>
              <ChevronDown className="w-4 h-4" />
            </motion.div>
          </div>
        </motion.div>
      </section>

      {/* ============ TWO PILLARS ============ */}
      <section
        id="sections"
        className="relative py-32 md:py-40 bg-[#F7F2E9] text-[#1A1A1A] dark:bg-[#0F2A44] dark:text-[#F7F2E9] overflow-hidden transition-colors duration-500"
      >
        {/* Subtle ornamental layer that fits both modes */}
        <TessellatedBg
          className="absolute inset-0 w-full h-full hidden dark:block"
          color="#C9A962"
          opacity={0.04}
        />
        <TessellatedBg
          className="absolute inset-0 w-full h-full dark:hidden"
          color="#0F2A44"
          opacity={0.025}
        />
        {/* Soft gradient seam — blends with the cream hero above and the cream features below */}
        <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-[#F7F2E9] to-transparent dark:from-[#0B1217] dark:to-transparent pointer-events-none" />
        <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-[#F7F2E9] to-transparent dark:from-[#0a1f33] dark:to-transparent pointer-events-none" />

        <div className="container mx-auto px-6 relative">
          <Reveal>
            <div className="text-center mb-20 max-w-2xl mx-auto">
              <div className="inline-flex items-center gap-3 mb-6">
                <div className="h-px w-12 bg-[#B08D57] dark:bg-[#C9A962]" />
                <span className="text-xs tracking-[0.35em] text-[#B08D57] dark:text-[#C9A962] uppercase">المنصَّتان</span>
                <div className="h-px w-12 bg-[#B08D57] dark:bg-[#C9A962]" />
              </div>
              <h2 className="text-5xl md:text-7xl font-bold mb-6 leading-tight text-[#0F2A44] dark:text-[#F7F2E9]" style={{ fontFamily: "var(--font-quran)" }}>
                طريقانِ نحوَ الإتقان
              </h2>
              <p className="text-[#1A1A1A]/65 dark:text-[#F7F2E9]/65 text-lg leading-relaxed">
                اخترْ مسارَك الذي يُلائمُ هِمَّتَكَ ووقتَك
              </p>
            </div>
          </Reveal>

          <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 max-w-6xl mx-auto">
            {/* ACADEMY */}
            <Reveal delay={0.1}>
              <Link href="/academy/student" className="group block relative">
                <ArchFrame className="absolute -inset-4 w-[calc(100%+2rem)] h-[calc(100%+2rem)] text-[#B08D57]/35 dark:text-[#C9A962]/30 pointer-events-none" />
                <article className="relative h-full bg-gradient-to-br from-[#FFFCF5] via-[#FAF4E5] to-[#F2E8CF] dark:from-[#163A60] dark:via-[#0F2A44] dark:to-[#0a1f33] rounded-t-[100px] rounded-b-2xl p-10 md:p-12 border border-[#B08D57]/30 dark:border-[#C9A962]/30 overflow-hidden transition-all duration-700 group-hover:border-[#B08D57]/60 dark:group-hover:border-[#C9A962]/60 group-hover:-translate-y-2 shadow-xl shadow-[#0F2A44]/10 dark:shadow-2xl dark:shadow-black/40">
                  <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-96 h-96 bg-[#B08D57]/15 dark:bg-[#C9A962]/18 rounded-full blur-3xl group-hover:bg-[#B08D57]/25 dark:group-hover:bg-[#C9A962]/28 transition-all duration-700" />
                  <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-[#B08D57]/10 dark:bg-[#B08D57]/15 rounded-full blur-3xl" />
                  <ArabesqueCorner size={120} className="absolute top-0 right-0 text-[#B08D57]/30 dark:text-[#C9A962]/30" />
                  <ArabesqueCorner size={120} className="absolute bottom-0 left-0 text-[#B08D57]/30 dark:text-[#C9A962]/30 rotate-180" />

                  <div className="relative">
                    <div className="text-7xl font-bold text-[#B08D57]/35 dark:text-[#C9A962]/30 mb-2 leading-none" style={{ fontFamily: "var(--font-quran)" }}>
                      ٠١
                    </div>
                    <div className="flex items-center gap-3 mb-2 -mt-8">
                      <span className="text-xs tracking-[0.3em] text-[#B08D57] dark:text-[#C9A962] uppercase">القسم الأول</span>
                    </div>
                    <h3 className="text-4xl md:text-5xl font-bold mb-4 text-[#0F2A44] dark:text-[#F7F2E9]" style={{ fontFamily: "var(--font-quran)" }}>
                      الأكاديميَّة
                    </h3>
                    <p className="text-[#1A1A1A]/70 dark:text-[#F7F2E9]/70 leading-loose mb-10 text-base md:text-lg">
                      مَدْرسةٌ افتراضيَّةٌ منظَّمة، بدوراتٍ مُتدرِّجةٍ في علوم القرآن والتجويد والفقه،
                      تُتوَّجُ بشهاداتٍ وإجازاتٍ معتمدة.
                    </p>

                    <div className="space-y-4 mb-12">
                      {[
                        { i: ScrollText, t: "مناهجُ متدرِّجة", d: "من المبتدئ إلى الإجازة" },
                        { i: Award, t: "شهاداتٌ معتمدة", d: "موثَّقةٌ بختمِ الأكاديميَّة" },
                        { i: Users, t: "إشرافٌ مباشر", d: "أساتذةٌ مُجازون" },
                      ].map((f, i) => (
                        <div key={i} className="flex items-start gap-4 group/item">
                          <div className="w-10 h-10 rounded-full border border-[#B08D57]/40 dark:border-[#C9A962]/40 bg-[#B08D57]/8 dark:bg-[#C9A962]/5 flex items-center justify-center flex-shrink-0 group-hover/item:bg-[#B08D57]/15 dark:group-hover/item:bg-[#C9A962]/15 group-hover/item:border-[#B08D57]/65 dark:group-hover/item:border-[#C9A962]/60 transition-colors">
                            <f.i className="w-4 h-4 text-[#B08D57] dark:text-[#C9A962]" />
                          </div>
                          <div>
                            <div className="font-semibold text-base mb-0.5 text-[#0F2A44] dark:text-[#F7F2E9]" style={{ fontFamily: "var(--font-quran)" }}>{f.t}</div>
                            <div className="text-sm text-[#1A1A1A]/65 dark:text-[#F7F2E9]/65">{f.d}</div>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="flex items-center justify-between pt-6 border-t border-[#B08D57]/30 dark:border-[#C9A962]/25">
                      <span className="text-[#B08D57] dark:text-[#C9A962] font-medium">دخول الأكاديميَّة</span>
                      <div className="w-12 h-12 rounded-full bg-[#B08D57] dark:bg-[#C9A962] text-[#FAF6EE] dark:text-[#0F2A44] flex items-center justify-center transition-all duration-500 group-hover:scale-110 group-hover:rotate-[-45deg]">
                        <ArrowLeft className="w-5 h-5" />
                      </div>
                    </div>
                  </div>
                </article>
              </Link>
            </Reveal>

            {/* MAQRA'A */}
            <Reveal delay={0.25}>
              <Link href="/student" className="group block relative">
                <ArchFrame className="absolute -inset-4 w-[calc(100%+2rem)] h-[calc(100%+2rem)] text-[#B08D57]/35 dark:text-[#C9A962]/30 pointer-events-none" />
                <article className="relative h-full bg-gradient-to-br from-[#FBF7EB] via-[#F5EDDA] to-[#EBDFC0] dark:from-[#1F4736] dark:via-[#163A2A] dark:to-[#0d2418] rounded-t-[100px] rounded-b-2xl p-10 md:p-12 border border-[#B08D57]/30 dark:border-[#C9A962]/30 overflow-hidden transition-all duration-700 group-hover:border-[#B08D57]/60 dark:group-hover:border-[#C9A962]/60 group-hover:-translate-y-2 shadow-xl shadow-[#0F2A44]/10 dark:shadow-2xl dark:shadow-black/40">
                  <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-96 h-96 bg-[#B08D57]/15 dark:bg-[#C9A962]/18 rounded-full blur-3xl group-hover:bg-[#B08D57]/25 dark:group-hover:bg-[#C9A962]/28 transition-all duration-700" />
                  <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-[#B08D57]/12 dark:bg-[#B08D57]/18 rounded-full blur-3xl" />
                  <ArabesqueCorner size={120} className="absolute top-0 right-0 text-[#B08D57]/30 dark:text-[#C9A962]/30" />
                  <ArabesqueCorner size={120} className="absolute bottom-0 left-0 text-[#B08D57]/30 dark:text-[#C9A962]/30 rotate-180" />

                  <div className="relative">
                    <div className="text-7xl font-bold text-[#B08D57]/35 dark:text-[#C9A962]/30 mb-2 leading-none" style={{ fontFamily: "var(--font-quran)" }}>
                      ٠٢
                    </div>
                    <div className="flex items-center gap-3 mb-2 -mt-8">
                      <span className="text-xs tracking-[0.3em] text-[#B08D57] dark:text-[#C9A962] uppercase">القسم الثاني</span>
                    </div>
                    <h3 className="text-4xl md:text-5xl font-bold mb-4 text-[#1B4332] dark:text-[#F7F2E9]" style={{ fontFamily: "var(--font-quran)" }}>
                      المَقْرأة
                    </h3>
                    <p className="text-[#1A1A1A]/70 dark:text-[#F7F2E9]/70 leading-loose mb-10 text-base md:text-lg">
                      مجلسٌ روحانيٌّ مُباشَر، تَعْرضُ تِلاوتَكَ على المُقرئِ المُجاز،
                      فيُصحِّحُ ويُتابعُ ويُجيز.
                    </p>

                    <div className="space-y-4 mb-12">
                      {[
                        { i: Mic, t: "تَسميعٌ مُباشر", d: "بصوتِكَ وبتفاعلٍ حيّ" },
                        { i: Calendar, t: "حَجزٌ مَرِن", d: "مواعيدُ تُناسبُك" },
                        { i: BookOpen, t: "مُتابعةُ الحفظ", d: "تقدُّمٌ مُسجَّلٌ كلَّ جلسة" },
                      ].map((f, i) => (
                        <div key={i} className="flex items-start gap-4 group/item">
                          <div className="w-10 h-10 rounded-full border border-[#B08D57]/40 dark:border-[#C9A962]/40 bg-[#B08D57]/8 dark:bg-[#C9A962]/5 flex items-center justify-center flex-shrink-0 group-hover/item:bg-[#B08D57]/15 dark:group-hover/item:bg-[#C9A962]/15 group-hover/item:border-[#B08D57]/65 dark:group-hover/item:border-[#C9A962]/60 transition-colors">
                            <f.i className="w-4 h-4 text-[#B08D57] dark:text-[#C9A962]" />
                          </div>
                          <div>
                            <div className="font-semibold text-base mb-0.5 text-[#1B4332] dark:text-[#F7F2E9]" style={{ fontFamily: "var(--font-quran)" }}>{f.t}</div>
                            <div className="text-sm text-[#1A1A1A]/65 dark:text-[#F7F2E9]/65">{f.d}</div>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="flex items-center justify-between pt-6 border-t border-[#B08D57]/30 dark:border-[#C9A962]/25">
                      <span className="text-[#B08D57] dark:text-[#C9A962] font-medium">دخول المَقْرأة</span>
                      <div className="w-12 h-12 rounded-full bg-[#B08D57] dark:bg-[#C9A962] text-[#FAF6EE] dark:text-[#1B4332] flex items-center justify-center transition-all duration-500 group-hover:scale-110 group-hover:rotate-[-45deg]">
                        <ArrowLeft className="w-5 h-5" />
                      </div>
                    </div>
                  </div>
                </article>
              </Link>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ============ FEATURES ============ */}
      <section id="features" className="relative py-32 md:py-40 bg-[#F7F2E9] dark:bg-[#0B1217] overflow-hidden transition-colors duration-500">
        <div className="absolute inset-0 pointer-events-none">
          <EightStar size={500} className="absolute -top-40 -left-40 text-[#0F2A44]/5 dark:text-[#C9A962]/8" strokeWidth={0.3} />
          <EightStar size={400} className="absolute -bottom-32 -right-32 text-[#1B4332]/5 dark:text-[#C9A962]/6" strokeWidth={0.3} />
        </div>

        <div className="container mx-auto px-6 relative">
          <Reveal>
            <div className="grid lg:grid-cols-12 gap-10 mb-20">
              <div className="lg:col-span-5">
                <span className="text-xs tracking-[0.35em] text-[#B08D57] dark:text-[#C9A962] uppercase mb-4 block">المميزات</span>
                <h2 className="text-5xl md:text-6xl font-bold leading-tight text-[#0F2A44] dark:text-[#F2EBDD]" style={{ fontFamily: "var(--font-quran)" }}>
                  تجربةٌ مُتكاملة بِتفاصيلَ مَدروسة
                </h2>
              </div>
              <div className="lg:col-span-6 lg:col-start-7 flex items-end">
                <p className="text-lg text-[#1A1A1A]/65 dark:text-[#F2EBDD]/65 leading-loose">
                  كلُّ ميزةٍ صُمِّمَت لِتُلامسَ احتياجَ الطالب، فلا تَكلُّفَ ولا تَعقيد،
                  بل أدواتٌ صريحةٌ تُعينُك على الإتقان.
                </p>
              </div>
            </div>
          </Reveal>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { num: "٠١", t: "حَلَقاتٌ مرئيَّة", d: "جلساتٌ مباشرةٌ بصوتٍ وصورةٍ، تَحاكي الحَلْقةَ التقليديَّة في رحابِ المساجد.", i: Users },
              { num: "٠٢", t: "تَسجيلُ التِّلاوة", d: "سجِّل تِلاوتَكَ في أيِّ وقت، وأرسلْها للمُقرئ ليُصحِّحَ ويُعلِّقَ على كلِّ آية.", i: Mic },
              { num: "٠٣", t: "مُتابعةُ التَّقدُّم", d: "إحصاءاتٌ دقيقةٌ تُظهِرُ مُعدَّلَ حِفظِك وإتقانِك أسبوعيًّا وشهريًّا.", i: Star },
              { num: "٠٤", t: "شهاداتٌ مُوثَّقة", d: "عند إتمامِ مسارٍ تعليميٍّ، تَحصُلُ على شهادةٍ مَعزُوَّةٍ بختمِ الأكاديميَّة.", i: Award },
              { num: "٠٥", t: "حَجْزٌ مَرِن", d: "اختر مُقرِئَكَ والوقتَ المُناسبَ لك من تقويمٍ ذكيٍّ يَعرضُ المتاحَ فقط.", i: Calendar },
              { num: "٠٦", t: "مَكتبةٌ معرفيَّة", d: "محاضراتٌ ومَقالاتٌ في علوم القرآن والفقه والتفسير، يتجدَّدُ مُحتواها أُسبوعيًّا.", i: ScrollText },
            ].map((f, i) => (
              <Reveal key={i} delay={i * 0.08}>
                <article className="group relative h-full p-10 bg-[#FAF6EE] dark:bg-[#101A22] border border-[#0F2A44]/10 dark:border-[#C9A962]/15 rounded-2xl overflow-hidden hover:border-[#B08D57]/40 dark:hover:border-[#C9A962]/45 transition-all duration-500">
                  <div className="absolute top-0 left-0 w-20 h-20">
                    <ArabesqueCorner size={80} color="#B08D57" className="opacity-20 dark:opacity-30 group-hover:opacity-40 dark:group-hover:opacity-50 transition-opacity" />
                  </div>

                  <div className="relative">
                    <div className="flex items-center justify-between mb-8">
                      <span className="text-3xl font-bold text-[#B08D57]/60 dark:text-[#C9A962]/55" style={{ fontFamily: "var(--font-quran)" }}>
                        {f.num}
                      </span>
                      <div className="w-12 h-12 rounded-full bg-[#0F2A44]/5 dark:bg-[#C9A962]/10 flex items-center justify-center transition-all duration-500 group-hover:bg-[#0F2A44] dark:group-hover:bg-[#C9A962] group-hover:rotate-12">
                        <f.i className="w-5 h-5 text-[#0F2A44] dark:text-[#C9A962] group-hover:text-[#C9A962] dark:group-hover:text-[#0F2A44] transition-colors" />
                      </div>
                    </div>
                    <h3 className="text-2xl font-bold text-[#0F2A44] dark:text-[#F2EBDD] mb-3" style={{ fontFamily: "var(--font-quran)" }}>
                      {f.t}
                    </h3>
                    <p className="text-[#1A1A1A]/65 dark:text-[#F2EBDD]/65 leading-loose text-sm">{f.d}</p>
                  </div>

                  <div className="absolute bottom-0 inset-x-10 h-px bg-gradient-to-r from-transparent via-[#B08D57]/30 dark:via-[#C9A962]/40 to-transparent scale-x-0 group-hover:scale-x-100 transition-transform duration-700" />
                </article>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ============ JOURNEY ============ */}
      <section id="journey" className="relative py-32 md:py-40 bg-[#FAF6EE] dark:bg-[#0E1820] border-y border-[#0F2A44]/10 dark:border-[#C9A962]/15 overflow-hidden transition-colors duration-500">
        <div className="container mx-auto px-6">
          <Reveal>
            <div className="text-center mb-20 max-w-2xl mx-auto">
              <span className="text-xs tracking-[0.35em] text-[#B08D57] dark:text-[#C9A962] uppercase mb-4 block">المسار</span>
              <OrnamentDivider className="w-48 h-8 mx-auto mb-6 text-[#B08D57] dark:text-[#C9A962]" />
              <h2 className="text-5xl md:text-6xl font-bold text-[#0F2A44] dark:text-[#F2EBDD] leading-tight mb-6" style={{ fontFamily: "var(--font-quran)" }}>
                كيف تَبدأُ رحلتَك
              </h2>
              <p className="text-lg text-[#1A1A1A]/65 dark:text-[#F2EBDD]/65">
                أربعُ خطواتٍ هَيِّنات، وأنتَ في صَدرِ المَجلس
              </p>
            </div>
          </Reveal>

          <div className="max-w-4xl mx-auto">
            {[
              { n: "١", t: "سَجِّل في المنصَّة", d: "أنشئ حسابَكَ في دقائق، اختر منصَّتَك (الأكاديميَّة أو المَقْرأة أو كلتيهما)، وأَكمِل ملفَّكَ التعريفيَّ." },
              { n: "٢", t: "اخْتَر مُعلِّمَك", d: "تصفَّح قائمةَ الأساتذةِ والمُقرئين، اقرأْ سيرَهم وتقييماتِ طلَّابِهم، ثم اخترِ الأنسبَ لك." },
              { n: "٣", t: "احْجِزْ موعدَك", d: "اختر اليومَ والساعةَ من تقويمِ المُعلِّم، فيَصلُكَ تَنبيهٌ قبلَ الجلسةِ بوقتٍ كافٍ." },
              { n: "٤", t: "ابْدأْ في الإتقان", d: "احْضُرْ الجلساتِ، أَنجِزْ الواجبات، وَتابعْ تقدُّمَك حتى تَبلُغَ غايتَك بإذن الله." },
            ].map((step, i) => (
              <Reveal key={i} delay={i * 0.12}>
                <div className="group relative flex gap-8 md:gap-12 py-10 border-b border-[#0F2A44]/10 dark:border-[#C9A962]/15 last:border-0">
                  <div className="flex-shrink-0">
                    <div
                      className="text-7xl md:text-8xl font-bold text-[#B08D57]/30 dark:text-[#C9A962]/35 leading-none transition-all duration-500 group-hover:text-[#B08D57] dark:group-hover:text-[#C9A962]"
                      style={{ fontFamily: "var(--font-quran)" }}
                    >
                      {step.n}
                    </div>
                  </div>
                  <div className="flex-1 pt-2">
                    <h3 className="text-2xl md:text-3xl font-bold text-[#0F2A44] dark:text-[#F2EBDD] mb-4" style={{ fontFamily: "var(--font-quran)" }}>
                      {step.t}
                    </h3>
                    <p className="text-[#1A1A1A]/65 dark:text-[#F2EBDD]/65 leading-loose md:text-lg max-w-2xl">{step.d}</p>
                  </div>
                  <div className="hidden md:flex items-center text-[#B08D57]/40 dark:text-[#C9A962]/45 group-hover:text-[#B08D57] dark:group-hover:text-[#C9A962] group-hover:-translate-x-2 transition-all duration-500">
                    <ArrowLeft className="w-6 h-6" />
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ============ TESTIMONIALS ============ */}
      <section id="voices" className="relative py-32 md:py-40 bg-[#F7F2E9] dark:bg-[#0B1217] overflow-hidden transition-colors duration-500">
        <div className="container mx-auto px-6">
          <Reveal>
            <div className="text-center mb-20">
              <span className="text-xs tracking-[0.35em] text-[#B08D57] dark:text-[#C9A962] uppercase mb-4 block">آراؤهم</span>
              <h2 className="text-5xl md:text-6xl font-bold text-[#0F2A44] dark:text-[#F2EBDD] leading-tight" style={{ fontFamily: "var(--font-quran)" }}>
                كَلِماتٌ مِن طُلَّابِنا
              </h2>
            </div>
          </Reveal>

          <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {[
              { q: "تجربةٌ أعادتْ لي شَغفي بالقرآن، فالأستاذُ يُتابعُ تِلاوتي حرفًا حرفًا، وأنا في بيتي.", n: "أحمد المصري", r: "طالبٌ في مسارِ الإجازة" },
              { q: "حفظتُ ربعَ القرآن في ستَّةِ أشهرٍ بفضلِ المتابعةِ المُنظَّمةِ والمُقرئةِ المُتميِّزةِ في المنصَّة.", n: "فاطمة الزهراء", r: "طالبةُ تحفيظ" },
              { q: "الجَودةُ، التَّنظيم، الاحترامُ في التعامل، كلُّ شيءٍ يَدلُّ على أنَّ القائمين أهلُ علمٍ وصِدق.", n: "د. خالد الأنصاري", r: "وَلِيُّ أمر" },
            ].map((t, i) => (
              <Reveal key={i} delay={i * 0.15}>
                <article className="group h-full relative p-10 bg-[#FAF6EE] dark:bg-[#101A22] border border-[#0F2A44]/10 dark:border-[#C9A962]/15 rounded-2xl hover:border-[#B08D57]/40 dark:hover:border-[#C9A962]/45 transition-all duration-500">
                  <Quote className="absolute top-6 left-6 w-10 h-10 text-[#B08D57]/20 dark:text-[#C9A962]/30 rotate-180" />
                  <ArabesqueCorner size={80} className="absolute top-0 right-0 text-[#B08D57]/15 dark:text-[#C9A962]/25" />

                  <div className="relative pt-6">
                    <p className="text-lg text-[#1A1A1A]/85 dark:text-[#F2EBDD]/85 leading-loose mb-8" style={{ fontFamily: "var(--font-quran)" }}>
                      {t.q}
                    </p>
                    <div className="pt-6 border-t border-[#0F2A44]/10 dark:border-[#C9A962]/15">
                      <div className="font-bold text-[#0F2A44] dark:text-[#F2EBDD]" style={{ fontFamily: "var(--font-quran)" }}>{t.n}</div>
                      <div className="text-sm text-[#1A1A1A]/55 dark:text-[#F2EBDD]/55 mt-1">{t.r}</div>
                    </div>
                    <div className="flex gap-1 mt-4">
                      {[...Array(5)].map((_, k) => (
                        <Star key={k} className="w-3.5 h-3.5 fill-[#B08D57] dark:fill-[#C9A962] text-[#B08D57] dark:text-[#C9A962]" />
                      ))}
                    </div>
                  </div>
                </article>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ============ CTA ============ */}
      <section className="relative py-32 md:py-40 bg-[#0F2A44] text-[#F7F2E9] overflow-hidden">
        {/* Ottoman carpet pattern — desaturated, gold-toned woven texture */}
        <div
          className="absolute inset-0 bg-repeat opacity-[0.22] pointer-events-none"
          style={{
            backgroundImage: "url(/patterns/ottoman-carpet.jpg)",
            backgroundSize: "440px",
            filter: "grayscale(1) sepia(0.55) brightness(0.95) contrast(1)",
          }}
        />
        {/* Navy wash to keep text readable on top of the pattern */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#0F2A44]/85 via-[#0F2A44]/75 to-[#0F2A44]/90 pointer-events-none" />
        {/* Gold seams */}
        <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-[#C9A962]/40 to-transparent" />
        <div className="absolute bottom-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-[#C9A962]/30 to-transparent" />

        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 100, repeat: Infinity, ease: "linear" }}
          className="absolute -top-40 -right-40 text-[#C9A962]/10"
        >
          <EightStar size={500} strokeWidth={0.4} />
        </motion.div>
        <motion.div
          animate={{ rotate: -360 }}
          transition={{ duration: 120, repeat: Infinity, ease: "linear" }}
          className="absolute -bottom-40 -left-40 text-[#C9A962]/10"
        >
          <EightStar size={500} strokeWidth={0.4} />
        </motion.div>

        <div className="container mx-auto px-6 relative">
          <Reveal>
            <div className="max-w-3xl mx-auto text-center">
              <Sparkles className="w-10 h-10 text-[#C9A962] mx-auto mb-6" />
              <OrnamentDivider className="w-48 h-8 mx-auto mb-8 text-[#C9A962]" />
              <h2 className="text-5xl md:text-7xl font-bold mb-8 leading-tight" style={{ fontFamily: "var(--font-quran)" }}>
                ابْدَأْ رحلتَك اليومَ
              </h2>
              <p className="text-lg md:text-xl text-[#F7F2E9]/70 leading-loose mb-12">
                انضمَّ إلى آلاف الطلَّابِ الذينَ بَدَؤوا رحلتَهم نحو إتقانِ كتابِ الله،
                ولا تَنْسَ أنَّ <span className="text-[#C9A962]" style={{ fontFamily: "var(--font-quran)" }}>«خيرُكم مَن تَعَلَّمَ القرآنَ وعَلَّمَه»</span>.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link
                  href="/register"
                  className="group h-14 px-10 inline-flex items-center gap-3 bg-[#C9A962] text-[#0F2A44] rounded-full font-bold transition-all duration-500 hover:gap-5 shadow-2xl shadow-[#C9A962]/20"
                >
                  <span>سَجِّل مَجَّانًا</span>
                  <ArrowLeft className="w-5 h-5 transition-transform duration-500 group-hover:-translate-x-1" />
                </Link>
                <Link
                  href="/login"
                  className="h-14 px-10 inline-flex items-center gap-3 border border-[#F7F2E9]/25 rounded-full hover:bg-[#F7F2E9]/5 transition-colors"
                >
                  لديَّ حسابٌ بالفعل
                </Link>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ============ FOOTER ============ */}
      <footer className="relative bg-[#0a1f33] text-[#F7F2E9]/85 pt-20 pb-10 overflow-hidden">
        {/* Ottoman carpet — woven texture beneath the dark wash */}
        <div
          className="absolute inset-0 bg-repeat opacity-[0.18] mix-blend-overlay pointer-events-none"
          style={{
            backgroundImage: "url(/patterns/ottoman-carpet.jpg)",
            backgroundSize: "440px",
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#0a1f33] via-[#0a1f33]/92 to-[#0a1f33] pointer-events-none" />
        {/* Top thin gold seam */}
        <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-[#C9A962]/40 to-transparent" />

        <div className="container mx-auto px-6 relative">
          <div className="grid lg:grid-cols-12 gap-10 pb-12 border-b border-[#F7F2E9]/10">
            <div className="lg:col-span-5">
              <div className="flex items-center gap-3 mb-6">
                <div className="relative w-12 h-12">
                  <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-[#13325a] to-[#1B4332]" />
                  <svg viewBox="0 0 44 44" className="absolute inset-0 w-full h-full p-2.5 text-[#C9A962]" fill="currentColor" aria-hidden>
                    <path d="M22 4 L26 18 L40 18 L29 27 L33 41 L22 32 L11 41 L15 27 L4 18 L18 18 Z" />
                  </svg>
                </div>
                <div>
                  <div className="text-2xl font-bold text-[#F7F2E9]" style={{ fontFamily: "var(--font-quran)" }}>
                    إتْقان
                  </div>
                  <div className="text-[10px] tracking-[0.2em] text-[#F7F2E9]/50 uppercase">
                    Itqan Platform
                  </div>
                </div>
              </div>
              <p className="text-[#F7F2E9]/60 leading-loose max-w-md mb-6">
                مِنبرٌ علميٌّ يجمع بين الأكاديميَّة الراسخة والمَقْرأة الروحانيَّة،
                لِيَكونَ صَرحًا متكاملًا لإتقانِ كتابِ الله.
              </p>
              <OrnamentDivider className="w-40 h-6 text-[#C9A962]/50" />
            </div>

            <div className="lg:col-span-7 grid grid-cols-2 md:grid-cols-3 gap-8">
              <div>
                <h4 className="text-sm font-bold text-[#C9A962] mb-5 tracking-wider">الأكاديميَّة</h4>
                <ul className="space-y-3 text-sm">
                  <li><Link href="/academy/student" className="hover:text-[#C9A962] transition-colors">لوحة التحكُّم</Link></li>
                  <li><Link href="/academy/student/courses" className="hover:text-[#C9A962] transition-colors">الدَّورات</Link></li>
                  <li><Link href="/academy/student/path" className="hover:text-[#C9A962] transition-colors">المَسار</Link></li>
                  <li><Link href="/academy/student/certificates" className="hover:text-[#C9A962] transition-colors">الشَّهادات</Link></li>
                </ul>
              </div>
              <div>
                <h4 className="text-sm font-bold text-[#C9A962] mb-5 tracking-wider">المَقْرأة</h4>
                <ul className="space-y-3 text-sm">
                  <li><Link href="/student" className="hover:text-[#C9A962] transition-colors">لوحة التحكُّم</Link></li>
                  <li><Link href="/student/recitations" className="hover:text-[#C9A962] transition-colors">التَّسميعات</Link></li>
                  <li><Link href="/student/booking" className="hover:text-[#C9A962] transition-colors">حَجْزُ موعد</Link></li>
                  <li><Link href="/student/progress" className="hover:text-[#C9A962] transition-colors">التَّقدُّم</Link></li>
                </ul>
              </div>
              <div>
                <h4 className="text-sm font-bold text-[#C9A962] mb-5 tracking-wider">الدَّعم</h4>
                <ul className="space-y-3 text-sm">
                  <li><Link href="/about" className="hover:text-[#C9A962] transition-colors">عَن المنصَّة</Link></li>
                  <li><Link href="/contact" className="hover:text-[#C9A962] transition-colors">تَواصلْ معنا</Link></li>
                  <li><Link href="/privacy" className="hover:text-[#C9A962] transition-colors">الخصوصيَّة</Link></li>
                  <li><Link href="/terms" className="hover:text-[#C9A962] transition-colors">الشُّروط</Link></li>
                </ul>
              </div>
            </div>
          </div>

          <div className="pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-[#F7F2E9]/55">
            <div>© {new Date().getFullYear()} إتْقان. جميعُ الحقوقِ محفوظة.</div>
            <div className="flex items-center gap-2">
              <span>صُنِعَ بِـ</span>
              <span className="text-[#C9A962]">♥</span>
              <span>لِخدمةِ كتابِ الله</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
