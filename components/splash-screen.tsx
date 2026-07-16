'use client'

import { useEffect, useState } from 'react'
import { MisbahaLoader } from './misbaha-loader'
import { useI18n } from '@/lib/i18n/context'

interface SplashScreenProps {
  isLoading: boolean
  onLoadingComplete: () => void
}

/* نقش إسلامي هندسي — نجمة ثمانية مع تشابك — نفس نمط الصفحة الرئيسية */
function IslamicBg() {
  return (
    <svg
      className="absolute inset-0 w-full h-full"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <defs>
        <pattern
          id="splash-islamic"
          x="0" y="0"
          width="80" height="80"
          patternUnits="userSpaceOnUse"
        >
          <g fill="none" stroke="#1B5E3B" strokeWidth="0.55">
            {/* نجمة ثمانية */}
            <polygon points="40,5 47,33 75,40 47,47 40,75 33,47 5,40 33,33" opacity="0.55" />
            {/* دائرة داخلية */}
            <circle cx="40" cy="40" r="22" opacity="0.3" />
            {/* خطوط الزوايا */}
            <line x1="0"  y1="0"  x2="18" y2="18" opacity="0.2" />
            <line x1="80" y1="0"  x2="62" y2="18" opacity="0.2" />
            <line x1="0"  y1="80" x2="18" y2="62" opacity="0.2" />
            <line x1="80" y1="80" x2="62" y2="62" opacity="0.2" />
            {/* نقطة مركزية */}
            <circle cx="40" cy="40" r="2.5" fill="#1B5E3B" opacity="0.35" />
          </g>
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#splash-islamic)" opacity="0.07" />
    </svg>
  )
}

/* زخرفة الزاوية — نفس ArabesqueCorner من الصفحة الرئيسية */
function CornerOrnament({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 100 100"
      className={`absolute w-28 h-28 ${className}`}
      fill="none"
      stroke="#1B5E3B"
      strokeWidth="0.7"
      aria-hidden
    >
      <path d="M 0 0 L 100 0 L 100 30 Q 70 30 70 60 Q 70 100 30 100 L 0 100 Z" opacity="0.07" fill="#1B5E3B" />
      <path d="M 0 0 L 100 0 L 100 30 Q 70 30 70 60 Q 70 100 30 100 L 0 100" opacity="0.25" />
      <path d="M 20 0 Q 20 50 50 50 Q 80 50 80 30" opacity="0.4" />
      <circle cx="50" cy="50" r="3" fill="#1B5E3B" opacity="0.3" />
      <circle cx="20" cy="20" r="1.5" fill="#1B5E3B" opacity="0.4" />
    </svg>
  )
}

export function SplashScreen({ isLoading, onLoadingComplete }: SplashScreenProps) {
  const { t } = useI18n()
  const sp = (t as any).splashScreen as Record<string, string> | undefined
  const [show, setShow] = useState(true)

  useEffect(() => {
    if (!isLoading) {
      const timer = setTimeout(() => {
        setShow(false)
        onLoadingComplete()
      }, 1000)
      return () => clearTimeout(timer)
    }
  }, [isLoading, onLoadingComplete])

  if (!show) return null

  return (
    <div
      className="fixed inset-0 z-[9999] overflow-hidden flex flex-col items-center justify-center"
      style={{ background: 'linear-gradient(160deg, #f7f3ea 0%, #faf7f2 50%, #ede6d6 100%)' }}
    >
      {/* النقش الإسلامي كخلفية */}
      <IslamicBg />

      {/* خط زينة علوي */}
      <div className="absolute top-0 inset-x-0 h-[3px] bg-gradient-to-r from-transparent via-[#1B5E3B]/60 to-transparent" />

      {/* زخارف الزوايا */}
      <CornerOrnament className="top-0 right-0 text-[#1B5E3B]" />
      <CornerOrnament className="bottom-0 left-0 rotate-180 text-[#1B5E3B]" />
      <CornerOrnament className="top-0 left-0 scale-x-[-1] text-[#1B5E3B] opacity-60" />
      <CornerOrnament className="bottom-0 right-0 scale-y-[-1] text-[#1B5E3B] opacity-60" />

      {/* المحتوى المركزي — عنوان فوق ثم سبحة تحتها */}
      <div className="relative z-10 flex flex-col items-center gap-2">

        {/* العنوان */}
        <div className="text-center flex flex-col items-center gap-3">
          {/* سطر تزييني فوق الاسم */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-px bg-gradient-to-r from-transparent to-[#1B5E3B]/50" />
            <svg viewBox="0 0 24 8" className="w-6 h-2 fill-[#1B5E3B]/40" aria-hidden>
              <polygon points="12,0 14,4 12,8 10,4" />
              <polygon points="4,0 6,4 4,8 2,4" opacity="0.5"/>
              <polygon points="20,0 22,4 20,8 18,4" opacity="0.5"/>
            </svg>
            <div className="w-10 h-px bg-gradient-to-l from-transparent to-[#1B5E3B]/50" />
          </div>

          <h1
            className="text-7xl font-bold text-[#1B5E3B] leading-tight"
            style={{ fontFamily: 'var(--font-amiri)', letterSpacing: '1px' }}
          >
            {sp?.brandName ?? 'Itqan'}
          </h1>
          <p
            className="text-xl text-[#1B5E3B]/60 font-medium tracking-widest"
            style={{ fontFamily: 'var(--font-cairo)' }}
          >
            {sp?.tagline ?? 'Quran Learning Platform'}
          </p>

          {/* سطر تزييني تحت الاسم */}
          <div className="flex items-center gap-2 mt-1">
            <div className="w-16 h-px bg-[#1B5E3B]/30" />
            <div className="w-1.5 h-1.5 rounded-full bg-[#1B5E3B]/40" />
            <div className="w-16 h-px bg-[#1B5E3B]/30" />
          </div>
        </div>

        {/* السبحة */}
        <div className="flex items-center justify-center">
          <MisbahaLoader />
        </div>

        {/* نص التحميل */}
        <div className="flex items-center gap-3 -mt-4">
          <div className="w-1.5 h-1.5 rounded-full bg-[#1B5E3B]/40 animate-bounce" style={{ animationDelay: '0s' }} />
          <p
            className="text-sm text-[#1B5E3B]/50"
            style={{ fontFamily: 'var(--font-cairo)' }}
          >
            {sp?.loading ?? 'Loading platform...'}
          </p>
          <div className="w-1.5 h-1.5 rounded-full bg-[#1B5E3B]/40 animate-bounce" style={{ animationDelay: '0.3s' }} />
        </div>
      </div>

      {/* خط زينة سفلي */}
      <div className="absolute bottom-0 inset-x-0 h-[3px] bg-gradient-to-r from-transparent via-[#1B5E3B]/60 to-transparent" />
    </div>
  )
}
