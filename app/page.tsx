"use client"

import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import { motion, useScroll, useTransform, useInView, useSpring, useMotionValue, useMotionTemplate } from "framer-motion"
import {
  BookOpen, GraduationCap, Users, Play, Mic2, Award,
  Moon, Sun, Star, Trophy, Heart, ArrowLeft, Menu, X, Headphones, Video,
  CheckCircle2, Sparkles, Clock, Globe, Shield, Zap, MessageCircle,
  ChevronDown, Layers, Target, BookMarked, FileText, BarChart3
} from "lucide-react"
import { BlurText } from "@/components/ui/blur-text"
import { FadeIn } from "@/components/ui/fade-in"
import { AnimatedCounter } from "@/components/ui/animated-counter"

// Floating geometric shapes component
function FloatingShapes() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Large octagon */}
      <motion.div
        className="absolute top-[15%] right-[10%] w-32 h-32 md:w-48 md:h-48"
        animate={{
          y: [0, -30, 0],
          rotate: [0, 45, 0],
        }}
        transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
      >
        <svg viewBox="0 0 100 100" className="w-full h-full">
          <polygon
            points="30,0 70,0 100,30 100,70 70,100 30,100 0,70 0,30"
            fill="none"
            stroke="currentColor"
            strokeWidth="0.5"
            className="text-primary/20"
          />
          <polygon
            points="35,5 65,5 95,35 95,65 65,95 35,95 5,65 5,35"
            fill="none"
            stroke="currentColor"
            strokeWidth="0.5"
            className="text-accent/30"
          />
        </svg>
      </motion.div>

      {/* Islamic star pattern */}
      <motion.div
        className="absolute bottom-[20%] left-[5%] w-24 h-24 md:w-40 md:h-40"
        animate={{
          y: [0, 20, 0],
          rotate: [0, -180, -360],
        }}
        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
      >
        <svg viewBox="0 0 100 100" className="w-full h-full">
          <path
            d="M50 0 L61 35 L98 35 L68 57 L79 92 L50 70 L21 92 L32 57 L2 35 L39 35 Z"
            fill="none"
            stroke="currentColor"
            strokeWidth="0.5"
            className="text-accent/20"
          />
        </svg>
      </motion.div>

      {/* Hexagon grid */}
      <motion.div
        className="absolute top-[40%] left-[15%] w-20 h-20 md:w-32 md:h-32"
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.3, 0.6, 0.3],
        }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
      >
        <svg viewBox="0 0 100 100" className="w-full h-full">
          <polygon
            points="50,0 93,25 93,75 50,100 7,75 7,25"
            fill="none"
            stroke="currentColor"
            strokeWidth="0.5"
            className="text-primary/20"
          />
        </svg>
      </motion.div>

      {/* Small circles */}
      <motion.div
        className="absolute top-[60%] right-[20%] w-16 h-16"
        animate={{ y: [0, -40, 0] }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 1 }}
      >
        <div className="w-full h-full rounded-full border border-primary/20" />
      </motion.div>

      <motion.div
        className="absolute top-[25%] left-[30%] w-8 h-8"
        animate={{ y: [0, 20, 0], x: [0, 10, 0] }}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 2 }}
      >
        <div className="w-full h-full rounded-full bg-accent/10" />
      </motion.div>

      {/* Diamond */}
      <motion.div
        className="absolute bottom-[35%] right-[8%] w-12 h-12 md:w-20 md:h-20"
        animate={{ rotate: [45, 90, 45] }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
      >
        <div className="w-full h-full border border-accent/20 rotate-45" />
      </motion.div>

      {/* Gradient orbs */}
      <div className="absolute top-1/4 right-1/4 w-[300px] h-[300px] md:w-[500px] md:h-[500px] bg-primary/10 rounded-full blur-[100px] animate-pulse" />
      <div className="absolute bottom-1/4 left-1/4 w-[200px] h-[200px] md:w-[400px] md:h-[400px] bg-accent/10 rounded-full blur-[80px] animate-pulse" style={{ animationDelay: "1s" }} />
    </div>
  )
}

