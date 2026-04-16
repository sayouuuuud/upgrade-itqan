'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    
    // Demo login - accept any email/password
    setTimeout(() => {
      localStorage.setItem('isLoggedIn', 'true')
      localStorage.setItem('userEmail', email || 'demo@liquid-obsidian.com')
      router.push('/admin')
    }, 800)
  }

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background Glow */}
      <div className="fixed inset-0 blue-radial-glow pointer-events-none"></div>

      {/* Login Container */}
      <main className="relative z-10 w-full max-w-md px-6">
        <div className="glass-card rounded-lg p-10 md:p-14 flex flex-col items-center border border-outline-variant/10 shadow-2xl">
          {/* Branding Header */}
          <div className="mb-12 flex flex-col items-center">
            <div className="w-16 h-16 mb-6 flex items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-primary-container shadow-lg shadow-primary/20">
              <span className="text-4xl">💎</span>
            </div>
            <h1 className="text-3xl font-extrabold tracking-tighter text-on-surface mb-2">
              Liquid Obsidian
            </h1>
            <p className="text-on-surface-variant text-sm font-medium tracking-wide">
              Enter your credentials to continue
            </p>
          </div>

          {/* Form Section */}
          <form className="w-full space-y-6" onSubmit={handleLogin}>
            {/* Email Field */}
            <div className="space-y-1.5">
              <label className="uppercase tracking-widest text-xs font-bold text-on-surface-variant px-4">
                Apple ID
              </label>
              <div className="relative">
                <input
                  type="email"
                  placeholder="Email or Phone Number"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full h-14 bg-surface-container-lowest/50 border-b border-outline-variant/15 text-on-surface placeholder:text-outline/40 px-5 rounded-xl focus:outline-none focus:border-primary transition-all duration-300 focus:ring-4 focus:ring-primary/5"
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-1.5">
              <label className="uppercase tracking-widest text-xs font-bold text-on-surface-variant px-4">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Required"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full h-14 bg-surface-container-lowest/50 border-b border-outline-variant/15 text-on-surface placeholder:text-outline/40 px-5 rounded-xl focus:outline-none focus:border-primary transition-all duration-300 focus:ring-4 focus:ring-primary/5"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-outline/60 hover:text-primary transition-colors"
                >
                  {showPassword ? '👁️' : '👁️‍🗨️'}
                </button>
              </div>
            </div>

            {/* Primary Action */}
            <div className="pt-6">
              <button
                type="submit"
                disabled={loading}
                className="w-full h-14 bg-on-surface text-surface font-bold rounded-full hover:scale-105 active:scale-95 transition-all duration-200 shadow-xl shadow-black/20 disabled:opacity-50"
              >
                {loading ? 'Signing In...' : 'Sign In'}
              </button>
            </div>
          </form>

          {/* Demo Credentials Hint */}
          <div className="mt-8 p-4 bg-surface-container-high rounded-lg border border-outline-variant/10 w-full text-center text-xs text-on-surface-variant">
            <span className="block mb-2 font-semibold text-primary">Demo Mode</span>
            Use any email and password to continue
          </div>

          {/* Secondary Links */}
          <div className="mt-8 flex flex-col items-center gap-4">
            <a href="#" className="text-sm font-medium text-on-surface-variant hover:text-primary transition-colors">
              Forgot Password?
            </a>
            <div className="flex items-center gap-2">
              <span className="text-xs text-outline/40 uppercase tracking-widest">New User?</span>
              <a href="#" className="text-sm font-semibold text-primary hover:text-primary-container transition-colors">
                Create New ID
              </a>
            </div>
          </div>
        </div>

        {/* Footer / Legal */}
        <footer className="mt-12 text-center">
          <p className="text-xs font-medium text-outline/30 uppercase tracking-widest leading-relaxed max-w-xs mx-auto">
            © 2025 Liquid Obsidian. <br />
            Designed for iPhone 17 hardware.
          </p>
        </footer>
      </main>

      {/* Contextual Decoration */}
      <div className="absolute bottom-10 left-10 hidden md:flex items-center gap-3 text-outline/20">
        <span>🔒</span>
        <span className="text-xs font-bold uppercase tracking-widest">Secure Core Architecture</span>
      </div>
      <div className="absolute top-10 right-10 hidden md:flex items-center gap-2 px-4 py-2 rounded-full border border-outline-variant/10 bg-surface-container-low/30 backdrop-blur-md">
        <div className="w-2 h-2 rounded-full bg-primary animate-pulse shadow-glow"></div>
        <span className="text-xs font-bold text-on-surface-variant uppercase tracking-widest">System Online</span>
      </div>
    </div>
  )
}
