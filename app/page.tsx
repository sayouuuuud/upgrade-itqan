"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import Link from "next/link"
import { motion, useScroll, useTransform, useInView, AnimatePresence } from "framer-motion"
import { 
  BookOpen, GraduationCap, Users, Play, Mic2, Award, 
  ChevronLeft, Moon, Sun, Star, Sparkles, Volume2,
  Clock, Trophy, Heart, ArrowLeft, Menu, X
} from "lucide-react"

// Islamic Geometric Pattern Component
function IslamicPattern() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-[0.04] dark:opacity-[0.03]">
      <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="islamic-pattern" x="0" y="0" width="120" height="120" patternUnits="userSpaceOnUse">
            {/* 8-pointed star */}
            <path d="M60 10 L70 40 L100 40 L75 60 L85 90 L60 70 L35 90 L45 60 L20 40 L50 40 Z" fill="none" stroke="currentColor" strokeWidth="0.5"/>
            {/* Inner circle */}
            <circle cx="60" cy="60" r="25" fill="none" stroke="currentColor" strokeWidth="0.5"/>
            {/* Outer circle */}
            <circle cx="60" cy="60" r="45" fill="none" stroke="currentColor" strokeWidth="0.3"/>
            {/* Diamond */}
            <path d="M60 15 L105 60 L60 105 L15 60 Z" fill="none" stroke="currentColor" strokeWidth="0.3"/>
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#islamic-pattern)" className="text-primary"/>
      </svg>
    </div>
  )
}

// Floating Stars Animation
function FloatingStars() {
  const [stars, setStars] = useState<Array<{id: number; size: number; x: number; y: number; duration: number; delay: number}>>([])

  useEffect(() => {
    setStars(Array.from({ length: 25 }, (_, i) => ({
      id: i,
      size: Math.random() * 6 + 3,
      x: Math.random() * 100,
      y: Math.random() * 100,
      duration: Math.random() * 4 + 3,
      delay: Math.random() * 3,
    })))
  }, [])

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {stars.map((star) => (
        <motion.div
          key={star.id}
          className="absolute"
          style={{
            left: `${star.x}%`,
            top: `${star.y}%`,
            width: star.size,
            height: star.size,
          }}
          animate={{
            opacity: [0.1, 0.7, 0.1],
            scale: [1, 1.3, 1],
            rotate: [0, 180, 360],
          }}
          transition={{
            duration: star.duration,
            repeat: Infinity,
            delay: star.delay,
            ease: "easeInOut",
          }}
        >
          <Star className="w-full h-full text-accent fill-accent/50" />
        </motion.div>
      ))}
    </div>
  )
}

// Animated Counter Component
function AnimatedCounter({ value, suffix = "" }: { value: number; suffix?: string }) {
  const [count, setCount] = useState(0)
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true })

  useEffect(() => {
    if (isInView) {
      const duration = 2000
      const steps = 60
      const increment = value / steps
      let current = 0
      const timer = setInterval(() => {
        current += increment
        if (current >= value) {
          setCount(value)
          clearInterval(timer)
        } else {
          setCount(Math.floor(current))
        }
      }, duration / steps)
      return () => clearInterval(timer)
    }
  }, [isInView, value])

  return (
    <span ref={ref} className="tabular-nums">
      {count.toLocaleString("ar-EG")}{suffix}
    </span>
  )
}

// Audio Wave Animation
function AudioWave({ isPlaying = true }: { isPlaying?: boolean }) {
  return (
    <div className="flex items-center justify-center gap-[3px] h-16">
      {[...Array(16)].map((_, i) => (
        <motion.div
          key={i}
          className="w-1.5 rounded-full bg-gradient-to-t from-accent via-primary to-accent"
          animate={isPlaying ? {
            height: ["15%", "85%", "35%", "95%", "25%", "70%"],
          } : { height: "20%" }}
          transition={{
            duration: 1.4,
            repeat: Infinity,
            delay: i * 0.08,
            ease: "easeInOut",
          }}
          style={{ height: "40%" }}
        />
      ))}
    </div>
  )
}

