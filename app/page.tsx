"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { motion, useScroll, useTransform } from "framer-motion"
import { 
  BookOpen, GraduationCap, Users, Play, Mic2, Award, 
  Moon, Sun, Star, Trophy, Heart, ArrowLeft, Menu, X, Headphones, Video,
  CheckCircle2, Sparkles, Clock, Globe, Shield, Zap, MessageCircle
} from "lucide-react"
import { IslamicPattern } from "@/components/ui/islamic-pattern"
import { BlurText } from "@/components/ui/blur-text"
import { FadeIn } from "@/components/ui/fade-in"
import { AnimatedCounter } from "@/components/ui/animated-counter"
import { Spotlight } from "@/components/ui/spotlight"
import { Magnet } from "@/components/ui/magnet"

// Stats data
const stats = [
  { value: 15000, label: "طالب نشط", suffix: "+" },
  { value: 500, label: "معلم متخصص", suffix: "+" },
  { value: 1200, label: "ساعة تعليمية", suffix: "+" },
  { value: 98, label: "نسبة الرضا", suffix: "%" },
]

// Features data - expanded
const features = [
  { icon: BookOpen, title: "حفظ القرآن الكريم", description: "منهجية متدرجة لحفظ القرآن مع متابعة يومية من معلمين متخصصين", highlight: true },
  { icon: Mic2, title: "تلاوات متميزة", description: "استمع لأجمل التلاوات من كبار القراء بجودة صوت عالية" },
  { icon: Users, title: "حلقات تفاعلية", description: "انضم إلى حلقات مباشرة مع معلمين وطلاب من حول العالم" },
  { icon: Award, title: "شهادات معتمدة", description: "احصل على إجازات وشهادات معتمدة في القرآن والقراءات", highlight: true },
  { icon: Trophy, title: "مسابقات قرآنية", description: "شارك في تحديات ومسابقات لتحفيز رحلتك" },
  { icon: Heart, title: "مجتمع داعم", description: "كن جزءاً من مجتمع قرآني داعم ومحفز" },
]

// Learning path steps
const learningPath = [
  { step: 1, title: "التسجيل", description: "أنشئ حسابك مجاناً في دقائق" },
  { step: 2, title: "اختيار المسار", description: "حدد مستواك وأهدافك التعليمية" },
  { step: 3, title: "التعلم", description: "ابدأ رحلتك مع معلم متخصص" },
  { step: 4, title: "الإتقان", description: "احصل على الإجازة والشهادة" },
]

// Academy stats
const academyStats = [
  { label: "حافظ للقرآن", value: "2,500+" },
  { label: "إجازة ممنوحة", value: "850+" },
  { label: "دولة", value: "45+" },
  { label: "ساعة تعليمية", value: "50,000+" },
]

// Testimonials data
const testimonials = [
  { quote: "منصة إتقان غيرت حياتي بالكامل، أصبحت أقرأ القرآن بطلاقة وأحفظ بسهولة", author: "أحمد محمد", role: "طالب" },
  { quote: "التعليم هنا مختلف تماماً، المعلمون متميزون والمنهجية فعالة جداً", author: "فاطمة علي", role: "معلمة" },
  { quote: "أفضل منصة قرآنية جربتها، أنصح كل الآباء بتسجيل أبنائهم فيها", author: "محمد الأحمد", role: "ولي أمر" },
]

