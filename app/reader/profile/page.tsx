'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { AvatarUpload } from '@/components/avatar-upload'
import { User, Lock, CheckCircle, Loader2 } from 'lucide-react'
import { useI18n } from '@/lib/i18n/context'

interface UserProfile {
  id: string; name: string; email: string; role: string
  avatar_url: string | null; phone: string | null; gender: string | null
}

export default function ReaderProfilePage() {
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [bio, setBio] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [currentPw, setCurrentPw] = useState('')
  const [newPw, setNewPw] = useState('')
  const [confirmPw, setConfirmPw] = useState('')
  const [pwSaving, setPwSaving] = useState(false)
  const [pwSaved, setPwSaved] = useState(false)
  const [pwError, setPwError] = useState('')

  useEffect(() => {
    fetch('/api/auth/me').then(r => r.json()).then(d => {
      if (d.user) { setProfile(d.user); setName(d.user.name || ''); setPhone(d.user.phone || '') }
    }).finally(() => setLoading(false))
  }, [])

  const handleAvatarUploaded = async (url: string) => {
    await fetch('/api/auth/me', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ avatar_url: url }) })
    setProfile(p => p ? { ...p, avatar_url: url } : p)
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true)
    try {
      const res = await fetch('/api/auth/me', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name, phone }) })
      if (res.ok) { const d = await res.json(); setProfile(p => p ? { ...p, name: d.user.name } : p); setSaved(true); setTimeout(() => setSaved(false), 3000) }
    } finally { setSaving(false) }
  }

  const handleChangePw = async (e: React.FormEvent) => {
    e.preventDefault(); setPwError('')
    if (newPw !== confirmPw) { setPwError(t.profile.passwordsNotMatching); return }
    if (newPw.length < 6) { setPwError(t.profile.passwordMinLength); return }
    setPwSaving(true)
    try {
      const res = await fetch('/api/auth/change-password', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ currentPassword: currentPw, newPassword: newPw }) })
      if (res.ok) { setPwSaved(true); setCurrentPw(''); setNewPw(''); setConfirmPw(''); setTimeout(() => setPwSaved(false), 3000) }
      else { const d = await res.json(); setPwError(d.error || t.profile.passwordChangeFailed) }
    } finally { setPwSaving(false) }
  }

  const { t } = useI18n()
  if (loading) return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-[#0B3D2E]" /></div>

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">{t.profile.title}</h1>
          <p className="text-sm text-muted-foreground mt-1">{t.profile.subtitle}</p>
        </div>
      </div>

      {/* Avatar & Name Card */}
      <Card className="border-border rounded-2xl shadow-sm bg-card">
        <CardContent className="pt-6">
          <div className="flex items-center gap-5">
            <AvatarUpload currentUrl={profile?.avatar_url} name={profile?.name} size="lg" onUploaded={handleAvatarUploaded} />
            <div>
              <h2 className="text-xl font-bold text-foreground">{profile?.name}</h2>
              <p className="text-sm text-muted-foreground">{t.shell.certifiedReader}</p>
              <p className="text-xs text-muted-foreground/70 mt-1">{profile?.email}</p>
              <p className="text-xs text-primary dark:text-emerald-400 mt-2 font-medium">{t.profile.clickToChangeAvatar}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Basic Info */}
      <Card className="border-border rounded-2xl shadow-sm bg-card">
        <CardHeader className="bg-muted/30 border-b border-border pb-4">
          <CardTitle className="text-base flex items-center gap-2 font-bold text-foreground">
            <User className="w-4 h-4 text-primary" />
            {t.profile.personalInfo}
          </CardTitle>
          <CardDescription className="text-muted-foreground">{t.profile.personalInfoDesc}</CardDescription>
        </CardHeader>
        <CardContent className="pt-5">
          <form onSubmit={handleSave} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="reader-name" className="font-semibold text-xs text-muted-foreground uppercase tracking-wider">{t.auth.fullName}</Label>
              <Input id="reader-name" value={name} onChange={e => setName(e.target.value)} required className="border-border bg-muted/30 rounded-xl focus:ring-primary/20" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="reader-email" className="font-semibold text-xs text-muted-foreground uppercase tracking-wider">{t.auth.email}</Label>
              <Input id="reader-email" value={profile?.email || ''} readOnly className="bg-muted border-border rounded-xl" dir="ltr" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="reader-phone" className="font-semibold text-xs text-muted-foreground uppercase tracking-wider">{t.profile.phone}</Label>
              <Input id="reader-phone" value={phone} onChange={e => setPhone(e.target.value)} dir="ltr" placeholder={t.profile.phonePlaceholder} className="border-border bg-muted/30 rounded-xl focus:ring-primary/20" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="reader-bio" className="font-semibold text-xs text-muted-foreground uppercase tracking-wider">نبذة مختصرة</Label>
              <Textarea id="reader-bio" value={bio} onChange={e => setBio(e.target.value)} rows={3} placeholder="أكتب نبذة عن تخصصك..." className="border-border bg-muted/30 rounded-xl focus:ring-primary/20" />
            </div>
            <div className="flex items-center gap-3">
              <Button type="submit" disabled={saving} className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl font-bold">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : t.profile.saveChanges}
              </Button>
              {saved && <span className="flex items-center gap-1 text-sm text-emerald-600 font-medium"><CheckCircle className="w-4 h-4" /> {t.profile.saved}</span>}
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Password */}
      <Card className="border-border rounded-2xl shadow-sm bg-card">
        <CardHeader className="bg-muted/30 border-b border-border pb-4">
          <CardTitle className="text-base flex items-center gap-2 font-bold text-foreground">
            <Lock className="w-4 h-4 text-primary" />
            {t.profile.changePassword}
          </CardTitle>
          <CardDescription className="text-muted-foreground">{t.profile.changePasswordDesc}</CardDescription>
        </CardHeader>
        <CardContent className="pt-5">
          <form onSubmit={handleChangePw} className="space-y-4">
            <div className="space-y-2">
              <Label className="font-semibold text-xs text-muted-foreground uppercase tracking-wider">{t.profile.currentPassword}</Label>
              <Input type="password" value={currentPw} onChange={e => setCurrentPw(e.target.value)} dir="ltr" required className="border-border bg-muted/30 rounded-xl focus:ring-primary/20" />
            </div>
            <div className="space-y-2">
              <Label className="font-semibold text-xs text-muted-foreground uppercase tracking-wider">{t.profile.newPassword}</Label>
              <Input type="password" value={newPw} onChange={e => setNewPw(e.target.value)} dir="ltr" required minLength={6} className="border-border bg-muted/30 rounded-xl focus:ring-primary/20" />
            </div>
            <div className="space-y-2">
              <Label className="font-semibold text-xs text-muted-foreground uppercase tracking-wider">{t.profile.confirmPassword}</Label>
              <Input type="password" value={confirmPw} onChange={e => setConfirmPw(e.target.value)} dir="ltr" required className="border-border bg-muted/30 rounded-xl focus:ring-primary/20" />
            </div>
            {pwError && <p className="text-sm text-red-600">{pwError}</p>}
            <div className="flex items-center gap-3">
              <Button type="submit" disabled={pwSaving} className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl font-bold">
                {pwSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : t.profile.updatePassword}
              </Button>
              {pwSaved && <span className="flex items-center gap-1 text-sm text-emerald-600 font-medium"><CheckCircle className="w-4 h-4" /> {t.profile.passwordUpdated}</span>}
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
