'use client'

import { useEffect, useState } from 'react'
import { SplashScreen } from './splash-screen'

export function SplashScreenWrapper({ children }: { children: React.ReactNode }) {
  const [isLoading, setIsLoading] = useState(true)
  const [showSplash, setShowSplash] = useState(true)

  useEffect(() => {
    // إخفاء السبلاش بعد ثانية واحدة من أول render
    const loadTimer = setTimeout(() => {
      setIsLoading(false)
    }, 800)

    return () => clearTimeout(loadTimer)
  }, [])

  const handleSplashComplete = () => {
    setShowSplash(false)
  }

  return (
    <>
      {showSplash && <SplashScreen isLoading={isLoading} onLoadingComplete={handleSplashComplete} />}
      {children}
    </>
  )
}
