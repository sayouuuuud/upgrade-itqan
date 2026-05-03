"use client"

import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import { motion, useScroll, useTransform, useSpring, AnimatePresence, useMotionValue, useInView } from "framer-motion"
import {
  BookOpen,
  GraduationCap,
  ArrowLeft,
  Menu,
  X,
  Mic,
  Award,
  Users,
  Calendar,
  Sparkles,
  Heart,
  Star,
} from "lucide-react"

/* ============================================================
 * ISLAMIC DECORATIVE SVGs
 * ============================================================ */

// 8-pointed Islamic star (najmah thumaniyya)
const IslamicStar8 = ({ className = "", size = 40 }: { className?: string; size?: number }) => (
  <svg viewBox="0 0 100 100" width={size} height={size} className={className} fill="none">
    <path
      d="M50 5 L60 30 L85 25 L70 50 L85 75 L60 70 L50 95 L40 70 L15 75 L30 50 L15 25 L40 30 Z"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinejoin="round"
    />
    <path
      d="M50 22 L57 38 L75 35 L63 50 L75 65 L57 62 L50 78 L43 62 L25 65 L37 50 L25 35 L43 38 Z"
      stroke="currentColor"
      strokeWidth="0.8"
      strokeLinejoin="round"
      opacity="0.5"
    />
  </svg>
)

// 12-pointed star
const IslamicStar12 = ({ className = "", size = 60 }: { className?: string; size?: number }) => (
  <svg viewBox="0 0 100 100" width={size} height={size} className={className} fill="none">
    {Array.from({ length: 12 }).map((_, i) => {
      const angle = (i * 30 * Math.PI) / 180
      const x = 50 + Math.cos(angle) * 45
      const y = 50 + Math.sin(angle) * 45
      const angle2 = ((i * 30 + 15) * Math.PI) / 180
      const x2 = 50 + Math.cos(angle2) * 25
      const y2 = 50 + Math.sin(angle2) * 25
      return <line key={i} x1={x} y1={y} x2={x2} y2={y2} stroke="currentColor" strokeWidth="1" />
    })}
    <circle cx="50" cy="50" r="45" stroke="currentColor" strokeWidth="0.5" fill="none" opacity="0.3" />
    <circle cx="50" cy="50" r="25" stroke="currentColor" strokeWidth="0.5" fill="none" opacity="0.5" />
  </svg>
)

// Mihrab arch
const MihrabArch = ({ className = "" }: { className?: string }) => (
  <svg viewBox="0 0 200 300" className={className} fill="none" preserveAspectRatio="xMidYMid meet">
    <path
      d="M20 300 L20 150 Q20 50 100 50 Q180 50 180 150 L180 300"
      stroke="currentColor"
      strokeWidth="2"
      fill="none"
    />
    <path
      d="M35 300 L35 155 Q35 65 100 65 Q165 65 165 155 L165 300"
      stroke="currentColor"
      strokeWidth="1"
      fill="none"
      opacity="0.5"
    />
    <circle cx="100" cy="40" r="3" fill="currentColor" />
  </svg>
)

// Arabesque corner
const ArabesqueCorner = ({ className = "" }: { className?: string }) => (
  <svg viewBox="0 0 100 100" className={className} fill="none">
    <path d="M0 0 Q30 0 30 30 Q30 60 60 60 Q90 60 90 90" stroke="currentColor" strokeWidth="1.5" fill="none" />
    <path d="M0 0 Q50 0 50 50 Q50 100 100 100" stroke="currentColor" strokeWidth="0.8" fill="none" opacity="0.6" />
    <circle cx="30" cy="30" r="3" fill="currentColor" opacity="0.7" />
    <circle cx="60" cy="60" r="2" fill="currentColor" opacity="0.5" />
  </svg>
)

// Crescent and star
const CrescentStar = ({ className = "", size = 40 }: { className?: string; size?: number }) => (
  <svg viewBox="0 0 100 100" width={size} height={size} className={className} fill="none">
    <path d="M65 50 A 30 30 0 1 1 65 49.9 A 22 22 0 1 0 65 50 Z" fill="currentColor" />
    <path d="M30 30 L33 38 L41 38 L35 43 L37 51 L30 46 L23 51 L25 43 L19 38 L27 38 Z" fill="currentColor" />
  </svg>
)

// Lantern (fanous)
const Lantern = ({ className = "", size = 50 }: { className?: string; size?: number }) => (
  <svg viewBox="0 0 60 100" width={size} height={size * 1.6} className={className} fill="none">
    <line x1="30" y1="0" x2="30" y2="15" stroke="currentColor" strokeWidth="1.2" />
    <path d="M20 15 L40 15 L40 22 L20 22 Z" fill="currentColor" opacity="0.8" />
    <path
      d="M15 22 Q15 35 18 50 Q21 65 30 75 Q39 65 42 50 Q45 35 45 22 Z"
      stroke="currentColor"
      strokeWidth="1.2"
      fill="none"
    />
    <path d="M22 30 L28 30 M32 30 L38 30" stroke="currentColor" strokeWidth="0.8" />
    <path d="M20 40 L40 40" stroke="currentColor" strokeWidth="0.8" />
    <path d="M22 50 L28 50 M32 50 L38 50" stroke="currentColor" strokeWidth="0.8" />
    <circle cx="30" cy="40" r="4" fill="currentColor" opacity="0.4" />
    <path d="M25 75 L35 75 L33 82 L27 82 Z" fill="currentColor" opacity="0.7" />
    <line x1="30" y1="82" x2="30" y2="92" stroke="currentColor" strokeWidth="1" />
    <circle cx="30" cy="95" r="3" fill="currentColor" />
  </svg>
)

// Mosque dome
const Dome = ({ className = "", size = 80 }: { className?: string; size?: number }) => (
  <svg viewBox="0 0 100 80" width={size} height={size * 0.8} className={className} fill="none">
    <line x1="50" y1="0" x2="50" y2="10" stroke="currentColor" strokeWidth="1.5" />
    <circle cx="50" cy="13" r="3" fill="currentColor" />
    <path d="M20 80 L20 50 Q20 20 50 20 Q80 20 80 50 L80 80" stroke="currentColor" strokeWidth="1.5" fill="none" />
    <path d="M20 80 L80 80" stroke="currentColor" strokeWidth="1.5" />
    <path
      d="M30 80 L30 60 Q30 50 35 50 Q40 50 40 60 L40 80"
      stroke="currentColor"
      strokeWidth="1"
      fill="none"
      opacity="0.6"
    />
    <path
      d="M60 80 L60 60 Q60 50 65 50 Q70 50 70 60 L70 80"
      stroke="currentColor"
      strokeWidth="1"
      fill="none"
      opacity="0.6"
    />
  </svg>
)

