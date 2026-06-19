'use client'

import { useState, useEffect } from 'react'
import { useI18n } from '@/lib/i18n/context'
import { User, Mail, Lock, Save, Loader2, CheckCircle, Eye, EyeOff, ShieldCheck, Sparkles } from 'lucide-react'
import { AvatarUpload } from '@/components/avatar-upload'

interface Profile {
  id: string
  name: string
  email: string
  avatar_url: string | null
  gender: string
}

export default function ContentSupervisorProfilePage() {
  const { locale } = useI18n()
  const isAr = locale === 'ar'
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
    if (newPw !== confirmPw) { setPwError(isAr ? 'كلمتا المرور غير متطابقتين' : 'Passwords do not match'); return }
    if (newPw.length < 8)    { setPwError(isAr ? 'كلمة المرور يجب أن تكون 8 أحرف على الأقل' : 'Password must be at least 8 characters long'); return }
    setPwSaving(true)
    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword: currentPw, newPassword: newPw }),
      })
      if (!res.ok) {
        const d = await res.json()
        setPwError(d.error || (isAr ? 'حدث خطأ' : 'An error occurred'))
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
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="max-w-3xl space-y-8 animate-in fade-in duration-500 pb-12">
      {/* Header */}
      <div className="space-y-1">
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3 text-foreground">
          <div className="p-2.5 bg-primary/10 rounded-xl text-primary">
            <User className="w-6 h-6" />
          </div>
          {isAr ? 'الملف الشخصي' : 'Profile'}
        </h1>
        <p className="text-muted-foreground text-sm flex items-center gap-2">
          <Sparkles className="w-4 h-4" />
          {isAr ? 'إدارة بياناتك الشخصية وحماية حسابك' : 'Manage your personal details and secure your account'}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
        {/* Profile Form */}
        <div className="md:col-span-7 space-y-6">
          <div className="bg-card border border-border/50 rounded-3xl p-6 md:p-8 shadow-sm">
            <div className="flex items-center gap-3 mb-8 pb-4 border-b border-border/50">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <User className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h2 className="font-bold text-lg text-foreground">{isAr ? 'البيانات الأساسية' : 'Personal Details'}</h2>
                <p className="text-xs text-muted-foreground mt-0.5">{isAr ? 'المعلومات التي تظهر للآخرين' : 'Information visible to others'}</p>
              </div>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-6">
              <div className="flex justify-center mb-8">
                <div className="relative group">
                  <div className="absolute -inset-0.5 bg-gradient-to-tr from-primary to-primary/30 rounded-full blur opacity-30 group-hover:opacity-50 transition duration-500"></div>
                  <div className="relative">
                    <AvatarUpload
                      currentUrl={avatarUrl}
                      name={name}
                      onUploaded={(url: string) => setAvatarUrl(url)}
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-foreground px-1">{isAr ? 'الاسم الكامل' : 'Full Name'}</label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full bg-background border border-border/50 rounded-xl px-4 py-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all shadow-sm"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-foreground px-1">{isAr ? 'البريد الإلكتروني' : 'Email Address'}</label>
                <div className="flex items-center gap-3 px-4 py-3 bg-muted/40 border border-border/50 rounded-xl shadow-sm">
                  <Mail className="w-4 h-4 text-muted-foreground shrink-0" />
                  <span className="text-sm text-muted-foreground font-medium">{profile?.email}</span>
                </div>
                <p className="text-xs text-muted-foreground px-1">
                  {isAr ? 'البريد الإلكتروني لا يمكن تغييره. للتعديل يرجى التواصل مع الإدارة.' : 'Email address cannot be changed. Contact admin for updates.'}
                </p>
              </div>

              <div className="pt-4 border-t border-border/50 flex items-center justify-between gap-4">
                <div className="flex-1">
                  {saved && (
                    <div className="flex items-center gap-2 p-2 px-3 bg-emerald-500/10 rounded-lg text-xs font-bold text-emerald-700 dark:text-emerald-400 animate-in slide-in-from-bottom-2">
                      <CheckCircle className="w-4 h-4 shrink-0" />
                      {isAr ? 'تم الحفظ بنجاح' : 'Saved successfully'}
                    </div>
                  )}
                </div>
                <button
                  type="submit"
                  disabled={saving}
                  className="shrink-0 group flex items-center justify-center gap-2 px-8 py-3 bg-primary text-primary-foreground rounded-xl font-bold text-sm hover:bg-primary/90 transition-all shadow-sm hover:shadow disabled:opacity-60 overflow-hidden relative"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4 group-hover:scale-110 transition-transform" />}
                  {saving ? (isAr ? 'جاري الحفظ...' : 'Saving...') : (isAr ? 'حفظ التغييرات' : 'Save Changes')}
                  <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform" />
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Security Form */}
        <div className="md:col-span-5 space-y-6">
          <div className="bg-card border border-border/50 rounded-3xl p-6 md:p-8 shadow-sm h-full">
            <div className="flex items-center gap-3 mb-8 pb-4 border-b border-border/50">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
                <ShieldCheck className="w-5 h-5 text-amber-600 dark:text-amber-500" />
              </div>
              <div>
                <h2 className="font-bold text-lg text-foreground">{isAr ? 'تأمين الحساب' : 'Account Security'}</h2>
                <p className="text-xs text-muted-foreground mt-0.5">{isAr ? 'تغيير كلمة المرور الخاصة بك' : 'Change your account password'}</p>
              </div>
            </div>

            <form onSubmit={handleChangePassword} className="space-y-5">
              {[
                { label: isAr ? 'كلمة المرور الحالية' : 'Current Password', value: currentPw, setter: setCurrentPw },
                { label: isAr ? 'كلمة المرور الجديدة' : 'New Password', value: newPw,     setter: setNewPw     },
                { label: isAr ? 'تأكيد كلمة المرور' : 'Confirm Password',   value: confirmPw, setter: setConfirmPw  },
              ].map(({ label, value, setter }) => (
                <div key={label} className="space-y-2">
                  <label className="text-sm font-semibold text-foreground px-1">{label}</label>
                  <div className="relative">
                    <input
                      type={showPw ? 'text' : 'password'}
                      value={value}
                      onChange={e => setter(e.target.value)}
                      dir="ltr"
                      required
                      className="w-full pr-4 pl-11 py-3 bg-background border border-border/50 rounded-xl text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500/50 transition-all shadow-sm font-mono tracking-widest placeholder:tracking-normal placeholder:font-sans"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPw(p => !p)}
                      className="absolute left-3 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground rounded-md hover:bg-muted transition-colors"
                    >
                      {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              ))}

              {pwError && (
                <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-sm font-medium text-rose-700 dark:text-rose-400 animate-in slide-in-from-top-2">
                  {pwError}
                </div>
              )}
              {pwSaved && (
                <div className="flex items-center gap-2 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-sm font-medium text-emerald-700 dark:text-emerald-400 animate-in slide-in-from-top-2">
                  <CheckCircle className="w-4 h-4 shrink-0" />
                  {isAr ? 'تم تغيير كلمة المرور بنجاح' : 'Password changed successfully'}
                </div>
              )}

              <div className="pt-4 border-t border-border/50 mt-6">
                <button
                  type="submit"
                  disabled={pwSaving}
                  className="w-full group flex items-center justify-center gap-2 px-6 py-3.5 bg-amber-500 text-amber-950 rounded-xl font-bold text-sm hover:bg-amber-400 transition-all shadow-sm hover:shadow disabled:opacity-60 overflow-hidden relative"
                >
                  {pwSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4 group-hover:scale-110 transition-transform" />}
                  {pwSaving ? (isAr ? 'جاري التغيير...' : 'Changing...') : (isAr ? 'تحديث كلمة المرور' : 'Update Password')}
                  <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform" />
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
