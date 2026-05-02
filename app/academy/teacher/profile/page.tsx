'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { AvatarUpload } from '@/components/avatar-upload'
import {
  GraduationCap, BadgeCheck, Award, Briefcase, BookOpen,
  Save, Loader2, Plus, X, CheckCircle, Star, Users, Lock,
} from 'lucide-react'
import { useI18n } from '@/lib/i18n/context'

interface TeacherProfile {
  id: string
  name: string
  email: string
  phone: string | null
  avatar_url: string | null
  bio: string | null
  specialization: string | null
  years_of_experience: number | null
  certifications: string[] | null
  subjects: string[] | null
  total_students: number | null
  total_courses: number | null
  rating: number | null
  is_verified: boolean | null
  is_accepting_students: boolean | null
}

const SUBJECT_OPTIONS = [
  'تلاوة',
  'تجويد',
  'حفظ',
  'فقه',
  'عقيدة',
  'سيرة',
  'تفسير',
  'لغة عربية',
]

export default function TeacherProfilePage() {
  const { locale } = useI18n()
  const isAr = locale === 'ar'

  const [profile, setProfile] = useState<TeacherProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [bio, setBio] = useState('')
  const [specialization, setSpecialization] = useState('')
  const [yearsExp, setYearsExp] = useState<string>('')
  const [certifications, setCertifications] = useState<string[]>([])
  const [newCert, setNewCert] = useState('')
  const [subjects, setSubjects] = useState<string[]>([])
  const [acceptingStudents, setAcceptingStudents] = useState(true)

  const [currentPw, setCurrentPw] = useState('')
  const [newPw, setNewPw] = useState('')
  const [confirmPw, setConfirmPw] = useState('')
  const [pwSaving, setPwSaving] = useState(false)
  const [pwSaved, setPwSaved] = useState(false)
  const [pwError, setPwError] = useState('')

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      try {
        const [meRes, profRes] = await Promise.all([
          fetch('/api/auth/me'),
          fetch('/api/academy/teacher/profile'),
        ])
        const me = meRes.ok ? await meRes.json() : null
        const prof = profRes.ok ? await profRes.json() : null
        if (cancelled) return

        const merged: TeacherProfile = {
          id: me?.user?.id || prof?.data?.id || '',
          name: me?.user?.name || prof?.data?.name || '',
          email: me?.user?.email || prof?.data?.email || '',
          phone: me?.user?.phone ?? prof?.data?.phone ?? null,
          avatar_url: me?.user?.avatar_url ?? prof?.data?.avatar_url ?? null,
          bio: prof?.data?.bio ?? null,
          specialization: prof?.data?.specialization ?? null,
          years_of_experience: prof?.data?.years_of_experience ?? null,
          certifications: prof?.data?.certifications ?? [],
          subjects: prof?.data?.subjects ?? [],
          total_students: prof?.data?.total_students ?? 0,
          total_courses: prof?.data?.total_courses ?? 0,
          rating: prof?.data?.rating ?? 0,
          is_verified: prof?.data?.is_verified ?? false,
          is_accepting_students: prof?.data?.is_accepting_students ?? true,
        }
        setProfile(merged)
        setName(merged.name)
        setPhone(merged.phone || '')
        setBio(merged.bio || '')
        setSpecialization(merged.specialization || '')
        setYearsExp(merged.years_of_experience != null ? String(merged.years_of_experience) : '')
        setCertifications(merged.certifications || [])
        setSubjects(merged.subjects || [])
        setAcceptingStudents(merged.is_accepting_students ?? true)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [])

  const handleAvatarUploaded = async (url: string) => {
    await fetch('/api/auth/me', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ avatar_url: url }),
    })
    setProfile((p) => (p ? { ...p, avatar_url: url } : p))
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      await fetch('/api/auth/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, phone }),
      })
      const res = await fetch('/api/academy/teacher/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bio,
          specialization,
          years_of_experience: yearsExp === '' ? null : Number(yearsExp),
          certifications,
          subjects,
          is_accepting_students: acceptingStudents,
        }),
      })
      if (res.ok) {
        setSaved(true)
        setTimeout(() => setSaved(false), 3000)
      }
    } finally {
      setSaving(false)
    }
  }

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setPwError('')
    if (newPw !== confirmPw) { setPwError(isAr ? 'كلمتا المرور غير متطابقتين' : 'Passwords do not match'); return }
    if (newPw.length < 6) { setPwError(isAr ? 'كلمة المرور قصيرة' : 'Password too short'); return }

    setPwSaving(true)
    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword: currentPw, newPassword: newPw }),
      })
      if (res.ok) {
        setPwSaved(true)
        setCurrentPw(''); setNewPw(''); setConfirmPw('')
        setTimeout(() => setPwSaved(false), 3000)
      } else {
        const d = await res.json()
        setPwError(d.error || (isAr ? 'فشل تغيير كلمة المرور' : 'Failed to change password'))
      }
    } finally {
      setPwSaving(false)
    }
  }

  const addCert = () => {
    const v = newCert.trim()
    if (!v) return
    setCertifications((prev) => Array.from(new Set([...prev, v])))
    setNewCert('')
  }
  const removeCert = (c: string) => setCertifications((prev) => prev.filter((x) => x !== c))
  const toggleSubject = (s: string) => setSubjects((prev) => prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-12" dir={isAr ? 'rtl' : 'ltr'}>
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 pb-4 border-b border-border/50">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold uppercase tracking-wider mb-2">
            <GraduationCap className="w-4 h-4" />
            {isAr ? 'الملف الشخصي' : 'Profile'}
          </div>
          <h1 className="text-3xl lg:text-4xl font-black tracking-tight text-foreground">
            {isAr ? 'ملف المدرس' : 'Teacher Profile'}
          </h1>
          <p className="text-muted-foreground font-medium mt-1">
            {isAr ? 'قم بتحديث بياناتك ومجالات تخصصك ليتعرف عليك الطلاب بسهولة.' : 'Update your bio, specialization and certifications.'}
          </p>
        </div>
        {profile?.is_verified && (
          <div className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-400">
            <BadgeCheck className="w-5 h-5" />
            <span className="text-sm font-bold">{isAr ? 'مدرس معتمد' : 'Verified Teacher'}</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="rounded-3xl">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center">
              <Users className="w-5 h-5 text-blue-500" />
            </div>
            <div>
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{isAr ? 'الطلاب' : 'Students'}</p>
              <p className="text-2xl font-black">{profile?.total_students || 0}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="rounded-3xl">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-emerald-500" />
            </div>
            <div>
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{isAr ? 'الدورات' : 'Courses'}</p>
              <p className="text-2xl font-black">{profile?.total_courses || 0}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="rounded-3xl">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center">
              <Star className="w-5 h-5 text-amber-500" />
            </div>
            <div>
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{isAr ? 'التقييم' : 'Rating'}</p>
              <p className="text-2xl font-black">{Number(profile?.rating || 0).toFixed(1)}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="rounded-3xl lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-lg font-bold">{isAr ? 'الصورة الشخصية' : 'Avatar'}</CardTitle>
            <CardDescription>{isAr ? 'حدّث صورتك الشخصية' : 'Update your profile photo'}</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center gap-4">
            <AvatarUpload
              currentUrl={profile?.avatar_url || null}
              userName={profile?.name || ''}
              onUploaded={handleAvatarUploaded}
            />
            <div className="text-center">
              <p className="font-bold">{profile?.name}</p>
              <p className="text-sm text-muted-foreground" dir="ltr">{profile?.email}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-3xl lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <Briefcase className="w-5 h-5" />
              {isAr ? 'البيانات المهنية' : 'Professional Details'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSave} className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>{isAr ? 'الاسم' : 'Name'}</Label>
                  <Input value={name} onChange={(e) => setName(e.target.value)} required />
                </div>
                <div className="space-y-1.5">
                  <Label>{isAr ? 'الهاتف' : 'Phone'}</Label>
                  <Input value={phone} onChange={(e) => setPhone(e.target.value)} dir="ltr" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>{isAr ? 'التخصص' : 'Specialization'}</Label>
                  <Input
                    value={specialization}
                    onChange={(e) => setSpecialization(e.target.value)}
                    placeholder={isAr ? 'مثلاً: تلاوة وتجويد' : 'e.g. Quran & Tajweed'}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>{isAr ? 'سنوات الخبرة' : 'Years of Experience'}</Label>
                  <Input type="number" min={0} max={70} value={yearsExp} onChange={(e) => setYearsExp(e.target.value)} />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label>{isAr ? 'نبذة عن المدرس' : 'Bio'}</Label>
                <Textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  rows={4}
                  placeholder={isAr ? 'اكتب نبذة قصيرة تعرف بنفسك للطلاب...' : 'Write a short bio for your students...'}
                />
              </div>

              <div className="space-y-2">
                <Label>{isAr ? 'المواد التي تدرّسها' : 'Subjects'}</Label>
                <div className="flex flex-wrap gap-2">
                  {SUBJECT_OPTIONS.map((s) => {
                    const active = subjects.includes(s)
                    return (
                      <button
                        type="button"
                        key={s}
                        onClick={() => toggleSubject(s)}
                        className={`px-3 py-1.5 rounded-full text-sm font-bold border transition-colors ${
                          active
                            ? 'bg-primary text-primary-foreground border-primary'
                            : 'bg-card text-foreground border-border hover:bg-muted/50'
                        }`}
                      >
                        {s}
                      </button>
                    )
                  })}
                </div>
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-2"><Award className="w-4 h-4" /> {isAr ? 'الشهادات والإجازات' : 'Certifications'}</Label>
                <div className="flex flex-wrap gap-2">
                  {certifications.map((c) => (
                    <span key={c} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-muted text-foreground text-sm font-medium border border-border">
                      {c}
                      <button type="button" onClick={() => removeCert(c)} className="text-muted-foreground hover:text-destructive" aria-label="remove">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </span>
                  ))}
                  {certifications.length === 0 && (
                    <span className="text-sm text-muted-foreground">{isAr ? 'لا توجد شهادات بعد' : 'No certifications yet'}</span>
                  )}
                </div>
                <div className="flex gap-2">
                  <Input
                    value={newCert}
                    onChange={(e) => setNewCert(e.target.value)}
                    placeholder={isAr ? 'أضف شهادة (مثلاً: إجازة في حفص)' : 'Add a certification'}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        addCert()
                      }
                    }}
                  />
                  <Button type="button" onClick={addCert} variant="outline">
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              <label className="flex items-center justify-between gap-3 p-4 rounded-2xl border border-border bg-muted/20">
                <div>
                  <p className="font-bold text-sm">{isAr ? 'فتح التسجيل للطلاب الجدد' : 'Accept new students'}</p>
                  <p className="text-xs text-muted-foreground">
                    {isAr ? 'إذا تم الإيقاف لن يظهر اسمك للطلاب الجدد' : 'When off, new students cannot enroll'}
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={acceptingStudents}
                  onChange={(e) => setAcceptingStudents(e.target.checked)}
                  className="w-5 h-5 accent-primary"
                />
              </label>

              <div className="flex items-center gap-3 pt-2">
                <Button type="submit" disabled={saving} className="font-bold h-11 px-6">
                  {saving ? <Loader2 className="w-4 h-4 animate-spin ml-2" /> : <Save className="w-4 h-4 ml-2" />}
                  {isAr ? 'حفظ التغييرات' : 'Save Changes'}
                </Button>
                {saved && (
                  <span className="inline-flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 text-sm font-bold">
                    <CheckCircle className="w-4 h-4" />
                    {isAr ? 'تم الحفظ' : 'Saved'}
                  </span>
                )}
              </div>
            </form>
          </CardContent>
        </Card>
      </div>

      <Card className="rounded-3xl">
        <CardHeader>
          <CardTitle className="text-lg font-bold flex items-center gap-2">
            <Lock className="w-5 h-5" />
            {isAr ? 'تغيير كلمة المرور' : 'Change Password'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleChangePassword} className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <Label>{isAr ? 'كلمة المرور الحالية' : 'Current Password'}</Label>
              <Input type="password" value={currentPw} onChange={(e) => setCurrentPw(e.target.value)} required />
            </div>
            <div className="space-y-1.5">
              <Label>{isAr ? 'كلمة المرور الجديدة' : 'New Password'}</Label>
              <Input type="password" value={newPw} onChange={(e) => setNewPw(e.target.value)} required />
            </div>
            <div className="space-y-1.5">
              <Label>{isAr ? 'تأكيد كلمة المرور' : 'Confirm Password'}</Label>
              <Input type="password" value={confirmPw} onChange={(e) => setConfirmPw(e.target.value)} required />
            </div>
            {pwError && (
              <div className="md:col-span-3 text-sm text-red-600 dark:text-red-400 font-bold">{pwError}</div>
            )}
            <div className="md:col-span-3 flex items-center gap-3">
              <Button type="submit" disabled={pwSaving} className="h-11 font-bold">
                {pwSaving ? <Loader2 className="w-4 h-4 animate-spin ml-2" /> : null}
                {isAr ? 'تغيير كلمة المرور' : 'Change Password'}
              </Button>
              {pwSaved && (
                <span className="inline-flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 text-sm font-bold">
                  <CheckCircle className="w-4 h-4" />
                  {isAr ? 'تم التغيير' : 'Changed'}
                </span>
              )}
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
