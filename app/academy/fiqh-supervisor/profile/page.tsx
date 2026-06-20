'use client'

import { useState, useEffect } from 'react'
import { User, Mail, Lock, Save, Loader2, CheckCircle, Eye, EyeOff, ShieldCheck } from 'lucide-react'
import { AvatarUpload } from '@/components/avatar-upload'
import { useI18n } from '@/lib/i18n/context'

interface Profile {
  id: string
  name: string
  email: string
  avatar_url: string | null
  gender: string
}

export default function FiqhSupervisorProfilePage() {
  const { t, dir } = useI18n()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [name, setName] = useState('')
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)

  // Password change
  const [currentPw, setCurrentPw] = useState('')
  const [newPw, setNewPw]         = useState('')
  const [confirmPw, setConfirmPw] = useState('')
  const [showPw, setShowPw]       = useState(false)
  const [pwSaving, setPwSaving]   = useState(false)
  const [pwSaved, setPwSaved]     = useState(false)
  const [pwError, setPwError]     = useState('')

  useEffect(() => {
    fetch('/api/auth/me')
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        if (d?.user) {
          setProfile(d.user)
          setName(d.user.name)
          setAvatarUrl(d.user.avatar_url)
        }
      })
      .finally(() => setLoading(false))
  }, [])

  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      await fetch('/api/auth/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, avatar_url: avatarUrl }),
      })
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } finally {
      setSaving(false)
    }
  }

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault()
    setPwError('')
    if (newPw !== confirmPw) { setPwError(t?.fiqhSupervisorProfile?.errPwMismatch || 'كلمتا المرور غير متطابقتين'); return }
    if (newPw.length < 8)    { setPwError(t?.fiqhSupervisorProfile?.errPwMinLength || 'كلمة المرور يجب أن تكون 8 أحرف على الأقل'); return }
    setPwSaving(true)
    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword: currentPw, newPassword: newPw }),
      })
      if (!res.ok) {
        const d = await res.json()
        setPwError(d.error || t?.fiqhSupervisorProfile?.errGeneric || 'حدث خطأ')
        return
      }
      setPwSaved(true)
      setCurrentPw(''); setNewPw(''); setConfirmPw('')
      setTimeout(() => setPwSaved(false), 3000)
    } finally {
      setPwSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-40 gap-6">
        <div className="relative w-24 h-24">
          <div className="absolute inset-0 border-4 border-primary/20 rounded-full"></div>
          <div className="absolute inset-0 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <Loader2 className="absolute inset-0 m-auto w-10 h-10 animate-spin text-primary opacity-50" />
        </div>
        <p className="text-xl font-black text-muted-foreground animate-pulse">{t?.fiqhSupervisorProfile?.loadingProfile}</p>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 relative min-h-screen pb-20" dir={dir}>
      
      {/* Decorative Background */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full filter blur-[120px] pointer-events-none -z-10 animate-pulse-slow" />
      <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-blue-500/5 rounded-full filter blur-[120px] pointer-events-none -z-10" />

      {/* Header */}
      <div className="bg-card/40 backdrop-blur-3xl border border-white/20 dark:border-white/5 rounded-[40px] p-8 shadow-2xl shadow-black/5 relative overflow-hidden group">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-1000 pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row items-center gap-6">
          <div className="w-20 h-20 rounded-[28px] bg-gradient-to-br from-primary/20 to-blue-500/20 flex items-center justify-center border border-primary/20 shadow-inner group-hover:scale-110 group-hover:rotate-6 transition-all duration-500 shrink-0">
            <User className="w-10 h-10 text-primary" />
          </div>
          <div className="text-center md:text-right">
            <h1 className="text-3xl md:text-4xl font-black text-foreground tracking-tight">{t?.fiqhSupervisorProfile?.pageTitle}</h1>
            <p className="text-muted-foreground font-medium mt-2 max-w-lg">
              {t?.fiqhSupervisorProfile?.pageSubtitle}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Profile Details Card */}
        <div className="lg:col-span-7 bg-card/60 backdrop-blur-3xl border border-white/20 dark:border-white/5 rounded-[40px] p-8 md:p-10 shadow-2xl shadow-black/5 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 opacity-50 blur-3xl rounded-full pointer-events-none group-hover:scale-150 transition-transform duration-1000" />
          
          <div className="relative z-10">
            <div className="flex items-center gap-4 mb-8 pb-6 border-b border-white/10 dark:border-white/5">
              <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center shadow-inner border border-primary/20">
                <ShieldCheck className="w-7 h-7 text-primary" />
              </div>
              <div>
                <h2 className="font-black text-2xl text-foreground">{t?.fiqhSupervisorProfile?.secPersonalTitle}</h2>
                <p className="text-sm font-bold text-primary">{t?.fiqhSupervisorProfile?.secPersonalSubtitle}</p>
              </div>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-8">
              {/* Avatar Section */}
              <div className="flex flex-col items-center sm:items-start gap-6 bg-white/40 dark:bg-black/20 p-6 rounded-[32px] border border-white/40 dark:border-white/5 shadow-inner">
                <div className="flex flex-col sm:flex-row items-center gap-6 w-full">
                  <div className="shrink-0 p-2 bg-gradient-to-br from-primary/20 to-blue-500/20 rounded-full border border-primary/20 shadow-lg shadow-primary/10">
                    <AvatarUpload
                      currentUrl={avatarUrl}
                      name={name}
                      onUploaded={(url: string) => setAvatarUrl(url)}
                    />
                  </div>
                  <div className="text-center sm:text-right space-y-1">
                    <h3 className="font-black text-lg text-foreground">{t?.fiqhSupervisorProfile?.avatarTitle}</h3>
                    <p className="text-sm font-medium text-muted-foreground">{t?.fiqhSupervisorProfile?.avatarSubtitle}</p>
                  </div>
                </div>
              </div>

              {/* Form Inputs */}
              <div className="space-y-6">
                <div className="space-y-2 relative group/input">
                  <label className="text-sm font-black text-foreground pr-2 block">{t?.fiqhSupervisorProfile?.labelName}</label>
                  <div className="absolute -inset-0.5 bg-gradient-to-r from-primary to-blue-500 rounded-2xl opacity-0 group-focus-within/input:opacity-20 transition duration-500 blur" />
                  <input
                    type="text"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    className="relative w-full bg-background border-2 border-border focus:border-transparent rounded-2xl px-5 py-4 text-sm font-bold text-foreground focus:outline-none focus:ring-4 focus:ring-primary/20 transition-all shadow-inner"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-black text-foreground pr-2 block">{t?.fiqhSupervisorProfile?.labelEmail}</label>
                  <div className="flex items-center gap-3 px-5 py-4 bg-muted/50 border border-border rounded-2xl shadow-inner opacity-80 cursor-not-allowed">
                    <Mail className="w-5 h-5 text-muted-foreground shrink-0" />
                    <span className="text-sm font-bold text-muted-foreground font-mono">{profile?.email}</span>
                  </div>
                </div>
              </div>

              {saved && (
                <div className="flex items-center gap-3 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl text-emerald-700 dark:text-emerald-400 font-bold shadow-inner">
                  <CheckCircle className="w-5 h-5 shrink-0" />
                  {t?.fiqhSupervisorProfile?.msgProfileSaved}
                </div>
              )}

              <button
                type="submit"
                disabled={saving}
                className="w-full flex items-center justify-center gap-3 px-8 py-4 bg-primary text-primary-foreground rounded-2xl font-black text-base hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 hover:shadow-xl hover:-translate-y-1 disabled:opacity-50 disabled:hover:scale-100 disabled:hover:translate-y-0"
              >
                {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                {saving ? t?.fiqhSupervisorProfile?.btnSavingProfile : t?.fiqhSupervisorProfile?.btnSaveProfile}
              </button>
            </form>
          </div>
        </div>

        {/* Password Card */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          <div className="bg-gradient-to-br from-amber-500/5 to-orange-500/5 dark:from-amber-950/30 dark:to-orange-950/30 backdrop-blur-3xl border border-amber-500/20 dark:border-amber-500/10 rounded-[40px] p-8 shadow-2xl shadow-black/5 relative overflow-hidden group flex-1">
            <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 opacity-50 blur-3xl rounded-full pointer-events-none group-hover:scale-150 transition-transform duration-1000" />
            
            <div className="relative z-10">
              <div className="flex items-center gap-4 mb-8 pb-6 border-b border-amber-500/20">
                <div className="w-14 h-14 rounded-2xl bg-amber-500/10 flex items-center justify-center shadow-inner border border-amber-500/20 group-hover:rotate-12 transition-transform duration-500">
                  <Lock className="w-7 h-7 text-amber-600 dark:text-amber-400" />
                </div>
                <div>
                  <h2 className="font-black text-xl text-foreground">{t?.fiqhSupervisorProfile?.secPasswordTitle}</h2>
                  <p className="text-sm font-bold text-amber-600 dark:text-amber-400 mt-1">{t?.fiqhSupervisorProfile?.secPasswordSubtitle}</p>
                </div>
              </div>

              <form onSubmit={handleChangePassword} className="space-y-6">
                {[
                  { label: t?.fiqhSupervisorProfile?.labelCurrentPw || 'كلمة المرور الحالية', value: currentPw, setter: setCurrentPw },
                  { label: t?.fiqhSupervisorProfile?.labelNewPw || 'كلمة المرور الجديدة', value: newPw,     setter: setNewPw     },
                  { label: t?.fiqhSupervisorProfile?.labelConfirmPw || 'تأكيد كلمة المرور',   value: confirmPw, setter: setConfirmPw  },
                ].map(({ label, value, setter }, idx) => (
                  <div key={idx} className="space-y-2 relative group/input">
                    <label className="text-sm font-black text-foreground pr-2 block">{label}</label>
                    <div className="absolute -inset-0.5 bg-gradient-to-r from-amber-500 to-orange-500 rounded-2xl opacity-0 group-focus-within/input:opacity-20 transition duration-500 blur" />
                    <div className="relative">
                      <input
                        type={showPw ? 'text' : 'password'}
                        value={value}
                        onChange={e => setter(e.target.value)}
                        dir="ltr"
                        required
                        className="w-full pl-12 pr-5 py-4 bg-background border-2 border-border focus:border-transparent rounded-2xl text-sm font-bold text-foreground focus:outline-none focus:ring-4 focus:ring-amber-500/20 transition-all shadow-inner"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPw(p => !p)}
                        className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-2 hover:bg-muted rounded-xl"
                      >
                        {showPw ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>
                ))}

                {pwError && (
                  <div className="flex items-center gap-3 p-4 bg-destructive/10 border border-destructive/20 rounded-2xl text-destructive font-bold text-sm shadow-inner">
                    <CheckCircle className="w-5 h-5 shrink-0 text-destructive" />
                    {pwError}
                  </div>
                )}
                {pwSaved && (
                  <div className="flex items-center gap-3 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl text-emerald-700 dark:text-emerald-400 font-bold text-sm shadow-inner">
                    <CheckCircle className="w-5 h-5 shrink-0" />
                    {t?.fiqhSupervisorProfile?.msgPwSaved}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={pwSaving}
                  className="w-full flex items-center justify-center gap-3 px-8 py-4 bg-amber-500 hover:bg-amber-600 text-white rounded-2xl font-black text-base transition-all shadow-lg shadow-amber-500/20 hover:shadow-xl hover:-translate-y-1 disabled:opacity-50 disabled:hover:scale-100 disabled:hover:translate-y-0"
                >
                  {pwSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Lock className="w-5 h-5" />}
                  {pwSaving ? t?.fiqhSupervisorProfile?.btnPwSaving : t?.fiqhSupervisorProfile?.btnPwSave}
                </button>
              </form>
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}
