"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { Book, Headphones, GraduationCap, Users, Award, Play, ChevronLeft, Menu, X, Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"

export default function HomePage() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const handleScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? "bg-background/95 backdrop-blur-md shadow-sm" : "bg-transparent"}`}>
        <div className="max-w-7xl mx-auto px-6 py-4">
          <nav className="flex items-center justify-between">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center">
                <Book className="w-5 h-5 text-primary-foreground" />
              </div>
              <span className="text-xl font-bold text-foreground">إتقان</span>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-8">
              <Link href="#features" className="text-muted-foreground hover:text-foreground transition-colors">المميزات</Link>
              <Link href="#academy" className="text-muted-foreground hover:text-foreground transition-colors">الأكاديمية</Link>
              <Link href="#library" className="text-muted-foreground hover:text-foreground transition-colors">المكتبة الصوتية</Link>
              <Link href="#about" className="text-muted-foreground hover:text-foreground transition-colors">من نحن</Link>
            </div>

            {/* Actions */}
            <div className="hidden md:flex items-center gap-4">
              {mounted && (
                <button
                  onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                  className="p-2 rounded-lg hover:bg-muted transition-colors"
                >
                  {theme === "dark" ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                </button>
              )}
              <Link href="/login" className="text-muted-foreground hover:text-foreground transition-colors">
                تسجيل الدخول
              </Link>
              <Link 
                href="/register" 
                className="px-5 py-2.5 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium"
              >
                ابدأ الآن
              </Link>
            </div>

            {/* Mobile Menu Button */}
            <button 
              className="md:hidden p-2 hover:bg-muted rounded-lg transition-colors"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </nav>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden bg-background border-t border-border">
            <div className="px-6 py-4 space-y-4">
              <Link href="#features" className="block text-muted-foreground hover:text-foreground">المميزات</Link>
              <Link href="#academy" className="block text-muted-foreground hover:text-foreground">الأكاديمية</Link>
              <Link href="#library" className="block text-muted-foreground hover:text-foreground">المكتبة الصوتية</Link>
              <Link href="#about" className="block text-muted-foreground hover:text-foreground">من نحن</Link>
              <div className="pt-4 border-t border-border space-y-3">
                <Link href="/login" className="block text-center py-2 text-muted-foreground">تسجيل الدخول</Link>
                <Link href="/register" className="block text-center py-2.5 bg-primary text-primary-foreground rounded-lg">ابدأ الآن</Link>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center pt-20 overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.02]">
          <div className="absolute inset-0" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%230D5A3C' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }} />
        </div>

        <div className="relative max-w-7xl mx-auto px-6 py-20">
          <div className="text-center max-w-4xl mx-auto">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[var(--gold)]/10 text-[var(--gold)] dark:text-[var(--gold-light)] mb-8">
              <Award className="w-4 h-4" />
              <span className="text-sm font-medium">منصة تعليمية متكاملة لتعليم القرآن الكريم</span>
            </div>

            {/* Main Heading */}
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-foreground leading-tight mb-6">
              <span className="block">أتقن تلاوة</span>
              <span className="block text-primary">القرآن الكريم</span>
            </h1>

            {/* Subheading */}
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
              منصة إتقان تجمع بين أكاديمية تعليمية متخصصة ومكتبة صوتية شاملة،
              لتمنحك تجربة فريدة في رحلتك مع كتاب الله
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
              <Link 
                href="/register"
                className="w-full sm:w-auto px-8 py-4 bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 transition-all font-semibold text-lg flex items-center justify-center gap-2 group"
              >
                انضم للأكاديمية
                <ChevronLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
              </Link>
              <Link 
                href="/student"
                className="w-full sm:w-auto px-8 py-4 bg-card border-2 border-border text-foreground rounded-xl hover:border-primary/50 hover:bg-muted transition-all font-semibold text-lg flex items-center justify-center gap-2"
              >
                <Play className="w-5 h-5" />
                استكشف المكتبة الصوتية
              </Link>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-3xl mx-auto">
              {[
                { value: "+5000", label: "طالب مسجل" },
                { value: "+100", label: "معلم معتمد" },
                { value: "+500", label: "ساعة تعليمية" },
                { value: "4.9", label: "تقييم المنصة" },
              ].map((stat, i) => (
                <div key={i} className="text-center">
                  <div className="text-2xl md:text-3xl font-bold text-primary mb-1">{stat.value}</div>
                  <div className="text-sm text-muted-foreground">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
          <div className="w-6 h-10 rounded-full border-2 border-muted-foreground/30 flex items-start justify-center p-2">
            <div className="w-1 h-2 bg-muted-foreground/50 rounded-full" />
          </div>
        </div>
      </section>

      {/* Two Modes Section */}
      <section id="features" className="py-24 bg-muted/50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              منصة واحدة، تجربتان فريدتان
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              اختر الطريقة التي تناسبك للتفاعل مع القرآن الكريم
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Academy Card */}
            <Link href="/academy/student" className="group">
              <div className="relative h-full bg-card rounded-2xl border border-border overflow-hidden transition-all duration-300 hover:shadow-xl hover:border-primary/30">
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -translate-y-1/2 translate-x-1/2" />
                <div className="relative p-8 md:p-10">
                  <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mb-6 group-hover:bg-primary/20 transition-colors">
                    <GraduationCap className="w-7 h-7 text-primary" />
                  </div>
                  <h3 className="text-2xl font-bold text-foreground mb-3">الأكاديمية التعليمية</h3>
                  <p className="text-muted-foreground mb-6 leading-relaxed">
                    تعلّم القرآن الكريم مع نخبة من المعلمين المعتمدين. حلقات تحفيظ، دورات تجويد، 
                    ومتابعة شخصية لتحقيق أهدافك في حفظ وإتقان كتاب الله.
                  </p>
                  <ul className="space-y-3 mb-8">
                    {["حلقات تحفيظ يومية مع معلمين متخصصين", "نظام متابعة شخصي لتقدمك", "شهادات معتمدة عند الإتمام", "مسابقات ونقاط تحفيزية"].map((item, i) => (
                      <li key={i} className="flex items-center gap-3 text-sm text-muted-foreground">
                        <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <div className="w-2 h-2 rounded-full bg-primary" />
                        </div>
                        {item}
                      </li>
                    ))}
                  </ul>
                  <div className="flex items-center gap-2 text-primary font-medium group-hover:gap-3 transition-all">
                    <span>ابدأ رحلتك التعليمية</span>
                    <ChevronLeft className="w-5 h-5" />
                  </div>
                </div>
              </div>
            </Link>

            {/* Audio Library Card */}
            <Link href="/student" className="group">
              <div className="relative h-full bg-card rounded-2xl border border-border overflow-hidden transition-all duration-300 hover:shadow-xl hover:border-[var(--gold)]/30">
                <div className="absolute top-0 right-0 w-32 h-32 bg-[var(--gold)]/5 rounded-full -translate-y-1/2 translate-x-1/2" />
                <div className="relative p-8 md:p-10">
                  <div className="w-14 h-14 rounded-xl bg-[var(--gold)]/10 flex items-center justify-center mb-6 group-hover:bg-[var(--gold)]/20 transition-colors">
                    <Headphones className="w-7 h-7 text-[var(--gold)]" />
                  </div>
                  <h3 className="text-2xl font-bold text-foreground mb-3">المكتبة الصوتية</h3>
                  <p className="text-muted-foreground mb-6 leading-relaxed">
                    استمع لتلاوات القرآن الكريم بأصوات أشهر القراء. سجّل تلاواتك واحصل على تقييم 
                    من مقرئين معتمدين لتحسين أدائك.
                  </p>
                  <ul className="space-y-3 mb-8">
                    {["آلاف التلاوات بجودة عالية", "سجّل تلاوتك واحصل على تقييم", "تابع تقدمك في الحفظ", "قوائم تشغيل مخصصة"].map((item, i) => (
                      <li key={i} className="flex items-center gap-3 text-sm text-muted-foreground">
                        <div className="w-5 h-5 rounded-full bg-[var(--gold)]/10 flex items-center justify-center flex-shrink-0">
                          <div className="w-2 h-2 rounded-full bg-[var(--gold)]" />
                        </div>
                        {item}
                      </li>
                    ))}
                  </ul>
                  <div className="flex items-center gap-2 text-[var(--gold)] font-medium group-hover:gap-3 transition-all">
                    <span>استكشف المكتبة</span>
                    <ChevronLeft className="w-5 h-5" />
                  </div>
                </div>
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* Academy Features */}
      <section id="academy" className="py-24">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
                <GraduationCap className="w-4 h-4" />
                الأكاديمية
              </div>
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-6">
                تعليم متكامل بأحدث الأساليب التربوية
              </h2>
              <p className="text-muted-foreground mb-8 leading-relaxed">
                نقدم لك تجربة تعليمية فريدة تجمع بين الأصالة والمعاصرة، مع معلمين متخصصين 
                ومناهج مدروسة تناسب جميع المستويات والأعمار.
              </p>
              
              <div className="space-y-6">
                {[
                  { title: "حلقات تفاعلية", desc: "جلسات مباشرة مع المعلم للتصحيح والمتابعة" },
                  { title: "مسارات متدرجة", desc: "من المبتدئ حتى الإجازة في القراءات" },
                  { title: "تقييم مستمر", desc: "متابعة دقيقة لمستواك وتقدمك" },
                ].map((item, i) => (
                  <div key={i} className="flex gap-4">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <span className="text-primary font-bold">{i + 1}</span>
                    </div>
                    <div>
                      <h4 className="font-semibold text-foreground mb-1">{item.title}</h4>
                      <p className="text-sm text-muted-foreground">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              <Link 
                href="/register"
                className="inline-flex items-center gap-2 mt-8 px-6 py-3 bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 transition-colors font-medium"
              >
                سجّل في الأكاديمية
                <ChevronLeft className="w-5 h-5" />
              </Link>
            </div>

            <div className="relative">
              <div className="aspect-square rounded-2xl bg-gradient-to-br from-primary/5 to-primary/10 p-8 flex items-center justify-center">
                <div className="grid grid-cols-2 gap-4 w-full max-w-sm">
                  {[
                    { icon: Users, label: "معلمون معتمدون", value: "+100" },
                    { icon: Book, label: "دورة متاحة", value: "+50" },
                    { icon: Award, label: "شهادة ممنوحة", value: "+2000" },
                    { icon: GraduationCap, label: "طالب نشط", value: "+5000" },
                  ].map((item, i) => (
                    <div key={i} className="bg-card rounded-xl p-4 text-center border border-border">
                      <item.icon className="w-8 h-8 text-primary mx-auto mb-2" />
                      <div className="text-2xl font-bold text-foreground">{item.value}</div>
                      <div className="text-xs text-muted-foreground">{item.label}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Audio Library Features */}
      <section id="library" className="py-24 bg-muted/50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="order-2 lg:order-1">
              <div className="aspect-square rounded-2xl bg-gradient-to-br from-[var(--gold)]/5 to-[var(--gold)]/10 p-8 flex items-center justify-center">
                <div className="relative w-full max-w-xs">
                  {/* Audio Player Mockup */}
                  <div className="bg-card rounded-2xl p-6 border border-border shadow-lg">
                    <div className="w-20 h-20 rounded-full bg-[var(--gold)]/10 mx-auto mb-4 flex items-center justify-center">
                      <Headphones className="w-10 h-10 text-[var(--gold)]" />
                    </div>
                    <div className="text-center mb-4">
                      <h4 className="font-semibold text-foreground">سورة البقرة</h4>
                      <p className="text-sm text-muted-foreground">الشيخ عبدالباسط عبدالصمد</p>
                    </div>
                    <div className="h-1 bg-muted rounded-full mb-4">
                      <div className="h-full w-1/3 bg-[var(--gold)] rounded-full" />
                    </div>
                    <div className="flex items-center justify-center gap-4">
                      <button className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                        <ChevronLeft className="w-5 h-5 rotate-180" />
                      </button>
                      <button className="w-14 h-14 rounded-full bg-[var(--gold)] text-white flex items-center justify-center">
                        <Play className="w-6 h-6 mr-[-2px]" />
                      </button>
                      <button className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                        <ChevronLeft className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="order-1 lg:order-2">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[var(--gold)]/10 text-[var(--gold)] text-sm font-medium mb-6">
                <Headphones className="w-4 h-4" />
                المكتبة الصوتية
              </div>
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-6">
                استمع وسجّل وتعلّم
              </h2>
              <p className="text-muted-foreground mb-8 leading-relaxed">
                مكتبة صوتية شاملة تضم تلاوات لأشهر القراء حول العالم، مع إمكانية تسجيل 
                تلاوتك والحصول على تقييم من مقرئين متخصصين.
              </p>
              
              <div className="space-y-6">
                {[
                  { title: "تلاوات متنوعة", desc: "آلاف التلاوات بمختلف القراءات والروايات" },
                  { title: "سجّل تلاوتك", desc: "سجّل واحصل على تقييم من مقرئين معتمدين" },
                  { title: "تتبع تقدمك", desc: "راقب تطور مستواك عبر الوقت" },
                ].map((item, i) => (
                  <div key={i} className="flex gap-4">
                    <div className="w-10 h-10 rounded-lg bg-[var(--gold)]/10 flex items-center justify-center flex-shrink-0">
                      <span className="text-[var(--gold)] font-bold">{i + 1}</span>
                    </div>
                    <div>
                      <h4 className="font-semibold text-foreground mb-1">{item.title}</h4>
                      <p className="text-sm text-muted-foreground">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              <Link 
                href="/student"
                className="inline-flex items-center gap-2 mt-8 px-6 py-3 bg-[var(--gold)] text-white rounded-xl hover:bg-[var(--gold)]/90 transition-colors font-medium"
              >
                استكشف المكتبة
                <ChevronLeft className="w-5 h-5" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-6">
          <div className="relative rounded-3xl overflow-hidden bg-primary p-12 md:p-16 text-center">
            <div className="absolute inset-0 opacity-10">
              <div className="absolute inset-0" style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
              }} />
            </div>
            <div className="relative">
              <h2 className="text-3xl md:text-4xl font-bold text-primary-foreground mb-4">
                ابدأ رحلتك مع القرآن الكريم اليوم
              </h2>
              <p className="text-primary-foreground/80 max-w-2xl mx-auto mb-8">
                انضم لآلاف الطلاب الذين يتعلمون القرآن الكريم على منصة إتقان
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link 
                  href="/register"
                  className="w-full sm:w-auto px-8 py-4 bg-white text-primary rounded-xl hover:bg-white/90 transition-colors font-semibold"
                >
                  أنشئ حسابك مجاناً
                </Link>
                <Link 
                  href="/login"
                  className="w-full sm:w-auto px-8 py-4 bg-transparent border-2 border-white/30 text-primary-foreground rounded-xl hover:bg-white/10 transition-colors font-semibold"
                >
                  لديك حساب؟ سجّل دخولك
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer id="about" className="py-16 border-t border-border">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-4 gap-12 mb-12">
            <div className="md:col-span-2">
              <Link href="/" className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center">
                  <Book className="w-5 h-5 text-primary-foreground" />
                </div>
                <span className="text-xl font-bold text-foreground">إتقان</span>
              </Link>
              <p className="text-muted-foreground max-w-md leading-relaxed">
                منصة إتقان التعليمية - منصة متكاملة لتعليم القرآن الكريم وإتقان تلاوته، 
                تجمع بين أكاديمية تعليمية ومكتبة صوتية شاملة.
              </p>
            </div>

            <div>
              <h4 className="font-semibold text-foreground mb-4">روابط سريعة</h4>
              <ul className="space-y-3">
                {["الأكاديمية", "المكتبة الصوتية", "من نحن", "تواصل معنا"].map((item, i) => (
                  <li key={i}>
                    <Link href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                      {item}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-foreground mb-4">قانوني</h4>
              <ul className="space-y-3">
                {["سياسة الخصوصية", "شروط الاستخدام", "الأسئلة الشائعة"].map((item, i) => (
                  <li key={i}>
                    <Link href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                      {item}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="pt-8 border-t border-border text-center text-sm text-muted-foreground">
            جميع الحقوق محفوظة &copy; {new Date().getFullYear()} منصة إتقان التعليمية
          </div>
        </div>
      </footer>
    </div>
  )
}
