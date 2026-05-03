"use client"

import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import {
  motion,
  AnimatePresence,
  useScroll,
  useTransform,
  useSpring,
  useMotionValue,
  useInView,
} from "framer-motion"
import {
  BookOpen,
  GraduationCap,
  Users,
  Mic2,
  Award,
  Moon,
  Sun,
  Star,
  Trophy,
  Heart,
  ArrowLeft,
  Menu,
  X,
  Headphones,
  CheckCircle2,
  Sparkles,
  Globe,
  Shield,
  Zap,
  MessageCircle,
  ChevronDown,
  Volume2,
  FileBadge,
  Target,
  Compass,
  ArrowRight,
  Quote,
  Play,
} from "lucide-react"

/* ============================================================
 * ALIASES — Use Tailwind's primary (#0D5A3C maqra'a) and
 * the academy navy (#1E3A5F) consistently across the page.
 * ============================================================ */
const ACADEMY = "#1E3A5F"
const ACADEMY_LIGHT = "#2A4A73"
const MAQRA = "#0D5A3C"
const GOLD = "#C9A962"

/* ============================================================
 * Custom hook: tracks mouse position for cursor-follow effects
 * ============================================================ */
function useMousePosition() {
  const x = useMotionValue(0)
  const y = useMotionValue(0)
  const smoothX = useSpring(x, { stiffness: 100, damping: 20 })
  const smoothY = useSpring(y, { stiffness: 100, damping: 20 })

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      x.set(e.clientX)
      y.set(e.clientY)
    }
    window.addEventListener("mousemove", handler)
    return () => window.removeEventListener("mousemove", handler)
  }, [x, y])

  return { x: smoothX, y: smoothY }
}

/* ============================================================
 * Animated counter — counts from 0 to target while in view
 * ============================================================ */
function CountUp({ to, suffix = "", duration = 2 }: { to: number; suffix?: string; duration?: number }) {
  const ref = useRef<HTMLSpanElement>(null)
  const inView = useInView(ref, { once: true, margin: "-50px" })
  const [val, setVal] = useState(0)

  useEffect(() => {
    if (!inView) return
    const start = performance.now()
    let raf = 0
    const step = (t: number) => {
      const p = Math.min((t - start) / (duration * 1000), 1)
      const eased = 1 - Math.pow(1 - p, 3)
      setVal(Math.floor(eased * to))
      if (p < 1) raf = requestAnimationFrame(step)
    }
    raf = requestAnimationFrame(step)
    return () => cancelAnimationFrame(raf)
  }, [inView, to, duration])

  return (
    <span ref={ref}>
      {val.toLocaleString("ar-EG")}
      {suffix}
    </span>
  )
}

/* ============================================================
 * Tilt card — 3D tilt effect on hover
 * ============================================================ */