// Mouse Follower Glow
function MouseGlow() {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 })

  const handleMouseMove = useCallback((e: MouseEvent) => {
    setMousePos({ x: e.clientX, y: e.clientY })
  }, [])

  useEffect(() => {
    window.addEventListener("mousemove", handleMouseMove)
    return () => window.removeEventListener("mousemove", handleMouseMove)
  }, [handleMouseMove])

  return (
    <motion.div
      className="fixed w-96 h-96 rounded-full pointer-events-none z-0 hidden lg:block"
      style={{
        background: "radial-gradient(circle, rgba(201,169,98,0.08) 0%, transparent 70%)",
      }}
      animate={{
        x: mousePos.x - 192,
        y: mousePos.y - 192,
      }}
      transition={{ type: "spring", damping: 30, stiffness: 200 }}
    />
  )
}

// Parallax Text
function ParallaxText({ children, baseVelocity = 1 }: { children: React.ReactNode; baseVelocity?: number }) {
  const { scrollY } = useScroll()
  const y = useTransform(scrollY, [0, 1000], [0, baseVelocity * 100])

  return (
    <motion.div style={{ y }}>
      {children}
    </motion.div>
  )
}

// Main Section Card with 3D Hover Effect
function SectionCard({ 
  title, 
  description, 
  icon: Icon, 
  href, 
  gradient, 
  features,
  delay = 0 
}: { 
  title: string
  description: string
  icon: React.ElementType
  href: string
  gradient: string
  features: string[]
  delay?: number
}) {
  const [isHovered, setIsHovered] = useState(false)
  const [rotateX, setRotateX] = useState(0)
  const [rotateY, setRotateY] = useState(0)
  const ref = useRef<HTMLDivElement>(null)
  const isInView = useInView(ref, { once: true, margin: "-100px" })

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!ref.current) return
    const rect = ref.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    const centerX = rect.width / 2
    const centerY = rect.height / 2
    setRotateX((y - centerY) / 20)
    setRotateY((centerX - x) / 20)
  }

  const handleMouseLeave = () => {
    setRotateX(0)
    setRotateY(0)
    setIsHovered(false)
  }

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 60 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.8, delay, ease: "easeOut" }}
      className="relative group perspective-1000"
      onMouseEnter={() => setIsHovered(true)}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      <Link href={href}>
        <motion.div
          className={`relative overflow-hidden rounded-3xl p-8 md:p-12 h-full min-h-[480px] ${gradient} cursor-pointer`}
          style={{
            transformStyle: "preserve-3d",
            rotateX: rotateX,
            rotateY: rotateY,
          }}
          whileHover={{ scale: 1.02 }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
        >
          {/* Floating particles on hover */}
          <AnimatePresence>
            {isHovered && (
              <>
                {[...Array(12)].map((_, i) => (
                  <motion.div
                    key={i}
                    className="absolute w-2 h-2 rounded-full bg-white/40"
                    initial={{ 
                      x: "50%", 
                      y: "50%", 
                      opacity: 0, 
                      scale: 0 
                    }}
                    animate={{ 
                      x: `${Math.random() * 100}%`, 
                      y: `${Math.random() * 100}%`, 
                      opacity: [0, 1, 0],
                      scale: [0, 1.5, 0]
                    }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 2, delay: i * 0.08 }}
                  />
                ))}
              </>
            )}
          </AnimatePresence>

          {/* Animated gradient overlay */}
          <motion.div
            className="absolute inset-0 bg-gradient-to-br from-white/0 via-white/10 to-white/0"
            animate={{
              backgroundPosition: isHovered ? ["0% 0%", "100% 100%"] : "0% 0%",
            }}
            transition={{ duration: 2, repeat: isHovered ? Infinity : 0, repeatType: "reverse" }}
          />

          {/* Icon with glow effect */}
          <motion.div 
            className="relative mb-8"
            animate={isHovered ? { scale: 1.15, y: -8 } : { scale: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 400 }}
          >
            <div className="absolute inset-0 bg-white/30 rounded-full blur-2xl scale-[2]" />
            <div className="relative w-24 h-24 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30">
              <Icon className="w-12 h-12 text-white" />
            </div>
          </motion.div>

          {/* Content */}
          <h3 className="text-3xl md:text-5xl font-bold text-white mb-4">{title}</h3>
          <p className="text-white/80 text-lg md:text-xl mb-10 leading-relaxed max-w-md">{description}</p>

          {/* Features list */}
          <ul className="space-y-4">
            {features.map((feature, i) => (
              <motion.li 
                key={i}
                className="flex items-center gap-4 text-white/90 text-lg"
                initial={{ opacity: 0, x: -30 }}
                animate={isInView ? { opacity: 1, x: 0 } : {}}
                transition={{ delay: delay + 0.4 + i * 0.1 }}
              >
                <motion.div 
                  className="w-3 h-3 rounded-full bg-white/70"
                  animate={isHovered ? { scale: [1, 1.5, 1] } : {}}
                  transition={{ duration: 0.5, delay: i * 0.1 }}
                />
                <span>{feature}</span>
              </motion.li>
            ))}
          </ul>

          {/* Arrow indicator */}
          <motion.div 
            className="absolute bottom-8 left-8 flex items-center gap-3 text-white/90"
            animate={isHovered ? { x: -15, scale: 1.05 } : { x: 0, scale: 1 }}
          >
            <span className="text-lg font-medium">ابدأ الآن</span>
            <motion.div
              animate={isHovered ? { x: [0, -8, 0] } : {}}
              transition={{ duration: 0.8, repeat: Infinity }}
            >
              <ArrowLeft className="w-5 h-5" />
            </motion.div>
          </motion.div>

          {/* Decorative corners */}
          <div className="absolute top-0 left-0 w-40 h-40 bg-white/10 rounded-br-[100px]" />
          <div className="absolute bottom-0 right-0 w-60 h-60 bg-black/10 rounded-tl-[100px]" />
          
          {/* Border glow on hover */}
          <motion.div
            className="absolute inset-0 rounded-3xl border-2 border-white/0"
            animate={isHovered ? { borderColor: "rgba(255,255,255,0.3)" } : {}}
          />
        </motion.div>
      </Link>
    </motion.div>
  )
}

