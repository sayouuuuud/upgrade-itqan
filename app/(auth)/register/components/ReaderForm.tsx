"use client"

import { useState } from 'react'
import { useI18n } from '@/lib/i18n/context'
import { Eye, EyeOff, Mail, Lock, User, Phone, ChevronDown, BookOpen, Award, CheckCircle, Check, ChevronsUpDown, ArrowRight } from 'lucide-react'
import { NATIONALITIES, NATIONALITIES_EN } from '@/lib/mock-data'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command'
import { cn } from '@/lib/utils'

interface ReaderFormProps {
  onBack: () => void
}

export function ReaderForm({ onBack }: ReaderFormProps) {
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [nationalityOpen, setNationalityOpen] = useState(false)
  const { t } = useI18n()

  const getNationalities = () => {
    return t.locale === 'ar' ? NATIONALITIES : NATIONALITIES_EN
  }

  const [form, setForm] = useState({
    full_name_triple: '',
    email: '',
    password: '',
    phone: '',
    city: '',
    gender: '',
    nationality: '',
    qualification: '',
    memorized_parts: '',
    years_of_experience: '',
  })

  function updateField(field: string, value: string) {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    if (form.password.length < 6) {
      setError(t.auth.passwordMinLength)
      setLoading(false)
      return
    }

    try {
      const res = await fetch('/api/auth/reader-register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          memorized_parts: form.memorized_parts ? parseInt(form.memorized_parts) : 0,
          years_of_experience: form.years_of_experience ? parseInt(form.years_of_experience) : 0,
        }),
      })
      const data = await res.json()

      if (!res.ok) {
        setError(data.error || t.auth.errorOccurred)
        setLoading(false)
        return
      }

      setSuccess(true)
    } catch {
      setError(t.auth.connectionError)
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="text-center py-8">
        <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="w-8 h-8 text-emerald-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-3">{t.readerRegister.requestReceived}</h2>
        <p className="text-gray-600 leading-relaxed mb-6">
          {t.readerRegister.requestReceivedDesc}
        </p>
        <button onClick={() => window.location.href = '/'} className="inline-block bg-[#D4A843] hover:bg-[#C49A3A] text-white font-bold py-3 px-8 rounded-xl transition-colors">
          {t.readerRegister.backToHome}
        </button>
      </div>
    )
  }

  return (
    <div className="w-full">
      <div className="flex items-center mb-6">
        <button onClick={onBack} className="p-2 hover:bg-secondary rounded-full transition-colors" aria-label="back">
          <ArrowRight className="w-5 h-5 text-muted-foreground" />
        </button>
        <h2 className="text-2xl font-bold text-foreground mr-2">{t.readerRegister.title}</h2>
      </div>

      <div className="mb-6 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-xl text-sm text-amber-800 dark:text-amber-300 text-center">
        {t.readerRegister.desc}
      </div>

      {error && (
        <div className="mb-6 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700 text-center">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Section 1: Required Info */}
        <div>
          <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
            <User className="w-5 h-5 text-primary" />
            {t.readerRegister.basicInfo}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label htmlFor="full_name" className="block text-sm font-medium text-foreground/80 mb-1">{t.readerRegister.fullNameTriple}</label>
              <div className="relative">
                <User className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground w-5 h-5" />
                <input id="full_name" type="text" value={form.full_name_triple} onChange={(e) => updateField('full_name_triple', e.target.value)} placeholder={t.readerRegister.fullNamePlaceholder} className="w-full pr-10 pl-4 py-3 bg-secondary/20 dark:bg-secondary/10 border border-border rounded-xl focus:ring-2 focus:ring-primary focus:border-primary transition-colors text-sm text-foreground" required />
              </div>
            </div>
            <div>
              <label htmlFor="reader_email" className="block text-sm font-medium text-foreground/80 mb-1">{t.readerRegister.email}</label>
              <div className="relative">
                <Mail className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground w-5 h-5" />
                <input id="reader_email" type="email" value={form.email} onChange={(e) => updateField('email', e.target.value)} placeholder="name@example.com" dir="ltr" className="w-full pr-10 pl-4 py-3 bg-secondary/20 dark:bg-secondary/10 border border-border rounded-xl focus:ring-2 focus:ring-primary focus:border-primary transition-colors text-sm text-foreground" required />
              </div>
            </div>
            <div>
              <label htmlFor="reader_password" className="block text-sm font-medium text-foreground/80 mb-1">{t.readerRegister.password}</label>
              <div className="relative">
                <Lock className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground w-5 h-5" />
                <input id="reader_password" type={showPw ? 'text' : 'password'} value={form.password} onChange={(e) => updateField('password', e.target.value)} placeholder={t.auth.passwordPlaceholder} dir="ltr" className="w-full pr-10 pl-10 py-3 bg-secondary/20 dark:bg-secondary/10 border border-border rounded-xl focus:ring-2 focus:ring-primary focus:border-primary transition-colors text-sm text-foreground" required minLength={6} />
                <button type="button" onClick={() => setShowPw(!showPw)} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground" aria-label="toggle password">
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <div>
              <label htmlFor="reader_phone" className="block text-sm font-medium text-foreground/80 mb-1">{t.readerRegister.phone}</label>
              <div className="relative">
                <Phone className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground w-5 h-5" />
                <input id="reader_phone" type="tel" value={form.phone} onChange={(e) => updateField('phone', e.target.value)} placeholder={t.readerRegister.phonePlaceholder} dir="ltr" className="w-full pr-10 pl-4 py-3 bg-secondary/20 dark:bg-secondary/10 border border-border rounded-xl focus:ring-2 focus:ring-primary focus:border-primary transition-colors text-sm text-foreground" required />
              </div>
            </div>

            <div>
              <label htmlFor="reader_gender" className="block text-sm font-medium text-foreground/80 mb-1">{t.readerRegister.gender}</label>
              <div className="relative">
                <ChevronDown className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-5 h-5 pointer-events-none" />
                <select id="reader_gender" value={form.gender} onChange={(e) => updateField('gender', e.target.value)} className="w-full pr-4 pl-10 py-3 bg-secondary/20 dark:bg-secondary/10 border border-border rounded-xl focus:ring-2 focus:ring-primary focus:border-primary transition-colors text-sm text-foreground appearance-none" required>
                  <option value="" className="bg-card">{t.auth.selectGender}</option>
                  <option value="male" className="bg-card">{t.auth.male}</option>
                  <option value="female" className="bg-card">{t.auth.female}</option>
                </select>
              </div>
            </div>
            <div>
              <label htmlFor="reader_nationality" className="block text-sm font-medium text-foreground/80 mb-1">{t.readerRegister.nationality}</label>
              <div className="relative">
                <Popover open={nationalityOpen} onOpenChange={setNationalityOpen}>
                  <PopoverTrigger asChild>
                    <button type="button" className={cn("w-full pr-4 pl-10 py-3 bg-secondary/20 dark:bg-secondary/10 border border-border rounded-xl focus:ring-2 focus:ring-primary focus:border-primary transition-colors text-sm flex items-center justify-between", t.locale === 'ar' ? "text-right" : "text-left", !form.nationality && "text-muted-foreground")}>
                      {form.nationality ? form.nationality : t.auth.selectNationality || "Select Nationality"}
                      <ChevronsUpDown className="w-4 h-4 opacity-50 shrink-0" />
                    </button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="end">
                    <Command>
                      <CommandInput placeholder={t.locale === 'ar' ? "ابحث عن جنسية..." : "Search nationality..."} className={t.locale === 'ar' ? "text-right" : "text-left"} />
                      <CommandList className="max-h-[200px] overflow-y-auto">
                        <CommandEmpty className="py-6 text-center text-sm">{t.locale === 'ar' ? 'لا توجد نتائج.' : 'No results found.'}</CommandEmpty>
                        <CommandGroup>
                          {getNationalities().map((nat) => (
                            <CommandItem key={nat} value={nat} onSelect={(currentValue) => { updateField('nationality', currentValue === form.nationality ? "" : currentValue); setNationalityOpen(false); }} className={t.locale === 'ar' ? "text-right flex items-center justify-between cursor-pointer" : "text-left flex items-center justify-between cursor-pointer"}>
                              {nat}
                              <Check className={cn("mr-2 h-4 w-4", form.nationality === nat ? "opacity-100" : "opacity-0")} />
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
                <input type="hidden" name="nationality" value={form.nationality} required />
              </div>
            </div>
          </div>
        </div>

        {/* Section 2: Professional Info */}
        <div>
          <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-primary" />
            {t.readerRegister.professionalInfo}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label htmlFor="qualification" className="block text-sm font-medium text-foreground/80 mb-1">{t.readerRegister.qualification}</label>
              <input id="qualification" type="text" value={form.qualification} onChange={(e) => updateField('qualification', e.target.value)} placeholder={t.readerRegister.qualificationPlaceholder} className="w-full px-4 py-3 bg-secondary/20 dark:bg-secondary/10 border border-border rounded-xl focus:ring-2 focus:ring-primary focus:border-primary transition-colors text-sm text-foreground" />
            </div>
            <div>
              <label htmlFor="memorized_parts" className="block text-sm font-medium text-foreground/80 mb-1">{t.readerRegister.memorizedParts}</label>
              <input id="memorized_parts" type="number" min="0" max="30" value={form.memorized_parts} onChange={(e) => updateField('memorized_parts', e.target.value)} placeholder="30" className="w-full px-4 py-3 bg-secondary/20 dark:bg-secondary/10 border border-border rounded-xl focus:ring-2 focus:ring-primary focus:border-primary transition-colors text-sm text-foreground" />
            </div>
            <div>
              <label htmlFor="years_exp" className="block text-sm font-medium text-foreground/80 mb-1">{t.readerRegister.yearsOfExperience}</label>
              <input id="years_exp" type="number" min="0" value={form.years_of_experience} onChange={(e) => updateField('years_of_experience', e.target.value)} placeholder="5" className="w-full px-4 py-3 bg-secondary/20 dark:bg-secondary/10 border border-border rounded-xl focus:ring-2 focus:ring-primary focus:border-primary transition-colors text-sm text-foreground" />
            </div>
          </div>
        </div>

        {/* Section 3: Attachments */}
        <div>
          <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
            <Award className="w-5 h-5 text-primary" />
            {t.readerRegister.attachments}
          </h3>
          <div className="border-2 border-dashed border-border rounded-xl p-6 text-center hover:border-primary/40 transition-colors">
            <Award className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-foreground/80 mb-1">{t.readerRegister.uploadCert}</p>
            <p className="text-xs text-muted-foreground">{t.readerRegister.uploadCertDesc}</p>
            <input type="file" accept=".pdf,.jpg,.jpeg,.png" className="hidden" id="certificate_file" />
            <label htmlFor="certificate_file" className="inline-block mt-3 px-4 py-2 bg-secondary/30 hover:bg-secondary/50 rounded-lg text-sm text-foreground cursor-pointer transition-colors">
              {t.readerRegister.chooseFile}
            </label>
          </div>
        </div>

        <button type="submit" disabled={loading} className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-3.5 px-4 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-60">
          {loading ? (
            <span className="flex items-center gap-2">
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              {t.readerRegister.submitting}
            </span>
          ) : (
            t.readerRegister.submitRequest
          )}
        </button>
      </form>
    </div>
  )
}