function TiltCard({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const x = useMotionValue(0)
  const y = useMotionValue(0)
  const rotX = useTransform(y, [-0.5, 0.5], [8, -8])
  const rotY = useTransform(x, [-0.5, 0.5], [-8, 8])
  const sRotX = useSpring(rotX, { stiffness: 200, damping: 25 })
  const sRotY = useSpring(rotY, { stiffness: 200, damping: 25 })

  return (
    <motion.div
      ref={ref}
      onMouseMove={(e) => {
        const rect = ref.current?.getBoundingClientRect()
        if (!rect) return
        x.set((e.clientX - rect.left) / rect.width - 0.5)
        y.set((e.clientY - rect.top) / rect.height - 0.5)
      }}
      onMouseLeave={() => {
        x.set(0)
        y.set(0)
      }}
      style={{
        rotateX: sRotX,
        rotateY: sRotY,
        transformStyle: "preserve-3d",
      }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

/* ============================================================
 * Decorative — Floating 8-pointed Islamic star SVG
 * ============================================================ */
function IslamicStar({
  size = 80,
  className = "",
  duration = 20,
  delay = 0,
}: {
  size?: number
  className?: string
  duration?: number
  delay?: number
}) {
  return (
    <motion.svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      className={className}
      animate={{ rotate: 360 }}
      transition={{ duration, repeat: Infinity, ease: "linear", delay }}
    >
      <polygon
        points="50,5 60,30 85,30 65,50 75,75 50,60 25,75 35,50 15,30 40,30"
        fill="none"
        stroke="currentColor"
        strokeWidth="0.8"
      />
      <polygon
        points="50,15 58,32 76,32 60,45 67,65 50,55 33,65 40,45 24,32 42,32"
        fill="currentColor"
        opacity="0.1"
      />
    </motion.svg>
  )
}

/* ============================================================
 * Decorative — Animated mesh gradient backdrop
 * ============================================================ */
function MeshBackdrop() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Academy blob */}
      <motion.div
        className="absolute top-[10%] right-[15%] w-[480px] h-[480px] rounded-full blur-[120px]"
        style={{ background: `radial-gradient(circle, ${ACADEMY}40 0%, transparent 70%)` }}
        animate={{
          x: [0, 60, -40, 0],
          y: [0, -30, 40, 0],
          scale: [1, 1.15, 0.95, 1],
        }}
        transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
      />
      {/* Maqra blob */}
      <motion.div
        className="absolute bottom-[15%] left-[10%] w-[420px] h-[420px] rounded-full blur-[120px]"
        style={{ background: `radial-gradient(circle, ${MAQRA}40 0%, transparent 70%)` }}
        animate={{
          x: [0, -40, 50, 0],
          y: [0, 30, -20, 0],
          scale: [1, 0.9, 1.1, 1],
        }}
        transition={{ duration: 16, repeat: Infinity, ease: "easeInOut", delay: 2 }}
      />
      {/* Gold accent blob */}
      <motion.div
        className="absolute top-1/2 left-1/2 w-[300px] h-[300px] rounded-full blur-[100px] -translate-x-1/2 -translate-y-1/2"
        style={{ background: `radial-gradient(circle, ${GOLD}30 0%, transparent 70%)` }}
        animate={{ scale: [1, 1.3, 1], opacity: [0.5, 0.8, 0.5] }}
        transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
      />
      {/* Dot grid */}
      <svg className="absolute inset-0 w-full h-full opacity-[0.04]">
        <defs>
          <pattern id="dotgrid" width="32" height="32" patternUnits="userSpaceOnUse">
            <circle cx="16" cy="16" r="1" fill="currentColor" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#dotgrid)" />
      </svg>
    </div>
  )
}

/* ============================================================
 * Cursor glow — follows pointer (desktop only)
 * ============================================================ */
function CursorGlow() {
  const { x, y } = useMousePosition()
  return (
    <motion.div
      className="fixed top-0 left-0 w-[500px] h-[500px] rounded-full pointer-events-none z-0 hidden lg:block"
      style={{
        background: `radial-gradient(circle, ${MAQRA}15 0%, transparent 60%)`,
        x: useTransform(x, (v) => v - 250),
        y: useTransform(y, (v) => v - 250),
      }}
    />
  )
}

/* ============================================================
 * Marquee — infinite scrolling row
 * ============================================================ */
function Marquee({ children, reverse = false, speed = 40 }: { children: React.ReactNode; reverse?: boolean; speed?: number }) {
  return (
    <div className="overflow-hidden py-2 [mask-image:linear-gradient(to_right,transparent,black_10%,black_90%,transparent)]">
      <motion.div
        className="flex gap-6 w-max"
        animate={{ x: reverse ? ["-50%", "0%"] : ["0%", "-50%"] }}
        transition={{ duration: speed, repeat: Infinity, ease: "linear" }}
      >
        {children}
        {children}
      </motion.div>
    </div>
  )
}

/* ============================================================
 * DATA
 * ============================================================ */
const stats = [
  { value: 15000, label: "طالب نشط", suffix: "+", icon: Users },
  { value: 500, label: "معلم ومقرئ", suffix: "+", icon: GraduationCap },
  { value: 1200, label: "ساعة تعليمية", suffix: "+", icon: Volume2 },
  { value: 98, label: "نسبة الرضا", suffix: "%", icon: Heart },
]

const features = [
  {
    icon: BookOpen,
    title: "حلقات الحفظ",
    description: "حلقات منظمة لحفظ القرآن مع متابعة يومية وتسميع مستمر",
    accent: MAQRA,
    span: "lg:col-span-2",
  },
  {
    icon: GraduationCap,
    title: "دورات الأكاديمية",
    description: "دورات في التجويد والقراءات والفقه",
    accent: ACADEMY,
    span: "",
  },
  {
    icon: Award,
    title: "إجازات معتمدة",
    description: "احصل على الإجازة بالسند المتصل",
    accent: GOLD,
    span: "",
  },
  {
    icon: Mic2,
    title: "تسميع مباشر",
    description: "جلسات تسميع لايف مع مقرئين معتمدين، مع تسجيل وتقييم فوري",
    accent: MAQRA,
    span: "lg:col-span-2",
  },
]

const journey = [
  { icon: Compass, title: "اختر مسارك", desc: "أكاديمية للدورات أو مقرأة للتسميع" },
  { icon: Target, title: "حدد هدفك", desc: "تجويد، حفظ، إجازة، أو دورة متخصصة" },
  { icon: Volume2, title: "ابدأ التعلم", desc: "حلقات مباشرة وتسجيلات وتقييم فوري" },
  { icon: FileBadge, title: "احصد الشهادة", desc: "إجازات وشهادات معتمدة من أساتذة مجازين" },
]

const testimonials = [
  { quote: "منصة إتقان غيرت رحلتي مع القرآن، أتممت حفظ خمسة أجزاء في 6 أشهر فقط", author: "أحمد محمد", role: "طالب — المقرأة" },
  { quote: "أفضل أكاديمية قرآنية درست فيها، الأساتذة متمكنون والمنهج محكم", author: "فاطمة علي", role: "طالبة — الأكاديمية" },
  { quote: "حصلت على إجازة برواية حفص بفضل الله ثم بفضل أساتذة المنصة", author: "محمد الأحمد", role: "خريج" },
  { quote: "نظام التسميع المباشر فيه إتقان شيء عجيب، تجربة فريدة", author: "نور حسن", role: "طالبة — المقرأة" },
  { quote: "ابني سجل في الأكاديمية وأرى تطوراً ملحوظاً كل أسبوع", author: "سارة الحربي", role: "ولية أمر" },
  { quote: "المرونة في المواعيد ساعدتني كثيراً مع عملي ودراستي", author: "عبدالله سعد", role: "طالب" },
]

/* ============================================================
 * MAIN PAGE
 * ============================================================ */
export default function HomePage() {
  const [isDark, setIsDark] = useState(false)
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const heroRef = useRef<HTMLElement>(null)

  const { scrollYProgress } = useScroll({ target: heroRef, offset: ["start start", "end start"] })
  const heroY = useTransform(scrollYProgress, [0, 1], [0, 200])
  const heroOpacity = useTransform(scrollYProgress, [0, 0.8], [1, 0])
  const heroScale = useTransform(scrollYProgress, [0, 1], [1, 0.95])

  useEffect(() => {
    setIsDark(document.documentElement.classList.contains("dark"))
    const onScroll = () => setScrolled(window.scrollY > 30)
    window.addEventListener("scroll", onScroll)
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  const toggleDark = () => {
    document.documentElement.classList.toggle("dark")
    setIsDark(!isDark)
  }

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden" dir="rtl">
      <CursorGlow />

      {/* ============================================================ */}
      {/* HEADER                                                         */}
      {/* ============================================================ */}
      <motion.header
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className={`fixed top-0 right-0 left-0 z-50 transition-all duration-500 ${
          scrolled
            ? "bg-background/80 backdrop-blur-xl border-b border-border/50 shadow-sm"
            : "bg-transparent"
        }`}
      >
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16 md:h-20">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-3 group">
              <motion.div
                whileHover={{ rotate: [0, -8, 8, 0] }}
                transition={{ duration: 0.5 }}
                className="relative w-11 h-11 rounded-xl overflow-hidden flex items-center justify-center"
                style={{
                  background: `linear-gradient(135deg, ${ACADEMY} 0%, ${MAQRA} 100%)`,
                }}
              >
                <BookOpen className="w-5 h-5 text-white relative z-10" />
                <motion.div
                  className="absolute inset-0 opacity-0 group-hover:opacity-100"
                  style={{
                    background: `linear-gradient(135deg, ${MAQRA} 0%, ${ACADEMY} 100%)`,
                  }}
                  transition={{ duration: 0.3 }}
                />
              </motion.div>
              <div>
                <span className="text-xl font-bold text-foreground tracking-tight">إتقان</span>
                <span className="block text-[10px] text-muted-foreground -mt-0.5">
                  الأكاديمية والمقرأة
                </span>
              </div>
            </Link>

            {/* Nav */}
            <nav className="hidden lg:flex items-center gap-1">
              {[
                { href: "#sections", label: "الأقسام" },
                { href: "#features", label: "المميزات" },
                { href: "#journey", label: "رحلتك" },
                { href: "#testimonials", label: "آراء الطلاب" },
              ].map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="relative px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors group"
                >
                  {item.label}
                  <span className="absolute bottom-1 right-1/2 translate-x-1/2 w-0 group-hover:w-6 h-px bg-foreground transition-all duration-300" />
                </Link>
              ))}
            </nav>

            {/* Right side */}
            <div className="flex items-center gap-2">
              <button
                onClick={toggleDark}
                aria-label="تبديل المظهر"
                className="w-10 h-10 rounded-lg bg-secondary/60 hover:bg-secondary flex items-center justify-center transition-colors"
              >
                <AnimatePresence mode="wait">
                  <motion.div
                    key={isDark ? "sun" : "moon"}
                    initial={{ rotate: -90, opacity: 0 }}
                    animate={{ rotate: 0, opacity: 1 }}
                    exit={{ rotate: 90, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                  </motion.div>
                </AnimatePresence>
              </button>

              <Link
                href="/login"
                className="hidden sm:inline-flex h-10 px-5 rounded-lg items-center justify-center text-sm font-medium border border-border hover:bg-secondary/60 transition-colors"
              >
                دخول
              </Link>

              <Link
                href="/register"
                className="hidden sm:inline-flex h-10 px-5 rounded-lg items-center justify-center text-sm font-medium text-white shadow-md transition-all hover:shadow-lg hover:scale-[1.02]"
                style={{
                  background: `linear-gradient(135deg, ${ACADEMY} 0%, ${MAQRA} 100%)`,
                }}
              >
                ابدأ مجاناً
              </Link>

              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                aria-label="القائمة"
                className="lg:hidden w-10 h-10 rounded-lg bg-secondary/60 flex items-center justify-center"
              >
                {isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile menu */}
        <AnimatePresence>
          {isMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="lg:hidden bg-background/95 backdrop-blur-xl border-t border-border overflow-hidden"
            >
              <div className="container mx-auto px-4 py-6 space-y-1">
                {[
                  { href: "#sections", label: "الأقسام" },
                  { href: "#features", label: "المميزات" },
                  { href: "#journey", label: "رحلتك" },
                  { href: "#testimonials", label: "آراء الطلاب" },
                ].map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="block py-3 px-3 rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    {item.label}
                  </Link>
                ))}
                <div className="grid grid-cols-2 gap-2 pt-4 mt-4 border-t border-border">
                  <Link
                    href="/academy/student"
                    className="text-center py-3 rounded-lg text-white font-medium"
                    style={{ background: ACADEMY }}
                    onClick={() => setIsMenuOpen(false)}
                  >
                    الأكاديمية
                  </Link>
                  <Link
                    href="/student"
                    className="text-center py-3 rounded-lg text-white font-medium bg-primary"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    المقرأة
                  </Link>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.header>

      {/* ============================================================ */}
      {/* HERO                                                            */}
      {/* ============================================================ */}
      <motion.section
        ref={heroRef}
        style={{ y: heroY, opacity: heroOpacity, scale: heroScale }}
        className="relative min-h-screen flex items-center justify-center pt-24 pb-16 overflow-hidden"
      >
        <MeshBackdrop />

        {/* Floating decorative stars */}
        <IslamicStar
          size={140}
          duration={40}
          className="absolute top-[15%] right-[8%] text-primary/20 hidden md:block"
        />
        <IslamicStar
          size={100}
          duration={30}
          delay={2}
          className="absolute bottom-[20%] left-[8%] hidden md:block"
        />
        <IslamicStar
          size={70}
          duration={25}
          delay={1}
          className="absolute top-[40%] left-[12%] text-foreground/20 hidden lg:block"
        />

        {/* Bismillah floating ornament */}
        <motion.div
          className="absolute top-[8%] left-1/2 -translate-x-1/2 text-7xl md:text-9xl text-foreground/[0.04] select-none pointer-events-none"
          animate={{ y: [0, -10, 0], opacity: [0.3, 0.5, 0.3] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
        >
          ﷽
        </motion.div>

        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-5xl mx-auto text-center">
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              className="inline-flex items-center gap-3 px-5 py-2 rounded-full border border-border/50 bg-background/40 backdrop-blur-sm mb-8 shadow-sm"
            >
              <span className="relative flex h-2 w-2">
                <span
                  className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-75"
                  style={{ backgroundColor: MAQRA }}
                />
                <span className="relative inline-flex h-2 w-2 rounded-full" style={{ backgroundColor: MAQRA }} />
              </span>
              <span className="text-sm text-muted-foreground">منصة قرآنية متكاملة</span>
              <span className="w-px h-3 bg-border" />
              <span className="text-sm font-medium" style={{ color: ACADEMY }}>
                الأكاديمية
              </span>
              <span className="text-xs text-muted-foreground">+</span>
              <span className="text-sm font-medium text-primary">المقرأة</span>
            </motion.div>

            {/* Main heading */}
            <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold leading-[0.95] tracking-tight mb-8">
              <motion.span
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
                className="block text-foreground"
              >
                رحلتك مع القرآن
              </motion.span>
              <motion.span
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.25, ease: [0.16, 1, 0.3, 1] }}
                className="relative inline-block mt-2 md:mt-4"
              >
                <span
                  className="bg-clip-text text-transparent"
                  style={{
                    backgroundImage: `linear-gradient(135deg, ${ACADEMY} 0%, ${MAQRA} 50%, ${GOLD} 100%)`,
                  }}
                >
                  تبدأ من هنا
                </span>
                {/* Underline ornament */}
                <motion.svg
                  initial={{ pathLength: 0, opacity: 0 }}
                  animate={{ pathLength: 1, opacity: 1 }}
                  transition={{ duration: 1.2, delay: 0.9, ease: "easeOut" }}
                  viewBox="0 0 300 20"
                  className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-[80%] h-3"
                >
                  <motion.path
                    d="M5 12 Q 75 2, 150 10 T 295 8"
                    fill="none"
                    stroke={GOLD}
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 1.2, delay: 0.9 }}
                  />
                </motion.svg>
              </motion.span>
            </h1>

            {/* Description */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.4 }}
              className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed text-pretty"
            >
              منصة واحدة تجمع{" "}
              <span className="font-semibold" style={{ color: ACADEMY }}>
                الأكاديمية القرآنية
              </span>{" "}
              للدورات والشهادات و
              <span className="font-semibold text-primary">المقرأة الإلكترونية</span> للحفظ والتسميع المباشر
              مع المقرئين والأساتذة المعتمدين.
            </motion.p>

            {/* CTAs */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.55 }}
              className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-16"
            >
              <Link
                href="/academy/student"
                className="group relative w-full sm:w-auto h-14 px-7 rounded-xl text-white font-medium overflow-hidden flex items-center justify-center gap-2.5 shadow-lg transition-all hover:scale-[1.02]"
                style={{
                  background: ACADEMY,
                  boxShadow: `0 10px 30px -10px ${ACADEMY}80`,
                }}
              >
                <span
                  className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                  style={{
                    background: `linear-gradient(135deg, ${ACADEMY_LIGHT} 0%, ${ACADEMY} 100%)`,
                  }}
                />
                <GraduationCap className="w-5 h-5 relative z-10" />
                <span className="relative z-10">دخول الأكاديمية</span>
                <ArrowLeft className="w-4 h-4 relative z-10 group-hover:-translate-x-1 transition-transform" />
              </Link>

              <Link
                href="/student"
                className="group relative w-full sm:w-auto h-14 px-7 rounded-xl bg-primary text-primary-foreground font-medium overflow-hidden flex items-center justify-center gap-2.5 shadow-lg transition-all hover:scale-[1.02]"
                style={{ boxShadow: `0 10px 30px -10px ${MAQRA}80` }}
              >
                <BookOpen className="w-5 h-5" />
                <span>دخول المقرأة</span>
                <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
              </Link>
            </motion.div>

            {/* Quick stats */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1, delay: 0.8 }}
              className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 max-w-3xl mx-auto"
            >
              {stats.map((s, i) => (
                <motion.div
                  key={s.label}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.9 + i * 0.1, duration: 0.5 }}
                  className="relative group"
                >
                  <div className="rounded-2xl border border-border/50 bg-background/40 backdrop-blur-sm p-4 md:p-5 text-center transition-all hover:border-foreground/20 hover:-translate-y-1">
                    <s.icon className="w-5 h-5 mx-auto mb-2 text-muted-foreground group-hover:text-foreground transition-colors" />
                    <div className="text-2xl md:text-3xl font-bold text-foreground tracking-tight">
                      <CountUp to={s.value} suffix={s.suffix} />
                    </div>
                    <div className="text-xs md:text-sm text-muted-foreground mt-1">{s.label}</div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </div>

        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5, duration: 1 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2"
        >
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            className="flex flex-col items-center gap-2 text-muted-foreground"
          >
            <span className="text-xs">اكتشف المزيد</span>
            <ChevronDown className="w-4 h-4" />
          </motion.div>
        </motion.div>
      </motion.section>

      {/* ============================================================ */}
      {/* DUAL PLATFORM SHOWCASE                                          */}
      {/* ============================================================ */}
      <section id="sections" className="relative py-24 md:py-32 overflow-hidden">
        {/* Section heading */}
        <div className="container mx-auto px-4 mb-16">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            className="text-center max-w-2xl mx-auto"
          >
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-border bg-secondary/40 text-sm text-muted-foreground mb-6">
              <Sparkles className="w-3.5 h-3.5" />
              منصتان في مكان واحد
            </span>
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-5 text-balance">
              اختر وجهتك التعليمية
            </h2>
            <p className="text-lg text-muted-foreground leading-relaxed text-pretty">
              لكل طالب رحلته الخاصة. اختر المنصة الأنسب لاحتياجك.
            </p>
          </motion.div>
        </div>

        {/* Cards */}
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-6 max-w-6xl mx-auto perspective-[1500px]">
            {/* === ACADEMY CARD === */}
            <motion.div
              initial={{ opacity: 0, x: 60 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            >
              <TiltCard className="h-full">
                <Link href="/academy/student" className="block h-full">
                  <div
                    className="relative h-full min-h-[520px] rounded-3xl p-8 md:p-10 overflow-hidden text-white group"
                    style={{
                      background: `linear-gradient(135deg, ${ACADEMY} 0%, ${ACADEMY_LIGHT} 100%)`,
                    }}
                  >
                    {/* Animated decorative shapes */}
                    <div className="absolute inset-0 opacity-20 pointer-events-none">
                      <svg className="w-full h-full" viewBox="0 0 400 400">
                        <defs>
                          <pattern id="academy-pat" width="40" height="40" patternUnits="userSpaceOnUse">
                            <path
                              d="M20 0 L40 20 L20 40 L0 20 Z"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="0.5"
                            />
                          </pattern>
                        </defs>
                        <rect width="400" height="400" fill="url(#academy-pat)" />
                      </svg>
                    </div>

                    {/* Gold corner glow */}
                    <motion.div
                      className="absolute -top-20 -right-20 w-64 h-64 rounded-full blur-3xl"
                      style={{ background: `${GOLD}40` }}
                      animate={{ scale: [1, 1.2, 1], opacity: [0.4, 0.6, 0.4] }}
                      transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                    />

                    {/* Floating star */}
                    <IslamicStar
                      size={120}
                      duration={45}
                      className="absolute bottom-4 left-4 text-white/10"
                    />

                    <div className="relative z-10 flex flex-col h-full">
                      <div className="flex items-start justify-between mb-8">
                        <motion.div
                          whileHover={{ rotate: -8, scale: 1.1 }}
                          transition={{ type: "spring", stiffness: 300 }}
                          className="w-16 h-16 rounded-2xl bg-white/15 backdrop-blur-sm flex items-center justify-center"
                        >
                          <GraduationCap className="w-8 h-8" />
                        </motion.div>
                        <span className="text-xs uppercase tracking-widest px-3 py-1 rounded-full bg-white/10 border border-white/20">
                          الأكاديمية
                        </span>
                      </div>

                      <h3 className="text-3xl md:text-4xl font-bold mb-4 leading-tight">
                        أكاديمية إتقان القرآنية
                      </h3>
                      <p className="text-white/80 mb-7 leading-relaxed text-pretty">
                        دورات منظمة في علوم القرآن والتجويد والقراءات والفقه. شهادات وإجازات معتمدة بالسند
                        المتصل.
                      </p>

                      <ul className="space-y-3 mb-8 flex-1">
                        {[
                          "دورات التجويد والقراءات العشر",
                          "إجازات معتمدة بالسند المتصل",
                          "فصول دراسية تفاعلية",
                          "متابعة شخصية من الأساتذة",
                        ].map((item, i) => (
                          <motion.li
                            key={item}
                            initial={{ opacity: 0, x: 20 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: 0.1 * i }}
                            className="flex items-center gap-3 text-white/95"
                          >
                            <div
                              className="w-6 h-6 rounded-full flex items-center justify-center shrink-0"
                              style={{ background: GOLD }}
                            >
                              <CheckCircle2 className="w-3.5 h-3.5 text-[#1E3A5F]" />
                            </div>
                            <span className="text-sm">{item}</span>
                          </motion.li>
                        ))}
                      </ul>

                      <div className="flex items-center justify-between pt-6 border-t border-white/15">
                        <span className="text-sm text-white/70">ابدأ رحلتك الأكاديمية</span>
                        <div className="w-12 h-12 rounded-full bg-white/15 flex items-center justify-center group-hover:bg-white group-hover:text-[#1E3A5F] transition-all duration-300">
                          <ArrowLeft className="w-5 h-5 group-hover:-translate-x-0.5 transition-transform" />
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              </TiltCard>
            </motion.div>

            {/* === MAQRA'A CARD === */}
            <motion.div
              initial={{ opacity: 0, x: -60 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.8, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
            >
              <TiltCard className="h-full">
                <Link href="/student" className="block h-full">
                  <div
                    className="relative h-full min-h-[520px] rounded-3xl p-8 md:p-10 overflow-hidden text-primary-foreground group"
                    style={{
                      background: `linear-gradient(135deg, ${MAQRA} 0%, #0F6B47 100%)`,
                    }}
                  >
                    {/* Decorative pattern */}
                    <div className="absolute inset-0 opacity-20 pointer-events-none">
                      <svg className="w-full h-full" viewBox="0 0 400 400">
                        <defs>
                          <pattern id="maqra-pat" width="60" height="60" patternUnits="userSpaceOnUse">
                            <circle cx="30" cy="30" r="20" fill="none" stroke="currentColor" strokeWidth="0.5" />
                            <circle cx="30" cy="30" r="10" fill="none" stroke="currentColor" strokeWidth="0.5" />
                          </pattern>
                        </defs>
                        <rect width="400" height="400" fill="url(#maqra-pat)" />
                      </svg>
                    </div>

                    <motion.div
                      className="absolute -top-20 -right-20 w-64 h-64 rounded-full blur-3xl"
                      style={{ background: `${GOLD}50` }}
                      animate={{ scale: [1, 1.2, 1], opacity: [0.4, 0.7, 0.4] }}
                      transition={{ duration: 7, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                    />

                    <IslamicStar size={140} duration={50} className="absolute bottom-4 left-4 text-white/10" />

                    <div className="relative z-10 flex flex-col h-full">
                      <div className="flex items-start justify-between mb-8">
                        <motion.div
                          whileHover={{ rotate: 8, scale: 1.1 }}
                          transition={{ type: "spring", stiffness: 300 }}
                          className="w-16 h-16 rounded-2xl bg-white/15 backdrop-blur-sm flex items-center justify-center"
                        >
                          <BookOpen className="w-8 h-8" />
                        </motion.div>
                        <span className="text-xs uppercase tracking-widest px-3 py-1 rounded-full bg-white/10 border border-white/20">
                          المقرأة
                        </span>
                      </div>

                      <h3 className="text-3xl md:text-4xl font-bold mb-4 leading-tight">
                        المقرأة الإلكترونية
                      </h3>
                      <p className="text-white/80 mb-7 leading-relaxed text-pretty">
                        حلقات تسميع مباشرة مع مقرئين معتمدين. سجّل تلاوتك واحصل على تقييم فوري وتوجيه شخصي.
                      </p>

                      <ul className="space-y-3 mb-8 flex-1">
                        {[
                          "حلقات تسميع مباشرة",
                          "مقرئون مجازون",
                          "تقييم وتصحيح فوري",
                          "متابعة تقدم الحفظ",
                        ].map((item, i) => (
                          <motion.li
                            key={item}
                            initial={{ opacity: 0, x: -20 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: 0.1 * i }}
                            className="flex items-center gap-3 text-white/95"
                          >
                            <div
                              className="w-6 h-6 rounded-full flex items-center justify-center shrink-0"
                              style={{ background: GOLD }}
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" style={{ color: MAQRA }} />
                            </div>
                            <span className="text-sm">{item}</span>
                          </motion.li>
                        ))}
                      </ul>

                      <div className="flex items-center justify-between pt-6 border-t border-white/15">
                        <span className="text-sm text-white/70">ابدأ تسميعك الآن</span>
                        <div
                          className="w-12 h-12 rounded-full bg-white/15 flex items-center justify-center group-hover:bg-white transition-all duration-300"
                          style={{ color: "transparent" }}
                        >
                          <ArrowLeft
                            className="w-5 h-5 text-white group-hover:text-primary group-hover:-translate-x-0.5 transition-all"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              </TiltCard>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* FEATURES BENTO                                                  */}
      {/* ============================================================ */}
      <section id="features" className="relative py-24 md:py-32 bg-secondary/30">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <IslamicStar size={200} duration={60} className="absolute -top-20 -right-20 text-foreground/[0.03]" />
          <IslamicStar size={150} duration={50} delay={3} className="absolute -bottom-10 -left-10 text-foreground/[0.03]" />
        </div>

        <div className="container mx-auto px-4 relative">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.7 }}
            className="text-center max-w-2xl mx-auto mb-16"
          >
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-border bg-background/60 text-sm text-muted-foreground mb-6">
              <Zap className="w-3.5 h-3.5" />
              ما نقدمه
            </span>
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-5 text-balance">
              كل ما تحتاجه لرحلتك القرآنية
            </h2>
            <p className="text-lg text-muted-foreground text-pretty">
              تجربة تعليمية متكاملة تجمع بين أصالة المنهج وحداثة الأدوات
            </p>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 max-w-6xl mx-auto">
            {features.map((feature, i) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.6, delay: i * 0.1, ease: [0.16, 1, 0.3, 1] }}
                className={`group relative rounded-2xl border border-border bg-background p-7 overflow-hidden hover:border-foreground/20 transition-all hover:-translate-y-1 ${feature.span}`}
              >
                {/* Hover glow */}
                <div
                  className="absolute -inset-px rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                  style={{
                    background: `radial-gradient(400px circle at var(--mouse-x, 50%) var(--mouse-y, 50%), ${feature.accent}15, transparent 40%)`,
                  }}
                />

                {/* Icon */}
                <div
                  className="relative w-12 h-12 rounded-xl flex items-center justify-center mb-5 transition-transform group-hover:scale-110 group-hover:-rotate-6"
                  style={{ background: `${feature.accent}15`, color: feature.accent }}
                >
                  <feature.icon className="w-6 h-6" />
                </div>

                <h3 className="text-xl font-bold mb-2.5 text-foreground">{feature.title}</h3>
                <p className="text-muted-foreground leading-relaxed text-sm">{feature.description}</p>

                {/* Decorative number */}
                <span className="absolute top-4 left-4 text-5xl font-bold text-foreground/[0.04] tabular-nums">
                  0{i + 1}
                </span>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* JOURNEY                                                         */}
      {/* ============================================================ */}
      <section id="journey" className="relative py-24 md:py-32 overflow-hidden">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.7 }}
            className="text-center max-w-2xl mx-auto mb-20"
          >
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-border bg-secondary/40 text-sm text-muted-foreground mb-6">
              <Compass className="w-3.5 h-3.5" />
              رحلتك معنا
            </span>
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-5 text-balance">
              4 خطوات لإتقان القرآن
            </h2>
            <p className="text-lg text-muted-foreground text-pretty">
              رحلة منظمة تأخذك من البداية إلى الإجازة
            </p>
          </motion.div>

          <div className="relative max-w-5xl mx-auto">
            {/* Connecting line */}
            <div className="absolute top-8 right-0 left-0 h-px bg-gradient-to-l from-transparent via-border to-transparent hidden md:block" />

            <div className="grid grid-cols-1 md:grid-cols-4 gap-8 md:gap-4">
              {journey.map((step, i) => (
                <motion.div
                  key={step.title}
                  initial={{ opacity: 0, y: 40 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-50px" }}
                  transition={{ duration: 0.6, delay: i * 0.15 }}
                  className="relative text-center group"
                >
                  {/* Step circle */}
                  <div className="relative inline-flex mx-auto mb-6">
                    <motion.div
                      className="absolute inset-0 rounded-full"
                      style={{
                        background: `linear-gradient(135deg, ${ACADEMY}, ${MAQRA})`,
                      }}
                      animate={{ scale: [1, 1.15, 1], opacity: [0.3, 0.1, 0.3] }}
                      transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", delay: i * 0.5 }}
                    />
                    <div
                      className="relative w-16 h-16 rounded-full flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform duration-500"
                      style={{
                        background: `linear-gradient(135deg, ${ACADEMY} 0%, ${MAQRA} 100%)`,
                      }}
                    >
                      <step.icon className="w-7 h-7" />
                    </div>
                    {/* Step number */}
                    <div className="absolute -top-2 -left-2 w-7 h-7 rounded-full bg-background border-2 border-border flex items-center justify-center text-xs font-bold">
                      {i + 1}
                    </div>
                  </div>

                  <h3 className="text-lg font-bold mb-2">{step.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{step.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* TESTIMONIALS MARQUEE                                            */}
      {/* ============================================================ */}
      <section
        id="testimonials"
        className="relative py-24 md:py-32 bg-secondary/30 overflow-hidden"
      >
        <div className="container mx-auto px-4 mb-14">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.7 }}
            className="text-center max-w-2xl mx-auto"
          >
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-border bg-background/60 text-sm text-muted-foreground mb-6">
              <Quote className="w-3.5 h-3.5" />
              آراء طلابنا
            </span>
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-5 text-balance">
              قصص نجاح حقيقية
            </h2>
            <p className="text-lg text-muted-foreground text-pretty">
              آلاف الطلاب يثقون في إتقان لرحلتهم القرآنية
            </p>
          </motion.div>
        </div>

        <div className="space-y-4">
          <Marquee speed={50}>
            {testimonials.slice(0, 3).map((t, i) => (
              <TestimonialCard key={`a-${i}`} {...t} />
            ))}
          </Marquee>
          <Marquee reverse speed={60}>
            {testimonials.slice(3).map((t, i) => (
              <TestimonialCard key={`b-${i}`} {...t} />
            ))}
          </Marquee>
        </div>
      </section>

      {/* ============================================================ */}
      {/* CTA                                                             */}
      {/* ============================================================ */}
      <section className="relative py-24 md:py-32 overflow-hidden">
        <div className="absolute inset-0">
          <motion.div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full blur-3xl"
            style={{
              background: `conic-gradient(from 0deg, ${ACADEMY}40, ${MAQRA}40, ${GOLD}40, ${ACADEMY}40)`,
            }}
            animate={{ rotate: 360 }}
            transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
          />
        </div>

        <div className="container mx-auto px-4 relative z-10">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="relative max-w-4xl mx-auto rounded-3xl overflow-hidden p-10 md:p-16 text-center text-white"
            style={{
              background: `linear-gradient(135deg, ${ACADEMY} 0%, ${MAQRA} 100%)`,
            }}
          >
            {/* Decorative */}
            <IslamicStar size={200} duration={60} className="absolute -top-10 -right-10 text-white/10" />
            <IslamicStar size={150} duration={50} delay={2} className="absolute -bottom-10 -left-10 text-white/10" />

            <motion.div
              className="absolute -top-20 -left-20 w-80 h-80 rounded-full blur-3xl"
              style={{ background: `${GOLD}30` }}
              animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0.8, 0.5] }}
              transition={{ duration: 6, repeat: Infinity }}
            />

            <div className="relative z-10">
              <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight mb-6 text-balance">
                ابدأ رحلتك مع
                <br />
                <span style={{ color: GOLD }}>القرآن الكريم</span> اليوم
              </h2>
              <p className="text-lg md:text-xl text-white/85 max-w-2xl mx-auto mb-10 leading-relaxed text-pretty">
                انضم لآلاف الطلاب من حول العالم واستمتع بتجربة تعليمية متكاملة
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                <Link
                  href="/register"
                  className="group h-14 px-8 rounded-xl bg-white text-foreground font-medium flex items-center justify-center gap-2 hover:bg-white/95 transition-all hover:scale-[1.02]"
                  style={{ color: ACADEMY }}
                >
                  <Sparkles className="w-5 h-5" />
                  <span>سجّل الآن مجاناً</span>
                  <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                </Link>

                <Link
                  href="/login"
                  className="group h-14 px-8 rounded-xl border border-white/30 text-white font-medium flex items-center justify-center gap-2 hover:bg-white/10 transition-colors"
                >
                  <span>لدي حساب</span>
                  <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                </Link>
              </div>

              {/* Trust badges */}
              <div className="flex flex-wrap items-center justify-center gap-6 mt-10 pt-10 border-t border-white/15">
                {[
                  { icon: Shield, label: "آمن ومعتمد" },
                  { icon: Globe, label: "أكثر من 45 دولة" },
                  { icon: Award, label: "إجازات بالسند" },
                ].map((b) => (
                  <div key={b.label} className="flex items-center gap-2 text-sm text-white/80">
                    <b.icon className="w-4 h-4" />
                    <span>{b.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* FOOTER                                                          */}
      {/* ============================================================ */}
      <footer className="relative border-t border-border bg-background pt-20 pb-8">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-10 mb-12">
            {/* Brand */}
            <div className="col-span-2">
              <Link href="/" className="flex items-center gap-3 mb-5">
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center"
                  style={{ background: `linear-gradient(135deg, ${ACADEMY} 0%, ${MAQRA} 100%)` }}
                >
                  <BookOpen className="w-6 h-6 text-white" />
                </div>
                <div>
                  <span className="text-2xl font-bold">إتقان</span>
                  <span className="block text-xs text-muted-foreground">الأكاديمية والمقرأة</span>
                </div>
              </Link>
              <p className="text-sm text-muted-foreground leading-relaxed max-w-xs mb-6">
                منصة تعليمية متكاملة تجمع بين الأكاديمية القرآنية للدورات والشهادات والمقرأة الإلكترونية
                للحفظ والتسميع.
              </p>
              <div className="flex gap-2">
                {[Heart, MessageCircle, Globe].map((Icon, i) => (
                  <a
                    key={i}
                    href="#"
                    className="w-9 h-9 rounded-lg border border-border bg-secondary/40 hover:bg-secondary flex items-center justify-center transition-colors"
                  >
                    <Icon className="w-4 h-4 text-muted-foreground" />
                  </a>
                ))}
              </div>
            </div>

            {/* Academy */}
            <div>
              <h4 className="font-bold mb-4 text-sm" style={{ color: ACADEMY }}>
                الأكاديمية
              </h4>
              <ul className="space-y-2.5 text-sm">
                {[
                  { label: "لوحة التحكم", href: "/academy/student" },
                  { label: "الدورات", href: "/academy/student/courses" },
                  { label: "المسار التعليمي", href: "/academy/student/path" },
                  { label: "الشهادات", href: "/academy/student/certificates" },
                ].map((l) => (
                  <li key={l.label}>
                    <Link href={l.href} className="text-muted-foreground hover:text-foreground transition-colors">
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Maqra */}
            <div>
              <h4 className="font-bold mb-4 text-sm text-primary">المقرأة</h4>
              <ul className="space-y-2.5 text-sm">
                {[
                  { label: "لوحة التحكم", href: "/student" },
                  { label: "التسميعات", href: "/student/recitations" },
                  { label: "حجز موعد", href: "/student/booking" },
                  { label: "التقدم", href: "/student/progress" },
                ].map((l) => (
                  <li key={l.label}>
                    <Link href={l.href} className="text-muted-foreground hover:text-foreground transition-colors">
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Support */}
            <div>
              <h4 className="font-bold mb-4 text-sm">الدعم</h4>
              <ul className="space-y-2.5 text-sm">
                {[
                  { label: "تواصل معنا", href: "/contact" },
                  { label: "من نحن", href: "/about" },
                  { label: "سياسة الخصوصية", href: "/privacy" },
                  { label: "الشروط", href: "/terms" },
                ].map((l) => (
                  <li key={l.label}>
                    <Link href={l.href} className="text-muted-foreground hover:text-foreground transition-colors">
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="pt-8 border-t border-border flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-sm text-muted-foreground">
              &copy; {new Date().getFullYear()} إتقان. جميع الحقوق محفوظة.
            </p>
            <p className="text-sm text-muted-foreground flex items-center gap-1.5">
              صُنع بـ <Heart className="w-3.5 h-3.5 fill-current text-red-500" /> لخدمة كتاب الله
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}

/* ============================================================
 * Testimonial card (used in marquee)
 * ============================================================ */
function TestimonialCard({ quote, author, role }: { quote: string; author: string; role: string }) {
  return (
    <div className="w-[340px] md:w-[420px] shrink-0 rounded-2xl border border-border bg-background p-6 hover:border-foreground/20 hover:shadow-lg transition-all">
      <div className="flex items-center gap-1 mb-3 text-amber-400">
        {[...Array(5)].map((_, i) => (
          <Star key={i} className="w-4 h-4 fill-current" />
        ))}
      </div>
      <p className="text-sm md:text-base leading-relaxed mb-5 text-foreground/90 text-pretty">
        &ldquo;{quote}&rdquo;
      </p>
      <div className="flex items-center gap-3 pt-4 border-t border-border">
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold"
          style={{ background: `linear-gradient(135deg, ${ACADEMY}, ${MAQRA})` }}
        >
          {author.charAt(0)}
        </div>
        <div>
          <div className="font-semibold text-sm">{author}</div>
          <div className="text-xs text-muted-foreground">{role}</div>
        </div>
      </div>
    </div>
  )
}