// Feature Card Component
function FeatureCard({ 
  icon: Icon, 
  title, 
  description, 
  index 
}: { 
  icon: React.ElementType
  title: string
  description: string
  index: number 
}) {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: "-50px" })

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 40, scale: 0.95 }}
      animate={isInView ? { opacity: 1, y: 0, scale: 1 } : {}}
      transition={{ duration: 0.6, delay: index * 0.1, ease: "easeOut" }}
      whileHover={{ y: -12, scale: 1.03 }}
      className="group relative bg-card rounded-2xl p-8 border border-border/50 hover:border-accent/50 transition-all duration-500 hover:shadow-2xl hover:shadow-accent/10"
    >
      {/* Gradient background on hover */}
      <motion.div 
        className="absolute inset-0 bg-gradient-to-br from-accent/10 via-primary/5 to-transparent rounded-2xl"
        initial={{ opacity: 0 }}
        whileHover={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      />
      
      <div className="relative">
        <motion.div 
          className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/15 to-accent/15 flex items-center justify-center mb-6"
          whileHover={{ scale: 1.15, rotate: 5 }}
          transition={{ type: "spring", stiffness: 400 }}
        >
          <Icon className="w-8 h-8 text-primary" />
        </motion.div>
        <h4 className="text-xl font-bold text-foreground mb-3">{title}</h4>
        <p className="text-muted-foreground leading-relaxed">{description}</p>
      </div>
    </motion.div>
  )
}

// Testimonial Card
function TestimonialCard({ 
  quote, 
  author, 
  role, 
  index 
}: { 
  quote: string
  author: string
  role: string
  index: number 
}) {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true })

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, scale: 0.9, rotateY: -15 }}
      animate={isInView ? { opacity: 1, scale: 1, rotateY: 0 } : {}}
      transition={{ duration: 0.6, delay: index * 0.15 }}
      whileHover={{ y: -8 }}
      className="relative bg-card rounded-3xl p-8 border border-border/50 hover:border-primary/30 transition-all duration-300"
    >
      <div className="absolute -top-6 right-8 w-12 h-12 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white text-3xl font-serif">
        &ldquo;
      </div>
      <p className="text-foreground/80 text-lg leading-relaxed mb-8 mt-4">{quote}</p>
      <div className="flex items-center gap-4">
        <div className="w-14 h-14 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white font-bold text-xl">
          {author.charAt(0)}
        </div>
        <div>
          <p className="font-bold text-foreground text-lg">{author}</p>
          <p className="text-sm text-muted-foreground">{role}</p>
        </div>
      </div>
    </motion.div>
  )
}