// Stats data
const stats = [
  { value: 15000, label: "طالب نشط", suffix: "+" },
  { value: 500, label: "معلم متخصص", suffix: "+" },
  { value: 1200, label: "دورة تعليمية", suffix: "+" },
  { value: 98, label: "نسبة الرضا", suffix: "%" },
]

// Academy features
const academyFeatures = [
  {
    icon: BookMarked,
    title: "دورات أكاديمية شاملة",
    description: "مناهج متكاملة في التفسير والحديث والفقه والعقيدة مع شهادات معتمدة",
    color: "primary"
  },
  {
    icon: GraduationCap,
    title: "برامج تعليمية متدرجة",
    description: "من المبتدئ حتى المتقدم، كل مستوى مصمم بعناية ليناسب قدراتك",
    color: "accent"
  },
  {
    icon: Users,
    title: "تعلم تفاعلي مباشر",
    description: "حلقات live مع أساتذة متخصصين ومناقشات جماعية مثرية",
    color: "primary"
  },
  {
    icon: BarChart3,
    title: "تتبع تقدمك",
    description: "لوحة تحكم شاملة تعرض إنجازاتك ونقاط قوتك ومجالات التحسين",
    color: "accent"
  },
  {
    icon: FileText,
    title: "اختبارات وتقييمات",
    description: "نظام تقييم دوري يضمن فهمك العميق للمادة العلمية",
    color: "primary"
  },
  {
    icon: Award,
    title: "شهادات وإجازات",
    description: "احصل على شهادات معتمدة وإجازات بالسند المتصل",
    color: "accent"
  },
]

// Learning paths
const learningPaths = [
  { title: "مسار الحفظ", desc: "حفظ القرآن كاملاً", icon: BookOpen, duration: "2-4 سنوات" },
  { title: "مسار التجويد", desc: "إتقان أحكام التلاوة", icon: Mic2, duration: "6-12 شهر" },
  { title: "مسار العلوم", desc: "التفسير والحديث والفقه", icon: GraduationCap, duration: "1-3 سنوات" },
  { title: "مسار الإجازة", desc: "إجازة بالسند المتصل", icon: Award, duration: "حسب المستوى" },
]