export default function HomePage() {
  const [isDark, setIsDark] = useState(false)
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const { scrollYProgress } = useScroll()
  
  const heroOpacity = useTransform(scrollYProgress, [0, 0.2], [1, 0])
  const heroY = useTransform(scrollYProgress, [0, 0.2], [0, -50])

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
    <div className="min-h-screen bg-background text-foreground" dir="rtl">
      {/* Header */}
      <header 
        className={`fixed top-0 right-0 left-0 z-50 transition-all duration-300 ${
          scrolled 
            ? "bg-background/90 backdrop-blur-lg border-b border-border shadow-sm" 
            : "bg-transparent"
        }`}
      >
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16 md:h-20">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-primary-foreground" />
              </div>
              <div>
                <span className="text-xl font-bold text-foreground">إتقان</span>
                <span className="block text-[10px] text-muted-foreground -mt-1">حلقة القرآن</span>
              </div>
            </Link>

            <nav className="hidden md:flex items-center gap-8">
              {["المميزات", "الأقسام", "آراء الطلاب"].map((label) => (
                <Link 
                  key={label}
                  href={`#${label}`} 
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  {label}
                </Link>
              ))}
            </nav>

            <div className="flex items-center gap-3">
              <button
                onClick={toggleDark}
                className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center hover:bg-secondary/80 transition-colors"
              >
                {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </button>
              
              <Link 
                href="/login"
                className="hidden sm:flex h-10 px-5 bg-primary text-primary-foreground rounded-lg items-center justify-center text-sm font-medium hover:bg-primary/90 transition-colors"
              >
                تسجيل الدخول
              </Link>

              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="md:hidden w-10 h-10 rounded-lg bg-secondary flex items-center justify-center"
              >
                {isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-background border-t border-border"
          >
            <div className="container mx-auto px-4 py-4 space-y-2">
              {["المميزات", "الأقسام", "آراء الطلاب"].map((label) => (
                <Link 
                  key={label}
                  href={`#${label}`}
                  className="block py-2 text-muted-foreground hover:text-foreground"
                  onClick={() => setIsMenuOpen(false)}
                >
                  {label}
                </Link>
              ))}
              <Link 
                href="/login"
                className="block py-2 text-primary font-medium"
                onClick={() => setIsMenuOpen(false)}
              >
                تسجيل الدخول
              </Link>
            </div>
          </motion.div>
        )}
      </header>

      {/* Hero Section */}
      <motion.section 
        style={{ opacity: heroOpacity, y: heroY }}
        className="relative min-h-screen flex items-center justify-center pt-20 overflow-hidden"
      >
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-[0.03]">
          <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="grid" width="60" height="60" patternUnits="userSpaceOnUse">
                <circle cx="30" cy="30" r="1" fill="currentColor" className="text-foreground"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>
        </div>

        {/* Gradient Orbs */}
        <div className="absolute top-1/4 right-1/4 w-[500px] h-[500px] bg-primary/20 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-1/4 left-1/4 w-[400px] h-[400px] bg-accent/20 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: "1s" }} />

        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            {/* Badge */}
            <FadeIn delay={0}>
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-8">
                <Star className="w-4 h-4 text-accent fill-accent" />
                <span className="text-sm text-primary font-medium">منصة قرآنية متكاملة</span>
              </div>
            </FadeIn>

            {/* Main Heading */}
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold mb-6 leading-tight">
              <BlurText 
                text="رحلتك نحو إتقان" 
                className="text-foreground"
                delay={80}
              />
              <BlurText 
                text="القرآن الكريم" 
                className="text-primary mt-2"
                delay={80}
                direction="bottom"
              />
            </h1>

            {/* Description */}
            <FadeIn delay={0.4}>
              <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
                منصة تعليمية شاملة تجمع بين الأكاديمية القرآنية المتخصصة وحلقة القرآن الصوتية، لنرافقك في رحلة الحفظ والتلاوة والتجويد
              </p>
            </FadeIn>

            {/* CTA Buttons */}
            <FadeIn delay={0.5}>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Magnet padding={40} magnetStrength={3}>
                  <Link 
                    href="/register"
                    className="group flex items-center gap-2 h-14 px-8 bg-primary text-primary-foreground rounded-xl font-medium hover:bg-primary/90 transition-all shadow-lg shadow-primary/25"
                  >
                    <span>ابدأ رحلتك مجاناً</span>
                    <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                  </Link>
                </Magnet>
                <Link 
                  href="#sections"
                  className="flex items-center gap-2 h-14 px-8 bg-secondary text-secondary-foreground rounded-xl font-medium hover:bg-secondary/80 transition-colors"
                >
                  <Play className="w-5 h-5" />
                  <span>استكشف المنصة</span>
                </Link>
              </div>
            </FadeIn>

            {/* Stats */}
            <FadeIn delay={0.6}>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-16 pt-16 border-t border-border/50">
                {stats.map((stat, i) => (
                  <div key={i} className="text-center">
                    <div className="text-3xl md:text-4xl font-bold text-foreground mb-1">
                      <AnimatedCounter target={stat.value} suffix={stat.suffix} />
                    </div>
                    <div className="text-sm text-muted-foreground">{stat.label}</div>
                  </div>
                ))}
              </div>
            </FadeIn>
          </div>
        </div>

        {/* Scroll Indicator */}
        <motion.div 
          className="absolute bottom-8 left-1/2 -translate-x-1/2"
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <div className="w-6 h-10 rounded-full border-2 border-border flex items-start justify-center p-1">
            <motion.div 
              className="w-1.5 h-1.5 rounded-full bg-primary"
              animate={{ y: [0, 16, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
          </div>
        </motion.div>
      </motion.section>

      {/* Main Sections */}
      <section id="sections" className="py-24 md:py-32 bg-secondary/30">
        <div className="container mx-auto px-4">
          <FadeIn>
            <div className="text-center max-w-2xl mx-auto mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                اختر وجهتك
              </h2>
              <p className="text-muted-foreground text-lg">
                منصة واحدة بوجهتين، اختر ما يناسب احتياجاتك
              </p>
            </div>
          </FadeIn>

          <div className="grid md:grid-cols-2 gap-6 max-w-5xl mx-auto">
            {/* Academy Card */}
            <FadeIn delay={0.1} direction="right">
              <Spotlight className="h-full rounded-2xl" spotlightColor="rgba(13, 90, 60, 0.1)">
                <Link href="/academy/student" className="block h-full">
                  <div className="relative h-full min-h-[400px] p-8 rounded-2xl bg-gradient-to-br from-primary to-primary/80 text-primary-foreground overflow-hidden group">
                    {/* Decorative */}
                    <div className="absolute top-0 left-0 w-32 h-32 bg-white/10 rounded-br-[80px]" />
                    <div className="absolute bottom-0 right-0 w-48 h-48 bg-black/10 rounded-tl-[100px]" />
                    
                    <div className="relative z-10">
                      <div className="w-16 h-16 rounded-xl bg-white/20 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                        <GraduationCap className="w-8 h-8" />
                      </div>
                      
                      <h3 className="text-2xl md:text-3xl font-bold mb-3">الأكاديمية القرآنية</h3>
                      <p className="text-primary-foreground/80 mb-6 leading-relaxed">
                        تعلم القرآن الكريم مع معلمين متخصصين، احفظ وأتقن التجويد واحصل على إجازات معتمدة
                      </p>
                      
                      <ul className="space-y-3 mb-8">
                        {["حلقات حفظ تفاعلية", "متابعة يومية مكثفة", "مسارات تعليمية متدرجة", "شهادات وإجازات"].map((item, i) => (
                          <li key={i} className="flex items-center gap-3 text-primary-foreground/90">
                            <div className="w-2 h-2 rounded-full bg-accent" />
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                      
                      <div className="flex items-center gap-2 text-primary-foreground/90 group-hover:gap-4 transition-all">
                        <span className="font-medium">انضم للأكاديمية</span>
                        <ArrowLeft className="w-5 h-5" />
                      </div>
                    </div>
                  </div>
                </Link>
              </Spotlight>
            </FadeIn>

            {/* Halqa Card */}
            <FadeIn delay={0.2} direction="left">
              <Spotlight className="h-full rounded-2xl" spotlightColor="rgba(201, 169, 98, 0.1)">
                <Link href="/student" className="block h-full">
                  <div className="relative h-full min-h-[400px] p-8 rounded-2xl bg-gradient-to-br from-accent to-accent/80 text-accent-foreground overflow-hidden group">
                    {/* Decorative */}
                    <div className="absolute top-0 left-0 w-32 h-32 bg-white/10 rounded-br-[80px]" />
                    <div className="absolute bottom-0 right-0 w-48 h-48 bg-black/10 rounded-tl-[100px]" />
                    
                    <div className="relative z-10">
                      <div className="w-16 h-16 rounded-xl bg-white/20 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                        <Headphones className="w-8 h-8" />
                      </div>
                      
                      <h3 className="text-2xl md:text-3xl font-bold mb-3">حلقة القرآن</h3>
                      <p className="text-accent-foreground/80 mb-6 leading-relaxed">
                        استمع إلى أجمل التلاوات القرآنية من كبار القراء حول العالم بجودة صوت استثنائية
                      </p>
                      
                      <ul className="space-y-3 mb-8">
                        {["تلاوات بجودة عالية", "قراء من حول العالم", "قوائم تشغيل مخصصة", "استماع بدون انترنت"].map((item, i) => (
                          <li key={i} className="flex items-center gap-3 text-accent-foreground/90">
                            <div className="w-2 h-2 rounded-full bg-primary" />
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                      
                      <div className="flex items-center gap-2 text-accent-foreground/90 group-hover:gap-4 transition-all">
                        <span className="font-medium">استكشف التلاوات</span>
                        <ArrowLeft className="w-5 h-5" />
                      </div>
                    </div>
                  </div>
                </Link>
              </Spotlight>
            </FadeIn>
          </div>
        </div>
      </section>

      {/* Features Section - Redesigned */}
      <section id="features" className="py-24 md:py-32 relative overflow-hidden">
        <IslamicPattern />
        
        <div className="container mx-auto px-4 relative z-10">
          <FadeIn>
            <div className="text-center max-w-3xl mx-auto mb-20">
              <motion.div
                initial={{ scale: 0 }}
                whileInView={{ scale: 1 }}
                viewport={{ once: true }}
                className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6"
              >
                <Sparkles className="w-10 h-10 text-primary" />
              </motion.div>
              <h2 className="text-3xl md:text-5xl font-bold text-foreground mb-6">
                لماذا <span className="text-primary">إتقان</span>؟
              </h2>
              <p className="text-muted-foreground text-lg md:text-xl leading-relaxed">
                لأننا نؤمن أن تعلم القرآن يستحق أفضل الأدوات والمعلمين. نقدم لك تجربة تعليمية فريدة تجمع بين الأصالة والتقنية الحديثة.
              </p>
            </div>
          </FadeIn>

          {/* Features Grid - Bento Style */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-6xl mx-auto">
            {/* Large Feature Card */}
            <FadeIn delay={0.1} className="md:col-span-2 lg:col-span-2">
              <motion.div 
                whileHover={{ y: -5 }}
                className="relative h-full min-h-[280px] p-8 rounded-3xl bg-gradient-to-br from-primary to-primary/80 text-primary-foreground overflow-hidden"
              >
                <div className="absolute top-0 left-0 w-full h-full opacity-10">
                  <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                    <pattern id="grid-pattern" width="10" height="10" patternUnits="userSpaceOnUse">
                      <circle cx="5" cy="5" r="1" fill="currentColor"/>
                    </pattern>
                    <rect width="100" height="100" fill="url(#grid-pattern)"/>
                  </svg>
                </div>
                <div className="relative z-10">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
                      <BookOpen className="w-6 h-6" />
                    </div>
                    <span className="text-sm font-medium bg-white/20 px-3 py-1 rounded-full">الأكثر طلباً</span>
                  </div>
                  <h3 className="text-2xl md:text-3xl font-bold mb-3">حفظ القرآن الكريم كاملاً</h3>
                  <p className="text-primary-foreground/80 text-lg mb-6 max-w-lg">
                    برنامج متكامل لحفظ القرآن الكريم مع متابعة يومية مكثفة من معلمين حاصلين على إجازات عالية
                  </p>
                  <div className="flex flex-wrap gap-3">
                    {["متابعة يومية", "معلم خاص", "تقييم مستمر", "إجازة معتمدة"].map((tag, i) => (
                      <span key={i} className="text-sm bg-white/10 px-4 py-2 rounded-full flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4" />
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </motion.div>
            </FadeIn>

            {/* Side Features */}
            <FadeIn delay={0.2}>
              <motion.div 
                whileHover={{ y: -5 }}
                className="h-full min-h-[280px] p-6 rounded-3xl bg-card border border-border hover:border-accent/50 transition-colors"
              >
                <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center mb-4">
                  <Mic2 className="w-6 h-6 text-accent" />
                </div>
                <h3 className="text-xl font-bold text-foreground mb-2">تلاوات بجودة استثنائية</h3>
                <p className="text-muted-foreground mb-4">آلاف التلاوات من أشهر القراء حول العالم بجودة صوت HD</p>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Headphones className="w-4 h-4" />
                  <span>+5000 تلاوة</span>
                </div>
              </motion.div>
            </FadeIn>

            {/* Stats Card */}
            <FadeIn delay={0.3}>
              <motion.div 
                whileHover={{ y: -5 }}
                className="h-full min-h-[200px] p-6 rounded-3xl bg-gradient-to-br from-accent/10 to-accent/5 border border-accent/20"
              >
                <h3 className="text-lg font-bold text-foreground mb-4">أرقام نفخر بها</h3>
                <div className="grid grid-cols-2 gap-4">
                  {academyStats.map((stat, i) => (
                    <div key={i} className="text-center">
                      <div className="text-2xl font-bold text-primary">{stat.value}</div>
                      <div className="text-xs text-muted-foreground">{stat.label}</div>
                    </div>
                  ))}
                </div>
              </motion.div>
            </FadeIn>

            {/* Medium Cards Row */}
            <FadeIn delay={0.4}>
              <motion.div 
                whileHover={{ y: -5 }}
                className="p-6 rounded-3xl bg-card border border-border hover:border-primary/30 transition-colors"
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                    <Users className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-foreground mb-1">حلقات تفاعلية مباشرة</h3>
                    <p className="text-sm text-muted-foreground">تعلم في مجموعات صغيرة مع طلاب من حول العالم</p>
                  </div>
                </div>
              </motion.div>
            </FadeIn>

            <FadeIn delay={0.5}>
              <motion.div 
                whileHover={{ y: -5 }}
                className="p-6 rounded-3xl bg-card border border-border hover:border-primary/30 transition-colors"
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                    <Award className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-foreground mb-1">شهادات وإجازات معتمدة</h3>
                    <p className="text-sm text-muted-foreground">احصل على إجازة بالسند المتصل إلى رسول الله</p>
                  </div>
                </div>
              </motion.div>
            </FadeIn>

            <FadeIn delay={0.6}>
              <motion.div 
                whileHover={{ y: -5 }}
                className="p-6 rounded-3xl bg-card border border-border hover:border-primary/30 transition-colors"
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                    <Trophy className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-foreground mb-1">مسابقات ومكافآت</h3>
                    <p className="text-sm text-muted-foreground">شارك في تحديات أسبوعية واربح نقاط وجوائز</p>
                  </div>
                </div>
              </motion.div>
            </FadeIn>
          </div>

          {/* Additional Info Row */}
          <div className="grid md:grid-cols-4 gap-4 mt-4 max-w-6xl mx-auto">
            {[
              { icon: Clock, text: "متاح 24/7" },
              { icon: Globe, text: "من أي مكان" },
              { icon: Shield, text: "آمن وموثوق" },
              { icon: Zap, text: "تجربة سلسة" },
            ].map((item, i) => (
              <FadeIn key={i} delay={0.7 + i * 0.1}>
                <div className="flex items-center justify-center gap-3 p-4 rounded-2xl bg-secondary/50">
                  <item.icon className="w-5 h-5 text-primary" />
                  <span className="text-sm font-medium text-foreground">{item.text}</span>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-24 md:py-32 bg-secondary/30 relative overflow-hidden">
        <div className="container mx-auto px-4 relative z-10">
          <FadeIn>
            <div className="text-center max-w-2xl mx-auto mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                كيف تبدأ رحلتك؟
              </h2>
              <p className="text-muted-foreground text-lg">
                أربع خطوات بسيطة لتبدأ رحلتك مع القرآن الكريم
              </p>
            </div>
          </FadeIn>

          <div className="max-w-4xl mx-auto">
            <div className="relative">
              {/* Connection Line */}
              <div className="absolute top-8 right-8 left-8 h-0.5 bg-border hidden md:block" />
              
              <div className="grid md:grid-cols-4 gap-8">
                {learningPath.map((item, i) => (
                  <FadeIn key={i} delay={i * 0.15}>
                    <motion.div
                      whileHover={{ y: -10 }}
                      className="relative text-center"
                    >
                      <div className="relative z-10 w-16 h-16 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-2xl font-bold mx-auto mb-4 shadow-lg shadow-primary/25">
                        {item.step}
                      </div>
                      <h3 className="text-lg font-bold text-foreground mb-2">{item.title}</h3>
                      <p className="text-sm text-muted-foreground">{item.description}</p>
                    </motion.div>
                  </FadeIn>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section - Enhanced */}
      <section id="testimonials" className="py-24 md:py-32 relative overflow-hidden">
        <IslamicPattern animate={false} />
        
        <div className="container mx-auto px-4 relative z-10">
          <FadeIn>
            <div className="text-center max-w-2xl mx-auto mb-16">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/10 border border-accent/20 mb-6">
                <MessageCircle className="w-4 h-4 text-accent" />
                <span className="text-sm text-accent font-medium">قصص نجاح</span>
              </div>
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                ماذا يقول <span className="text-primary">طلابنا</span>
              </h2>
              <p className="text-muted-foreground text-lg">
                تجارب حقيقية من طلاب أتموا رحلتهم معنا
              </p>
            </div>
          </FadeIn>

          <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {[
              { 
                quote: "بفضل الله ثم منصة إتقان، أتممت حفظ القرآن الكريم كاملاً في سنتين. المعلمون متميزون والمنهجية فعالة جداً", 
                author: "أحمد محمد سالم", 
                role: "حافظ للقرآن الكريم",
                country: "السعودية",
                achievement: "أتم الحفظ"
              },
              { 
                quote: "كمعلمة، أجد في إتقان بيئة مثالية لتدريس القرآن. الأدوات التقنية تسهل المتابعة والتواصل مع الطالبات", 
                author: "فاطمة علي الزهراء", 
                role: "معلمة قرآن",
                country: "مصر",
                achievement: "معلمة متميزة"
              },
              { 
                quote: "ابني يحب جلسات إتقان كثيراً. المعلم صبور ومتفهم، والتقدم ملحوظ ماشاء الله. أنصح كل الآباء بهذه المنصة", 
                author: "خالد عبدالرحمن", 
                role: "ولي أمر",
                country: "الإمارات",
                achievement: "ولي أمر راضٍ"
              },
            ].map((testimonial, i) => (
              <FadeIn key={i} delay={i * 0.15}>
                <motion.div
                  whileHover={{ y: -5 }}
                  className="relative p-6 rounded-3xl bg-card border border-border hover:border-primary/20 transition-all h-full"
                >
                  {/* Quote mark */}
                  <div className="absolute top-4 left-4 text-6xl text-primary/10 font-serif leading-none">"</div>
                  
                  {/* Achievement badge */}
                  <div className="flex justify-end mb-4">
                    <span className="text-xs bg-primary/10 text-primary px-3 py-1 rounded-full">
                      {testimonial.achievement}
                    </span>
                  </div>
                  
                  <p className="text-foreground/80 mb-6 leading-relaxed relative z-10">{testimonial.quote}</p>
                  
                  <div className="flex items-center gap-4 pt-4 border-t border-border">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center text-primary-foreground font-bold text-lg">
                      {testimonial.author.charAt(0)}
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold text-foreground">{testimonial.author}</div>
                      <div className="text-sm text-muted-foreground flex items-center gap-2">
                        <span>{testimonial.role}</span>
                        <span className="w-1 h-1 rounded-full bg-muted-foreground" />
                        <span>{testimonial.country}</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Stars */}
                  <div className="flex gap-1 mt-4">
                    {[1,2,3,4,5].map((star) => (
                      <Star key={star} className="w-4 h-4 text-accent fill-accent" />
                    ))}
                  </div>
                </motion.div>
              </FadeIn>
            ))}
          </div>

          {/* Trust indicators */}
          <FadeIn delay={0.5}>
            <div className="mt-16 text-center">
              <p className="text-muted-foreground mb-6">موثوق من آلاف الطلاب حول العالم</p>
              <div className="flex flex-wrap items-center justify-center gap-8">
                {["4.9/5 تقييم", "15,000+ طالب", "45+ دولة", "98% رضا"].map((stat, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm">
                    <CheckCircle2 className="w-5 h-5 text-primary" />
                    <span className="text-foreground font-medium">{stat}</span>
                  </div>
                ))}
              </div>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* CTA Section - Enhanced */}
      <section className="py-24 md:py-32 bg-secondary/30">
        <div className="container mx-auto px-4">
          <FadeIn>
            <div className="relative max-w-5xl mx-auto overflow-hidden rounded-[2.5rem]">
              {/* Background with pattern */}
              <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary to-primary/80" />
              <IslamicPattern className="opacity-10" animate={false} />
              
              <div className="relative z-10 p-8 md:p-16 lg:p-20 text-center text-primary-foreground">
                {/* Decorative elements */}
                <motion.div 
                  className="absolute top-10 right-10 w-20 h-20 border border-white/20 rounded-full"
                  animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
                  transition={{ duration: 4, repeat: Infinity }}
                />
                <motion.div 
                  className="absolute bottom-10 left-10 w-16 h-16 border border-white/20 rotate-45"
                  animate={{ rotate: [45, 90, 45], opacity: [0.2, 0.4, 0.2] }}
                  transition={{ duration: 6, repeat: Infinity }}
                />
                
                <motion.div
                  initial={{ scale: 0 }}
                  whileInView={{ scale: 1 }}
                  viewport={{ once: true }}
                  className="w-20 h-20 rounded-full bg-white/20 flex items-center justify-center mx-auto mb-8"
                >
                  <BookOpen className="w-10 h-10" />
                </motion.div>
                
                <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6 leading-tight">
                  رحلة الألف ميل تبدأ بخطوة
                  <br />
                  <span className="text-accent">ابدأ اليوم</span>
                </h2>
                <p className="text-primary-foreground/80 text-lg md:text-xl mb-10 max-w-2xl mx-auto leading-relaxed">
                  انضم إلى مجتمع إتقان وابدأ رحلتك مع القرآن الكريم. التسجيل مجاني وسريع.
                </p>
                
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
                  <Magnet padding={50} magnetStrength={2}>
                    <Link 
                      href="/register"
                      className="group flex items-center gap-3 h-14 px-10 bg-white text-primary rounded-2xl font-semibold hover:bg-white/90 transition-all shadow-xl"
                    >
                      <span>ابدأ رحلتك مجاناً</span>
                      <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                    </Link>
                  </Magnet>
                  <Link 
                    href="/about"
                    className="flex items-center gap-2 h-14 px-10 bg-white/10 text-primary-foreground rounded-2xl font-medium hover:bg-white/20 transition-colors border border-white/20"
                  >
                    <Play className="w-5 h-5" />
                    <span>شاهد الفيديو التعريفي</span>
                  </Link>
                </div>
                
                {/* Trust badges */}
                <div className="flex flex-wrap items-center justify-center gap-6 pt-8 border-t border-white/20">
                  {[
                    { icon: Shield, text: "تسجيل آمن" },
                    { icon: Clock, text: "دقيقتين للتسجيل" },
                    { icon: Heart, text: "بدون التزام" },
                  ].map((badge, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm text-primary-foreground/80">
                      <badge.icon className="w-4 h-4" />
                      <span>{badge.text}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-24 md:py-32">
        <div className="container mx-auto px-4">
          <FadeIn>
            <div className="text-center max-w-2xl mx-auto mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                أسئلة شائعة
              </h2>
              <p className="text-muted-foreground text-lg">
                إجابات لأكثر الأسئلة التي تصلنا
              </p>
            </div>
          </FadeIn>

          <div className="max-w-3xl mx-auto space-y-4">
            {[
              { q: "هل المنصة مجانية؟", a: "نعم، التسجيل والاستماع للتلاوات مجاني. الأكاديمية لها اشتراك شهري بسيط يشمل الحلقات التفاعلية والمتابعة الشخصية." },
              { q: "من هم المعلمون في إتقان؟", a: "جميع معلمينا حاصلون على إجازات في القرآن الكريم بالسند المتصل، ولديهم خبرة لا تقل عن 5 سنوات في التدريس." },
              { q: "كيف تتم الحلقات التعليمية؟", a: "تتم الحلقات عبر الفيديو المباشر في مجموعات صغيرة (3-5 طلاب) أو بشكل فردي حسب اختيارك." },
              { q: "هل يمكنني الحصول على إجازة؟", a: "نعم، عند إتمام حفظ القرآن الكريم وإتقان التجويد، يمكنك الحصول على إجازة بالسند المتصل من معلمينا المجازين." },
            ].map((faq, i) => (
              <FadeIn key={i} delay={i * 0.1}>
                <motion.div
                  whileHover={{ scale: 1.01 }}
                  className="p-6 rounded-2xl bg-card border border-border hover:border-primary/20 transition-all"
                >
                  <h3 className="text-lg font-semibold text-foreground mb-2 flex items-start gap-3">
                    <span className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-primary text-sm shrink-0 mt-0.5">؟</span>
                    {faq.q}
                  </h3>
                  <p className="text-muted-foreground pr-9">{faq.a}</p>
                </motion.div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* Footer - Enhanced */}
      <footer className="py-16 bg-card border-t border-border">
        <div className="container mx-auto px-4">
          <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-12 mb-16">
            {/* Brand Column */}
            <div className="lg:col-span-2">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center">
                  <BookOpen className="w-6 h-6 text-primary-foreground" />
                </div>
                <div>
                  <span className="text-2xl font-bold text-foreground">إتقان</span>
                  <span className="block text-xs text-muted-foreground">حلقة القرآن والأكاديمية</span>
                </div>
              </div>
              <p className="text-muted-foreground leading-relaxed mb-6 max-w-sm">
                منصة قرآنية متكاملة تجمع بين حلقة القرآن للاستماع والأكاديمية للتعلم والحفظ مع أفضل المعلمين حول العالم.
              </p>
              {/* Social Links */}
              <div className="flex gap-3">
                {["twitter", "youtube", "telegram"].map((social) => (
                  <Link 
                    key={social}
                    href="#" 
                    className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center hover:bg-primary hover:text-primary-foreground transition-colors"
                  >
                    <span className="sr-only">{social}</span>
                    <div className="w-5 h-5 bg-current rounded opacity-50" />
                  </Link>
                ))}
              </div>
            </div>
            
            {/* Links Columns */}
            {[
              { 
                title: "الأكاديمية", 
                links: [
                  { label: "الدورات", href: "/academy/student/courses" },
                  { label: "المعلمون", href: "/academy/admin/teachers" },
                  { label: "المسارات التعليمية", href: "/academy/student/path" },
                  { label: "الشهادات", href: "#" },
                ] 
              },
              { 
                title: "حلقة القرآن", 
                links: [
                  { label: "التلاوات", href: "/student" },
                  { label: "القراء", href: "/student" },
                  { label: "القوائم", href: "/student" },
                  { label: "المفضلة", href: "/student" },
                ] 
              },
              { 
                title: "الدعم", 
                links: [
                  { label: "مركز المساعدة", href: "/contact" },
                  { label: "تواصل معنا", href: "/contact" },
                  { label: "الأسئلة الشائعة", href: "#" },
                  { label: "سياسة الخصوصية", href: "/privacy" },
                ] 
              },
            ].map((section, i) => (
              <div key={i}>
                <h4 className="font-semibold text-foreground mb-4">{section.title}</h4>
                <ul className="space-y-3">
                  {section.links.map((link, j) => (
                    <li key={j}>
                      <Link 
                        href={link.href} 
                        className="text-sm text-muted-foreground hover:text-primary transition-colors"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          
          {/* Bottom Bar */}
          <div className="pt-8 border-t border-border">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <p className="text-sm text-muted-foreground">
                جميع الحقوق محفوظة © {new Date().getFullYear()} منصة إتقان
              </p>
              <div className="flex items-center gap-6">
                <Link href="/privacy" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  سياسة الخصوصية
                </Link>
                <Link href="/terms" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  الشروط والأحكام
                </Link>
                <span className="text-sm text-muted-foreground">
                  صنع بـ ❤️ لخدمة القرآن
                </span>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