export default function HomePage() {
  const [isDark, setIsDark] = useState(false)
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const heroRef = useRef(null)
  const { scrollYProgress } = useScroll()
  
  const heroOpacity = useTransform(scrollYProgress, [0, 0.25], [1, 0])
  const heroScale = useTransform(scrollYProgress, [0, 0.25], [1, 0.9])
  const heroY = useTransform(scrollYProgress, [0, 0.25], [0, 100])

  useEffect(() => {
    const dark = document.documentElement.classList.contains("dark")
    setIsDark(dark)

    const handleScroll = () => {
      setScrolled(window.scrollY > 50)
    }
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  const toggleDark = () => {
    document.documentElement.classList.toggle("dark")
    setIsDark(!isDark)
  }

  const features = [
    { icon: BookOpen, title: "حفظ القرآن الكريم", description: "منهجية متدرجة لحفظ القرآن الكريم مع متابعة يومية مكثفة من معلمين متخصصين" },
    { icon: Mic2, title: "تلاوات متميزة", description: "استمع لأجمل التلاوات من كبار القراء حول العالم بجودة صوت استثنائية" },
    { icon: Users, title: "حلقات تفاعلية", description: "انضم إلى حلقات قرآنية مباشرة مع معلمين متخصصين وطلاب من حول العالم" },
    { icon: Award, title: "شهادات معتمدة", description: "احصل على إجازات وشهادات معتمدة في القرآن الكريم والقراءات" },
    { icon: Trophy, title: "مسابقات قرآنية", description: "شارك في مسابقات وتحديات قرآنية لتحفيز رحلتك وكسب الجوائز" },
    { icon: Heart, title: "مجتمع داعم", description: "كن جزءاً من مجتمع قرآني داعم ومحفز يساعدك على الاستمرار" },
  ]

  const testimonials = [
    { quote: "منصة إتقان غيرت حياتي بالكامل، أصبحت أقرأ القرآن بطلاقة وأحفظ بسهولة لم أكن أتخيلها من قبل", author: "أحمد محمد", role: "طالب في الأكاديمية" },
    { quote: "التعليم هنا مختلف تماماً عن أي مكان آخر، المعلمون متميزون والمنهجية فعالة جداً ومدروسة", author: "فاطمة علي", role: "معلمة قرآن" },
    { quote: "أفضل منصة قرآنية جربتها في حياتي، أنصح كل الآباء بتسجيل أبنائهم فيها فوراً", author: "محمد الأحمد", role: "ولي أمر" },
  ]

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden" dir="rtl">
      <MouseGlow />
      
      {/* Header */}
      <motion.header 
        className={`fixed top-0 right-0 left-0 z-50 transition-all duration-500 ${
          scrolled 
            ? "bg-background/80 backdrop-blur-xl border-b border-border/50 shadow-lg shadow-black/5" 
            : "bg-transparent"
        }`}
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      >
        <div className="container mx-auto px-4 md:px-6">
          <div className="flex items-center justify-between h-20">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-3 group">
              <motion.div 
                className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg shadow-primary/25"
                whileHover={{ scale: 1.1, rotate: 5 }}
                transition={{ type: "spring", stiffness: 400 }}
              >
                <BookOpen className="w-6 h-6 text-white" />
              </motion.div>
              <div>
                <span className="text-2xl font-bold bg-gradient-to-l from-primary to-accent bg-clip-text text-transparent">
                  إتقان
                </span>
                <span className="block text-xs text-muted-foreground -mt-1">حلقة القرآن</span>
              </div>
            </Link>

            {/* Desktop Nav */}
            <nav className="hidden md:flex items-center gap-10">
              {[
                { href: "#features", label: "المميزات" },
                { href: "#sections", label: "الأقسام" },
                { href: "#testimonials", label: "آراء الطلاب" },
              ].map((link) => (
                <Link 
                  key={link.href}
                  href={link.href} 
                  className="relative text-muted-foreground hover:text-foreground transition-colors group"
                >
                  {link.label}
                  <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-primary to-accent group-hover:w-full transition-all duration-300" />
                </Link>
              ))}
            </nav>

            {/* Actions */}
            <div className="flex items-center gap-4">
              <motion.button
                onClick={toggleDark}
                className="w-11 h-11 rounded-full bg-secondary flex items-center justify-center hover:bg-secondary/80 transition-colors"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
              >
                <AnimatePresence mode="wait">
                  {isDark ? (
                    <motion.div
                      key="sun"
                      initial={{ rotate: -90, opacity: 0, scale: 0 }}
                      animate={{ rotate: 0, opacity: 1, scale: 1 }}
                      exit={{ rotate: 90, opacity: 0, scale: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <Sun className="w-5 h-5 text-accent" />
                    </motion.div>
                  ) : (
                    <motion.div
                      key="moon"
                      initial={{ rotate: 90, opacity: 0, scale: 0 }}
                      animate={{ rotate: 0, opacity: 1, scale: 1 }}
                      exit={{ rotate: -90, opacity: 0, scale: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <Moon className="w-5 h-5 text-primary" />
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.button>

              <Link href="/login" className="hidden md:block">
                <motion.button
                  className="px-7 py-3 rounded-full bg-gradient-to-l from-primary to-primary/80 text-primary-foreground font-medium hover:shadow-xl hover:shadow-primary/25 transition-all"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.98 }}
                >
                  تسجيل الدخول
                </motion.button>
              </Link>

              {/* Mobile Menu Button */}
              <motion.button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="md:hidden w-11 h-11 rounded-full bg-secondary flex items-center justify-center"
                whileTap={{ scale: 0.95 }}
              >
                <AnimatePresence mode="wait">
                  {isMenuOpen ? (
                    <motion.div
                      key="close"
                      initial={{ rotate: -90, opacity: 0 }}
                      animate={{ rotate: 0, opacity: 1 }}
                      exit={{ rotate: 90, opacity: 0 }}
                    >
                      <X className="w-5 h-5" />
                    </motion.div>
                  ) : (
                    <motion.div
                      key="menu"
                      initial={{ rotate: 90, opacity: 0 }}
                      animate={{ rotate: 0, opacity: 1 }}
                      exit={{ rotate: -90, opacity: 0 }}
                    >
                      <Menu className="w-5 h-5" />
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {isMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden bg-background/95 backdrop-blur-xl border-t border-border/50"
            >
              <nav className="container mx-auto px-4 py-6 flex flex-col gap-4">
                <Link href="#features" className="text-lg py-3 hover:text-primary transition-colors" onClick={() => setIsMenuOpen(false)}>المميزات</Link>
                <Link href="#sections" className="text-lg py-3 hover:text-primary transition-colors" onClick={() => setIsMenuOpen(false)}>الأقسام</Link>
                <Link href="#testimonials" className="text-lg py-3 hover:text-primary transition-colors" onClick={() => setIsMenuOpen(false)}>آراء الطلاب</Link>
                <Link href="/login" className="mt-4">
                  <button className="w-full py-4 rounded-full bg-gradient-to-l from-primary to-primary/80 text-primary-foreground font-medium text-lg">
                    تسجيل الدخول
                  </button>
                </Link>
              </nav>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.header>

      {/* Hero Section */}
      <section ref={heroRef} className="relative min-h-screen flex items-center justify-center pt-20 overflow-hidden">
        <IslamicPattern />
        <FloatingStars />
        
        {/* Animated gradient orbs */}
        <motion.div 
          className="absolute top-1/4 right-1/4 w-[500px] h-[500px] bg-primary/20 rounded-full blur-[100px]"
          animate={{ 
            scale: [1, 1.2, 1],
            x: [0, 50, 0],
            y: [0, -30, 0],
          }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div 
          className="absolute bottom-1/4 left-1/4 w-[400px] h-[400px] bg-accent/20 rounded-full blur-[100px]"
          animate={{ 
            scale: [1, 1.3, 1],
            x: [0, -40, 0],
            y: [0, 40, 0],
          }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 1 }}
        />

        <motion.div 
          className="container mx-auto px-4 md:px-6 relative z-10"
          style={{ opacity: heroOpacity, scale: heroScale, y: heroY }}
        >
          <div className="text-center max-w-5xl mx-auto">
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, y: 30, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.6 }}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-accent/10 border border-accent/20 text-accent mb-10"
            >
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
              >
                <Sparkles className="w-4 h-4" />
              </motion.div>
              <span className="text-sm font-medium">منصة قرآنية متكاملة</span>
            </motion.div>

            {/* Main Heading */}
            <motion.h1
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="text-5xl md:text-7xl lg:text-8xl font-bold mb-8 leading-tight"
            >
              <ParallaxText baseVelocity={-0.5}>
                <span className="text-foreground">رحلتك مع</span>
              </ParallaxText>
              <motion.span 
                className="block bg-gradient-to-l from-primary via-accent to-primary bg-[length:200%_auto] bg-clip-text text-transparent py-2"
                animate={{ backgroundPosition: ["0% center", "200% center"] }}
                transition={{ duration: 5, repeat: Infinity, ease: "linear" }}
              >
                القرآن الكريم
              </motion.span>
              <ParallaxText baseVelocity={0.5}>
                <span className="text-foreground">تبدأ هنا</span>
              </ParallaxText>
            </motion.h1>

            {/* Subtitle */}
            <motion.p
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="text-xl md:text-2xl text-muted-foreground mb-14 max-w-3xl mx-auto leading-relaxed"
            >
              انضم إلى آلاف الطلاب في رحلة إتقان القرآن الكريم
              <br className="hidden md:block" />
              مع معلمين متخصصين ومنهجية متميزة
            </motion.p>

            {/* CTA Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.6 }}
              className="flex flex-col sm:flex-row items-center justify-center gap-5 mb-20"
            >
              <Link href="/register">
                <motion.button
                  className="group relative px-10 py-5 rounded-full bg-gradient-to-l from-primary to-accent text-white font-bold text-lg flex items-center gap-3 overflow-hidden"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                    animate={{ x: ["-100%", "200%"] }}
                    transition={{ duration: 2, repeat: Infinity, repeatDelay: 1 }}
                  />
                  <span className="relative">ابدأ رحلتك مجاناً</span>
                  <motion.div
                    className="relative"
                    animate={{ x: [0, -5, 0] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </motion.div>
                </motion.button>
              </Link>
              <Link href="#sections">
                <motion.button
                  className="px-10 py-5 rounded-full border-2 border-border bg-background/50 backdrop-blur-sm font-medium text-lg flex items-center gap-3 hover:border-primary/50 hover:bg-primary/5 transition-all"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Play className="w-5 h-5" />
                  <span>شاهد الفيديو</span>
                </motion.button>
              </Link>
            </motion.div>

            {/* Stats */}
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.8 }}
              className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto"
            >
              {[
                { value: 15000, suffix: "+", label: "طالب نشط" },
                { value: 500, suffix: "+", label: "معلم متخصص" },
                { value: 1200, suffix: "+", label: "تلاوة مميزة" },
                { value: 98, suffix: "%", label: "رضا الطلاب" },
              ].map((stat, i) => (
                <motion.div 
                  key={i} 
                  className="text-center"
                  whileHover={{ scale: 1.1 }}
                  transition={{ type: "spring", stiffness: 400 }}
                >
                  <div className="text-4xl md:text-5xl font-bold text-primary mb-2">
                    <AnimatedCounter value={stat.value} suffix={stat.suffix} />
                  </div>
                  <div className="text-sm text-muted-foreground">{stat.label}</div>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </motion.div>

        {/* Scroll indicator */}
        <motion.div
          className="absolute bottom-10 left-1/2 -translate-x-1/2"
          animate={{ y: [0, 12, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <div className="w-7 h-12 rounded-full border-2 border-muted-foreground/30 flex items-start justify-center p-2">
            <motion.div
              className="w-2 h-3 bg-primary rounded-full"
              animate={{ y: [0, 16, 0], opacity: [1, 0.3, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
          </div>
        </motion.div>
      </section>

      {/* Main Sections */}
      <section id="sections" className="py-28 md:py-40 relative">
        <IslamicPattern />
        
        <div className="container mx-auto px-4 md:px-6 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="text-center mb-20"
          >
            <h2 className="text-4xl md:text-6xl font-bold mb-6">اختر وجهتك</h2>
            <p className="text-xl md:text-2xl text-muted-foreground">اكتشف عالم إتقان بقسميه المتميزين</p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-8 lg:gap-10 max-w-6xl mx-auto">
            <SectionCard
              title="أكاديمية إتقان"
              description="تعلم القرآن الكريم مع معلمين متخصصين في بيئة تفاعلية متكاملة"
              icon={GraduationCap}
              href="/academy/student"
              gradient="bg-gradient-to-br from-primary via-primary/90 to-emerald-600"
              features={[
                "حلقات تحفيظ مباشرة",
                "متابعة يومية للتقدم",
                "شهادات معتمدة",
                "مسابقات وجوائز"
              ]}
              delay={0}
            />
            <SectionCard
              title="حلقة القرآن"
              description="استمتع بأجمل التلاوات والأصوات القرآنية من كبار القراء"
              icon={Volume2}
              href="/student"
              gradient="bg-gradient-to-br from-accent via-amber-500 to-orange-500"
              features={[
                "آلاف التلاوات المميزة",
                "قراء من حول العالم",
                "جودة صوت عالية",
                "قوائم تشغيل مخصصة"
              ]}
              delay={0.2}
            />
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-28 md:py-40 bg-secondary/30 relative">
        <IslamicPattern />
        
        <div className="container mx-auto px-4 md:px-6 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="text-center mb-20"
          >
            <h2 className="text-4xl md:text-6xl font-bold mb-6">لماذا إتقان؟</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              نقدم لك تجربة تعليمية فريدة تجمع بين الأصالة والحداثة
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8 max-w-6xl mx-auto">
            {features.map((feature, i) => (
              <FeatureCard key={i} {...feature} index={i} />
            ))}
          </div>
        </div>
      </section>

      {/* Audio Showcase Section */}
      <section className="py-28 md:py-40 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-accent/5" />
        
        <div className="container mx-auto px-4 md:px-6 relative z-10">
          <div className="grid lg:grid-cols-2 gap-16 items-center max-w-6xl mx-auto">
            <motion.div
              initial={{ opacity: 0, x: 60 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/10 text-accent mb-8"
              >
                <Volume2 className="w-4 h-4" />
                <span className="text-sm font-medium">حلقة القرآن</span>
              </motion.div>
              
              <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-8">
                استمع إلى أجمل
                <span className="text-primary block mt-2">التلاوات</span>
              </h2>
              <p className="text-xl text-muted-foreground mb-10 leading-relaxed">
                مكتبة ضخمة تضم آلاف التلاوات من أشهر القراء حول العالم، 
                بجودة صوت استثنائية وتجربة استماع لا تُنسى
              </p>
              <div className="flex flex-wrap gap-4">
                <motion.div 
                  className="flex items-center gap-2 px-5 py-3 rounded-full bg-primary/10 text-primary"
                  whileHover={{ scale: 1.05 }}
                >
                  <Volume2 className="w-5 h-5" />
                  <span className="font-medium">جودة عالية</span>
                </motion.div>
                <motion.div 
                  className="flex items-center gap-2 px-5 py-3 rounded-full bg-accent/10 text-accent"
                  whileHover={{ scale: 1.05 }}
                >
                  <Clock className="w-5 h-5" />
                  <span className="font-medium">تحديث مستمر</span>
                </motion.div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: -60 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="relative"
            >
              <motion.div 
                className="relative bg-card rounded-3xl p-10 border border-border/50 shadow-2xl"
                whileHover={{ y: -8 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-accent/5 rounded-3xl" />
                
                <div className="relative">
                  {/* Player mockup */}
                  <div className="flex items-center gap-5 mb-8">
                    <motion.div 
                      className="w-24 h-24 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg shadow-primary/30"
                      whileHover={{ scale: 1.1, rotate: 5 }}
                    >
                      <BookOpen className="w-12 h-12 text-white" />
                    </motion.div>
                    <div>
                      <h4 className="font-bold text-xl">سورة الرحمن</h4>
                      <p className="text-muted-foreground">الشيخ عبدالرحمن السديس</p>
                    </div>
                  </div>

                  <AudioWave />

                  <div className="mt-8 flex items-center gap-4">
                    <span className="text-sm text-muted-foreground font-mono">2:34</span>
                    <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                      <motion.div 
                        className="h-full bg-gradient-to-l from-primary to-accent rounded-full"
                        initial={{ width: "0%" }}
                        whileInView={{ width: "45%" }}
                        viewport={{ once: true }}
                        transition={{ duration: 2, ease: "easeOut" }}
                      />
                    </div>
                    <span className="text-sm text-muted-foreground font-mono">5:42</span>
                  </div>

                  <div className="mt-8 flex items-center justify-center gap-8">
                    <motion.button 
                      className="w-12 h-12 rounded-full bg-muted flex items-center justify-center hover:bg-muted/80 transition-colors"
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <ChevronLeft className="w-6 h-6 rotate-180" />
                    </motion.button>
                    <motion.button 
                      className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white shadow-xl shadow-primary/30"
                      whileHover={{ scale: 1.15 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <Play className="w-7 h-7 mr-0.5" />
                    </motion.button>
                    <motion.button 
                      className="w-12 h-12 rounded-full bg-muted flex items-center justify-center hover:bg-muted/80 transition-colors"
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <ChevronLeft className="w-6 h-6" />
                    </motion.button>
                  </div>
                </div>
              </motion.div>

              {/* Floating elements */}
              <motion.div
                className="absolute -top-6 -left-6 w-24 h-24 rounded-2xl bg-accent/20 backdrop-blur-sm border border-accent/30 flex items-center justify-center"
                animate={{ y: [0, -15, 0], rotate: [0, 5, 0] }}
                transition={{ duration: 4, repeat: Infinity }}
              >
                <Mic2 className="w-10 h-10 text-accent" />
              </motion.div>
              <motion.div
                className="absolute -bottom-6 -right-6 w-20 h-20 rounded-xl bg-primary/20 backdrop-blur-sm border border-primary/30 flex items-center justify-center"
                animate={{ y: [0, 15, 0], rotate: [0, -5, 0] }}
                transition={{ duration: 4, repeat: Infinity, delay: 1.5 }}
              >
                <Star className="w-8 h-8 text-primary fill-primary" />
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="py-28 md:py-40 bg-secondary/30 relative">
        <IslamicPattern />
        
        <div className="container mx-auto px-4 md:px-6 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="text-center mb-20"
          >
            <h2 className="text-4xl md:text-6xl font-bold mb-6">ماذا يقول طلابنا؟</h2>
            <p className="text-xl text-muted-foreground">تجارب حقيقية من مجتمع إتقان</p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {testimonials.map((testimonial, i) => (
              <TestimonialCard key={i} {...testimonial} index={i} />
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-28 md:py-40 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary/90 to-accent" />
        <IslamicPattern />
        <FloatingStars />

        <div className="container mx-auto px-4 md:px-6 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="text-center max-w-4xl mx-auto"
          >
            <motion.h2 
              className="text-4xl md:text-6xl lg:text-7xl font-bold text-white mb-8"
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
            >
              ابدأ رحلتك القرآنية اليوم
            </motion.h2>
            <p className="text-xl md:text-2xl text-white/80 mb-12 leading-relaxed">
              انضم إلى آلاف الطلاب الذين اختاروا إتقان لتعلم وحفظ القرآن الكريم
            </p>
            <Link href="/register">
              <motion.button
                className="relative px-12 py-6 rounded-full bg-white text-primary font-bold text-xl overflow-hidden group"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.98 }}
              >
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/10 to-transparent"
                  animate={{ x: ["-100%", "200%"] }}
                  transition={{ duration: 2, repeat: Infinity, repeatDelay: 1 }}
                />
                <span className="relative">سجل الآن مجاناً</span>
              </motion.button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-20 bg-card border-t border-border/50">
        <div className="container mx-auto px-4 md:px-6">
          <div className="grid md:grid-cols-4 gap-12 mb-16">
            <div className="md:col-span-2">
              <Link href="/" className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                  <BookOpen className="w-6 h-6 text-white" />
                </div>
                <div>
                  <span className="text-2xl font-bold">إتقان</span>
                  <span className="block text-xs text-muted-foreground">حلقة القرآن</span>
                </div>
              </Link>
              <p className="text-muted-foreground max-w-md leading-relaxed text-lg">
                منصة قرآنية متكاملة تجمع بين تعلم القرآن الكريم والاستماع لأجمل التلاوات
                مع معلمين متخصصين ومنهجية متميزة
              </p>
            </div>

            <div>
              <h4 className="font-bold text-lg mb-6">روابط سريعة</h4>
              <ul className="space-y-4">
                {[
                  { href: "/academy/student", label: "الأكاديمية" },
                  { href: "/student", label: "حلقة القرآن" },
                  { href: "/about", label: "عن إتقان" },
                  { href: "/contact", label: "تواصل معنا" },
                ].map((link) => (
                  <li key={link.href}>
                    <Link href={link.href} className="text-muted-foreground hover:text-primary transition-colors">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="font-bold text-lg mb-6">قانوني</h4>
              <ul className="space-y-4">
                {[
                  { href: "/privacy", label: "سياسة الخصوصية" },
                  { href: "/terms", label: "الشروط والأحكام" },
                ].map((link) => (
                  <li key={link.href}>
                    <Link href={link.href} className="text-muted-foreground hover:text-primary transition-colors">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="pt-10 border-t border-border/50 text-center text-muted-foreground">
            <p className="text-lg">جميع الحقوق محفوظة &copy; {new Date().getFullYear()} إتقان</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