// Minaret
const Minaret = ({ className = "", size = 100 }: { className?: string; size?: number }) => (
  <svg viewBox="0 0 40 200" width={size * 0.2} height={size} className={className} fill="none">
    <line x1="20" y1="0" x2="20" y2="10" stroke="currentColor" strokeWidth="1.5" />
    <circle cx="20" cy="14" r="3" fill="currentColor" />
    <path d="M14 18 Q14 30 20 35 Q26 30 26 18 Z" stroke="currentColor" strokeWidth="1.2" fill="none" />
    <path d="M12 35 L28 35 L28 40 L12 40 Z" stroke="currentColor" strokeWidth="1.2" fill="none" />
    <path d="M14 40 L14 80" stroke="currentColor" strokeWidth="1.2" />
    <path d="M26 40 L26 80" stroke="currentColor" strokeWidth="1.2" />
    <path d="M14 80 L14 85 L26 85 L26 80" stroke="currentColor" strokeWidth="1.2" fill="none" />
    <path d="M16 85 L16 180 L24 180 L24 85" stroke="currentColor" strokeWidth="1.2" fill="none" />
    <path d="M12 180 L28 180 L28 200 L12 200 Z" stroke="currentColor" strokeWidth="1.5" fill="none" />
    <line x1="16" y1="100" x2="24" y2="100" stroke="currentColor" strokeWidth="0.8" />
    <line x1="16" y1="120" x2="24" y2="120" stroke="currentColor" strokeWidth="0.8" />
    <line x1="16" y1="140" x2="24" y2="140" stroke="currentColor" strokeWidth="0.8" />
    <line x1="16" y1="160" x2="24" y2="160" stroke="currentColor" strokeWidth="0.8" />
  </svg>
)

// Open Quran book
const QuranBook = ({ className = "", size = 80 }: { className?: string; size?: number }) => (
  <svg viewBox="0 0 100 80" width={size} height={size * 0.8} className={className} fill="none">
    <path
      d="M10 20 Q30 15 48 20 L48 70 Q30 65 10 70 Z"
      stroke="currentColor"
      strokeWidth="1.5"
      fill="none"
    />
    <path
      d="M52 20 Q70 15 90 20 L90 70 Q70 65 52 70 Z"
      stroke="currentColor"
      strokeWidth="1.5"
      fill="none"
    />
    <line x1="48" y1="20" x2="48" y2="70" stroke="currentColor" strokeWidth="1" />
    <line x1="52" y1="20" x2="52" y2="70" stroke="currentColor" strokeWidth="1" />
    <path d="M16 30 L42 30 M16 38 L42 38 M16 46 L42 46 M16 54 L42 54" stroke="currentColor" strokeWidth="0.6" opacity="0.5" />
    <path d="M58 30 L84 30 M58 38 L84 38 M58 46 L84 46 M58 54 L84 54" stroke="currentColor" strokeWidth="0.6" opacity="0.5" />
  </svg>
)

// Tessellation pattern (Islamic geometric tile)
const TessellationTile = ({ className = "", size = 60 }: { className?: string; size?: number }) => (
  <svg viewBox="0 0 100 100" width={size} height={size} className={className} fill="none">
    <path
      d="M50 0 L93 25 L93 75 L50 100 L7 75 L7 25 Z"
      stroke="currentColor"
      strokeWidth="1"
      fill="none"
    />
    <path d="M50 20 L75 35 L75 65 L50 80 L25 65 L25 35 Z" stroke="currentColor" strokeWidth="0.8" fill="none" />
    <path d="M50 0 L50 20 M93 25 L75 35 M93 75 L75 65 M50 100 L50 80 M7 75 L25 65 M7 25 L25 35" stroke="currentColor" strokeWidth="0.5" />
    <circle cx="50" cy="50" r="8" stroke="currentColor" strokeWidth="0.6" fill="none" />
  </svg>
)

// Ornamental divider
const OrnamentalDivider = ({ className = "" }: { className?: string }) => (
  <div className={`flex items-center gap-3 ${className}`}>
    <div className="flex-1 h-px bg-gradient-to-l from-transparent via-current to-transparent opacity-30" />
    <IslamicStar8 size={20} />
    <div className="w-1.5 h-1.5 rounded-full bg-current opacity-60" />
    <IslamicStar8 size={28} />
    <div className="w-1.5 h-1.5 rounded-full bg-current opacity-60" />
    <IslamicStar8 size={20} />
    <div className="flex-1 h-px bg-gradient-to-r from-transparent via-current to-transparent opacity-30" />
  </div>
)

// Geometric pattern background
const GeometricPattern = ({ className = "" }: { className?: string }) => (
  <svg className={className} width="100%" height="100%">
    <defs>
      <pattern id="islamic-pattern" x="0" y="0" width="80" height="80" patternUnits="userSpaceOnUse">
        <path
          d="M40 0 L48 24 L72 32 L48 40 L40 64 L32 40 L8 32 L32 24 Z"
          stroke="currentColor"
          strokeWidth="0.5"
          fill="none"
          opacity="0.4"
        />
        <circle cx="40" cy="32" r="3" fill="currentColor" opacity="0.2" />
      </pattern>
    </defs>
    <rect width="100%" height="100%" fill="url(#islamic-pattern)" />
  </svg>
)

/* ============================================================
 * Floating object wrapper
 * ============================================================ */
const FloatingObject = ({
  children,
  className = "",
  delay = 0,
  duration = 8,
  amplitude = 20,
  rotate = true,
}: {
  children: React.ReactNode
  className?: string
  delay?: number
  duration?: number
  amplitude?: number
  rotate?: boolean
}) => (
  <motion.div
    className={`pointer-events-none absolute ${className}`}
    animate={{
      y: [-amplitude, amplitude, -amplitude],
      ...(rotate ? { rotate: [0, 5, -5, 0] } : {}),
    }}
    transition={{
      duration,
      delay,
      repeat: Infinity,
      ease: "easeInOut",
    }}
  >
    {children}
  </motion.div>
)

/* ============================================================
 * Counter
 * ============================================================ */
const Counter = ({ end, suffix = "", color = "currentColor" }: { end: number; suffix?: string; color?: string }) => {
  const ref = useRef<HTMLSpanElement>(null)
  const inView = useInView(ref, { once: true, margin: "-50px" })
  const [val, setVal] = useState(0)

  useEffect(() => {
    if (!inView) return
    const start = performance.now()
    let raf = 0
    const step = (t: number) => {
      const p = Math.min((t - start) / 2000, 1)
      const eased = 1 - Math.pow(1 - p, 3)
      setVal(Math.floor(eased * end))
      if (p < 1) raf = requestAnimationFrame(step)
    }
    raf = requestAnimationFrame(step)
    return () => cancelAnimationFrame(raf)
  }, [inView, end])

  return (
    <>
      <span ref={ref} className="tabular-nums">
        {val.toLocaleString("ar-EG")}
      </span>
      {suffix && <span style={{ color }}>{suffix}</span>}
    </>
  )
}

/* ============================================================
 * Reveal on scroll
 * ============================================================ */
const Reveal = ({
  children,
  delay = 0,
  className = "",
}: {
  children: React.ReactNode
  delay?: number
  className?: string
}) => (
  <motion.div
    initial={{ opacity: 0, y: 40 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, margin: "-100px" }}
    transition={{ duration: 0.8, delay, ease: [0.25, 0.1, 0.25, 1] }}
    className={className}
  >
    {children}
  </motion.div>
)

/* ============================================================
 * Magnetic button
 * ============================================================ */
const MagneticButton = ({
  children,
  href,
  className = "",
  style = {},
}: {
  children: React.ReactNode
  href: string
  className?: string
  style?: React.CSSProperties
}) => {
  const ref = useRef<HTMLAnchorElement>(null)
  const x = useMotionValue(0)
  const y = useMotionValue(0)
  const xS = useSpring(x, { stiffness: 200, damping: 20 })
  const yS = useSpring(y, { stiffness: 200, damping: 20 })

  return (
    <motion.a
      ref={ref}
      href={href}
      onMouseMove={(e) => {
        if (!ref.current) return
        const rect = ref.current.getBoundingClientRect()
        x.set((e.clientX - rect.left - rect.width / 2) * 0.2)
        y.set((e.clientY - rect.top - rect.height / 2) * 0.2)
      }}
      onMouseLeave={() => {
        x.set(0)
        y.set(0)
      }}
      style={{ x: xS, y: yS, ...style }}
      className={className}
    >
      {children}
    </motion.a>
  )
}

