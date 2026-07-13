"use client"

import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import { useTheme } from "next-themes"
import { motion, useScroll, useTransform, AnimatePresence, useInView } from "framer-motion"
import {
  BookOpen,
  GraduationCap,
  ArrowLeft,
  ArrowRight,
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
  Globe,
} from "lucide-react"
import { useI18n } from "@/lib/i18n/context"
import { buildHomepageContent, buildHomepageColorVars, asBool, type Locale } from "@/lib/homepage-content"
import HomepageHeader from "@/components/homepage-header"

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

const TessellatedBg = ({ className = "", color = "var(--hp-navy)", opacity = 0.04, id = "navy" }: any) => {
  const patternId = `tess-${id}`
  return (
    <svg className={className} aria-hidden>
      <defs>
        <pattern id={patternId} x="0" y="0" width="80" height="80" patternUnits="userSpaceOnUse">
          <g fill="none" stroke={color} strokeWidth="0.6" opacity={opacity * 12}>
            <polygon points="40,5 47,33 75,40 47,47 40,75 33,47 5,40 33,33" />
            <circle cx="40" cy="40" r="22" />
            <circle cx="40" cy="40" r="3" fill={color} />
          </g>
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill={`url(#${patternId})`} />
    </svg>
  )
}

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

function CountUp({ value, suffix = "", duration = 2, locale = "ar" }: { value: number; suffix?: string; duration?: number; locale?: Locale }) {
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
  return <span ref={ref}>{n.toLocaleString(locale === "ar" ? "ar-EG" : "en-US")}{suffix}</span>
}

/* ============================================================
   TESTIMONIALS MARQUEE
   ============================================================ */

type Testimonial = { q: string; n: string; r: string }

function TestimonialCard({ q, n, r, dir }: Testimonial & { dir: "rtl" | "ltr" }) {
  return (
    <article
      dir={dir}
      className="ml-6 flex-shrink-0 w-[320px] md:w-[420px] relative p-8 md:p-10 bg-hp-card dark:bg-hp-dark-2 border border-hp-navy/10 dark:border-hp-gold/15 rounded-2xl"
    >
      <Quote className="absolute top-6 left-6 w-8 h-8 text-hp-bronze/20 dark:text-hp-gold/30 rotate-180" />
      <ArabesqueCorner size={70} className="absolute top-0 right-0 text-hp-bronze/15 dark:text-hp-gold/25" />
      <div className="relative pt-4">
        <p
          className="text-base md:text-lg text-hp-ink/85 dark:text-hp-cream/85 leading-loose mb-6 line-clamp-4"
          style={{ fontFamily: "var(--font-heading)" }}
        >
          {q}
        </p>
        <div className="pt-4 border-t border-hp-navy/10 dark:border-hp-gold/15">
          <div className="font-bold text-hp-navy dark:text-hp-cream" style={{ fontFamily: "var(--font-heading)" }}>
            {n}
          </div>
          <div className="text-sm text-hp-ink/55 dark:text-hp-cream/55 mt-1">{r}</div>
        </div>
        <div className="flex gap-1 mt-3">
          {[...Array(5)].map((_, k) => (
            <Star key={k} className="w-3.5 h-3.5 fill-hp-bronze dark:fill-hp-gold text-hp-bronze dark:text-hp-gold" />
          ))}
        </div>
      </div>
    </article>
  )
}

function MarqueeRow({
  items,
  direction,
  duration,
  dir,
}: {
  items: Testimonial[]
  direction: "right" | "left"
  duration: number
  dir: "rtl" | "ltr"
}) {
  // Duplicate items so -50% translation lands exactly on the second copy → seamless loop.
  const doubled = [...items, ...items]
  const keyframes = direction === "right" ? "itqan-marquee-right" : "itqan-marquee-left"
  return (
    <div className="overflow-hidden" dir="ltr">
      <div
        className="marquee-track flex w-max"
        style={{
          animationName: keyframes,
          animationDuration: `${duration}s`,
          animationTimingFunction: "linear",
          animationIterationCount: "infinite",
        }}
      >
        {doubled.map((t, i) => (
          <TestimonialCard key={i} {...t} dir={dir} />
        ))}
      </div>
    </div>
  )
}

function TestimonialsMarquee({
  eyebrow,
  title,
  top,
  bottom,
  dir,
}: {
  eyebrow: string
  title: string
  top: Testimonial[]
  bottom: Testimonial[]
  dir: "rtl" | "ltr"
}) {
  return (
    <section id="voices" className="relative py-20 md:py-24 bg-hp-parchment dark:bg-hp-dark overflow-hidden transition-colors duration-500">
      <div className="container mx-auto px-6">
        <div className="text-center mb-10 md:mb-12">
          <span className="text-xs tracking-[0.35em] text-hp-bronze dark:text-hp-gold uppercase mb-4 block">{eyebrow}</span>
          <h2
            className="text-5xl md:text-6xl font-bold text-hp-navy dark:text-hp-cream leading-tight"
            style={{ fontFamily: "var(--font-heading)" }}
          >
            {title}
          </h2>
        </div>
      </div>

      {/* Two-row marquee with edge fades */}
      <div className="relative space-y-5">
        <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-24 md:w-48 bg-gradient-to-l from-hp-parchment dark:from-hp-dark to-transparent" />
        <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-24 md:w-48 bg-gradient-to-r from-hp-parchment dark:from-hp-dark to-transparent" />

        {top.length > 0 && <MarqueeRow items={top} direction="right" duration={60} dir={dir} />}
        {bottom.length > 0 && <MarqueeRow items={bottom} direction="left" duration={65} dir={dir} />}
      </div>
    </section>
  )
}

/* ============================================================
   PAGE
   ============================================================ */

