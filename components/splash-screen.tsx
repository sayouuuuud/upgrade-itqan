'use client'

import { useEffect, useState } from 'react'
import { MisbahaLoader } from './misbaha-loader'

interface SplashScreenProps {
  isLoading: boolean
  onLoadingComplete: () => void
}

export function SplashScreen({ isLoading, onLoadingComplete }: SplashScreenProps) {
  const [show, setShow] = useState(true)

  useEffect(() => {
    if (!isLoading) {
      // Wait 1 second before hiding splash screen
      const timer = setTimeout(() => {
        setShow(false)
        onLoadingComplete()
      }, 1000)
      return () => clearTimeout(timer)
    }
  }, [isLoading, onLoadingComplete])

  if (!show) return null

  return (
    <div className="fixed inset-0 z-[9999] bg-gradient-to-br from-[#f5f1e6] via-[#faf6f0] to-[#ebe4d3] dark:from-[#0a0a0a] dark:via-[#0f0f0f] dark:to-[#1a1a1a] flex flex-col items-center justify-center overflow-hidden">
      {/* Subtle grid background */}
      <div className="absolute inset-0 opacity-[0.08] dark:opacity-[0.04]">
        <svg
          className="w-full h-full"
          viewBox="0 0 400 400"
          preserveAspectRatio="xMidYMid slice"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#1B5E3B" strokeWidth="0.5" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>
      </div>

      {/* Accent line from top */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#1B5E3B] to-transparent dark:via-[#2D8659]" />

      {/* Main content */}
      <div className="relative z-10 flex flex-col items-center gap-12">
        {/* Misbaha animation - larger */}
        <div className="w-80 h-96 flex items-center justify-center">
          <MisbahaLoader />
        </div>

        {/* Text section - cleaner and larger */}
        <div className="text-center space-y-4">
          <h1
            className="text-5xl md:text-6xl font-bold text-[#1B5E3B] dark:text-[#4FD991]"
            style={{ fontFamily: 'var(--font-cairo)', letterSpacing: '-0.5px' }}
          >
            منصة مُتقن
          </h1>
          <div className="h-1 w-16 bg-gradient-to-r from-[#1B5E3B] to-[#2D8659] dark:from-[#2D8659] dark:to-[#4FD991] mx-auto rounded-full" />
          <p
            className="text-base md:text-lg text-[#555555] dark:text-[#999999] font-light"
            style={{ fontFamily: 'var(--font-cairo)' }}
          >
            جاري تحميل المنصة...
          </p>
        </div>
      </div>

      {/* Loading indicator dots */}
      <div className="absolute bottom-16 flex gap-2 items-center">
        <div className="w-2 h-2 rounded-full bg-[#1B5E3B]/60 dark:bg-[#2D8659]/60 animate-bounce" style={{ animationDelay: '0s' }} />
        <div className="w-2 h-2 rounded-full bg-[#1B5E3B]/40 dark:bg-[#2D8659]/40 animate-bounce" style={{ animationDelay: '0.2s' }} />
        <div className="w-2 h-2 rounded-full bg-[#1B5E3B]/20 dark:bg-[#2D8659]/20 animate-bounce" style={{ animationDelay: '0.4s' }} />
      </div>

      {/* Ornamental bottom */}
      <div className="absolute bottom-0 w-full h-24 bg-gradient-to-t from-[#1B5E3B]/8 to-transparent dark:from-[#2D8659]/12" />
    </div>
  )
}
