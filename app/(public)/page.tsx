"use client"

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useI18n } from '@/lib/i18n/context'
import { Mic, CheckCircle, Calendar, ArrowLeft, ChevronDown, BookOpen, Shield, Award, Star, GraduationCap, Users, Trophy, Heart, Sparkles } from 'lucide-react'
import { usePublicSettings } from '@/lib/hooks/use-public-settings'

export default function LandingPage() {
  const { t } = useI18n()
  const { branding, contactInfo } = usePublicSettings()
  const [masteredStudents, setMasteredStudents] = useState(0)

  useEffect(() => {
    fetch('/api/public/stats')
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data?.masteredStudents) setMasteredStudents(data.masteredStudents) })
      .catch(() => { })
  }, [])

  return (
    <div className="overflow-hidden">
      {/* ========== HERO ========== */}
      <section className="relative min-h-screen flex flex-col justify-center items-center overflow-hidden px-4 py-20 text-center text-white bg-[#0B3D2E]">
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 opacity-5" style={{ background: 'radial-gradient(circle at center, #D4A843 0%, transparent 50%)' }} />
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#D4A843] rounded-full mix-blend-multiply blur-3xl opacity-5 animate-blob-float" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[#0B3D2E] rounded-full mix-blend-multiply blur-3xl opacity-10 animate-blob-float-delayed" />
        </div>
        <div className="relative z-10 max-w-4xl mx-auto flex flex-col items-center gap-6 mt-12">
          <h1 className="text-3xl sm:text-4xl md:text-6xl lg:text-8xl font-black tracking-tight leading-[1.1] text-center px-2">
            <span>{t.landing.heroTitle} </span>
            <span className="text-[#D4A843]" style={{ textShadow: '0 0 20px rgba(212,168,67,0.3)' }}>{t.landing.heroEducational}</span>
          </h1>

          <div className="bg-[#D4A843]/10 border border-[#D4A843]/20 px-4 md:px-6 py-2 rounded-full mb-2">
            <span className="text-[#D4A843] font-bold tracking-[0.05em] md:tracking-[0.1em] text-xs sm:text-sm md:text-lg">
              {t.landing.heroInitiative}
            </span>
          </div>

          {/* Ayah */}
          <div className="flex items-center gap-4 w-full justify-center py-2 px-4 max-w-lg">
            <div className="h-px flex-1 bg-gradient-to-r from-transparent to-[#D4A843]/40" />
            <div className="text-center select-none flex-shrink-0">
              <p
                className="text-lg sm:text-xl md:text-2xl font-bold tracking-[0.1em] md:tracking-[0.15em] leading-relaxed"
                style={{
                  fontFamily: 'var(--font-quran, Georgia, serif)',
                  color: 'rgba(212,168,67,0.7)',
                }}
              >
                {t.landing.heroAyah}
              </p>
              <p className="text-[10px] md:text-[12px] tracking-[0.2em] md:tracking-[0.3em] text-[#D4A843]/40 mt-1 uppercase font-bold">
                {t.landing.heroAyahSource}
              </p>
            </div>
            <div className="h-px flex-1 bg-gradient-to-l from-transparent to-[#D4A843]/40" />
          </div>

          <p className="text-lg md:text-2xl font-medium text-white/90 max-w-2xl px-4 text-balance">
            {t.landing.heroSubtitle}
          </p>
          <p className="max-w-xl mx-auto text-white/60 text-xs sm:text-sm md:text-base leading-relaxed px-4">
            {t.landing.heroDesc}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 mt-8 w-full justify-center px-4 max-w-md md:max-w-none">
            <Link href="/register" className="group bg-[#D4A843] text-white hover:bg-[#C49A3A] font-black py-4 md:py-5 px-10 rounded-2xl md:rounded-full transition-all duration-300 hover:scale-[1.02] md:hover:scale-105 active:scale-95 shadow-xl shadow-[#D4A843]/20 flex items-center justify-center gap-2 w-full md:min-w-[240px]">
              <span>{t.landing.startNow}</span>
              <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
            </Link>
            <Link href="#how-it-works" className="group border-2 border-[#D4A843]/30 text-[#D4A843] hover:bg-[#D4A843]/10 hover:border-[#D4A843] font-bold py-4 md:py-5 px-10 rounded-2xl md:rounded-full transition-all duration-300 backdrop-blur-sm flex items-center justify-center gap-2 w-full md:min-w-[240px] hover:scale-[1.02] md:hover:scale-105 active:scale-95">
              <span>{t.landing.howItWorksBtn}</span>
            </Link>
          </div>
        </div>
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce hidden md:block">
          <Link href="#how-it-works" className="text-[#D4A843]/60 hover:text-[#D4A843] transition-colors">
            <ChevronDown className="w-10 h-10" />
          </Link>
        </div>
      </section>

      {/* ========== HOW IT WORKS ========== */}
      <section id="how-it-works" className="relative py-24 md:py-36 px-4 bg-secondary/30 dark:bg-background overflow-hidden">
        {/* Animated background orbs */}
        <div className="absolute top-20 right-10 w-[300px] md:w-[500px] h-[300px] md:h-[500px] rounded-full bg-primary/5 dark:bg-primary/10 blur-[120px] animate-blob-float pointer-events-none" />
        <div className="absolute bottom-20 left-10 w-[250px] md:w-[400px] h-[250px] md:h-[400px] rounded-full bg-primary/5 dark:bg-primary/20 blur-[100px] animate-blob-float-delayed pointer-events-none" />

        <div className="container mx-auto max-w-6xl relative z-10">
          <div className="flex items-center gap-4 mb-8">
            <div className="h-px flex-1 bg-foreground/10" />
            <span className="text-primary text-[10px] md:text-xs font-black tracking-[0.2em] md:tracking-[0.3em] uppercase">{t.landing.stepsLabel}</span>
            <div className="h-px flex-1 bg-foreground/10" />
          </div>

          <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-7xl font-black text-foreground text-center mb-6 text-balance leading-tight">
            {t.landing.fatihaMasteryTitle}
          </h2>
          <p className="text-center text-muted-foreground text-base md:text-lg mb-20 md:mb-24 max-w-xl mx-auto px-4">
            {t.landing.fatihaMasteryDesc}
          </p>

          {/* Steps */}
          <div className="flex flex-col gap-24 md:gap-0">
            {/* Step 1 */}
            <div className="group relative md:grid md:grid-cols-2 md:gap-16 items-center">
              <div className="relative flex items-center justify-center mb-10 md:mb-0">
                <div className="relative w-40 h-40 sm:w-48 sm:h-48 md:w-64 md:h-64 mx-auto">
                  <div className="absolute inset-0 rounded-full border-2 border-dashed border-[#D4A843]/20 group-hover:border-[#D4A843]/40 transition-colors duration-700 md:group-hover:animate-[spin_20s_linear_infinite]" />
                  <div className="absolute inset-4 md:inset-6 rounded-full bg-gradient-to-br from-[#0B3D2E] to-[#16503A] shadow-2xl shadow-[#0B3D2E]/30 flex items-center justify-center group-hover:scale-105 transition-transform duration-500">
                    <Mic className="w-12 h-12 md:w-20 md:h-20 text-white/90" />
                  </div>
                  <div className="absolute -top-1 -right-1 md:top-0 md:right-0 w-11 h-11 md:w-14 md:h-14 rounded-2xl bg-[#D4A843] shadow-lg shadow-[#D4A843]/30 flex items-center justify-center text-white font-black text-xl md:text-2xl rotate-12 group-hover:rotate-0 transition-transform duration-500">
                    1
                  </div>
                </div>
              </div>
              <div className="text-center md:text-right px-4">
                <h3 className="text-2xl md:text-3xl font-black text-foreground mb-4">{t.landing.step1Title}</h3>
                <p className="text-muted-foreground text-base md:text-lg leading-relaxed max-w-md mx-auto md:mx-0 md:mr-0 font-medium">
                  {t.landing.step1Desc}
                </p>
              </div>
            </div>

            {/* Connector */}
            <div className="hidden md:flex items-center justify-center py-10">
              <div className="w-px h-24 bg-gradient-to-b from-[#D4A843]/40 to-transparent" />
            </div>

            {/* Step 2 - reversed on desktop only */}
            <div className="group relative md:grid md:grid-cols-2 md:gap-16 items-center">
              <div className="relative flex items-center justify-center mb-10 md:mb-0 md:order-2">
                <div className="relative w-40 h-40 sm:w-48 sm:h-48 md:w-64 md:h-64 mx-auto">
                  <div className="absolute inset-0 rounded-full border-2 border-dashed border-[#D4A843]/20 group-hover:border-[#D4A843]/40 transition-colors duration-700 md:group-hover:animate-[spin_20s_linear_infinite]" />
                  <div className="absolute inset-4 md:inset-6 rounded-full bg-gradient-to-br from-[#D4A843] to-[#C49A3A] shadow-2xl shadow-[#D4A843]/30 flex items-center justify-center group-hover:scale-105 transition-transform duration-500">
                    <CheckCircle className="w-12 h-12 md:w-20 md:h-20 text-white/90" />
                  </div>
                  <div className="absolute -top-1 -right-1 md:top-0 md:right-0 w-11 h-11 md:w-14 md:h-14 rounded-2xl bg-[#0B3D2E] shadow-lg shadow-[#0B3D2E]/30 flex items-center justify-center text-white font-black text-xl md:text-2xl rotate-12 group-hover:rotate-0 transition-transform duration-500">
                    2
                  </div>
                </div>
              </div>
              <div className="text-center md:text-right px-4 mt-8 md:mt-0 md:order-1">
                <h3 className="text-2xl md:text-3xl font-black text-foreground mb-4">{t.landing.step2Title}</h3>
                <p className="text-muted-foreground text-base md:text-lg leading-relaxed max-w-md mx-auto md:mx-0 md:mr-0 font-medium">
                  {t.landing.step2Desc}
                </p>
              </div>
            </div>

            {/* Connector */}
            <div className="hidden md:flex items-center justify-center py-10">
              <div className="w-px h-24 bg-gradient-to-b from-[#D4A843]/40 to-transparent" />
            </div>

            {/* Step 3 */}
            <div className="group relative md:grid md:grid-cols-2 md:gap-16 items-center">
              <div className="relative flex items-center justify-center mb-10 md:mb-0">
                <div className="relative w-40 h-40 sm:w-48 sm:h-48 md:w-64 md:h-64 mx-auto">
                  <div className="absolute inset-0 rounded-full border-2 border-dashed border-[#D4A843]/20 group-hover:border-[#D4A843]/40 transition-colors duration-700 md:group-hover:animate-[spin_20s_linear_infinite]" />
                  <div className="absolute inset-4 md:inset-6 rounded-full bg-gradient-to-br from-[#0B3D2E] to-[#16503A] shadow-2xl shadow-[#0B3D2E]/30 flex items-center justify-center group-hover:scale-105 transition-transform duration-500">
                    <Calendar className="w-12 h-12 md:w-20 md:h-20 text-white/90" />
                  </div>
                  <div className="absolute -top-1 -right-1 md:top-0 md:right-0 w-11 h-11 md:w-14 md:h-14 rounded-2xl bg-[#D4A843] shadow-lg shadow-[#D4A843]/30 flex items-center justify-center text-white font-black text-xl md:text-2xl rotate-12 group-hover:rotate-0 transition-transform duration-500">
                    3
                  </div>
                </div>
              </div>
              <div className="text-center md:text-right px-4">
                <h3 className="text-2xl md:text-3xl font-black text-foreground mb-4">{t.landing.step3Title}</h3>
                <p className="text-muted-foreground text-base md:text-lg leading-relaxed max-w-md mx-auto md:mx-0 md:mr-0 font-medium">
                  {t.landing.step3Desc}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========== WHY THIS INITIATIVE ========== */}
      <section className="relative py-28 md:py-36 px-4 bg-[#0B3D2E] text-white overflow-hidden">
        {/* Animated background orbs */}
        <div className="absolute top-0 left-1/4 w-[300px] md:w-[500px] h-[300px] md:h-[500px] rounded-full bg-[#D4A843]/[0.05] blur-[100px] md:blur-[150px] animate-blob-float pointer-events-none" />
        <div className="absolute bottom-0 right-1/4 w-[250px] md:w-[400px] h-[250px] md:h-[400px] rounded-full bg-[#16503A]/30 blur-[100px] md:blur-[120px] animate-blob-float-delayed pointer-events-none" />

        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23D4A843' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")` }} />

        <div className="container mx-auto max-w-6xl relative z-10">
          <div className="flex items-center gap-4 mb-8">
            <div className="h-px flex-1 bg-white/10" />
            <span className="text-[#D4A843] text-[10px] md:text-xs font-black tracking-[0.2em] md:tracking-[0.3em] uppercase">{t.landing.whyLabel}</span>
            <div className="h-px flex-1 bg-white/10" />
          </div>

          <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-7xl font-black text-center mb-6 leading-tight text-balance px-2">
            {t.landing.whyTitle}
          </h2>
          <p className="text-center text-white/40 text-base md:text-lg mb-16 max-w-xl mx-auto px-4 font-medium">
            {t.landing.whyDesc}
          </p>

          {/* Bento grid */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 md:gap-5">
            {/* Large card */}
            <div className="md:col-span-7 group relative bg-white/[0.04] backdrop-blur-md border border-white/[0.06] rounded-[2rem] md:rounded-[2.5rem] p-8 md:p-12 hover:bg-white/[0.06] transition-all duration-500 overflow-hidden text-center md:text-right">
              <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-l from-[#D4A843] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="w-14 h-14 bg-[#D4A843]/10 rounded-2xl flex items-center justify-center mb-6 mx-auto md:mr-0 md:ml-0 group-hover:bg-[#D4A843]/20 transition-colors border border-[#D4A843]/20">
                <BookOpen className="w-7 h-7 text-[#D4A843]" />
              </div>
              <h3 className="text-2xl md:text-3xl font-black mb-4">{t.landing.reason1Title}</h3>
              <p className="text-white/50 text-base md:text-lg leading-relaxed max-w-lg mx-auto md:mr-0 md:ml-0 font-medium">
                {t.landing.reason1Desc}
              </p>
            </div>

            {/* Stacked small cards */}
            <div className="md:col-span-5 flex flex-col gap-4 md:gap-5">
              <div className="group relative bg-white/[0.04] backdrop-blur-md border border-white/[0.06] rounded-[2rem] p-8 hover:bg-white/[0.06] transition-all duration-500 flex-1 overflow-hidden text-center md:text-right">
                <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-l from-[#D4A843] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="w-12 h-12 bg-[#D4A843]/10 rounded-2xl flex items-center justify-center mb-5 mx-auto md:mr-0 md:ml-0 group-hover:bg-[#D4A843]/20 transition-colors border border-[#D4A843]/20">
                  <Shield className="w-6 h-6 text-[#D4A843]" />
                </div>
                <h3 className="text-xl font-black mb-2">{t.landing.reason2Title}</h3>
                <p className="text-white/50 leading-relaxed text-sm md:text-lg font-medium">
                  {t.landing.reason2Desc}
                </p>
              </div>

              <div className="group relative bg-white/[0.04] backdrop-blur-md border border-white/[0.06] rounded-[2rem] p-8 hover:bg-white/[0.06] transition-all duration-500 flex-1 overflow-hidden text-center md:text-right">
                <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-l from-[#D4A843] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="w-12 h-12 bg-[#D4A843]/10 rounded-2xl flex items-center justify-center mb-5 mx-auto md:mr-0 md:ml-0 group-hover:bg-[#D4A843]/20 transition-colors border border-[#D4A843]/20">
                  <Award className="w-6 h-6 text-[#D4A843]" />
                </div>
                <h3 className="text-xl font-black mb-2">{t.landing.reason3Title}</h3>
                <p className="text-white/50 leading-relaxed text-sm md:text-lg font-medium">
                  {t.landing.reason3Desc}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========== ACADEMY SHOWCASE ========== */}
      <section id="academy" className="relative py-24 md:py-36 px-4 bg-[#FAF7F0] dark:bg-background overflow-hidden">
        {/* Decorative background pattern */}
        <div className="absolute inset-0 opacity-[0.04] dark:opacity-[0.06]" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg width='80' height='80' viewBox='0 0 80 80' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg stroke='%230B3D2E' stroke-width='1'%3E%3Cpath d='M40 0L80 40L40 80L0 40z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")` }} />
        <div className="absolute top-20 right-10 w-[300px] md:w-[500px] h-[300px] md:h-[500px] rounded-full bg-[#0B3D2E]/[0.04] dark:bg-[#0B3D2E]/10 blur-[120px] animate-blob-float pointer-events-none" />
        <div className="absolute bottom-20 left-10 w-[250px] md:w-[400px] h-[250px] md:h-[400px] rounded-full bg-[#D4A843]/[0.05] dark:bg-[#D4A843]/10 blur-[100px] animate-blob-float-delayed pointer-events-none" />

        <div className="container mx-auto max-w-6xl relative z-10">
          <div className="flex items-center gap-4 mb-8">
            <div className="h-px flex-1 bg-[#0B3D2E]/10 dark:bg-foreground/10" />
            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-[#0B3D2E]/[0.04] dark:bg-[#0B3D2E]/20 border border-[#0B3D2E]/10 dark:border-[#0B3D2E]/30">
              <Sparkles className="w-3.5 h-3.5 text-[#D4A843]" />
              <span className="text-[#0B3D2E] dark:text-[#D4A843] text-[10px] md:text-xs font-black tracking-[0.2em] md:tracking-[0.3em] uppercase">{t.landing.academyLabel}</span>
            </div>
            <div className="h-px flex-1 bg-[#0B3D2E]/10 dark:bg-foreground/10" />
          </div>

          <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-7xl font-black text-[#0B3D2E] dark:text-foreground text-center mb-6 text-balance leading-tight">
            {t.landing.academyTitle}
          </h2>
          <p className="text-center text-[#0B3D2E]/60 dark:text-muted-foreground text-base md:text-lg mb-16 md:mb-20 max-w-2xl mx-auto px-4 font-medium leading-relaxed">
            {t.landing.academyDesc}
          </p>

          {/* Academy bento grid */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 md:gap-5">
            {/* Featured: Courses (large) */}
            <div className="md:col-span-7 md:row-span-2 group relative bg-gradient-to-br from-[#0B3D2E] to-[#16503A] rounded-[2rem] md:rounded-[2.5rem] p-8 md:p-12 overflow-hidden text-white">
              <div className="absolute top-0 right-0 w-64 h-64 bg-[#D4A843]/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:bg-[#D4A843]/20 transition-colors duration-700" />
              <div className="absolute bottom-0 left-0 w-px h-32 bg-gradient-to-t from-[#D4A843]/40 to-transparent" />
              <div className="relative">
                <div className="w-16 h-16 bg-[#D4A843]/15 backdrop-blur-sm rounded-2xl flex items-center justify-center mb-6 border border-[#D4A843]/20 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-500">
                  <BookOpen className="w-8 h-8 text-[#D4A843]" />
                </div>
                <h3 className="text-2xl md:text-4xl font-black mb-4 text-balance">{t.landing.academyCoursesTitle}</h3>
                <p className="text-white/60 text-base md:text-lg leading-relaxed max-w-md font-medium mb-8">
                  {t.landing.academyCoursesDesc}
                </p>
                <Link href="/academy" className="inline-flex items-center gap-2 text-[#D4A843] font-black text-sm tracking-wider group/link">
                  <span>{t.landing.academyExploreBtn}</span>
                  <ArrowLeft className="w-4 h-4 group-hover/link:-translate-x-1 transition-transform" />
                </Link>
              </div>
            </div>

            {/* Teachers */}
            <div className="md:col-span-5 group relative bg-white dark:bg-card border border-[#0B3D2E]/8 dark:border-border rounded-[2rem] p-7 md:p-8 hover:border-[#D4A843]/30 hover:shadow-2xl hover:shadow-[#0B3D2E]/5 transition-all duration-500 overflow-hidden">
              <div className="absolute top-0 right-0 w-full h-1 bg-gradient-to-l from-[#D4A843] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="w-12 h-12 bg-[#0B3D2E]/8 dark:bg-[#0B3D2E]/20 rounded-2xl flex items-center justify-center mb-5 group-hover:bg-[#0B3D2E] transition-colors duration-300">
                <GraduationCap className="w-6 h-6 text-[#0B3D2E] dark:text-[#D4A843] group-hover:text-[#D4A843] transition-colors duration-300" />
              </div>
              <h3 className="text-xl md:text-2xl font-black text-[#0B3D2E] dark:text-foreground mb-2">{t.landing.academyTeachersTitle}</h3>
              <p className="text-[#0B3D2E]/60 dark:text-muted-foreground leading-relaxed text-sm md:text-base font-medium">
                {t.landing.academyTeachersDesc}
              </p>
            </div>

            {/* Halaqat */}
            <div className="md:col-span-5 group relative bg-white dark:bg-card border border-[#0B3D2E]/8 dark:border-border rounded-[2rem] p-7 md:p-8 hover:border-[#D4A843]/30 hover:shadow-2xl hover:shadow-[#0B3D2E]/5 transition-all duration-500 overflow-hidden">
              <div className="absolute top-0 right-0 w-full h-1 bg-gradient-to-l from-[#D4A843] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="w-12 h-12 bg-[#D4A843]/10 dark:bg-[#D4A843]/15 rounded-2xl flex items-center justify-center mb-5 group-hover:bg-[#D4A843] transition-colors duration-300">
                <Users className="w-6 h-6 text-[#D4A843] group-hover:text-white transition-colors duration-300" />
              </div>
              <h3 className="text-xl md:text-2xl font-black text-[#0B3D2E] dark:text-foreground mb-2">{t.landing.academyHalaqatTitle}</h3>
              <p className="text-[#0B3D2E]/60 dark:text-muted-foreground leading-relaxed text-sm md:text-base font-medium">
                {t.landing.academyHalaqatDesc}
              </p>
            </div>

            {/* Certificates */}
            <div className="md:col-span-4 group relative bg-white dark:bg-card border border-[#0B3D2E]/8 dark:border-border rounded-[2rem] p-7 md:p-8 hover:border-[#D4A843]/30 hover:shadow-2xl hover:shadow-[#0B3D2E]/5 transition-all duration-500 overflow-hidden">
              <div className="absolute top-0 right-0 w-full h-1 bg-gradient-to-l from-[#D4A843] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="w-12 h-12 bg-[#0B3D2E]/8 dark:bg-[#0B3D2E]/20 rounded-2xl flex items-center justify-center mb-5 group-hover:bg-[#0B3D2E] transition-colors duration-300">
                <Award className="w-6 h-6 text-[#0B3D2E] dark:text-[#D4A843] group-hover:text-[#D4A843] transition-colors duration-300" />
              </div>
              <h3 className="text-lg md:text-xl font-black text-[#0B3D2E] dark:text-foreground mb-2">{t.landing.academyCertsTitle}</h3>
              <p className="text-[#0B3D2E]/60 dark:text-muted-foreground leading-relaxed text-sm font-medium">
                {t.landing.academyCertsDesc}
              </p>
            </div>

            {/* Parents */}
            <div className="md:col-span-4 group relative bg-white dark:bg-card border border-[#0B3D2E]/8 dark:border-border rounded-[2rem] p-7 md:p-8 hover:border-[#D4A843]/30 hover:shadow-2xl hover:shadow-[#0B3D2E]/5 transition-all duration-500 overflow-hidden">
              <div className="absolute top-0 right-0 w-full h-1 bg-gradient-to-l from-[#D4A843] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="w-12 h-12 bg-[#D4A843]/10 dark:bg-[#D4A843]/15 rounded-2xl flex items-center justify-center mb-5 group-hover:bg-[#D4A843] transition-colors duration-300">
                <Heart className="w-6 h-6 text-[#D4A843] group-hover:text-white transition-colors duration-300" />
              </div>
              <h3 className="text-lg md:text-xl font-black text-[#0B3D2E] dark:text-foreground mb-2">{t.landing.academyParentsTitle}</h3>
              <p className="text-[#0B3D2E]/60 dark:text-muted-foreground leading-relaxed text-sm font-medium">
                {t.landing.academyParentsDesc}
              </p>
            </div>

            {/* Competitions */}
            <div className="md:col-span-4 group relative bg-white dark:bg-card border border-[#0B3D2E]/8 dark:border-border rounded-[2rem] p-7 md:p-8 hover:border-[#D4A843]/30 hover:shadow-2xl hover:shadow-[#0B3D2E]/5 transition-all duration-500 overflow-hidden">
              <div className="absolute top-0 right-0 w-full h-1 bg-gradient-to-l from-[#D4A843] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="w-12 h-12 bg-[#0B3D2E]/8 dark:bg-[#0B3D2E]/20 rounded-2xl flex items-center justify-center mb-5 group-hover:bg-[#0B3D2E] transition-colors duration-300">
                <Trophy className="w-6 h-6 text-[#0B3D2E] dark:text-[#D4A843] group-hover:text-[#D4A843] transition-colors duration-300" />
              </div>
              <h3 className="text-lg md:text-xl font-black text-[#0B3D2E] dark:text-foreground mb-2">{t.landing.academyCompetitionsTitle}</h3>
              <p className="text-[#0B3D2E]/60 dark:text-muted-foreground leading-relaxed text-sm font-medium">
                {t.landing.academyCompetitionsDesc}
              </p>
            </div>
          </div>

          {/* Academy CTA */}
          <div className="flex justify-center mt-14 md:mt-16">
            <Link href="/register" className="group bg-[#0B3D2E] text-white hover:bg-[#16503A] font-black py-4 md:py-5 px-10 md:px-12 rounded-2xl md:rounded-full transition-all duration-300 hover:scale-[1.02] md:hover:scale-105 active:scale-95 shadow-xl shadow-[#0B3D2E]/20 flex items-center justify-center gap-3 text-base md:text-lg">
              <GraduationCap className="w-5 h-5 text-[#D4A843]" />
              <span>{t.landing.academyJoinBtn}</span>
              <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>
      </section>

      {/* ========== STATS ========== */}
      <section className="relative py-24 md:py-32 px-4 bg-secondary/30 dark:bg-background overflow-hidden border-b border-border/50">
        <div className="absolute top-1/3 right-0 w-[400px] h-[400px] rounded-full bg-primary/5 blur-[100px] animate-blob-float-delayed-2 pointer-events-none" />
        <div className="absolute bottom-1/3 left-0 w-[350px] h-[350px] rounded-full bg-foreground/5 blur-[100px] animate-blob-float pointer-events-none" />

        <div className="container mx-auto max-w-5xl relative z-10">
          <div className="flex flex-col md:flex-row items-center justify-between gap-12 md:gap-16">
            <div className="inline-flex flex-col items-center md:items-end w-fit">
              <div className="flex items-center text-5xl sm:text-6xl md:text-7xl lg:text-[7.5rem] font-black text-foreground leading-none tracking-tighter" dir="ltr">
                <span className="mr-2 text-primary">{t.locale === 'ar' ? '+' : '+'}</span>
                <span style={{ fontFeatureSettings: '"tnum"' }}>
                  {(5000).toLocaleString(t.locale === 'ar' ? 'ar-SA' : 'en-US')}
                </span>
              </div>
              <p className="w-full text-center text-[#D4A843] text-lg md:text-2xl font-black mt-3 tracking-widest uppercase">
                {t.landing.statsMastered}
              </p>
            </div>

            <div className="hidden md:block w-px h-32 bg-gradient-to-b from-transparent via-border to-transparent" />
            <div className="md:hidden h-px w-24 bg-gradient-to-l from-transparent via-border to-transparent" />

            <div className="flex-1 text-center md:text-right">
              <div className="flex items-center gap-2 justify-center md:justify-start mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 fill-primary text-primary" />
                ))}
              </div>
              <p className="text-foreground text-lg md:text-xl leading-relaxed font-black mb-2">
                {t.landing.freeInitiative}
              </p>
              <p className="text-muted-foreground text-[15px] md:text-base leading-relaxed font-medium">
                {t.landing.initiativeGoal}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ========== FINAL CTA ========== */}
      <section className="relative py-28 md:py-40 px-4 bg-[#0B3D2E] overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] md:w-[600px] h-[400px] md:h-[600px] bg-[#D4A843] rounded-full blur-[150px] md:blur-[200px] opacity-[0.06] animate-blob-float" />
          <div className="absolute top-0 right-1/4 w-[400px] h-[400px] bg-[#16503A] rounded-full blur-[150px] opacity-20 animate-blob-float-delayed" />
        </div>

        <div className="container mx-auto max-w-3xl relative z-10 text-center">
          <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-7xl font-black text-white mb-6 leading-tight text-balance">
            {t.landing.finalCtaTitle}
          </h2>

          <p className="text-white/50 text-base md:text-xl leading-[1.8] mb-12 max-w-xl mx-auto px-4 font-medium">
            {t.landing.finalCtaDesc}
          </p>

          <div className="flex flex-col sm:flex-row gap-5 justify-center items-center px-4">
            <Link href="/login" className="group bg-[#D4A843] text-white hover:bg-[#C49A3A] font-black py-4 md:py-5 px-12 rounded-2xl md:rounded-full transition-all duration-300 hover:scale-[1.02] md:hover:scale-105 active:scale-95 shadow-2xl shadow-[#D4A843]/30 flex items-center justify-center gap-3 text-lg w-full sm:w-auto">
              <span>{t.landing.finalCtaBtn}</span>
              <ArrowLeft className="w-6 h-6 group-hover:-translate-x-1 transition-transform" />
            </Link>
            <Link href="/reader-register" className="text-white/40 hover:text-[#D4A843] text-sm font-bold transition-all border-b border-white/10 hover:border-[#D4A843]/40 pb-0.5 tracking-wide">
              {t.landing.readerJoin}
            </Link>
          </div>
        </div>
      </section>

      {/* ========== FOOTER ========== */}
      <footer className="py-12 md:py-16 px-4 bg-[#082A1F] border-t border-white/[0.06]">
        <div className="container mx-auto max-w-6xl flex flex-col items-center gap-10">
          
          <div className="flex flex-col md:flex-row items-center justify-between w-full gap-8 border-b border-white/5 pb-10">
            <div className="flex flex-col items-center md:items-start gap-4">
              <Link href="/">
                <Image 
                  src={branding.logoUrl || "/branding/main-logo.png"} 
                  alt={t.appName} 
                  width={140}
                  height={80}
                  className="h-16 md:h-20 w-auto object-contain" 
                />
              </Link>
              <p className="text-white/30 text-xs md:text-sm max-w-xs text-center md:text-right font-medium">
                {t.footer.desc}
              </p>
            </div>

            <div className="flex flex-wrap justify-center md:justify-end gap-6 md:gap-8">
              <Link href="/login" className="text-white/50 hover:text-[#D4A843] text-xs md:text-sm font-bold uppercase tracking-widest transition-colors">
                {t.landing.footerLogin}
              </Link>
              <Link href="/reader-register" className="text-white/50 hover:text-[#D4A843] text-xs md:text-sm font-bold uppercase tracking-widest transition-colors">
                {t.landing.footerJoin}
              </Link>
              <Link href="/contact" className="text-white/50 hover:text-[#D4A843] text-xs md:text-sm font-bold uppercase tracking-widest transition-colors">
                {t.landing.contact}
              </Link>
            </div>
          </div>

          <div className="flex flex-col md:flex-row items-center justify-between w-full gap-6">
            <div className="flex flex-col md:flex-row items-center gap-4 md:gap-8 text-white/30 text-[10px] md:text-xs font-bold">
               <div className="flex items-center gap-2">
                 <span>{contactInfo.address}</span>
               </div>
               <span className="hidden md:block opacity-20">|</span>
               <a href={`https://wa.me/${contactInfo.phone.replace(/[\s+]/g, '')}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 hover:text-[#25D366] transition-all">
                 <span className="text-[#D4A843]/60 font-black">واتساب:</span>
                 <span dir="ltr">{contactInfo.phone}</span>
               </a>
            </div>
            
            <p className="text-white/10 text-[10px] md:text-xs font-medium tracking-[0.2em] uppercase">
              {'© 2026 '}{t.appName}{'. '}{t.footer.rights}
            </p>
          </div>

        </div>
      </footer>
    </div>
  )
}