export default function Home() {

  const [scrolled, setScrolled] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [settings, setSettings] = useState<Record<string, any>>({})
  // Journey fork: which door the visitor has opened ('academy' | 'maqraa' | null).
  const [journeyTrack, setJourneyTrack] = useState<"academy" | "maqraa" | null>(null)
  const { resolvedTheme, setTheme } = useTheme()
  const { locale, dir, toggleLocale, t } = useI18n()
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

  useEffect(() => {
    let cancelled = false
    fetch('/api/homepage', { cache: 'no-store' })
      .then(r => r.ok ? r.json() : { settings: {} })
      .then(data => { if (!cancelled && data?.settings) setSettings(data.settings) })
      .catch(() => { /* keep defaults */ })
    return () => { cancelled = true }
  }, [])



  // Localized + merged homepage content (defaults match the original copy).
  const c = buildHomepageContent(settings, locale)
  // Admin color overrides (8 base colors; shades derived in CSS via color-mix).
  const colorVars = buildHomepageColorVars(settings)

  // Directional arrow: points "forward" in the reading direction.
  const ForwardArrow = dir === "rtl" ? ArrowLeft : ArrowRight

  const showStats = asBool(settings.homepage_show_stats, true)
  const showFeatures = asBool(settings.homepage_show_features, true)
  const showTestimonials = asBool(settings.homepage_show_testimonials, true)
  const maintenanceOn = asBool(settings.maintenance_mode, false)
  const maintenanceFull = asBool(settings.maintenance_full_page, false)
  const maintenanceMsg = settings.maintenance_message || t.common.maintenanceMessage
  const maintenanceColor = settings.maintenance_banner_color || '#f59e0b'

  // Icons for the repeating sections (visual only — text/numbers come from CMS).
  const pillarAcademyIcons = [ScrollText, Award, Users]
  const pillarMaqraaIcons = [Mic, Calendar, BookOpen]
  const featureIcons = [Users, Mic, Star, Award, Calendar, ScrollText]

  const Logo = ({ light = false }: { light?: boolean }) =>
    c.logoUrl ? (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={c.logoUrl || "/placeholder.svg"} alt={c.brandName} className="w-full h-full object-contain p-1.5" />
    ) : (
      <>
        <div className={`absolute inset-0 rounded-xl bg-gradient-to-br ${light ? "from-hp-navy-2" : "from-hp-navy"} to-hp-green`} />
        <svg viewBox="0 0 44 44" className="absolute inset-0 w-full h-full p-2.5 text-hp-gold" fill="currentColor" aria-hidden>
          <path d="M22 4 L26 18 L40 18 L29 27 L33 41 L22 32 L11 41 L15 27 L4 18 L18 18 Z" opacity="0.95" />
        </svg>
      </>
    )

  const LangButton = ({ mobile = false }: { mobile?: boolean }) => (
    <button
      onClick={toggleLocale}
      aria-label={locale === "ar" ? "Switch to English" : "التبديل إلى العربية"}
      className={
        mobile
          ? "p-2 text-hp-navy dark:text-hp-gold flex items-center gap-1 text-sm font-medium"
          : "relative h-10 px-3 rounded-full border border-hp-ink/15 dark:border-hp-cream/20 flex items-center gap-1.5 text-hp-navy dark:text-hp-gold hover:border-hp-bronze dark:hover:border-hp-gold transition-all duration-500 text-sm font-medium"
      }
    >
      <Globe className="w-4 h-4" />
      <span>{locale === "ar" ? "EN" : "ع"}</span>
    </button>
  )

  if (maintenanceOn && maintenanceFull) {
    return (
      <div
        className="min-h-screen flex flex-col items-center justify-center px-6 text-center text-hp-ink dark:text-hp-cream bg-hp-parchment dark:bg-hp-dark"
        dir={dir}
        style={colorVars}
      >
        <div
          className="w-20 h-20 rounded-full flex items-center justify-center mb-6 text-3xl"
          style={{ backgroundColor: maintenanceColor + '22', color: maintenanceColor }}
        >
          🔧
        </div>
        <h1 className="text-3xl md:text-5xl font-bold mb-4 text-hp-navy dark:text-hp-cream">
          {maintenanceMsg}
        </h1>
      </div>
    )
  }

  return (
    <div
      className="hp-root min-h-screen bg-hp-parchment text-hp-ink dark:bg-hp-dark dark:text-hp-cream overflow-x-hidden font-sans transition-colors duration-500"
      dir={dir}
      style={colorVars}
    >
      {maintenanceOn && (
        <div
          className="sticky top-0 z-[60] w-full text-center text-sm py-3 px-4 font-medium shadow-md"
          style={{ backgroundColor: maintenanceColor, color: 'var(--hp-dark)' }}
        >
          {maintenanceMsg}
        </div>
      )}
      {/* ============ HEADER ============ */}
      <HomepageHeader />

      {/* ============ HERO ============ */}
      <section ref={heroRef} className="relative min-h-screen flex items-center pt-32 pb-20 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          {/* Ottoman carpet pattern — pure CSS, static opacity. */}
          <div
            className="absolute inset-0 bg-repeat opacity-[0.18] dark:opacity-[0.26]"
            style={{
              backgroundImage: "url(/patterns/ottoman-carpet.jpg)",
              backgroundSize: "440px",
              filter: "grayscale(1) sepia(0.45) brightness(1.05) contrast(0.95)",
            }}
          />
          {/* Soft parchment / dark wash so text stays readable */}
          <div className="absolute inset-0 bg-gradient-to-b from-hp-parchment/85 via-hp-parchment/70 to-hp-parchment dark:from-hp-dark/85 dark:via-hp-dark/75 dark:to-hp-dark" />

          {/* Breathing warm radial glow behind the headline */}
          <motion.div
            animate={{ scale: [1, 1.12, 1], opacity: [0.7, 1, 0.7] }}
            transition={{ duration: 9, repeat: Infinity, ease: "easeInOut" }}
            className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[60vw] h-[60vw] rounded-full blur-[140px] bg-hp-bronze/15 dark:bg-hp-gold/10"
          />

          {/* Large rotating eight-stars */}
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 90, repeat: Infinity, ease: "linear" }}
            className="absolute top-32 -right-20 text-hp-navy/10 dark:text-hp-gold/15"
          >
            <EightStar size={400} strokeWidth={0.4} />
          </motion.div>
          <motion.div
            animate={{ rotate: -360 }}
            transition={{ duration: 110, repeat: Infinity, ease: "linear" }}
            className="absolute bottom-20 -left-20 text-hp-green/10 dark:text-hp-gold/10"
          >
            <EightStar size={340} strokeWidth={0.4} />
          </motion.div>

          {/* Arabesque corners — pulse opacity ONLY */}
          <motion.div
            animate={{ opacity: [0.7, 1, 0.7] }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
            className="absolute top-24 right-0"
          >
            <ArabesqueCorner size={180} className="text-hp-bronze/30 dark:text-hp-gold/30" />
          </motion.div>
          <motion.div
            animate={{ opacity: [0.7, 1, 0.7] }}
            transition={{ duration: 7, repeat: Infinity, ease: "easeInOut", delay: 1.5 }}
            className="absolute bottom-10 left-0"
          >
            <ArabesqueCorner size={180} className="text-hp-bronze/30 dark:text-hp-gold/30 rotate-180" />
          </motion.div>

          {/* Gold sparks — twinkle in place */}
          {[
            { top: "18%", left: "12%", d: 12, delay: 0, dur: 5 },
            { top: "28%", left: "82%", d: 16, delay: 1.4, dur: 6 },
            { top: "62%", left: "8%", d: 9, delay: 2.8, dur: 4.5 },
            { top: "72%", left: "88%", d: 14, delay: 0.6, dur: 5.5 },
            { top: "44%", left: "20%", d: 8, delay: 3.2, dur: 4 },
            { top: "55%", left: "78%", d: 10, delay: 2, dur: 5 },
          ].map((m, i) => (
            <motion.div
              key={i}
              className="absolute rounded-full bg-hp-bronze/50 dark:bg-hp-gold/45 blur-[2px]"
              style={{ top: m.top, left: m.left, width: m.d, height: m.d }}
              animate={{
                scale: [0.6, 1.3, 0.6],
                opacity: [0.2, 0.85, 0.2],
              }}
              transition={{
                duration: m.dur,
                repeat: Infinity,
                ease: "easeInOut",
                delay: m.delay,
              }}
            />
          ))}

          {/* Eight-point sparkles */}
          {[
            { top: "22%", left: "30%", size: 22, delay: 0 },
            { top: "70%", left: "65%", size: 18, delay: 2.5 },
            { top: "38%", left: "75%", size: 14, delay: 1.2 },
          ].map((s, i) => (
            <motion.div
              key={`sparkle-${i}`}
              className="absolute text-hp-bronze/35 dark:text-hp-gold/40"
              style={{ top: s.top, left: s.left }}
              animate={{
                rotate: 360,
                scale: [0.85, 1.2, 0.85],
                opacity: [0.3, 0.9, 0.3],
              }}
              transition={{
                rotate: { duration: 20 + i * 4, repeat: Infinity, ease: "linear" },
                scale: { duration: 4 + i, repeat: Infinity, ease: "easeInOut", delay: s.delay },
                opacity: { duration: 4 + i, repeat: Infinity, ease: "easeInOut", delay: s.delay },
              }}
            >
              <EightStar size={s.size} strokeWidth={0.8} />
            </motion.div>
          ))}
        </div>

        <motion.div style={{ y: heroY, opacity: heroOpacity }} className="container mx-auto px-6 relative z-10">
          <div className="max-w-5xl mx-auto text-center pt-4 md:pt-8">
            <Reveal delay={0} y={20}>
              <div className="inline-flex items-center gap-4 mb-16 md:mb-20">
                <div className="h-px w-12 bg-hp-bronze" />
                <span className="text-lg md:text-2xl tracking-[0.15em] text-hp-bronze font-semibold">
                  {c.bismillah}
                </span>
                <div className="h-px w-12 bg-hp-bronze" />
              </div>
            </Reveal>

            <Reveal delay={0.15}>
              <h1
                className="text-[17vw] sm:text-[13vw] md:text-[10rem] lg:text-[13rem] font-normal leading-[0.9] tracking-tight text-hp-navy dark:text-hp-cream mb-10 md:mb-14"
                style={{ fontFamily: "'BIXIE', serif" }}
              >
                {c.heroTitle}
              </h1>
            </Reveal>

            <Reveal delay={0.28}>
              <div className="flex items-center justify-center gap-5 mb-10 md:mb-12" aria-hidden>
                <div className="h-px w-14 md:w-20 bg-hp-bronze/50 dark:bg-hp-gold/40" />
                <span className="text-xs tracking-[0.5em] text-hp-bronze dark:text-hp-gold">٭</span>
                <div className="h-px w-14 md:w-20 bg-hp-bronze/50 dark:bg-hp-gold/40" />
              </div>
            </Reveal>

            <Reveal delay={0.38}>
              <h2
                className="text-[7vw] sm:text-[5vw] md:text-4xl lg:text-5xl font-light text-hp-bronze dark:text-hp-gold mb-12 md:mb-14"
                style={{ fontFamily: "var(--font-cairo), sans-serif" }}
              >
                {c.heroSubtitle}
              </h2>
            </Reveal>

            <Reveal delay={0.5}>
              <OrnamentDivider className="w-72 h-10 mx-auto mb-10 text-hp-bronze dark:text-hp-gold" />
            </Reveal>

            <Reveal delay={0.6}>
              <p className="text-base md:text-lg text-hp-ink/70 dark:text-hp-cream/70 leading-loose max-w-2xl mx-auto mb-14 px-4 whitespace-pre-line">
                {c.heroDescription}
              </p>
            </Reveal>

            <Reveal delay={0.75}>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-20">
                <Link
                  href={c.ctaPrimaryLink}
                  className="group relative h-14 px-8 inline-flex items-center gap-3 bg-hp-navy text-hp-parchment dark:bg-hp-gold dark:text-hp-dark rounded-full overflow-hidden transition-all duration-500 hover:gap-5 shadow-lg shadow-hp-navy/20 dark:shadow-hp-gold/20 hover:shadow-2xl"
                >
                  <span className="absolute inset-0 bg-hp-green dark:bg-hp-gold-light translate-y-full group-hover:translate-y-0 transition-transform duration-500" />
                  <GraduationCap className="w-5 h-5 relative z-10" />
                  <span className="relative z-10 font-medium">{c.ctaPrimaryText}</span>
                  <ForwardArrow className="w-4 h-4 relative z-10" />
                </Link>
                <Link
                  href={c.ctaSecondaryLink}
                  className="group relative h-14 px-8 inline-flex items-center gap-3 border border-hp-navy/25 dark:border-hp-gold/35 text-hp-navy dark:text-hp-gold rounded-full hover:gap-5 transition-all duration-500 hover:border-hp-green hover:bg-hp-green hover:text-hp-parchment dark:hover:border-hp-gold dark:hover:bg-hp-gold dark:hover:text-hp-dark"
                >
                  <BookOpen className="w-5 h-5" />
                  <span className="font-medium">{c.ctaSecondaryText}</span>
                  <ForwardArrow className="w-4 h-4" />
                </Link>
              </div>
            </Reveal>

            {showStats && <Reveal delay={0.9}>
              <div className="grid grid-cols-2 md:grid-cols-4 max-w-4xl mx-auto border-y border-hp-ink/10 dark:border-hp-cream/10 divide-x divide-hp-ink/10 dark:divide-hp-cream/10 divide-x-reverse">
                {c.stats.map((s, i) => (
                  <div key={i} className="py-8 px-2 text-center">
                    <div className="text-3xl md:text-4xl font-bold text-hp-navy dark:text-hp-gold" style={{ fontFamily: "var(--font-heading)" }}>
                      <CountUp value={s.v} suffix={s.s} locale={locale} />
                    </div>
                    <div className="text-xs md:text-sm text-hp-ink/60 dark:text-hp-cream/60 mt-2 tracking-wide">{s.l}</div>
                  </div>
                ))}
              </div>
            </Reveal>}

            <motion.div
              animate={{ y: [0, 12, 0] }}
              transition={{ duration: 2.5, repeat: Infinity }}
              className="mt-16 text-hp-ink/40 dark:text-hp-cream/40 inline-flex flex-col items-center gap-2"
            >
              <span className="text-xs tracking-[0.3em]">{c.scrollText}</span>
              <ChevronDown className="w-4 h-4" />
            </motion.div>
          </div>
        </motion.div>
      </section>

      {/* ============ TWO PILLARS ============ */}
      <section id="sections" className="relative py-32 md:py-40 bg-hp-navy text-hp-parchment overflow-hidden">
        <TessellatedBg className="absolute inset-0 w-full h-full" color="var(--hp-gold)" opacity={0.04} id="gold" />
        <div className="absolute inset-0 bg-gradient-to-b from-hp-navy via-hp-navy to-hp-navy-deep" />

        <div className="container mx-auto px-6 relative">
          <Reveal>
            <div className="text-center mb-20 max-w-2xl mx-auto">
              <div className="inline-flex items-center gap-3 mb-6">
                <div className="h-px w-12 bg-hp-gold" />
                <span className="text-xs tracking-[0.35em] text-hp-gold uppercase">{c.pillarsEyebrow}</span>
                <div className="h-px w-12 bg-hp-gold" />
              </div>
              <h2 className="text-5xl md:text-7xl font-bold mb-6 leading-tight" style={{ fontFamily: "var(--font-heading)" }}>
                {c.pillarsTitle}
              </h2>
              <p className="text-hp-parchment/70 text-lg leading-relaxed">
                {c.pillarsSubtitle}
              </p>
            </div>
          </Reveal>

          <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 max-w-6xl mx-auto">
            {/* ACADEMY */}
            <Reveal delay={0.1}>
              <Link href={c.academy.link} className="group block relative">
                <ArchFrame className="absolute -inset-4 w-[calc(100%+2rem)] h-[calc(100%+2rem)] text-hp-gold/45 pointer-events-none" />
                <article className="relative h-full bg-gradient-to-br from-hp-parch-1 via-hp-parch-2 to-hp-parch-3 dark:from-hp-navd-1 dark:via-hp-navd-2 dark:to-hp-navd-3 rounded-t-[100px] rounded-b-2xl p-10 md:p-12 border border-hp-gold/50 dark:border-hp-gold/30 overflow-hidden transition-all duration-700 group-hover:border-hp-gold/80 dark:group-hover:border-hp-gold/60 group-hover:-translate-y-2 shadow-2xl shadow-black/40 dark:shadow-black/60">
                  <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-96 h-96 bg-hp-bronze/15 dark:bg-hp-gold/10 rounded-full blur-3xl group-hover:bg-hp-bronze/25 dark:group-hover:bg-hp-gold/20 transition-all duration-700" />
                  <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-hp-bronze/10 dark:bg-hp-gold/8 rounded-full blur-3xl" />
                  <ArabesqueCorner size={120} className="absolute top-0 right-0 text-hp-bronze/35 dark:text-hp-gold/30" />
                  <ArabesqueCorner size={120} className="absolute bottom-0 left-0 text-hp-bronze/35 dark:text-hp-gold/30 rotate-180" />

                  <div className="relative">
                    <div className="text-7xl font-bold text-hp-bronze/35 dark:text-hp-gold/30 mb-2 leading-none" style={{ fontFamily: "var(--font-heading)" }}>
                      {c.academy.number}
                    </div>
                    <div className="flex items-center gap-3 mb-2 -mt-8">
                      <span className="text-xs tracking-[0.3em] text-hp-bronze dark:text-hp-gold uppercase">{c.academy.badge}</span>
                    </div>
                    <h3 className="text-4xl md:text-5xl font-bold mb-4 text-hp-navy dark:text-hp-cream" style={{ fontFamily: "var(--font-heading)" }}>
                      {c.academy.title}
                    </h3>
                    <p className="text-hp-ink/75 dark:text-hp-cream/75 leading-loose mb-10 text-base md:text-lg">
                      {c.academy.desc}
                    </p>

                    <div className="space-y-4 mb-12">
                      {c.academy.features.map((f, i) => {
                        const Icon = pillarAcademyIcons[i] || ScrollText
                        return (
                          <div key={i} className="flex items-start gap-4 group/item">
                            <div className="w-10 h-10 rounded-full border border-hp-bronze/45 dark:border-hp-gold/40 bg-hp-bronze/10 dark:bg-hp-gold/10 flex items-center justify-center flex-shrink-0 group-hover/item:bg-hp-bronze/20 dark:group-hover/item:bg-hp-gold/20 group-hover/item:border-hp-bronze/70 dark:group-hover/item:border-hp-gold/65 transition-colors">
                              <Icon className="w-4 h-4 text-hp-bronze dark:text-hp-gold" />
                            </div>
                            <div>
                              <div className="font-semibold text-base mb-0.5 text-hp-navy dark:text-hp-cream" style={{ fontFamily: "var(--font-heading)" }}>{f.t}</div>
                              <div className="text-sm text-hp-ink/65 dark:text-hp-cream/60">{f.d}</div>
                            </div>
                          </div>
                        )
                      })}
                    </div>

                    <div className="flex items-center justify-between pt-6 border-t border-hp-bronze/30 dark:border-hp-gold/25">
                      <span className="text-hp-bronze dark:text-hp-gold font-medium">{c.academy.cta}</span>
                      <div className="w-12 h-12 rounded-full bg-hp-navy dark:bg-hp-gold text-hp-gold dark:text-hp-dark flex items-center justify-center transition-all duration-500 group-hover:scale-110 group-hover:rotate-[-45deg]">
                        <ForwardArrow className="w-5 h-5" />
                      </div>
                    </div>
                  </div>
                </article>
              </Link>
            </Reveal>

            {/* MAQRA'A */}
            <Reveal delay={0.25}>
              <Link href={c.maqraa.link} className="group block relative">
                <ArchFrame className="absolute -inset-4 w-[calc(100%+2rem)] h-[calc(100%+2rem)] text-hp-gold/45 pointer-events-none" />
                <article className="relative h-full bg-gradient-to-br from-hp-parchm-1 via-hp-parchm-2 to-hp-parchm-3 dark:from-hp-gold dark:via-hp-gold-light dark:to-hp-gold rounded-t-[100px] rounded-b-2xl p-10 md:p-12 border border-hp-gold/50 dark:border-hp-dark/30 overflow-hidden transition-all duration-700 group-hover:border-hp-gold/80 dark:group-hover:border-hp-dark/50 group-hover:-translate-y-2 shadow-2xl shadow-black/40 dark:shadow-black/60">
                  <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-96 h-96 bg-hp-bronze/18 dark:bg-hp-dark/10 rounded-full blur-3xl group-hover:bg-hp-bronze/28 dark:group-hover:bg-hp-dark/15 transition-all duration-700" />
                  <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-hp-bronze/12 dark:bg-hp-dark/8 rounded-full blur-3xl" />
                  <ArabesqueCorner size={120} className="absolute top-0 right-0 text-hp-bronze/35 dark:text-hp-dark/25" />
                  <ArabesqueCorner size={120} className="absolute bottom-0 left-0 text-hp-bronze/35 dark:text-hp-dark/25 rotate-180" />

                  <div className="relative">
                    <div className="text-7xl font-bold text-hp-bronze/35 dark:text-hp-dark/30 mb-2 leading-none" style={{ fontFamily: "var(--font-heading)" }}>
                      {c.maqraa.number}
                    </div>
                    <div className="flex items-center gap-3 mb-2 -mt-8">
                      <span className="text-xs tracking-[0.3em] text-hp-bronze dark:text-hp-dark/80 uppercase">{c.maqraa.badge}</span>
                    </div>
                    <h3 className="text-4xl md:text-5xl font-bold mb-4 text-hp-green dark:text-hp-dark" style={{ fontFamily: "var(--font-heading)" }}>
                      {c.maqraa.title}
                    </h3>
                    <p className="text-hp-ink/75 dark:text-hp-dark/85 leading-loose mb-10 text-base md:text-lg">
                      {c.maqraa.desc}
                    </p>

                    <div className="space-y-4 mb-12">
                      {c.maqraa.features.map((f, i) => {
                        const Icon = pillarMaqraaIcons[i] || Mic
                        return (
                          <div key={i} className="flex items-start gap-4 group/item">
                            <div className="w-10 h-10 rounded-full border border-hp-bronze/45 dark:border-hp-dark/40 bg-hp-bronze/10 dark:bg-hp-dark/10 flex items-center justify-center flex-shrink-0 group-hover/item:bg-hp-bronze/20 dark:group-hover/item:bg-hp-dark/20 group-hover/item:border-hp-bronze/70 dark:group-hover/item:border-hp-dark/60 transition-colors">
                              <Icon className="w-4 h-4 text-hp-bronze dark:text-hp-dark" />
                            </div>
                            <div>
                              <div className="font-semibold text-base mb-0.5 text-hp-green dark:text-hp-dark" style={{ fontFamily: "var(--font-heading)" }}>{f.t}</div>
                              <div className="text-sm text-hp-ink/65 dark:text-hp-dark/75">{f.d}</div>
                            </div>
                          </div>
                        )
                      })}
                    </div>

                    <div className="flex items-center justify-between pt-6 border-t border-hp-bronze/30 dark:border-hp-dark/25">
                      <span className="text-hp-bronze dark:text-hp-dark font-medium">{c.maqraa.cta}</span>
                      <div className="w-12 h-12 rounded-full bg-hp-green dark:bg-hp-dark text-hp-gold dark:text-hp-gold flex items-center justify-center transition-all duration-500 group-hover:scale-110 group-hover:rotate-[-45deg]">
                        <ForwardArrow className="w-5 h-5" />
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
      {showFeatures && <section id="features" className="relative py-32 md:py-40 bg-hp-parchment dark:bg-hp-dark overflow-hidden transition-colors duration-500">
        <div className="absolute inset-0 pointer-events-none">
          <EightStar size={500} className="absolute -top-40 -left-40 text-hp-navy/5 dark:text-hp-gold/8" strokeWidth={0.3} />
          <EightStar size={400} className="absolute -bottom-32 -right-32 text-hp-green/5 dark:text-hp-gold/6" strokeWidth={0.3} />
        </div>

        <div className="container mx-auto px-6 relative">
          <Reveal>
            <div className="grid lg:grid-cols-12 gap-10 mb-20">
              <div className="lg:col-span-5">
                <span className="text-xs tracking-[0.35em] text-hp-bronze dark:text-hp-gold uppercase mb-4 block">{c.featuresEyebrow}</span>
                <h2 className="text-5xl md:text-6xl font-bold leading-tight text-hp-navy dark:text-hp-cream" style={{ fontFamily: "var(--font-heading)" }}>
                  {c.featuresTitle}
                </h2>
              </div>
              <div className="lg:col-span-6 lg:col-start-7 flex items-end">
                <p className="text-lg text-hp-ink/65 dark:text-hp-cream/65 leading-loose">
                  {c.featuresSubtitle}
                </p>
              </div>
            </div>
          </Reveal>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {c.features.map((f, i) => {
              const Icon = featureIcons[i] || Star
              return (
                <Reveal key={i} delay={i * 0.08}>
                  <article className="group relative h-full p-10 bg-hp-card dark:bg-hp-dark-2 border border-hp-navy/10 dark:border-hp-gold/15 rounded-2xl overflow-hidden hover:border-hp-bronze/40 dark:hover:border-hp-gold/45 transition-all duration-500">
                    <div className="absolute top-0 left-0 w-20 h-20">
                      <ArabesqueCorner size={80} color="var(--hp-bronze)" className="opacity-20 dark:opacity-30 group-hover:opacity-40 dark:group-hover:opacity-50 transition-opacity" />
                    </div>

                    <div className="relative">
                      <div className="flex items-center justify-between mb-8">
                        <span className="text-3xl font-bold text-hp-bronze/60 dark:text-hp-gold/55" style={{ fontFamily: "var(--font-heading)" }}>
                          {f.num}
                        </span>
                        <div className="w-12 h-12 rounded-full bg-hp-navy/5 dark:bg-hp-gold/10 flex items-center justify-center transition-all duration-500 group-hover:bg-hp-navy dark:group-hover:bg-hp-gold group-hover:rotate-12">
                          <Icon className="w-5 h-5 text-hp-navy dark:text-hp-gold group-hover:text-hp-gold dark:group-hover:text-hp-navy transition-colors" />
                        </div>
                      </div>
                      <h3 className="text-2xl font-bold text-hp-navy dark:text-hp-cream mb-3" style={{ fontFamily: "var(--font-heading)" }}>
                        {f.t}
                      </h3>
                      <p className="text-hp-ink/65 dark:text-hp-cream/65 leading-loose text-sm">{f.d}</p>
                    </div>

                    <div className="absolute bottom-0 inset-x-10 h-px bg-gradient-to-r from-transparent via-hp-bronze/30 dark:via-hp-gold/40 to-transparent scale-x-0 group-hover:scale-x-100 transition-transform duration-700" />
                  </article>
                </Reveal>
              )
            })}
          </div>
        </div>
      </section>}

      {/* ============ JOURNEY ============ */}
      <section id="journey" className="relative py-32 md:py-40 bg-hp-card dark:bg-hp-dark-3 border-y border-hp-navy/10 dark:border-hp-gold/15 overflow-hidden transition-colors duration-500">
        <div className="container mx-auto px-6">
          <Reveal>
            <div className="text-center mb-20 max-w-2xl mx-auto">
              <span className="text-xs tracking-[0.35em] text-hp-bronze dark:text-hp-gold uppercase mb-4 block">{c.journeyEyebrow}</span>
              <OrnamentDivider className="w-48 h-8 mx-auto mb-6 text-hp-bronze dark:text-hp-gold" />
              <h2 className="text-5xl md:text-6xl font-bold text-hp-navy dark:text-hp-cream leading-tight mb-6" style={{ fontFamily: "var(--font-heading)" }}>
                {c.journeyTitle}
              </h2>
              <p className="text-lg text-hp-ink/65 dark:text-hp-cream/65">
                {c.journeySubtitle}
              </p>
            </div>
          </Reveal>

          {/* ---- The two doors (fork in the road) ---- */}
          <div className="max-w-4xl mx-auto grid sm:grid-cols-2 gap-6 md:gap-10">
            {([
              { key: "academy" as const, icon: GraduationCap, label: c.journeyAcademyLabel, tagline: c.journeyAcademyTagline, link: c.academy.link, cta: c.academy.cta },
              { key: "maqraa" as const, icon: Mic, label: c.journeyMaqraaLabel, tagline: c.journeyMaqraaTagline, link: c.maqraa.link, cta: c.maqraa.cta },
            ]).map((door, i) => {
              const Icon = door.icon
              const active = journeyTrack === door.key
              return (
                <Reveal key={door.key} delay={i * 0.12}>
                  <button
                    type="button"
                    onClick={() => setJourneyTrack(active ? null : door.key)}
                    aria-pressed={active}
                    className={`group relative w-full overflow-hidden rounded-t-[5rem] rounded-b-2xl border text-center px-8 pt-14 pb-10 transition-all duration-500 ${
                      active
                        ? "border-hp-bronze dark:border-hp-gold bg-hp-navy text-hp-parchment shadow-2xl shadow-hp-navy/25 -translate-y-1"
                        : "border-hp-navy/15 dark:border-hp-gold/20 bg-hp-card dark:bg-hp-dark-2 hover:-translate-y-1 hover:border-hp-bronze/60 dark:hover:border-hp-gold/50 hover:shadow-xl"
                    }`}
                  >
                    {/* Arched ornament frame */}
                    <ArchFrame
                      className={`absolute inset-x-6 top-4 bottom-0 h-[calc(100%-1rem)] w-auto mx-auto transition-colors duration-500 ${
                        active ? "text-hp-gold/40" : "text-hp-bronze/15 dark:text-hp-gold/15 group-hover:text-hp-bronze/35 dark:group-hover:text-hp-gold/30"
                      }`}
                    />
                    <div className="relative">
                      <span
                        className={`mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full border transition-all duration-500 ${
                          active
                            ? "border-hp-gold/50 bg-hp-gold text-hp-navy"
                            : "border-hp-bronze/25 dark:border-hp-gold/25 bg-hp-navy/5 dark:bg-hp-gold/10 text-hp-navy dark:text-hp-gold group-hover:scale-110"
                        }`}
                      >
                        <Icon className="h-9 w-9" />
                      </span>
                      <h3
                        className={`text-3xl md:text-4xl font-bold mb-3 transition-colors ${active ? "text-hp-parchment" : "text-hp-navy dark:text-hp-cream"}`}
                        style={{ fontFamily: "var(--font-heading)" }}
                      >
                        {door.label}
                      </h3>
                      <p className={`text-sm md:text-base leading-relaxed mb-6 transition-colors ${active ? "text-hp-parchment/75" : "text-hp-ink/60 dark:text-hp-cream/60"}`}>
                        {door.tagline}
                      </p>
                      <span
                        className={`inline-flex items-center gap-2 text-sm font-bold tracking-wide transition-colors ${
                          active ? "text-hp-gold" : "text-hp-bronze dark:text-hp-gold"
                        }`}
                      >
                        <span>{active ? door.cta : c.scrollText}</span>
                        <ChevronDown className={`w-4 h-4 transition-transform duration-500 ${active ? "rotate-180" : ""}`} />
                      </span>
                    </div>
                  </button>
                </Reveal>
              )
            })}
          </div>

          {/* ---- The selected track's timeline ---- */}
          <AnimatePresence mode="wait">
            {journeyTrack && (
              <motion.div
                key={journeyTrack}
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.5, ease: "easeInOut" }}
                className="overflow-hidden"
              >
                <div className="max-w-3xl mx-auto pt-16">
                  <OrnamentDivider className="w-40 h-7 mx-auto mb-12 text-hp-bronze dark:text-hp-gold" />
                  {(journeyTrack === "academy" ? c.academySteps : c.maqraaSteps).map((step, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: dir === "rtl" ? 24 : -24 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.1, duration: 0.45 }}
                      className="group relative flex gap-6 md:gap-10 py-8 border-b border-hp-navy/10 dark:border-hp-gold/15 last:border-0"
                    >
                      <div className="flex-shrink-0">
                        <div
                          className="flex h-16 w-16 md:h-20 md:w-20 items-center justify-center rounded-full border border-hp-bronze/25 dark:border-hp-gold/25 bg-hp-navy/5 dark:bg-hp-gold/10 text-3xl md:text-4xl font-bold text-hp-bronze dark:text-hp-gold leading-none transition-all duration-500 group-hover:bg-hp-navy dark:group-hover:bg-hp-gold group-hover:text-hp-gold dark:group-hover:text-hp-navy"
                          style={{ fontFamily: "var(--font-heading)" }}
                        >
                          {step.n}
                        </div>
                      </div>
                      <div className="flex-1 pt-2">
                        <h4 className="text-xl md:text-2xl font-bold text-hp-navy dark:text-hp-cream mb-2" style={{ fontFamily: "var(--font-heading)" }}>
                          {step.t}
                        </h4>
                        <p className="text-hp-ink/65 dark:text-hp-cream/65 leading-loose">{step.d}</p>
                      </div>
                    </motion.div>
                  ))}

                  {/* Track CTA */}
                  <div className="text-center pt-12">
                    <Link
                      href={journeyTrack === "academy" ? c.academy.link : c.maqraa.link}
                      className="group inline-flex h-14 items-center gap-3 rounded-full bg-hp-navy dark:bg-hp-gold px-10 font-bold text-hp-parchment dark:text-hp-navy transition-all duration-500 hover:gap-5 shadow-xl shadow-hp-navy/20"
                    >
                      <span>{journeyTrack === "academy" ? c.academy.cta : c.maqraa.cta}</span>
                      <ForwardArrow className="w-5 h-5 transition-transform duration-500 group-hover:-translate-x-1" />
                    </Link>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ---- Both paths meet ---- */}
          <Reveal>
            <div className="max-w-2xl mx-auto text-center mt-20">
              <OrnamentDivider className="w-48 h-8 mx-auto mb-6 text-hp-bronze/60 dark:text-hp-gold/60" />
              <p className="text-lg md:text-xl text-hp-navy/80 dark:text-hp-cream/75 leading-loose" style={{ fontFamily: "var(--font-heading)" }}>
                {c.journeyMeetText}
              </p>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ============ TESTIMONIALS ============ */}
      {showTestimonials && (
        <TestimonialsMarquee
          eyebrow={c.testimonialsEyebrow}
          title={c.testimonialsTitle}
          top={c.testimonialsTop}
          bottom={c.testimonialsBottom}
          dir={dir}
        />
      )}

      {/* ============ CTA ============ */}
      <section className="relative py-32 md:py-40 bg-hp-navy text-hp-parchment overflow-hidden">
        {/* Ottoman carpet pattern */}
        <div
          className="absolute inset-0 bg-repeat opacity-[0.22] pointer-events-none"
          style={{
            backgroundImage: "url(/patterns/ottoman-carpet.jpg)",
            backgroundSize: "440px",
            filter: "grayscale(1) sepia(0.55) brightness(0.95) contrast(1)",
          }}
        />
        {/* Navy wash to keep text readable */}
        <div className="absolute inset-0 bg-gradient-to-b from-hp-navy/85 via-hp-navy/75 to-hp-navy/90 pointer-events-none" />
        {/* Gold seams */}
        <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-hp-gold/40 to-transparent" />
        <div className="absolute bottom-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-hp-gold/30 to-transparent" />

        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 100, repeat: Infinity, ease: "linear" }}
          className="absolute -top-40 -right-40 text-hp-gold/10"
        >
          <EightStar size={500} strokeWidth={0.4} />
        </motion.div>
        <motion.div
          animate={{ rotate: -360 }}
          transition={{ duration: 120, repeat: Infinity, ease: "linear" }}
          className="absolute -bottom-40 -left-40 text-hp-gold/10"
        >
          <EightStar size={500} strokeWidth={0.4} />
        </motion.div>

        <div className="container mx-auto px-6 relative">
          <Reveal>
            <div className="max-w-3xl mx-auto text-center">
              <Sparkles className="w-10 h-10 text-hp-gold mx-auto mb-6" />
              <OrnamentDivider className="w-48 h-8 mx-auto mb-8 text-hp-gold" />
              <h2 className="text-5xl md:text-7xl font-bold mb-8 leading-tight" style={{ fontFamily: "var(--font-heading)" }}>
                {c.ctaTitle}
              </h2>
              <p className="text-lg md:text-xl text-hp-parchment/70 leading-loose mb-12">
                {c.ctaDesc}{" "}
                <span className="text-hp-gold" style={{ fontFamily: "var(--font-heading)" }}>{c.ctaHadith}</span>.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link
                  href={c.ctaButtonPrimaryLink}
                  className="group h-14 px-10 inline-flex items-center gap-3 bg-hp-gold text-hp-navy rounded-full font-bold transition-all duration-500 hover:gap-5 shadow-2xl shadow-hp-gold/20"
                >
                  <span>{c.ctaButtonPrimary}</span>
                  <ForwardArrow className="w-5 h-5 transition-transform duration-500 group-hover:-translate-x-1" />
                </Link>
                <Link
                  href={c.ctaButtonSecondaryLink}
                  className="h-14 px-10 inline-flex items-center gap-3 border border-hp-parchment/25 rounded-full hover:bg-hp-parchment/5 transition-colors"
                >
                  {c.ctaButtonSecondary}
                </Link>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ============ FOOTER ============ */}
      <footer className="relative bg-hp-navy-deep text-hp-parchment/85 pt-20 pb-10 overflow-hidden">
        {/* Ottoman carpet — woven texture beneath the dark wash */}
        <div
          className="absolute inset-0 bg-repeat opacity-[0.18] mix-blend-overlay pointer-events-none"
          style={{
            backgroundImage: "url(/patterns/ottoman-carpet.jpg)",
            backgroundSize: "440px",
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-hp-navy-deep via-hp-navy-deep/92 to-hp-navy-deep pointer-events-none" />
        {/* Top thin gold seam */}
        <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-hp-gold/40 to-transparent" />

        <div className="container mx-auto px-6 relative">
          <div className="grid lg:grid-cols-12 gap-10 pb-12 border-b border-hp-parchment/10">
            <div className="lg:col-span-5">
              <div className="flex items-center gap-3 mb-6">
                <div className="relative w-12 h-12">
                  <Logo light />
                </div>
                <div>
                  <div className="text-2xl font-bold text-hp-parchment" style={{ fontFamily: "var(--font-heading)" }}>
                    {c.brandName}
                  </div>
                  <div className="text-[10px] tracking-[0.2em] text-hp-parchment/50 uppercase">
                    {c.brandTagline}
                  </div>
                </div>
              </div>
              <p className="text-hp-parchment/60 leading-loose max-w-md mb-6">
                {c.footerDesc}
              </p>
              <OrnamentDivider className="w-40 h-6 text-hp-gold/50" />
            </div>

            <div className="lg:col-span-7 grid grid-cols-2 md:grid-cols-3 gap-8">
              {c.footerColumns.map((col, i) => (
                <div key={i}>
                  <h4 className="text-sm font-bold text-hp-gold mb-5 tracking-wider">{col.title}</h4>
                  <ul className="space-y-3 text-sm">
                    {col.links.map((l, k) => (
                      <li key={k}><Link href={l.href} className="hover:text-hp-gold transition-colors">{l.label}</Link></li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-hp-parchment/55">
            <div>© {new Date().getFullYear()} {c.footerCopyright}</div>
            <div className="flex items-center gap-2">
              <span>{c.footerMadePre}</span>
              <span className="text-hp-gold">♥</span>
              <span>{c.footerMadePost}</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