/* ============================================================
 * MAIN PAGE
 * ============================================================ */
export default function HomePage() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const heroRef = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  })
  const heroY = useTransform(scrollYProgress, [0, 1], [0, 200])
  const heroOpacity = useTransform(scrollYProgress, [0, 0.8], [1, 0])

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50)
    window.addEventListener("scroll", onScroll)
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  return (
    <div className="min-h-screen bg-[#FBF8F3] text-[#1a1a1a] overflow-x-hidden font-sans" dir="rtl">
      {/* ============================================================ */}
      {/* HEADER */}
      {/* ============================================================ */}
      <motion.header
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className={`fixed top-0 inset-x-0 z-50 transition-all duration-500 ${
          scrolled ? "bg-[#FBF8F3]/85 backdrop-blur-xl border-b border-[#1E3A5F]/10" : "bg-transparent"
        }`}
      >
        <div className="container mx-auto px-6 lg:px-12">
          <div className="flex items-center justify-between h-20">
            <Link href="/" className="flex items-center gap-3 group">
              <div className="relative w-11 h-11">
                <motion.div
                  className="absolute inset-0 text-[#1E3A5F]"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
                >
                  <IslamicStar8 size={44} />
                </motion.div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-base font-bold text-[#1E3A5F]">إ</span>
                </div>
              </div>
              <div>
                <div className="text-lg font-bold tracking-tight">إتقان</div>
                <div className="text-[10px] text-[#1a1a1a]/50 tracking-widest font-sans">ITQAN</div>
              </div>
            </Link>

            <nav className="hidden lg:flex items-center gap-10">
              {[
                { label: "الأكاديمية", href: "#academy" },
                { label: "المقرأة", href: "#maqraa" },
                { label: "المميزات", href: "#features" },
                { label: "آراء الطلاب", href: "#testimonials" },
                { label: "تواصل", href: "/contact" },
              ].map((item, i) => (
                <motion.div
                  key={item.label}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 * i }}
                >
                  <Link href={item.href} className="relative text-sm hover:text-[#1E3A5F] transition-colors group">
                    {item.label}
                    <span className="absolute -bottom-1 right-0 w-0 h-px bg-[#C9A962] group-hover:w-full transition-all duration-300" />
                  </Link>
                </motion.div>
              ))}
            </nav>

            <div className="hidden lg:flex items-center gap-3">
              <Link
                href="/login"
                className="text-sm hover:text-[#1E3A5F] transition-colors"
              >
                تسجيل الدخول
              </Link>
              <Link
                href="/register"
                className="group relative inline-flex items-center gap-2 bg-[#1E3A5F] text-white px-5 h-11 rounded-full text-sm font-medium overflow-hidden"
              >
                <span className="relative z-10">انضم إلينا</span>
                <ArrowLeft className="relative z-10 w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                <span className="absolute inset-0 bg-[#0D5A3C] translate-x-full group-hover:translate-x-0 transition-transform duration-500" />
              </Link>
            </div>

            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="lg:hidden w-10 h-10 flex items-center justify-center"
              aria-label="القائمة"
            >
              {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        <AnimatePresence>
          {menuOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="lg:hidden bg-[#FBF8F3] border-t border-[#1E3A5F]/10 overflow-hidden"
            >
              <div className="container mx-auto px-6 py-6 space-y-4">
                {[
                  { label: "الأكاديمية", href: "#academy" },
                  { label: "المقرأة", href: "#maqraa" },
                  { label: "المميزات", href: "#features" },
                  { label: "آراء الطلاب", href: "#testimonials" },
                ].map((item) => (
                  <Link
                    key={item.label}
                    href={item.href}
                    onClick={() => setMenuOpen(false)}
                    className="block py-2 text-base"
                  >
                    {item.label}
                  </Link>
                ))}
                <div className="pt-4 flex gap-3 border-t border-[#1E3A5F]/10">
                  <Link
                    href="/login"
                    className="flex-1 h-11 flex items-center justify-center border border-[#1E3A5F]/20 rounded-full text-sm"
                  >
                    تسجيل الدخول
                  </Link>
                  <Link
                    href="/register"
                    className="flex-1 h-11 flex items-center justify-center bg-[#1E3A5F] text-white rounded-full text-sm"
                  >
                    انضم إلينا
                  </Link>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.header>

      {/* ============================================================ */}
      {/* HERO */}
      {/* ============================================================ */}
      <section
        ref={heroRef}
        className="relative min-h-screen flex items-center justify-center pt-32 pb-20 overflow-hidden"
      >
        {/* Geometric backdrop */}
        <div className="absolute inset-0 text-[#1E3A5F]/[0.04] pointer-events-none">
          <GeometricPattern className="absolute inset-0" />
        </div>

        {/* Floating Islamic Objects */}
        <FloatingObject className="top-32 right-[8%] text-[#1E3A5F]/15" delay={0} duration={10}>
          <IslamicStar12 size={120} />
        </FloatingObject>
        <FloatingObject className="top-40 left-[10%] text-[#0D5A3C]/15" delay={2} duration={12}>
          <IslamicStar8 size={80} />
        </FloatingObject>
        <FloatingObject className="bottom-32 right-[15%] text-[#C9A962]/30" delay={4} duration={11}>
          <CrescentStar size={70} />
        </FloatingObject>
        <FloatingObject className="bottom-40 left-[12%] text-[#1E3A5F]/10" delay={1} duration={9}>
          <Lantern size={60} />
        </FloatingObject>
        <FloatingObject className="top-[45%] right-[3%] text-[#0D5A3C]/10" delay={3} duration={13}>
          <Dome size={90} />
        </FloatingObject>
        <FloatingObject className="top-[40%] left-[3%] text-[#C9A962]/20" delay={2.5} duration={10}>
          <IslamicStar8 size={50} />
        </FloatingObject>
        <FloatingObject className="top-[20%] left-[25%] text-[#1E3A5F]/10" delay={1.5} duration={14}>
          <TessellationTile size={70} />
        </FloatingObject>
        <FloatingObject className="bottom-[25%] right-[28%] text-[#0D5A3C]/15" delay={3.5} duration={12}>
          <QuranBook size={70} />
        </FloatingObject>

        {/* Decorative arches on sides */}
        <div className="hidden lg:block absolute top-[15%] right-[2%] w-32 h-48 text-[#1E3A5F]/10 pointer-events-none">
          <MihrabArch />
        </div>
        <div className="hidden lg:block absolute top-[15%] left-[2%] w-32 h-48 text-[#0D5A3C]/10 pointer-events-none">
          <MihrabArch />
        </div>

        {/* Bismillah ornament floating top */}
        <motion.div
          className="absolute top-[10%] left-1/2 -translate-x-1/2 text-7xl md:text-9xl text-[#C9A962]/[0.08] select-none pointer-events-none"
          animate={{ y: [0, -10, 0], opacity: [0.4, 0.6, 0.4] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
        >
          ﷽
        </motion.div>

        <motion.div
          style={{ y: heroY, opacity: heroOpacity }}
          className="container mx-auto px-6 lg:px-12 relative z-10"
        >
          <div className="max-w-5xl mx-auto text-center">
            {/* Badge */}
            <Reveal>
              <div className="inline-flex items-center gap-3 mb-10">
                <div className="h-px w-12 bg-[#C9A962]" />
                <div className="flex items-center gap-2 text-[#C9A962]">
                  <IslamicStar8 size={16} />
                  <span className="text-xs tracking-[0.3em] uppercase font-medium font-sans">
                    منصة قرآنية متكاملة
                  </span>
                  <IslamicStar8 size={16} />
                </div>
                <div className="h-px w-12 bg-[#C9A962]" />
              </div>
            </Reveal>

            {/* Main heading */}
            <Reveal delay={0.1}>
              <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-[5.5rem] leading-[1.1] tracking-tight">
                <span className="block text-[#1a1a1a]">رحلتك مع كتاب الله</span>
                <span className="block mt-3">
                  بين{" "}
                  <span className="relative inline-block">
                    <span className="relative z-10 text-[#1E3A5F] italic">الأكاديمية</span>
                    <motion.span
                      initial={{ scaleX: 0 }}
                      animate={{ scaleX: 1 }}
                      transition={{ delay: 0.8, duration: 1, ease: "easeOut" }}
                      className="absolute bottom-1 right-0 left-0 h-2 bg-[#C9A962]/30 origin-right -z-0"
                    />
                  </span>{" "}
                  <span className="text-[#1a1a1a]/40">و</span>{" "}
                  <span className="relative inline-block">
                    <span className="relative z-10 text-[#0D5A3C] italic">المقرأة</span>
                    <motion.span
                      initial={{ scaleX: 0 }}
                      animate={{ scaleX: 1 }}
                      transition={{ delay: 1.1, duration: 1, ease: "easeOut" }}
                      className="absolute bottom-1 right-0 left-0 h-2 bg-[#C9A962]/30 origin-right -z-0"
                    />
                  </span>
                </span>
              </h1>
            </Reveal>

            {/* Subtitle */}
            <Reveal delay={0.3}>
              <p className="mt-10 text-lg md:text-xl text-[#1a1a1a]/70 max-w-2xl mx-auto leading-relaxed font-sans">
                منصة تعليمية أصيلة تجمع بين عراقة العلوم الشرعية ودقة التسميع والإتقان، مع نخبة من العلماء والمقرئين
                المجازين.
              </p>
            </Reveal>

            {/* CTAs */}
            <Reveal delay={0.5}>
              <div className="mt-12 flex flex-col sm:flex-row items-center justify-center gap-4">
                <MagneticButton
                  href="/academy/student"
                  className="group relative inline-flex items-center gap-3 px-8 h-14 rounded-full font-medium bg-[#1E3A5F] text-white overflow-hidden"
                >
                  <GraduationCap className="w-5 h-5 relative z-10" />
                  <span className="relative z-10">ادخل الأكاديمية</span>
                  <ArrowLeft className="w-4 h-4 relative z-10 group-hover:-translate-x-1 transition-transform" />
                  <span className="absolute inset-0 bg-[#0D5A3C] translate-x-full group-hover:translate-x-0 transition-transform duration-500" />
                </MagneticButton>
                <MagneticButton
                  href="/student"
                  className="group inline-flex items-center gap-3 px-8 h-14 rounded-full font-medium bg-white border-2 border-[#1a1a1a] text-[#1a1a1a] hover:bg-[#1a1a1a] hover:text-white transition-colors"
                >
                  <BookOpen className="w-5 h-5" />
                  ادخل المقرأة
                  <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                </MagneticButton>
              </div>
            </Reveal>

            <Reveal delay={0.7}>
              <div className="mt-8">
                <Link
                  href="/register"
                  className="text-sm text-[#1a1a1a]/60 hover:text-[#1E3A5F] underline underline-offset-4 font-sans"
                >
                  لا تملك حساباً؟ سجّل الآن مجاناً
                </Link>
              </div>
            </Reveal>

            <Reveal delay={0.9}>
              <div className="mt-20 max-w-md mx-auto text-[#C9A962]">
                <OrnamentalDivider />
              </div>
            </Reveal>
          </div>
        </motion.div>

        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-[#1a1a1a]/40"
        >
          <div className="text-[10px] tracking-widest uppercase font-sans">اكتشف</div>
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="w-px h-10 bg-[#1a1a1a]/30"
          />
        </motion.div>
      </section>

      {/* ============================================================ */}
      {/* STATS BAR */}
      {/* ============================================================ */}
      <section className="relative py-16 bg-[#1E3A5F] text-white overflow-hidden">
        <div className="absolute inset-0 text-white/5 pointer-events-none">
          <GeometricPattern className="absolute inset-0" />
        </div>

        <FloatingObject className="top-4 right-[10%] text-[#C9A962]/30" delay={0} duration={8} amplitude={10}>
          <IslamicStar8 size={40} />
        </FloatingObject>
        <FloatingObject className="bottom-4 left-[15%] text-[#C9A962]/30" delay={2} duration={10} amplitude={8}>
          <IslamicStar8 size={32} />
        </FloatingObject>
        <FloatingObject className="top-1/2 right-[40%] text-[#C9A962]/20" delay={1} duration={9} amplitude={6}>
          <CrescentStar size={28} />
        </FloatingObject>

        <div className="container mx-auto px-6 lg:px-12 relative z-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-4">
            {[
              { end: 12500, label: "طالب وطالبة", suffix: "+" },
              { end: 350, label: "معلم ومقرئ", suffix: "+" },
              { end: 180, label: "دورة معتمدة", suffix: "+" },
              { end: 98, label: "نسبة الإتقان", suffix: "%" },
            ].map((stat, i) => (
              <Reveal key={i} delay={i * 0.1}>
                <div className="text-center text-white">
                  <div className="flex items-baseline justify-center gap-1">
                    <span className="text-4xl md:text-5xl font-bold">
                      <Counter end={stat.end} suffix={stat.suffix} color="#C9A962" />
                    </span>
                  </div>
                  <div className="mt-2 text-sm text-white/70 font-sans">{stat.label}</div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* ACADEMY SECTION */}
      {/* ============================================================ */}
      <section id="academy" className="relative py-32 md:py-40 overflow-hidden bg-[#FBF8F3]">
        <FloatingObject className="top-20 left-[5%] text-[#1E3A5F]/10" delay={0} duration={11}>
          <IslamicStar12 size={100} />
        </FloatingObject>
        <FloatingObject className="bottom-20 right-[5%] text-[#1E3A5F]/10" delay={3} duration={13}>
          <Dome size={120} />
        </FloatingObject>
        <FloatingObject className="top-[40%] right-[42%] text-[#C9A962]/20" delay={2} duration={10}>
          <TessellationTile size={50} />
        </FloatingObject>

        <div className="container mx-auto px-6 lg:px-12 relative">
          <div className="grid lg:grid-cols-12 gap-12 items-center">
            {/* Visual side */}
            <div className="lg:col-span-5 lg:order-2">
              <Reveal>
                <div className="relative aspect-[4/5] rounded-3xl overflow-hidden bg-gradient-to-br from-[#1E3A5F] to-[#0F2440] shadow-2xl shadow-[#1E3A5F]/20">
                  <div className="absolute inset-0 text-[#C9A962]/15">
                    <GeometricPattern className="absolute inset-0" />
                  </div>

                  {/* Decorative arches */}
                  <div className="absolute top-0 right-0 left-0 h-2/3 text-[#C9A962]/30">
                    <svg
                      viewBox="0 0 400 500"
                      className="w-full h-full"
                      fill="none"
                      preserveAspectRatio="none"
                    >
                      <path
                        d="M50 500 L50 200 Q50 50 200 50 Q350 50 350 200 L350 500"
                        stroke="currentColor"
                        strokeWidth="2"
                        fill="none"
                      />
                      <path
                        d="M80 500 L80 220 Q80 80 200 80 Q320 80 320 220 L320 500"
                        stroke="currentColor"
                        strokeWidth="1"
                        fill="none"
                        opacity="0.6"
                      />
                    </svg>
                  </div>

                  {/* Center icon */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
                      className="absolute text-[#C9A962]/40"
                    >
                      <IslamicStar8 size={280} />
                    </motion.div>
                    <motion.div
                      animate={{ rotate: -360 }}
                      transition={{ duration: 80, repeat: Infinity, ease: "linear" }}
                      className="absolute text-[#C9A962]/30"
                    >
                      <IslamicStar12 size={180} />
                    </motion.div>
                    <div className="relative z-10 w-24 h-24 rounded-full bg-[#C9A962] flex items-center justify-center shadow-2xl">
                      <GraduationCap className="w-11 h-11 text-[#1E3A5F]" />
                    </div>
                  </div>

                  {/* Floating book */}
                  <FloatingObject
                    className="bottom-12 right-12 text-[#C9A962]/60"
                    delay={0}
                    duration={8}
                    amplitude={10}
                  >
                    <QuranBook size={50} />
                  </FloatingObject>

                  {/* Corner ornaments */}
                  <div className="absolute top-4 right-4 w-12 h-12 text-[#C9A962]/40">
                    <ArabesqueCorner />
                  </div>
                  <div className="absolute top-4 left-4 w-12 h-12 text-[#C9A962]/40 -scale-x-100">
                    <ArabesqueCorner />
                  </div>
                  <div className="absolute bottom-4 right-4 w-12 h-12 text-[#C9A962]/40 -scale-y-100">
                    <ArabesqueCorner />
                  </div>
                  <div className="absolute bottom-4 left-4 w-12 h-12 text-[#C9A962]/40 -scale-100">
                    <ArabesqueCorner />
                  </div>

                  <motion.div
                    animate={{ y: [-5, 5, -5] }}
                    transition={{ duration: 4, repeat: Infinity }}
                    className="absolute top-6 left-1/2 -translate-x-1/2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white text-xs tracking-wider font-sans"
                  >
                    الأكاديمية القرآنية
                  </motion.div>
                </div>
              </Reveal>
            </div>

            {/* Text side */}
            <div className="lg:col-span-7 lg:order-1">
              <Reveal delay={0.1}>
                <div className="flex items-center gap-3 text-[#1E3A5F] mb-6">
                  <div className="h-px w-10 bg-[#1E3A5F]" />
                  <IslamicStar8 size={14} />
                  <span className="text-xs tracking-[0.3em] uppercase font-medium font-sans">المنصة الأولى</span>
                </div>
              </Reveal>

              <Reveal delay={0.2}>
                <h2 className="text-4xl md:text-5xl lg:text-6xl leading-tight tracking-tight">
                  <span className="text-[#1E3A5F]">الأكاديمية</span>
                  <br />
                  <span className="italic text-[#1a1a1a]/70 text-3xl md:text-4xl lg:text-5xl">
                    للعلوم الشرعية
                  </span>
                </h2>
              </Reveal>

              <Reveal delay={0.3}>
                <p className="mt-6 text-lg text-[#1a1a1a]/70 leading-relaxed max-w-xl font-sans">
                  دورات منهجية متكاملة في علوم القرآن والتجويد والقراءات والفقه، تُدرَّس على يد كبار العلماء مع شهادات
                  معتمدة وإجازات بالسند المتصل.
                </p>
              </Reveal>

              <Reveal delay={0.4}>
                <ul className="mt-8 space-y-4">
                  {[
                    { icon: BookOpen, text: "دورات في التجويد والقراءات العشر" },
                    { icon: Award, text: "شهادات وإجازات بالسند المتصل" },
                    { icon: Users, text: "حلقات حية بالفيديو مع الأساتذة" },
                    { icon: Calendar, text: "متابعة يومية ومسارات متدرجة" },
                  ].map((item, i) => (
                    <motion.li
                      key={i}
                      initial={{ opacity: 0, x: 20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: 0.5 + i * 0.1 }}
                      className="flex items-center gap-4"
                    >
                      <div className="relative w-10 h-10 flex-shrink-0">
                        <div className="absolute inset-0 text-[#C9A962]">
                          <IslamicStar8 size={40} />
                        </div>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <item.icon className="w-4 h-4 text-[#1E3A5F]" />
                        </div>
                      </div>
                      <span className="text-[#1a1a1a]/80 font-sans">{item.text}</span>
                    </motion.li>
                  ))}
                </ul>
              </Reveal>

              <Reveal delay={0.7}>
                <div className="mt-10 flex flex-wrap gap-4 items-center">
                  <Link
                    href="/academy/student"
                    className="group inline-flex items-center gap-3 bg-[#1E3A5F] text-white px-7 h-13 py-4 rounded-full text-sm font-medium transition-all hover:shadow-2xl hover:shadow-[#1E3A5F]/30"
                  >
                    دخول الأكاديمية
                    <span className="w-7 h-7 rounded-full bg-white/15 flex items-center justify-center group-hover:bg-[#C9A962] group-hover:text-[#1E3A5F] transition-all">
                      <ArrowLeft className="w-3.5 h-3.5" />
                    </span>
                  </Link>
                  <Link
                    href="/academy/student/courses"
                    className="inline-flex items-center gap-2 text-[#1E3A5F] px-2 h-13 py-4 text-sm font-medium border-b-2 border-[#1E3A5F]/20 hover:border-[#1E3A5F] transition-colors"
                  >
                    استكشف الدورات
                  </Link>
                </div>
              </Reveal>
            </div>
          </div>
        </div>
      </section>

      {/* Divider */}
      <div className="container mx-auto px-6 lg:px-12 py-8 text-[#C9A962]">
        <OrnamentalDivider className="max-w-2xl mx-auto" />
      </div>

      {/* ============================================================ */}
      {/* MAQRA'A SECTION */}
      {/* ============================================================ */}
      <section id="maqraa" className="relative py-32 md:py-40 overflow-hidden bg-[#0D5A3C] text-white">
        <div className="absolute inset-0 text-white/5 pointer-events-none">
          <GeometricPattern className="absolute inset-0" />
        </div>

        <FloatingObject className="top-20 right-[5%] text-[#C9A962]/30" delay={0} duration={11}>
          <CrescentStar size={80} />
        </FloatingObject>
        <FloatingObject className="bottom-20 left-[5%] text-[#C9A962]/20" delay={3} duration={13}>
          <Lantern size={70} />
        </FloatingObject>
        <FloatingObject className="top-[40%] left-[8%] text-[#C9A962]/15" delay={2} duration={10}>
          <IslamicStar12 size={90} />
        </FloatingObject>
        <FloatingObject className="top-[15%] left-[40%] text-[#C9A962]/15" delay={1} duration={12}>
          <TessellationTile size={60} />
        </FloatingObject>

        {/* Side minarets (decoration) */}
        <div className="hidden lg:block absolute top-[20%] right-[1%] text-[#C9A962]/15 pointer-events-none">
          <Minaret size={300} />
        </div>
        <div className="hidden lg:block absolute top-[20%] left-[1%] text-[#C9A962]/15 pointer-events-none">
          <Minaret size={300} />
        </div>

        <div className="container mx-auto px-6 lg:px-12 relative">
          <div className="grid lg:grid-cols-12 gap-12 items-center">
            {/* Visual side */}
            <div className="lg:col-span-5">
              <Reveal>
                <div className="relative aspect-[4/5] rounded-3xl overflow-hidden bg-gradient-to-br from-[#0A4A30] to-[#062D1D] shadow-2xl border border-[#C9A962]/20">
                  <div className="absolute inset-0 text-[#C9A962]/15">
                    <GeometricPattern className="absolute inset-0" />
                  </div>

                  {/* Decorative dome at top */}
                  <div className="absolute top-0 inset-x-0 h-1/2 flex items-end justify-center text-[#C9A962]/30 pb-8">
                    <Dome size={200} />
                  </div>

                  {/* Center icon */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 90, repeat: Infinity, ease: "linear" }}
                      className="absolute text-[#C9A962]/30"
                    >
                      <IslamicStar12 size={300} />
                    </motion.div>
                    <motion.div
                      animate={{ rotate: -360 }}
                      transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
                      className="absolute text-[#C9A962]/40"
                    >
                      <IslamicStar8 size={200} />
                    </motion.div>
                    <div className="relative z-10 w-24 h-24 rounded-full bg-[#C9A962] flex items-center justify-center shadow-2xl">
                      <Mic className="w-10 h-10 text-[#0D5A3C]" />
                    </div>
                  </div>

                  {/* Floating lantern */}
                  <FloatingObject
                    className="bottom-12 left-8 text-[#C9A962]/60"
                    delay={1}
                    duration={7}
                    amplitude={10}
                    rotate={false}
                  >
                    <Lantern size={50} />
                  </FloatingObject>

                  <div className="absolute top-4 right-4 w-12 h-12 text-[#C9A962]/40">
                    <ArabesqueCorner />
                  </div>
                  <div className="absolute top-4 left-4 w-12 h-12 text-[#C9A962]/40 -scale-x-100">
                    <ArabesqueCorner />
                  </div>
                  <div className="absolute bottom-4 right-4 w-12 h-12 text-[#C9A962]/40 -scale-y-100">
                    <ArabesqueCorner />
                  </div>
                  <div className="absolute bottom-4 left-4 w-12 h-12 text-[#C9A962]/40 -scale-100">
                    <ArabesqueCorner />
                  </div>

                  <motion.div
                    animate={{ y: [-5, 5, -5] }}
                    transition={{ duration: 4, repeat: Infinity }}
                    className="absolute top-6 left-1/2 -translate-x-1/2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white text-xs tracking-wider font-sans"
                  >
                    المقرأة الإلكترونية
                  </motion.div>
                </div>
              </Reveal>
            </div>

            {/* Text */}
            <div className="lg:col-span-7">
              <Reveal delay={0.1}>
                <div className="flex items-center gap-3 text-[#C9A962] mb-6">
                  <div className="h-px w-10 bg-[#C9A962]" />
                  <IslamicStar8 size={14} />
                  <span className="text-xs tracking-[0.3em] uppercase font-medium font-sans">المنصة الثانية</span>
                </div>
              </Reveal>

              <Reveal delay={0.2}>
                <h2 className="text-4xl md:text-5xl lg:text-6xl leading-tight tracking-tight">
                  <span className="text-white">المقرأة</span>
                  <br />
                  <span className="italic text-white/70 text-3xl md:text-4xl lg:text-5xl">الإلكترونية</span>
                </h2>
              </Reveal>

              <Reveal delay={0.3}>
                <p className="mt-6 text-lg text-white/80 leading-relaxed max-w-xl font-sans">
                  حلقات تسميع مباشرة وتفاعلية مع نخبة من المقرئين المجازين، سجّل تلاوتك واحصل على تقييم وتصحيح فوري في
                  أي وقت تشاء.
                </p>
              </Reveal>

              <Reveal delay={0.4}>
                <ul className="mt-8 space-y-4">
                  {[
                    { icon: Mic, text: "حلقات تسميع مباشرة بالصوت" },
                    { icon: Heart, text: "مقرئون معتمدون بالسند" },
                    { icon: Sparkles, text: "تصحيح وتقييم فوري للتلاوة" },
                    { icon: Star, text: "متابعة دقيقة لتقدم الحفظ" },
                  ].map((item, i) => (
                    <motion.li
                      key={i}
                      initial={{ opacity: 0, x: 20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: 0.5 + i * 0.1 }}
                      className="flex items-center gap-4"
                    >
                      <div className="relative w-10 h-10 flex-shrink-0">
                        <div className="absolute inset-0 text-[#C9A962]">
                          <IslamicStar8 size={40} />
                        </div>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <item.icon className="w-4 h-4 text-white" />
                        </div>
                      </div>
                      <span className="text-white/90 font-sans">{item.text}</span>
                    </motion.li>
                  ))}
                </ul>
              </Reveal>

              <Reveal delay={0.7}>
                <div className="mt-10 flex flex-wrap gap-4 items-center">
                  <Link
                    href="/student"
                    className="group inline-flex items-center gap-3 bg-[#C9A962] text-[#0D5A3C] px-7 h-13 py-4 rounded-full text-sm font-medium transition-all hover:shadow-2xl hover:shadow-[#C9A962]/30"
                  >
                    دخول المقرأة
                    <span className="w-7 h-7 rounded-full bg-[#0D5A3C]/15 flex items-center justify-center group-hover:bg-[#0D5A3C] group-hover:text-[#C9A962] transition-all">
                      <ArrowLeft className="w-3.5 h-3.5" />
                    </span>
                  </Link>
                  <Link
                    href="/student/booking"
                    className="inline-flex items-center gap-2 text-[#C9A962] px-2 h-13 py-4 text-sm font-medium border-b-2 border-[#C9A962]/30 hover:border-[#C9A962] transition-colors"
                  >
                    احجز موعداً
                  </Link>
                </div>
              </Reveal>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* FEATURES BENTO */}
      {/* ============================================================ */}
      <section id="features" className="relative py-32 md:py-40 overflow-hidden bg-[#FBF8F3]">
        <FloatingObject className="top-20 right-[5%] text-[#1E3A5F]/8" delay={0} duration={12}>
          <IslamicStar12 size={140} />
        </FloatingObject>
        <FloatingObject className="bottom-20 left-[8%] text-[#0D5A3C]/8" delay={3} duration={11}>
          <TessellationTile size={100} />
        </FloatingObject>

        <div className="container mx-auto px-6 lg:px-12 relative">
          <Reveal>
            <div className="text-center max-w-2xl mx-auto mb-20">
              <div className="flex items-center justify-center gap-3 text-[#C9A962] mb-6">
                <div className="h-px w-10 bg-[#C9A962]" />
                <IslamicStar8 size={14} />
                <span className="text-xs tracking-[0.3em] uppercase font-medium font-sans">لماذا إتقان</span>
                <IslamicStar8 size={14} />
                <div className="h-px w-10 bg-[#C9A962]" />
              </div>
              <h2 className="text-4xl md:text-5xl lg:text-6xl leading-tight tracking-tight">
                مميزات تجعل تجربتك
                <br />
                <span className="italic text-[#1E3A5F]">استثنائية</span>
              </h2>
            </div>
          </Reveal>

          <div className="grid md:grid-cols-3 lg:grid-cols-4 gap-5">
            <Reveal className="md:col-span-2 lg:col-span-2 lg:row-span-2">
              <FeatureCard
                title="معلمون مجازون بالسند المتصل"
                description="نخبة من العلماء الحاصلين على إجازات بالسند المتصل إلى رسول الله ﷺ، يضمنون لك تعلماً صحيحاً وأصيلاً."
                icon={GraduationCap}
                size="large"
                accent="navy"
              />
            </Reveal>

            <Reveal delay={0.1}>
              <FeatureCard
                title="مرونة المواعيد"
                description="احجز جلستك في الوقت المناسب لك."
                icon={Calendar}
                accent="green"
              />
            </Reveal>

            <Reveal delay={0.2}>
              <FeatureCard
                title="تقييم فوري"
                description="نتائج وتصحيحات لحظية لتلاوتك."
                icon={Sparkles}
                accent="gold"
              />
            </Reveal>

            <Reveal delay={0.3}>
              <FeatureCard
                title="مجتمع متفاعل"
                description="انضم لآلاف الطلاب من حول العالم."
                icon={Users}
                accent="green"
              />
            </Reveal>

            <Reveal delay={0.4}>
              <FeatureCard
                title="شهادات معتمدة"
                description="وثّق إنجازاتك بشهادات رسمية."
                icon={Award}
                accent="gold"
              />
            </Reveal>

            <Reveal delay={0.5} className="md:col-span-2">
              <FeatureCard
                title="مسارات تعليمية متدرجة"
                description="من المبتدئ إلى المتقن، اختر المسار المناسب لمستواك واتبع خطة محكمة لتحقيق هدفك."
                icon={BookOpen}
                size="wide"
                accent="navy"
              />
            </Reveal>
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* TESTIMONIALS */}
      {/* ============================================================ */}
      <section id="testimonials" className="relative py-32 md:py-40 overflow-hidden bg-[#1a1a1a] text-white">
        <FloatingObject className="top-20 left-[10%] text-[#C9A962]/15" delay={0} duration={10}>
          <IslamicStar8 size={70} />
        </FloatingObject>
        <FloatingObject className="bottom-20 right-[10%] text-[#C9A962]/15" delay={3} duration={12}>
          <IslamicStar12 size={90} />
        </FloatingObject>
        <FloatingObject className="top-[40%] right-[5%] text-[#C9A962]/15" delay={2} duration={11}>
          <Lantern size={60} />
        </FloatingObject>

        <div className="container mx-auto px-6 lg:px-12 relative">
          <Reveal>
            <div className="text-center max-w-2xl mx-auto mb-20">
              <div className="flex items-center justify-center gap-3 text-[#C9A962] mb-6">
                <div className="h-px w-10 bg-[#C9A962]" />
                <IslamicStar8 size={14} />
                <span className="text-xs tracking-[0.3em] uppercase font-medium font-sans">آراء طلابنا</span>
                <IslamicStar8 size={14} />
                <div className="h-px w-10 bg-[#C9A962]" />
              </div>
              <h2 className="text-4xl md:text-5xl lg:text-6xl leading-tight tracking-tight">
                قصص نجاح
                <br />
                <span className="italic text-[#C9A962]">من قلوبهم</span>
              </h2>
            </div>
          </Reveal>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                name: "أحمد المصري",
                role: "أتم حفظ القرآن في الأكاديمية",
                quote:
                  "تجربة استثنائية، ساعدتني على إتمام حفظ القرآن في وقت قياسي بفضل المتابعة الدقيقة من الأستاذ.",
              },
              {
                name: "فاطمة السعدي",
                role: "طالبة في المقرأة",
                quote:
                  "المقرأة الإلكترونية غيّرت حياتي، أستطيع التسميع في أي وقت ومع مقرئين متمكنين، وجودة التصحيح ممتازة.",
              },
              {
                name: "محمد الراشد",
                role: "حصل على الإجازة بالقراءات",
                quote:
                  "حصلت على إجازتي في القراءات العشر بفضل الله ثم بفضل المنهج الرائع للأكاديمية والأساتذة المجازين.",
              },
            ].map((t, i) => (
              <Reveal key={i} delay={i * 0.15}>
                <div className="group relative h-full p-8 rounded-3xl bg-white/5 backdrop-blur border border-white/10 hover:border-[#C9A962]/40 transition-all duration-500">
                  <div className="absolute top-6 left-6 w-10 h-10 text-[#C9A962]/40 group-hover:text-[#C9A962] transition-colors">
                    <svg viewBox="0 0 40 40" fill="currentColor">
                      <path d="M10 25 Q10 15 20 12 L20 17 Q14 19 14 25 L18 25 L18 32 L10 32 Z M22 25 Q22 15 32 12 L32 17 Q26 19 26 25 L30 25 L30 32 L22 32 Z" />
                    </svg>
                  </div>

                  <p className="mt-12 text-white/80 leading-relaxed font-sans">{t.quote}</p>

                  <div className="mt-8 pt-6 border-t border-white/10 flex items-center gap-4">
                    <div className="relative w-12 h-12">
                      <div className="absolute inset-0 text-[#C9A962]">
                        <IslamicStar8 size={48} />
                      </div>
                      <div className="absolute inset-0 flex items-center justify-center font-bold text-[#C9A962]">
                        {t.name.charAt(0)}
                      </div>
                    </div>
                    <div>
                      <div className="font-medium">{t.name}</div>
                      <div className="text-xs text-white/50 mt-0.5 font-sans">{t.role}</div>
                    </div>
                  </div>

                  <div className="absolute top-2 right-2 w-8 h-8 text-[#C9A962]/30 opacity-0 group-hover:opacity-100 transition-opacity">
                    <ArabesqueCorner />
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* CTA */}
      {/* ============================================================ */}
      <section className="relative py-32 md:py-40 overflow-hidden bg-[#FBF8F3]">
        <div className="absolute inset-0 text-[#1E3A5F]/5 pointer-events-none">
          <GeometricPattern className="absolute inset-0" />
        </div>

        <FloatingObject className="top-20 right-[15%] text-[#C9A962]/20" delay={0} duration={10}>
          <CrescentStar size={60} />
        </FloatingObject>
        <FloatingObject className="bottom-20 left-[15%] text-[#1E3A5F]/15" delay={2} duration={12}>
          <Dome size={100} />
        </FloatingObject>

        <div className="container mx-auto px-6 lg:px-12 relative">
          <Reveal>
            <div className="relative max-w-4xl mx-auto text-center p-12 md:p-20 rounded-3xl bg-gradient-to-br from-[#1E3A5F] to-[#0F2440] text-white overflow-hidden shadow-2xl">
              <div className="absolute inset-0 text-[#C9A962]/10 pointer-events-none">
                <GeometricPattern className="absolute inset-0" />
              </div>

              <div className="absolute top-0 right-0 w-32 h-48 text-[#C9A962]/20">
                <MihrabArch />
              </div>
              <div className="absolute top-0 left-0 w-32 h-48 text-[#C9A962]/20 -scale-x-100">
                <MihrabArch />
              </div>

              <div className="absolute top-6 right-6 w-16 h-16 text-[#C9A962]/40">
                <ArabesqueCorner />
              </div>
              <div className="absolute top-6 left-6 w-16 h-16 text-[#C9A962]/40 -scale-x-100">
                <ArabesqueCorner />
              </div>
              <div className="absolute bottom-6 right-6 w-16 h-16 text-[#C9A962]/40 -scale-y-100">
                <ArabesqueCorner />
              </div>
              <div className="absolute bottom-6 left-6 w-16 h-16 text-[#C9A962]/40 -scale-100">
                <ArabesqueCorner />
              </div>

              <div className="relative z-10">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
                  className="inline-block text-[#C9A962] mb-8"
                >
                  <IslamicStar8 size={64} />
                </motion.div>

                <h2 className="text-4xl md:text-5xl lg:text-6xl leading-tight tracking-tight">
                  ابدأ رحلتك مع
                  <br />
                  <span className="italic text-[#C9A962]">القرآن الكريم</span>
                </h2>
                <p className="mt-6 text-lg text-white/70 max-w-xl mx-auto leading-relaxed font-sans">
                  انضم لآلاف الطلاب الذين بدأوا رحلتهم القرآنية معنا. سجّل الآن واحصل على درس تجريبي مجاناً.
                </p>

                <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
                  <Link
                    href="/register"
                    className="group inline-flex items-center gap-3 bg-[#C9A962] text-[#1E3A5F] px-8 h-14 rounded-full text-sm font-medium transition-all hover:shadow-2xl hover:shadow-[#C9A962]/40"
                  >
                    سجل الآن مجاناً
                    <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                  </Link>
                  <Link
                    href="/login"
                    className="inline-flex items-center gap-2 text-white/80 px-2 h-14 text-sm font-medium border-b-2 border-white/30 hover:border-white transition-colors"
                  >
                    لدي حساب بالفعل
                  </Link>
                </div>

                <div className="mt-12 max-w-sm mx-auto text-[#C9A962]/60">
                  <OrnamentalDivider />
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ============================================================ */}
      {/* FOOTER */}
      {/* ============================================================ */}
      <footer className="relative bg-[#FBF8F3] border-t border-[#1E3A5F]/10 pt-20 pb-10 overflow-hidden">
        <div className="absolute inset-0 text-[#1E3A5F]/[0.03] pointer-events-none">
          <GeometricPattern className="absolute inset-0" />
        </div>

        <div className="container mx-auto px-6 lg:px-12 relative">
          <div className="grid lg:grid-cols-12 gap-12 mb-16">
            <div className="lg:col-span-5">
              <Link href="/" className="flex items-center gap-3 mb-6">
                <div className="relative w-12 h-12">
                  <div className="absolute inset-0 text-[#1E3A5F]">
                    <IslamicStar8 size={48} />
                  </div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-base font-bold text-[#1E3A5F]">إ</span>
                  </div>
                </div>
                <div>
                  <div className="text-xl font-bold tracking-tight">إتقان</div>
                  <div className="text-[10px] text-[#1a1a1a]/50 tracking-widest font-sans">ITQAN ACADEMY</div>
                </div>
              </Link>
              <p className="text-[#1a1a1a]/70 leading-relaxed max-w-sm font-sans">
                منصة تعليمية أصيلة تجمع بين عراقة العلوم الشرعية ودقة التسميع والإتقان.
              </p>
              <div className="mt-8 max-w-xs text-[#C9A962]">
                <OrnamentalDivider />
              </div>
            </div>

            <div className="lg:col-span-7 grid grid-cols-2 md:grid-cols-3 gap-8">
              {[
                {
                  title: "الأكاديمية",
                  color: "#1E3A5F",
                  links: [
                    { label: "لوحة التحكم", href: "/academy/student" },
                    { label: "الدورات", href: "/academy/student/courses" },
                    { label: "المسار التعليمي", href: "/academy/student/path" },
                    { label: "الشهادات", href: "/academy/student/certificates" },
                  ],
                },
                {
                  title: "المقرأة",
                  color: "#0D5A3C",
                  links: [
                    { label: "لوحة التحكم", href: "/student" },
                    { label: "التسميعات", href: "/student/recitations" },
                    { label: "احجز موعداً", href: "/student/booking" },
                    { label: "تتبع التقدم", href: "/student/progress" },
                  ],
                },
                {
                  title: "الدعم",
                  color: "#1a1a1a",
                  links: [
                    { label: "تواصل معنا", href: "/contact" },
                    { label: "حول المنصة", href: "/about" },
                    { label: "سياسة الخصوصية", href: "/privacy" },
                    { label: "الشروط والأحكام", href: "/terms" },
                  ],
                },
              ].map((section) => (
                <div key={section.title}>
                  <div className="flex items-center gap-2 mb-5">
                    <span style={{ color: section.color }}>
                      <IslamicStar8 size={12} className="opacity-50" />
                    </span>
                    <h4
                      className="font-medium text-sm tracking-wider"
                      style={{ color: section.color }}
                    >
                      {section.title}
                    </h4>
                  </div>
                  <ul className="space-y-3">
                    {section.links.map((link) => (
                      <li key={link.label}>
                        <Link
                          href={link.href}
                          className="text-sm text-[#1a1a1a]/60 hover:text-[#1a1a1a] transition-colors font-sans"
                        >
                          {link.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-8 border-t border-[#1E3A5F]/10 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="text-xs text-[#1a1a1a]/50 font-sans">
              © {new Date().getFullYear()} إتقان. جميع الحقوق محفوظة.
            </div>
            <div className="flex items-center gap-2 text-xs text-[#1a1a1a]/50 font-sans">
              <span>صُنع بحب في</span>
              <Heart className="w-3.5 h-3.5 text-[#C9A962] fill-[#C9A962]" />
              <span>للقرآن الكريم</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}

/* ============================================================
 * Feature Card
 * ============================================================ */
function FeatureCard({
  title,
  description,
  icon: Icon,
  size = "default",
  accent = "navy",
}: {
  title: string
  description: string
  icon: any
  size?: "default" | "large" | "wide"
  accent?: "navy" | "green" | "gold"
}) {
  const accents = {
    navy: { bg: "#1E3A5F", fg: "white", iconBg: "#C9A962", iconFg: "#1E3A5F" },
    green: { bg: "#FBF8F3", fg: "#0D5A3C", iconBg: "#0D5A3C", iconFg: "#C9A962" },
    gold: { bg: "#FBF8F3", fg: "#1a1a1a", iconBg: "#C9A962", iconFg: "#1E3A5F" },
  } as const
  const a = accents[accent]
  const isDark = accent === "navy"

  return (
    <div
      className="group relative h-full min-h-[240px] p-7 rounded-3xl border transition-all duration-500 hover:-translate-y-1 hover:shadow-2xl overflow-hidden"
      style={{
        backgroundColor: a.bg,
        color: a.fg,
        borderColor: isDark ? "rgba(255,255,255,0.1)" : "rgba(30,58,95,0.1)",
      }}
    >
      <div className={`absolute inset-0 ${isDark ? "text-white/5" : "text-[#1E3A5F]/5"} pointer-events-none`}>
        <GeometricPattern className="absolute inset-0" />
      </div>

      <div
        className="absolute top-3 left-3 w-10 h-10 -scale-x-100 pointer-events-none opacity-30 group-hover:opacity-60 transition-opacity"
        style={{ color: "#C9A962" }}
      >
        <ArabesqueCorner />
      </div>

      <div className="relative w-14 h-14 mb-5">
        <motion.div
          className="absolute inset-0"
          animate={{ rotate: 360 }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          style={{ color: a.iconBg }}
        >
          <IslamicStar8 size={56} />
        </motion.div>
        <div className="absolute inset-0 flex items-center justify-center">
          <Icon className="w-5 h-5" style={{ color: a.iconFg }} />
        </div>
      </div>

      <h3
        className={`font-bold leading-tight ${
          size === "large" ? "text-3xl md:text-4xl" : size === "wide" ? "text-2xl" : "text-xl"
        }`}
      >
        {title}
      </h3>
      <p
        className="mt-3 text-sm leading-relaxed opacity-80 font-sans"
        style={{ color: isDark ? "rgba(255,255,255,0.75)" : "rgba(0,0,0,0.65)" }}
      >
        {description}
      </p>

      {size === "large" && (
        <div className="absolute bottom-7 right-7">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
            style={{ color: a.iconBg, opacity: 0.3 }}
          >
            <IslamicStar12 size={80} />
          </motion.div>
        </div>
      )}
    </div>
  )
}
