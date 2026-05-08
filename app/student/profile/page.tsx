'use client'

import { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { AvatarUpload } from '@/components/avatar-upload'
import { User, Lock, CheckCircle, Loader2, BookMarked, X, Plus, MapPin } from 'lucide-react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

// Major Arab/Islamic cities for prayer times
const PRAYER_CITIES = [
  { value: 'Makkah',     country: 'Saudi Arabia', label: 'مكة المكرمة' },
  { value: 'Madinah',    country: 'Saudi Arabia', label: 'المدينة المنورة' },
  { value: 'Riyadh',     country: 'Saudi Arabia', label: 'الرياض' },
  { value: 'Jeddah',     country: 'Saudi Arabia', label: 'جدة' },
  { value: 'Dammam',     country: 'Saudi Arabia', label: 'الدمام' },
  { value: 'Cairo',      country: 'Egypt',        label: 'القاهرة' },
  { value: 'Alexandria', country: 'Egypt',        label: 'الإسكندرية' },
  { value: 'Giza',       country: 'Egypt',        label: 'الجيزة' },
  { value: 'Dubai',      country: 'UAE',          label: 'دبي' },
  { value: 'Abu Dhabi',  country: 'UAE',          label: 'أبوظبي' },
  { value: 'Kuwait City',country: 'Kuwait',       label: 'الكويت' },
  { value: 'Doha',       country: 'Qatar',        label: 'الدوحة' },
  { value: 'Manama',     country: 'Bahrain',      label: 'المنامة' },
  { value: 'Muscat',     country: 'Oman',         label: 'مسقط' },
  { value: 'Amman',      country: 'Jordan',       label: 'عمّان' },
  { value: 'Beirut',     country: 'Lebanon',      label: 'بيروت' },
  { value: 'Damascus',   country: 'Syria',        label: 'دمشق' },
  { value: 'Baghdad',    country: 'Iraq',         label: 'بغداد' },
  { value: 'Tunis',      country: 'Tunisia',      label: 'تونس' },
  { value: 'Algiers',    country: 'Algeria',      label: 'الجزائر' },
  { value: 'Casablanca', country: 'Morocco',      label: 'الدار البيضاء' },
  { value: 'Rabat',      country: 'Morocco',      label: 'الرباط' },
  { value: 'Khartoum',   country: 'Sudan',        label: 'الخرطوم' },
  { value: 'Istanbul',   country: 'Turkey',       label: 'إسطنبول' },
  { value: 'London',     country: 'United Kingdom', label: 'لندن' },
  { value: 'Paris',      country: 'France',       label: 'باريس' },
]
import { useI18n } from '@/lib/i18n/context'

interface UserProfile {
  id: string
  name: string
  email: string
  role: string
  avatar_url: string | null
  phone: string | null
  gender: string | null
  city: string | null
  has_quran_access?: boolean
  has_academy_access?: boolean
  platform_preference?: string
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [city, setCity] = useState('')
  const [platformPreference, setPlatformPreference] = useState('both')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  // Password change state
  const [currentPw, setCurrentPw] = useState('')
  const [newPw, setNewPw] = useState('')
  const [confirmPw, setConfirmPw] = useState('')
  const [pwSaving, setPwSaving] = useState(false)
  const [pwSaved, setPwSaved] = useState(false)
  const [pwError, setPwError] = useState('')

  useEffect(() => {
    fetch('/api/auth/me')
      .then(r => r.json())
      .then(d => {
        if (d.user) {
          setProfile(d.user)
          setName(d.user.name || '')
          setPhone(d.user.phone || '')
          setCity(d.user.city || '')
          setPlatformPreference(d.user.platform_preference || 'both')
        }
      })
      .finally(() => setLoading(false))
  }, [])

  const handleAvatarUploaded = async (url: string) => {
    await fetch('/api/auth/me', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ avatar_url: url }),
    })
    setProfile(p => p ? { ...p, avatar_url: url } : p)
  }

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      const res = await fetch('/api/auth/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, phone, city: city || null, platform_preference: platformPreference }),
      })
      if (res.ok) {
        const d = await res.json()
        setProfile(p => p ? { ...p, name: d.user.name, platform_preference: d.user.platform_preference } : p)
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
    if (newPw !== confirmPw) { setPwError(t.profile.passwordsNotMatching); return }
    if (newPw.length < 6) { setPwError(t.profile.passwordMinLength); return }

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
        setPwError(d.error || t.profile.passwordChangeFailed)
      }
    } finally {
      setPwSaving(false)
    }
  }

  // Specializations state
  const [specs, setSpecs] = useState<{ specialization: string; set_by: string }[]>([])
  const [specsLoading, setSpecsLoading] = useState(true)
  const [specSaving, setSpecSaving] = useState<string | null>(null)

  const SPECIALIZATIONS = [
    { key: 'sira',    label: 'السيرة النبوية' },
    { key: 'fiqh',    label: 'الفقه' },
    { key: 'aqeedah', label: 'العقيدة' },
    { key: 'tajweed', label: 'التجويد' },
    { key: 'tafseer', label: 'التفسير' },
    { key: 'arabic',  label: 'اللغة العربية' },
  ]

  useEffect(() => {
    fetch('/api/student/specializations')
      .then(r => r.ok ? r.json() : { specializations: [] })
      .then(d => setSpecs(d.specializations || []))
      .finally(() => setSpecsLoading(false))
  }, [])

  const toggleSpec = async (key: string) => {
    const existing = specs.find(s => s.specialization === key)
    setSpecSaving(key)
    try {
      if (existing) {
        if (existing.set_by !== 'self') return // locked by admin/parent
        await fetch('/api/student/specializations', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ specialization: key }),
        })
        setSpecs(prev => prev.filter(s => s.specialization !== key))
      } else {
        await fetch('/api/student/specializations', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ specialization: key }),
        })
        setSpecs(prev => [...prev, { specialization: key, set_by: 'self' }])
      }
    } finally {
      setSpecSaving(null)
    }
  }

  const { t, locale } = useI18n()
  const isAr = locale === 'ar'
  const pathname = usePathname()
  const isAcademyContext = pathname?.startsWith('/academy/') ?? false
  const studentLabel = isAcademyContext
    ? (t.profile.roles.shariaSciencesStudent || t.profile.roles.student)
    : (t.profile.roles.quranStudent || t.profile.roles.student)
  const roleLabel = profile?.role === 'student' ? studentLabel : profile?.role === 'reader' ? t.profile.roles.reader : t.profile.roles.admin

  return (
    <div className="min-h-screen relative pb-20">
      {/* Decorative background elements */}
      <div className="absolute top-0 left-0 w-full h-64 bg-gradient-to-b from-primary/10 via-primary/5 to-transparent -z-10" />
      <div className="absolute top-20 right-[10%] w-64 h-64 bg-primary/20 rounded-full blur-[120px] -z-10 animate-pulse" />
      <div className="absolute top-40 left-[15%] w-72 h-72 bg-primary/10 rounded-full blur-[120px] -z-10 animate-pulse delay-700" />
      
      <div className="max-w-4xl mx-auto px-4 pt-10 space-y-8 relative z-10">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold uppercase tracking-wider mb-2">
              <User className="w-3 h-3" />
              {t.profile.title}
            </div>
            <h1 className="text-3xl md:text-4xl font-black text-foreground tracking-tight leading-none">
              {isAr ? "الملف الشخصي" : "Student Profile"}
            </h1>
            <p className="text-muted-foreground font-medium max-w-md">
              {t.profile.subtitle}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column: Avatar & Summary (Sticky) */}
          <div className="lg:col-span-4 space-y-6">
            <Card className="border-border shadow-2xl shadow-black/5 bg-card/70 backdrop-blur-xl rounded-3xl overflow-hidden border">
              <CardContent className="p-8 flex flex-col items-center text-center space-y-6">
                <div className="relative group">
                  <div className="absolute -inset-1 bg-gradient-to-tr from-primary to-accent rounded-full blur opacity-20 group-hover:opacity-40 transition duration-500" />
                  <AvatarUpload
                    currentUrl={profile?.avatar_url}
                    name={profile?.name}
                    size="lg"
                    onUploaded={handleAvatarUploaded}
                  />
                </div>
                
                <div className="space-y-1">
                  <h2 className="text-2xl font-bold text-foreground">{profile?.name}</h2>
                  <p className="text-sm font-bold text-primary bg-primary/10 px-3 py-1 rounded-full inline-block">
                    {roleLabel}
                  </p>
                  <p className="text-sm text-muted-foreground font-medium pt-2 break-all">{profile?.email}</p>
                </div>

                <div className="w-full pt-4 border-t border-border">
                   <p className="text-xs text-muted-foreground font-medium leading-relaxed">
                     {t.profile.clickToChangeAvatar}
                   </p>
                </div>
              </CardContent>
            </Card>

            <div className="bg-primary/5 border border-primary/10 p-6 rounded-3xl space-y-3 backdrop-blur-md">
              <h3 className="font-bold text-primary flex items-center gap-2 text-sm">
                <CheckCircle className="w-4 h-4" />
                {isAr ? "حساب موثق" : "Verified Account"}
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed font-bold">
                {isAr ? "بياناتك الشخصية محمية ومشفرة. لا نشارك معلوماتك مع أي جهة خارجية." : "Your personal data is protected and encrypted. We do not share your information with third parties."}
              </p>
            </div>
          </div>

          {/* Right Column: Forms */}
          <div className="lg:col-span-8 space-y-8">
            {/* Personal Info Card */}
            <Card className="border-border shadow-2xl shadow-black/5 bg-card/70 backdrop-blur-xl rounded-3xl overflow-hidden border">
              <CardHeader className="p-8 pb-4">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                    <User className="w-5 h-5" />
                  </div>
                  <div>
                    <CardTitle className="text-lg font-bold text-foreground">{t.profile.personalInfo}</CardTitle>
                    <CardDescription className="text-muted-foreground font-medium text-sm">{t.profile.personalInfoDesc}</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-8 pt-0">
                <form onSubmit={handleSaveProfile} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="name" className="text-xs font-bold text-muted-foreground uppercase tracking-widest px-1">{t.auth.fullName}</Label>
                      <Input 
                        id="name" 
                        value={name} 
                        onChange={e => setName(e.target.value)} 
                        required 
                        className="h-12 border-border bg-muted/30 rounded-2xl focus:ring-2 focus:ring-primary/20 transition-all border font-medium" 
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone" className="text-xs font-bold text-muted-foreground uppercase tracking-widest px-1">{t.profile.phone}</Label>
                      <Input 
                        id="phone" 
                        value={phone} 
                        onChange={e => setPhone(e.target.value)} 
                        dir="ltr" 
                        className="h-12 border-border bg-muted/30 rounded-2xl focus:ring-2 focus:ring-primary/20 transition-all border font-medium" 
                        placeholder={t.profile.phonePlaceholder} 
                      />
                    </div>
                  </div>
                  
                  {/* Prayer City */}
                  <div className="space-y-2">
                    <Label className="text-xs font-bold text-muted-foreground uppercase tracking-widest px-1 flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5" />
                      {isAr ? "مدينة مواقيت الصلاة" : "Prayer Times City"}
                    </Label>
                    <Select value={city} onValueChange={setCity}>
                      <SelectTrigger className="h-12 border-border bg-muted/30 rounded-2xl focus:ring-2 focus:ring-primary/20 transition-all border font-medium">
                        <SelectValue placeholder={isAr ? "اختر مدينتك..." : "Select your city..."} />
                      </SelectTrigger>
                      <SelectContent className="max-h-72">
                        {PRAYER_CITIES.map(c => (
                          <SelectItem key={c.value} value={c.value}>
                            <span className="font-medium">{c.label}</span>
                            <span className="text-muted-foreground text-xs ms-2">— {c.country}</span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-[10px] text-muted-foreground px-1">
                      {isAr ? "ستُستخدم هذه المدينة لعرض مواقيت الصلاة الخاصة بك." : "This city will be used to show your prayer times."}
                    </p>
                  </div>

                  {profile?.has_quran_access && profile?.has_academy_access && (
                    <div className="space-y-2">
                       <Label htmlFor="platform_preference" className="text-xs font-bold text-muted-foreground uppercase tracking-widest px-1">
                         {isAr ? "المنصة المفضلة" : "Preferred Platform"}
                       </Label>
                       <select 
                         id="platform_preference" 
                         value={platformPreference} 
                         onChange={e => setPlatformPreference(e.target.value)} 
                         className="w-full h-12 px-4 border-border bg-muted/30 rounded-2xl focus:ring-2 focus:ring-primary/20 transition-all border font-medium appearance-none"
                       >
                         <option value="both">{isAr ? "الاثنان معاً" : "Both"}</option>
                         <option value="quran">{isAr ? "المقرأة" : "Quran Library"}</option>
                         <option value="academy">{isAr ? "الأكاديمية" : "Academy"}</option>
                       </select>
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-xs font-bold text-muted-foreground uppercase tracking-widest px-1">{t.auth.email}</Label>
                    <Input 
                      id="email" 
                      type="email" 
                      value={profile?.email || ''} 
                      dir="ltr" 
                      className="h-12 bg-muted border-transparent text-muted-foreground rounded-2xl cursor-not-allowed font-medium" 
                      readOnly 
                    />
                    <p className="text-[10px] text-muted-foreground px-1 italic">
                      {isAr ? "* لا يمكن تغيير البريد الإلكتروني حالياً لمعايير الأمان." : "* Email cannot be changed for security reasons."}
                    </p>
                  </div>

                  <div className="pt-4 flex items-center justify-end gap-4 border-t border-border mt-6">
                    <Button 
                      type="submit" 
                      disabled={saving} 
                      className="h-12 px-8 bg-primary hover:bg-primary/90 text-primary-foreground rounded-2xl font-bold transition-all transform active:scale-95 shadow-lg shadow-primary/20"
                    >
                      {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : t.profile.saveChanges}
                    </Button>
                    {saved && (
                      <span className="flex items-center gap-2 text-sm text-primary font-bold animate-in fade-in slide-in-from-right-2">
                        <CheckCircle className="w-5 h-5" /> {t.profile.saved}
                      </span>
                    )}
                  </div>
                </form>
              </CardContent>
            </Card>

            {/* Specializations Card */}
            <Card className="border-border shadow-2xl shadow-black/5 bg-card/70 backdrop-blur-xl rounded-3xl overflow-hidden border">
              <CardHeader className="p-8 pb-4">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                    <BookMarked className="w-5 h-5" />
                  </div>
                  <div>
                    <CardTitle className="text-lg font-bold text-foreground">التخصصات الدراسية</CardTitle>
                    <CardDescription className="text-muted-foreground font-medium text-sm">
                      اختر التخصصات التي تريد أن تظهر لك الدورات المرتبطة بها. اتركها فارغة لعرض كل الدورات.
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-8 pt-0">
                {specsLoading ? (
                  <div className="flex justify-center py-6">
                    <Loader2 className="w-5 h-5 animate-spin text-primary" />
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-3">
                    {SPECIALIZATIONS.map(({ key, label }) => {
                      const active = specs.find(s => s.specialization === key)
                      const locked = active && active.set_by !== 'self'
                      const saving = specSaving === key
                      return (
                        <button
                          key={key}
                          type="button"
                          disabled={saving || !!locked}
                          onClick={() => toggleSpec(key)}
                          className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl border text-sm font-bold transition-all ${
                            active
                              ? 'bg-primary text-primary-foreground border-primary shadow-md shadow-primary/20'
                              : 'bg-muted/40 text-muted-foreground border-border hover:border-primary/40 hover:text-foreground'
                          } ${locked ? 'opacity-70 cursor-not-allowed' : ''}`}
                        >
                          {saving ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : active ? (
                            locked
                              ? <span className="text-[10px] opacity-70">مقيّد</span>
                              : <X className="w-3.5 h-3.5" />
                          ) : (
                            <Plus className="w-3.5 h-3.5" />
                          )}
                          {label}
                        </button>
                      )
                    })}
                  </div>
                )}
                {specs.length === 0 && !specsLoading && (
                  <p className="text-xs text-muted-foreground mt-4">
                    لم تختر أي تخصص — ستظهر لك جميع الدورات المتاحة.
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Change Password Card */}
            <Card className="border-border shadow-2xl shadow-black/5 bg-card/70 backdrop-blur-xl rounded-3xl overflow-hidden border">
              <CardHeader className="p-8 pb-4">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-2xl bg-accent/10 flex items-center justify-center text-accent">
                    <Lock className="w-5 h-5" />
                  </div>
                  <div>
                    <CardTitle className="text-lg font-black text-foreground">{t.profile.changePassword}</CardTitle>
                    <CardDescription className="text-muted-foreground font-bold text-sm">{t.profile.changePasswordDesc}</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-8 pt-0">
                <form onSubmit={handleChangePassword} className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="current-password" className="text-xs font-black text-muted-foreground uppercase tracking-widest px-1">{t.profile.currentPassword}</Label>
                    <Input 
                      id="current-password" 
                      type="password" 
                      value={currentPw} 
                      onChange={e => setCurrentPw(e.target.value)} 
                      dir="ltr" 
                      className="h-12 border-border bg-muted/40 rounded-2xl focus:ring-2 focus:ring-primary/20 transition-all border font-black" 
                      required 
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="new-password" className="text-xs font-black text-muted-foreground uppercase tracking-widest px-1">{t.profile.newPassword}</Label>
                      <Input 
                        id="new-password" 
                        type="password" 
                        value={newPw} 
                        onChange={e => setNewPw(e.target.value)} 
                        dir="ltr" 
                        className="h-12 border-border bg-muted/40 rounded-2xl focus:ring-2 focus:ring-primary/20 transition-all border font-black" 
                        required 
                        minLength={6} 
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="confirm-password" className="text-xs font-black text-muted-foreground uppercase tracking-widest px-1">{t.profile.confirmPassword}</Label>
                      <Input 
                        id="confirm-password" 
                        type="password" 
                        value={confirmPw} 
                        onChange={e => setConfirmPw(e.target.value)} 
                        dir="ltr" 
                        className="h-12 border-border bg-muted/40 rounded-2xl focus:ring-2 focus:ring-primary/20 transition-all border font-black" 
                        required 
                      />
                    </div>
                  </div>

                  {pwError && <p className="text-sm text-destructive font-black bg-destructive/10 p-3 rounded-xl border border-destructive/20">{pwError}</p>}
                  
                  <div className="pt-4 flex items-center justify-end gap-4 border-t border-border mt-6">
                    <Button 
                      type="submit" 
                      disabled={pwSaving} 
                      className="h-12 px-8 bg-muted hover:bg-muted/80 text-foreground border border-border rounded-2xl font-black transition-all transform active:scale-95 shadow-md"
                    >
                      {pwSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : t.profile.updatePassword}
                    </Button>
                    {pwSaved && (
                      <span className="flex items-center gap-2 text-sm text-primary font-bold animate-in fade-in slide-in-from-right-2">
                        <CheckCircle className="w-5 h-5" /> {t.profile.passwordUpdated}
                      </span>
                    )}
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
