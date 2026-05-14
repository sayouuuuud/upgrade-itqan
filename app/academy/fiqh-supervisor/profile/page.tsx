'use client'

import { useState, useEffect } from 'react'
import { User, Mail, Lock, Save, Loader2, CheckCircle, Eye, EyeOff } from 'lucide-react'
import { AvatarUpload } from '@/components/avatar-upload'

interface Profile {
  id: string
  name: string
  email: string
  avatar_url: string | null
  gender: string
}

export default function FiqhSupervisorProfilePage() {
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
    if (newPw !== confirmPw) { setPwError('كلمتا المرور غير متطابقتين'); return }
    if (newPw.length < 8)    { setPwError('كلمة المرور يجب أن تكون 8 أحرف على الأقل'); return }
    setPwSaving(true)
    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword: currentPw, newPassword: newPw }),
      })
      if (!res.ok) {
        const d = await res.json()
        setPwError(d.error || 'حدث خطأ')
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
      <div className="flex justify-center py-24">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-black text-foreground">الملف الشخصي</h1>
        <p className="text-sm text-muted-foreground mt-1">إدارة بياناتك الشخصية وكلمة المرور</p>
      </div>

      {/* Profile card */}
      <div className="bg-card border border-border rounded-2xl p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
            <User className="w-4 h-4 text-primary" />
          </div>
          <h2 className="font-bold text-foreground">البيانات الشخصية</h2>
        </div>

        <form onSubmit={handleSaveProfile} className="space-y-5">
          {/* Avatar */}
          <div className="flex justify-center">
            <AvatarUpload
              currentUrl={avatarUrl}
              name={name}
              onUploaded={(url: string) => setAvatarUrl(url)}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">الاسم</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full bg-muted/30 border border-border rounded-xl px-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">البريد الإلكتروني</label>
            <div className="flex items-center gap-2 px-4 py-2.5 bg-muted/20 border border-border rounded-xl">
              <Mail className="w-4 h-4 text-muted-foreground shrink-0" />
              <span className="text-sm text-muted-foreground">{profile?.email}</span>
            </div>
          </div>

          {saved && (
            <div className="flex items-center gap-2 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-sm text-emerald-700 dark:text-emerald-400">
              <CheckCircle className="w-4 h-4 shrink-0" />
              تم حفظ البيانات بنجاح
            </div>
          )}

          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 px-6 py-2.5 bg-primary text-primary-foreground rounded-xl font-bold text-sm hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {saving ? 'جاري الحفظ...' : 'حفظ التغييرات'}
          </button>
        </form>
      </div>

      {/* Password card */}
      <div className="bg-card border border-border rounded-2xl p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-9 h-9 rounded-xl bg-amber-500/10 flex items-center justify-center">
            <Lock className="w-4 h-4 text-amber-600 dark:text-amber-400" />
          </div>
          <h2 className="font-bold text-foreground">تغيير كلمة المرور</h2>
        </div>

        <form onSubmit={handleChangePassword} className="space-y-4">
          {[
            { label: 'كلمة المرور الحالية', value: currentPw, setter: setCurrentPw },
            { label: 'كلمة المرور الجديدة', value: newPw,     setter: setNewPw     },
            { label: 'تأكيد كلمة المرور',   value: confirmPw, setter: setConfirmPw  },
          ].map(({ label, value, setter }) => (
            <div key={label} className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">{label}</label>
              <div className="relative">
                <input
                  type={showPw ? 'text' : 'password'}
                  value={value}
                  onChange={e => setter(e.target.value)}
                  dir="ltr"
                  required
                  className="w-full pr-4 pl-10 py-2.5 bg-muted/30 border border-border rounded-xl text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
                <button
                  type="button"
                  onClick={() => setShowPw(p => !p)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          ))}

          {pwError && (
            <p className="text-sm text-destructive">{pwError}</p>
          )}
          {pwSaved && (
            <div className="flex items-center gap-2 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-sm text-emerald-700 dark:text-emerald-400">
              <CheckCircle className="w-4 h-4 shrink-0" />
              تم تغيير كلمة المرور بنجاح
            </div>
          )}

          <button
            type="submit"
            disabled={pwSaving}
            className="flex items-center gap-2 px-6 py-2.5 bg-amber-500 text-white rounded-xl font-bold text-sm hover:bg-amber-600 transition-colors disabled:opacity-50"
          >
            {pwSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
            {pwSaving ? 'جاري التغيير...' : 'تغيير كلمة المرور'}
          </button>
        </form>
      </div>
    </div>
  )
}
