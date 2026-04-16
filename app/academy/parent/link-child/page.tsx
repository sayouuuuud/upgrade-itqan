'use client'

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Search, Link as LinkIcon, UserPlus, CheckCircle2, User, Loader2, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useI18n } from '@/lib/i18n/context'

interface FoundStudent {
  id: string
  name: string
  email: string
  avatar_url: string | null
}

export default function LinkChildPage() {
  const { t, locale } = useI18n()
  const isAr = locale === 'ar'
  
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [student, setStudent] = useState<FoundStudent | null>(null)
  const [error, setError] = useState('')
  const [relation, setRelation] = useState('father')
  const [linking, setLinking] = useState(false)
  const [success, setSuccess] = useState(false)

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) return
    
    setLoading(true)
    setError('')
    setStudent(null)
    setSuccess(false)
    
    try {
      const res = await fetch('/api/academy/parent/link-child', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'search', email })
      })
      const data = await res.json()
      
      if (!res.ok) {
        setError(data.error || (isAr ? 'حدث خطأ' : 'An error occurred'))
      } else {
        setStudent(data.student)
      }
    } catch {
      setError(isAr ? 'فشل الاتصال بالسيرفر' : 'Connection failed')
    } finally {
      setLoading(false)
    }
  }

  const handleLink = async () => {
    if (!student) return
    setLinking(true)
    setError('')
    
    try {
      const res = await fetch('/api/academy/parent/link-child', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'link', child_id: student.id, relation })
      })
      const data = await res.json()
      
      if (!res.ok) {
        setError(data.error || (isAr ? 'فشل الربط' : 'Linking failed'))
      } else {
        setSuccess(true)
        setStudent(null)
        setEmail('')
      }
    } catch {
      setError(isAr ? 'فشل الاتصال بالسيرفر' : 'Connection failed')
    } finally {
      setLinking(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12" dir={isAr ? "rtl" : "ltr"}>
      <div className="space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold uppercase tracking-wider mb-2">
          <UserPlus className="w-4 h-4" />
          {isAr ? "إضافة ابن جديد" : "Link New Child"}
        </div>
        <h1 className="text-3xl lg:text-4xl font-black tracking-tight text-foreground">
          {isAr ? "ربط حساب طالب" : "Link Student Account"}
        </h1>
        <p className="text-muted-foreground font-medium max-w-2xl">
          {isAr 
            ? "ابحث عن حساب ابنك باستخدام بريده الإلكتروني المسجل في المنصة لربطه بحسابك وتتبع تقدمه." 
            : "Search for your child's account using their registered email to link it to your profile and track their progress."}
        </p>
      </div>

      <Card className="border border-border/50 shadow-sm rounded-3xl overflow-hidden bg-card">
        <CardContent className="p-8">
          <form onSubmit={handleSearch} className="flex gap-4">
            <div className="relative flex-1">
              <Search className={`absolute ${isAr ? "right-4" : "left-4"} top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground`} />
              <Input
                type="email"
                placeholder={isAr ? "أدخل البريد الإلكتروني للطالب..." : "Enter student email..."}
                value={email}
                onChange={e => setEmail(e.target.value)}
                className={`h-14 font-medium rounded-2xl ${isAr ? "pr-12" : "pl-12"} bg-muted/30 border-border/50 focus:bg-card focus:ring-2 focus:ring-primary/20`}
                dir="ltr"
                required
              />
            </div>
            <Button type="submit" disabled={loading} className="h-14 px-8 font-bold rounded-2xl shadow-sm min-w-[120px]">
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (isAr ? "بحث" : "Search")}
            </Button>
          </form>

          {error && (
            <div className="mt-6 p-4 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
              <p className="text-sm font-bold text-red-700 dark:text-red-400">{error}</p>
            </div>
          )}

          {success && (
             <div className="mt-6 p-6 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex flex-col items-center text-center gap-3 animate-in fade-in slide-in-from-bottom-4">
              <CheckCircle2 className="w-12 h-12 text-emerald-500" />
              <h4 className="text-lg font-black text-emerald-700 dark:text-emerald-400">
                {isAr ? "تم ربط الطالب بنجاح!" : "Student linked successfully!"}
              </h4>
              <p className="text-sm font-medium text-emerald-600/80 dark:text-emerald-400/80 max-w-sm">
                {isAr 
                  ? "يمكنك الآن متابعة تقدم ابنك من لوحة التحكم." 
                  : "You can now track your child's progress from the dashboard."}
              </p>
            </div>
          )}

          {student && (
            <div className="mt-8 p-6 rounded-3xl border border-border bg-muted/10 animate-in fade-in">
              <h4 className="text-sm font-bold uppercase tracking-widest text-muted-foreground mb-4">
                {isAr ? "نتيجة البحث" : "Search Result"}
              </h4>
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center shrink-0 border border-primary/20">
                    <User className="w-8 h-8 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-foreground">{student.name}</h3>
                    <p className="text-sm font-medium text-muted-foreground dir-ltr">{student.email}</p>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
                  <select 
                    value={relation} 
                    onChange={e => setRelation(e.target.value)}
                    className="h-12 px-4 rounded-xl border border-border bg-card font-medium focus:ring-2 focus:ring-primary/20 w-full sm:w-40 appearance-none"
                  >
                    <option value="father">{isAr ? "أب" : "Father"}</option>
                    <option value="mother">{isAr ? "أم" : "Mother"}</option>
                    <option value="guardian">{isAr ? "ولي أمر آخر" : "Other Guardian"}</option>
                  </select>
                  
                  <Button 
                    onClick={handleLink} 
                    disabled={linking}
                    className="h-12 w-full sm:w-auto px-8 font-bold rounded-xl shadow-md bg-emerald-600 hover:bg-emerald-700 text-white transition-all transform active:scale-95"
                  >
                    {linking ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                      <>
                        <LinkIcon className={`w-4 h-4 ${isAr ? "ml-2" : "mr-2"}`} />
                        {isAr ? "تأكيد الربط" : "Confirm Link"}
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          )}

        </CardContent>
      </Card>
    </div>
  )
}