export default function HomePage() {
  const [isDark, setIsDark] = useState(false)
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const { scrollYProgress } = useScroll()
  const heroRef = useRef<HTMLDivElement>(null)
  const academyRef = useRef<HTMLDivElement>(null)
  const isAcademyInView = useInView(academyRef, { once: true, margin: "-100px" })

  const smoothProgress = useSpring(scrollYProgress, { stiffness: 100, damping: 30 })
  const heroOpacity = useTransform(smoothProgress, [0, 0.15], [1, 0])
  const heroScale = useTransform(smoothProgress, [0, 0.15], [1, 0.95])

  useEffect(() => {
    setIsDark(document.documentElement.classList.contains("dark"))
    const handleScroll = () => setScrolled(window.scrollY > 50)
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  const toggleDark = () => {
    document.documentElement.classList.toggle("dark")
    setIsDark(!isDark)
  }

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden" dir="rtl">
      {/* Header */}
      <header
        className={`fixed top-0 right-0 left-0 z-50 transition-all duration-500 ${
          scrolled
            ? "bg-background/80 backdrop-blur-xl border-b border-border/50 shadow-sm"
            : "bg-transparent"
        }`}
      >
        <div className="container mx-auto px-4 md:px-6">
          <div className="flex items-center justify-between h-16 md:h-20">
            <Link href="/" className="flex items-center gap-3 group">
              <motion.div
                whileHover={{ rotate: 10 }}
                className="w-11 h-11 rounded-xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-lg shadow-primary/20"
              >
                <BookOpen className="w-5 h-5 text-primary-foreground" />
              </motion.div>
              <div>
                <span className="text-xl font-bold text-foreground">إتقان</span>
                <span className="block text-[10px] text-muted-foreground -mt-0.5">الأكاديمية والمقرأة</span>
              </div>
            </Link>

            <nav className="hidden lg:flex items-center gap-8">
              {[
                { label: "الأكاديمية", href: "#academy" },
                { label: "المقرأة", href: "#maqraa" },
                { label: "المميزات", href: "#features" },
                { label: "آراء الطلاب", href: "#testimonials" },
              ].map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  className="relative text-sm text-muted-foreground hover:text-foreground transition-colors group"
                >
                  {item.label}
                  <span className="absolute -bottom-1 right-0 w-0 h-0.5 bg-primary group-hover:w-full transition-all duration-300" />
                </Link>
              ))}
            </nav>

            <div className="flex items-center gap-3">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={toggleDark}
                className="w-10 h-10 rounded-xl bg-secondary/80 backdrop-blur flex items-center justify-center hover:bg-secondary transition-colors"
              >
                {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </motion.button>

              <Link
                href="/login"
                className="hidden sm:flex h-10 px-5 bg-secondary text-foreground rounded-xl items-center justify-center text-sm font-medium hover:bg-secondary/80 transition-colors"
              >
                تسجيل الدخول
              </Link>

              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Link
                  href="/register"
                  className="hidden sm:flex h-10 px-5 bg-primary text-primary-foreground rounded-xl items-center justify-center text-sm font-medium hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20"
                >
                  ابدأ الآن
                </Link>
              </motion.div>

              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="lg:hidden w-10 h-10 rounded-xl bg-secondary flex items-center justify-center"
              >
                {isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        <motion.div
          initial={false}
          animate={{ height: isMenuOpen ? "auto" : 0, opacity: isMenuOpen ? 1 : 0 }}
          className="lg:hidden overflow-hidden bg-background/95 backdrop-blur-xl border-t border-border"
        >
          <div className="container mx-auto px-4 py-4 space-y-2">
            {["الأكاديمية", "المقرأة", "المميزات", "آراء الطلاب"].map((label) => (
              <Link
                key={label}
                href={`#${label}`}
                className="block py-3 text-muted-foreground hover:text-foreground transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                {label}
              </Link>
            ))}
            <div className="flex gap-2 pt-4">
              <Link
                href="/login"
                className="flex-1 py-3 text-center bg-secondary rounded-xl font-medium"
                onClick={() => setIsMenuOpen(false)}
              >
                تسجيل الدخول
              </Link>
              <Link
                href="/register"
                className="flex-1 py-3 text-center bg-primary text-primary-foreground rounded-xl font-medium"
                onClick={() => setIsMenuOpen(false)}
              >
                ابدأ الآن
              </Link>
            </div>
          </div>
        </motion.div>
      </header>

      {/* Hero Section */}
      <motion.section
        ref={heroRef}
        style={{ opacity: heroOpacity, scale: heroScale }}
        className="relative min-h-screen flex items-center justify-center pt-20 overflow-hidden"
      >
        <FloatingShapes />

        <div className="container mx-auto px-4 md:px-6 relative z-10">
          <div className="max-w-5xl mx-auto text-center">
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-primary/10 to-accent/10 border border-primary/20 mb-8"
            >
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
              >
                <Star className="w-4 h-4 text-accent fill-accent" />
              </motion.div>
              <span className="text-sm font-medium bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                منصة تعليمية إسلامية متكاملة
              </span>
            </motion.div>

            {/* Main Heading */}
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold mb-6 leading-tight">
              <BlurText
                text="أكاديمية إتقان"
                className="text-foreground"
                delay={80}
              />
              <span className="block mt-2">
                <BlurText
                  text="للعلوم الشرعية"
                  className="bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent bg-[length:200%_auto] animate-gradient"
                  delay={80}
                  direction="bottom"
                />
              </span>
            </h1>

            {/* Description */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto mb-10 leading-relaxed"
            >
              منصة شاملة تجمع بين <span className="text-primary font-semibold">الأكاديمية العلمية المتخصصة</span> في
              العلوم الشرعية و<span className="text-accent font-semibold">المقرأة القرآنية</span> للحفظ والتلاوة،
              مع أفضل المعلمين والشيوخ من حول العالم
            </motion.p>

            {/* CTA Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.5 }}
              className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16"
            >
              <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.98 }}>
                <Link
                  href="/register"
                  className="group flex items-center gap-3 h-14 px-8 bg-primary text-primary-foreground rounded-2xl font-semibold hover:bg-primary/90 transition-all shadow-xl shadow-primary/25"
                >
                  <span>سجّل في الأكاديمية</span>
                  <motion.div
                    animate={{ x: [0, -5, 0] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  >
                    <ArrowLeft className="w-5 h-5" />
                  </motion.div>
                </Link>
              </motion.div>

              <Link
                href="/student"
                className="flex items-center gap-3 h-14 px-8 bg-accent/10 text-accent-foreground border border-accent/30 rounded-2xl font-medium hover:bg-accent/20 transition-colors"
              >
                <Headphones className="w-5 h-5 text-accent" />
                <span>استكشف المقرأة</span>
              </Link>
            </motion.div>

            {/* Stats */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.6 }}
              className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8 max-w-4xl mx-auto"
            >
              {stats.map((stat, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.4, delay: 0.7 + i * 0.1 }}
                  className="relative p-4 md:p-6 rounded-2xl bg-card/50 backdrop-blur border border-border/50 hover:border-primary/30 transition-colors group"
                >
                  <div className="text-3xl md:text-4xl font-bold text-foreground mb-1">
                    <AnimatedCounter target={stat.value} suffix={stat.suffix} />
                  </div>
                  <div className="text-sm text-muted-foreground">{stat.label}</div>
                  <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-primary/5 to-accent/5 opacity-0 group-hover:opacity-100 transition-opacity -z-10" />
                </motion.div>
              ))}
            </motion.div>
          </div>
        </div>

        {/* Scroll Indicator */}
        <motion.div
          className="absolute bottom-8 left-1/2 -translate-x-1/2"
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <Link href="#academy" className="flex flex-col items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
            <span className="text-xs">اكتشف المزيد</span>
            <ChevronDown className="w-5 h-5" />
          </Link>
        </motion.div>
      </motion.section>

      {/* Academy Section - Main Focus */}
      <section id="academy" ref={academyRef} className="py-24 md:py-32 relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 bg-gradient-to-b from-secondary/30 via-transparent to-secondary/30" />
        <motion.div
          className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary/50 to-transparent"
          initial={{ scaleX: 0 }}
          animate={isAcademyInView ? { scaleX: 1 } : {}}
          transition={{ duration: 1.5 }}
        />

        <div className="container mx-auto px-4 md:px-6 relative z-10">
          {/* Section Header */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center max-w-3xl mx-auto mb-16"
          >
            <motion.div
              initial={{ scale: 0 }}
              whileInView={{ scale: 1 }}
              viewport={{ once: true }}
              className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center mx-auto mb-6 shadow-xl shadow-primary/20"
            >
              <GraduationCap className="w-10 h-10 text-primary-foreground" />
            </motion.div>
            <h2 className="text-3xl md:text-5xl font-bold text-foreground mb-6">
              الأكاديمية <span className="text-primary">العلمية</span>
            </h2>
            <p className="text-lg md:text-xl text-muted-foreground leading-relaxed">
              تعلّم العلوم الشرعية بمنهجية أكاديمية متدرجة مع نخبة من العلماء والمتخصصين،
              واحصل على شهادات معتمدة تؤهلك للتدريس والإفتاء
            </p>
          </motion.div>

          {/* Features Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
            {academyFeatures.map((feature, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                whileHover={{ y: -5, scale: 1.02 }}
                className="group relative p-6 md:p-8 rounded-3xl bg-card border border-border hover:border-primary/30 transition-all duration-300"
              >
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-5 ${
                  feature.color === "primary"
                    ? "bg-primary/10 text-primary"
                    : "bg-accent/10 text-accent"
                }`}>
                  <feature.icon className="w-7 h-7" />
                </div>
                <h3 className="text-xl font-bold text-foreground mb-3">{feature.title}</h3>
                <p className="text-muted-foreground leading-relaxed">{feature.description}</p>

                {/* Hover gradient */}
                <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-primary/5 to-accent/5 opacity-0 group-hover:opacity-100 transition-opacity -z-10" />
              </motion.div>
            ))}
          </div>

          {/* Learning Paths */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="max-w-5xl mx-auto"
          >
            <h3 className="text-2xl font-bold text-foreground text-center mb-8">المسارات التعليمية</h3>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {learningPaths.map((path, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  whileHover={{ y: -5 }}
                  className="relative p-6 rounded-2xl bg-gradient-to-br from-primary/5 to-accent/5 border border-primary/10 hover:border-primary/30 transition-all text-center group"
                >
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-4 group-hover:bg-primary/20 transition-colors">
                    <path.icon className="w-6 h-6 text-primary" />
                  </div>
                  <h4 className="font-bold text-foreground mb-1">{path.title}</h4>
                  <p className="text-sm text-muted-foreground mb-3">{path.desc}</p>
                  <span className="text-xs text-primary font-medium">{path.duration}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* CTA */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mt-12"
          >
            <Link
              href="/academy/student"
              className="inline-flex items-center gap-3 h-14 px-10 bg-primary text-primary-foreground rounded-2xl font-semibold hover:bg-primary/90 transition-all shadow-xl shadow-primary/20"
            >
              <span>انضم للأكاديمية الآن</span>
              <ArrowLeft className="w-5 h-5" />
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Maqraa (Quran Circle) Section */}
      <section id="maqraa" className="py-24 md:py-32 relative overflow-hidden bg-gradient-to-br from-accent/5 via-background to-primary/5">
        <div className="container mx-auto px-4 md:px-6 relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Content */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="order-2 lg:order-1"
            >
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/10 border border-accent/20 mb-6">
                <Headphones className="w-4 h-4 text-accent" />
                <span className="text-sm text-accent font-medium">المقرأة الصوتية</span>
              </div>

              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-6">
                استمع واحفظ مع <span className="text-accent">أجمل التلاوات</span>
              </h2>

              <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
                مكتبة صوتية ضخمة تضم آلاف التلاوات من كبار القراء حول العالم، بجودة صوت استثنائية وتجربة استماع فريدة
              </p>

              <ul className="space-y-4 mb-8">
                {[
                  "أكثر من 5000 تلاوة من 200+ قارئ",
                  "جودة صوت HD مع إمكانية التحميل",
                  "قوائم تشغيل مخصصة حسب رغبتك",
                  "تكرار الآيات للحفظ والمراجعة",
                  "استماع بدون انترنت"
                ].map((item, i) => (
                  <motion.li
                    key={i}
                    initial={{ opacity: 0, x: 20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.1 }}
                    className="flex items-center gap-3"
                  >
                    <div className="w-6 h-6 rounded-full bg-accent/10 flex items-center justify-center">
                      <CheckCircle2 className="w-4 h-4 text-accent" />
                    </div>
                    <span className="text-foreground">{item}</span>
                  </motion.li>
                ))}
              </ul>

              <Link
                href="/student"
                className="inline-flex items-center gap-3 h-14 px-8 bg-accent text-accent-foreground rounded-2xl font-semibold hover:bg-accent/90 transition-all shadow-xl shadow-accent/20"
              >
                <Play className="w-5 h-5" />
                <span>استكشف المقرأة</span>
              </Link>
            </motion.div>

            {/* Visual */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="order-1 lg:order-2 relative"
            >
              <div className="relative aspect-square max-w-md mx-auto">
                {/* Decorative rings */}
                <motion.div
                  className="absolute inset-0 rounded-full border-2 border-accent/20"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
                />
                <motion.div
                  className="absolute inset-4 rounded-full border border-primary/20"
                  animate={{ rotate: -360 }}
                  transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
                />
                <motion.div
                  className="absolute inset-8 rounded-full border border-accent/10"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                />

                {/* Center content */}
                <div className="absolute inset-12 rounded-full bg-gradient-to-br from-accent/20 to-primary/20 backdrop-blur-sm flex items-center justify-center">
                  <motion.div
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="w-24 h-24 rounded-full bg-accent/20 flex items-center justify-center"
                  >
                    <Headphones className="w-12 h-12 text-accent" />
                  </motion.div>
                </div>

                {/* Floating elements */}
                <motion.div
                  className="absolute top-0 right-1/4 w-12 h-12 rounded-xl bg-primary/10 backdrop-blur flex items-center justify-center"
                  animate={{ y: [0, -10, 0] }}
                  transition={{ duration: 3, repeat: Infinity }}
                >
                  <BookOpen className="w-6 h-6 text-primary" />
                </motion.div>
                <motion.div
                  className="absolute bottom-10 left-0 w-12 h-12 rounded-xl bg-accent/10 backdrop-blur flex items-center justify-center"
                  animate={{ y: [0, 10, 0] }}
                  transition={{ duration: 4, repeat: Infinity }}
                >
                  <Mic2 className="w-6 h-6 text-accent" />
                </motion.div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="py-24 md:py-32 bg-secondary/30">
        <div className="container mx-auto px-4 md:px-6">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center max-w-2xl mx-auto mb-16"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-6">
              <MessageCircle className="w-4 h-4 text-primary" />
              <span className="text-sm text-primary font-medium">قصص نجاح</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              ماذا يقول <span className="text-primary">طلابنا</span>
            </h2>
            <p className="text-muted-foreground text-lg">
              تجارب حقيقية من طلاب أتموا رحلتهم معنا
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {[
              {
                quote: "الأكاديمية غيرت فهمي للعلوم الشرعية بالكامل. المناهج متدرجة والأساتذة على أعلى مستوى",
                author: "أحمد محمد",
                role: "طالب في مسار التفسير",
                achievement: "أتم السنة الأولى"
              },
              {
                quote: "حفظت القرآن الكريم في المقرأة مع متابعة يومية من معلم متخصص. تجربة لا تُنسى",
                author: "فاطمة علي",
                role: "حافظة للقرآن",
                achievement: "إجازة بالسند"
              },
              {
                quote: "أفضل منصة للتعلم الشرعي. الجمع بين الأكاديمية والمقرأة فكرة عبقرية",
                author: "خالد عبدالرحمن",
                role: "طالب علم",
                achievement: "شهادة معتمدة"
              },
            ].map((testimonial, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                whileHover={{ y: -5 }}
                className="relative p-6 md:p-8 rounded-3xl bg-card border border-border hover:border-primary/20 transition-all"
              >
                <div className="absolute top-4 left-4 text-6xl text-primary/10 font-serif leading-none">&ldquo;</div>
                <div className="flex justify-end mb-4">
                  <span className="text-xs bg-primary/10 text-primary px-3 py-1 rounded-full">
                    {testimonial.achievement}
                  </span>
                </div>
                <p className="text-foreground/80 mb-6 leading-relaxed relative z-10">{testimonial.quote}</p>
                <div className="flex items-center gap-4 pt-4 border-t border-border">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-primary-foreground font-bold text-lg">
                    {testimonial.author.charAt(0)}
                  </div>
                  <div>
                    <div className="font-semibold text-foreground">{testimonial.author}</div>
                    <div className="text-sm text-muted-foreground">{testimonial.role}</div>
                  </div>
                </div>
                <div className="flex gap-1 mt-4">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star key={star} className="w-4 h-4 text-accent fill-accent" />
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 md:py-32">
        <div className="container mx-auto px-4 md:px-6">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="relative max-w-5xl mx-auto overflow-hidden rounded-[2rem] md:rounded-[3rem]"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary to-primary/80" />
            <FloatingShapes />

            <div className="relative z-10 p-8 md:p-16 lg:p-20 text-center text-primary-foreground">
              <motion.div
                initial={{ scale: 0 }}
                whileInView={{ scale: 1 }}
                viewport={{ once: true }}
                className="w-20 h-20 rounded-2xl bg-white/20 flex items-center justify-center mx-auto mb-8"
              >
                <Sparkles className="w-10 h-10" />
              </motion.div>

              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6">
                ابدأ رحلتك العلمية اليوم
              </h2>
              <p className="text-primary-foreground/80 text-lg md:text-xl mb-10 max-w-2xl mx-auto">
                انضم إلى آلاف الطلاب في أكاديمية إتقان. التسجيل مجاني وسريع.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.98 }}>
                  <Link
                    href="/register"
                    className="flex items-center gap-3 h-14 px-10 bg-white text-primary rounded-2xl font-semibold hover:bg-white/90 transition-all shadow-xl"
                  >
                    <span>سجّل الآن مجاناً</span>
                    <ArrowLeft className="w-5 h-5" />
                  </Link>
                </motion.div>
                <Link
                  href="/about"
                  className="flex items-center gap-2 h-14 px-8 bg-white/10 text-primary-foreground rounded-2xl font-medium hover:bg-white/20 transition-colors border border-white/20"
                >
                  <Play className="w-5 h-5" />
                  <span>شاهد الفيديو التعريفي</span>
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-16 bg-card border-t border-border">
        <div className="container mx-auto px-4 md:px-6">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
            <div className="lg:col-span-1">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center">
                  <BookOpen className="w-6 h-6 text-primary-foreground" />
                </div>
                <div>
                  <span className="text-xl font-bold text-foreground">إتقان</span>
                  <span className="block text-xs text-muted-foreground">الأكاديمية والمقرأة</span>
                </div>
              </div>
              <p className="text-muted-foreground text-sm leading-relaxed">
                منصة تعليمية إسلامية شاملة تجمع بين الأكاديمية العلمية والمقرأة القرآنية
              </p>
            </div>

            <div>
              <h4 className="font-bold text-foreground mb-4">الأكاديمية</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="/academy/student/courses" className="hover:text-foreground transition-colors">الدورات</Link></li>
                <li><Link href="#" className="hover:text-foreground transition-colors">المسارات</Link></li>
                <li><Link href="#" className="hover:text-foreground transition-colors">الشهادات</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold text-foreground mb-4">المقرأة</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="/student" className="hover:text-foreground transition-colors">التلاوات</Link></li>
                <li><Link href="#" className="hover:text-foreground transition-colors">القراء</Link></li>
                <li><Link href="#" className="hover:text-foreground transition-colors">قوائم التشغيل</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold text-foreground mb-4">تواصل معنا</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="#" className="hover:text-foreground transition-colors">الدعم الفني</Link></li>
                <li><Link href="#" className="hover:text-foreground transition-colors">الأسئلة الشائعة</Link></li>
                <li><Link href="#" className="hover:text-foreground transition-colors">سياسة الخصوصية</Link></li>
              </ul>
            </div>
          </div>

          <div className="pt-8 border-t border-border flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-sm text-muted-foreground">
              جميع الحقوق محفوظة لأكاديمية إتقان 2024
            </p>
            <div className="flex items-center gap-4">
              {["twitter", "youtube", "telegram"].map((social) => (
                <Link
                  key={social}
                  href="#"
                  className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center hover:bg-primary hover:text-primary-foreground transition-colors"
                >
                  <span className="sr-only">{social}</span>
                  <div className="w-4 h-4 bg-current rounded opacity-50" />
                </Link>
              ))}
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
