"use client"

import { useState } from 'react'
import Link from 'next/link'
import { Eye, EyeOff, Mail, Lock, User, Phone, BookOpen, GraduationCap, CheckCircle, Check, ChevronsUpDown } from 'lucide-react'
import { SAUDI_CITIES, NATIONALITIES, NATIONALITIES_EN } from '@/lib/mock-data'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command'
import { cn } from '@/lib/utils'

export default function TeacherRegisterPage() {
    const [showPw, setShowPw] = useState(false)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [success, setSuccess] = useState(false)
    const [nationalityOpen, setNationalityOpen] = useState(false)

    const [form, setForm] = useState({
        full_name_triple: '',
        email: '',
        password: '',
        phone: '',
        city: '',
        gender: '',
        nationality: '',
        qualification: '',
        teaching_subjects: '',
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
            setError('كلمة المرور يجب أن تكون 6 أحرف على الأقل')
            setLoading(false)
            return
        }

        try {
            const res = await fetch('/api/auth/teacher-register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...form,
                    years_of_experience: form.years_of_experience ? parseInt(form.years_of_experience) : 0,
                }),
            })
            const data = await res.json()

            if (!res.ok) {
                setError(data.error || 'حدث خطأ')
                setLoading(false)
                return
            }

            setSuccess(true)
        } catch {
            setError('حدث خطأ في الاتصال')
            setLoading(false)
        }
    }

    if (success) {
        return (
            <div className="min-h-screen flex flex-col justify-center items-center relative overflow-hidden bg-[#0B3D2E]">
                <div className="absolute inset-0 z-0">
                    <div className="absolute -top-24 -right-24 w-96 h-96 bg-[#D4A843]/10 rounded-full blur-3xl" />
                    <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-[#0B3D2E]/30 rounded-full blur-3xl" />
                </div>
                <main className="relative z-10 w-full max-w-lg px-4">
                    <div className="bg-white/95 backdrop-blur-xl border border-white/20 shadow-2xl rounded-2xl p-8 md:p-10 text-center">
                        <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
                            <CheckCircle className="w-8 h-8 text-emerald-600" />
                        </div>
                        <h1 className="text-2xl font-bold text-gray-900 mb-3">تم استلام طلبك</h1>
                        <p className="text-gray-600 leading-relaxed mb-6">
                            تم استلام طلب التسجيل كمدرس بنجاح، وسيتم مراجعته من قبل إدارة الأكاديمية. سيتم إشعارك عبر البريد الإلكتروني عند اعتماد الحساب.
                        </p>
                        <Link href="/" className="inline-block bg-[#D4A843] hover:bg-[#C49A3A] text-white font-bold py-3 px-8 rounded-xl transition-colors">
                            العودة للرئيسية
                        </Link>
                    </div>
                </main>
            </div>
        )
    }

    return (
        <div className="min-h-screen flex flex-col items-center relative overflow-hidden bg-[#0B3D2E]">
            {/* Background */}
            <div className="absolute inset-0 z-0">
                <div className="absolute inset-0 opacity-10" style={{ background: 'radial-gradient(circle at top left, #145A3E 0%, #0B3D2E 40%, #072A1F 100%)' }} />
                <div className="absolute -top-24 -right-24 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
                <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
                {/* Decorative grid */}
                <div className="absolute inset-0 opacity-5" style={{ backgroundImage: 'radial-gradient(circle, #D4A843 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
            </div>

            {/* Nav */}
            <nav className="w-full p-6 flex justify-between items-center z-20 max-w-7xl mx-auto">
                <Link href="/" className="hover:opacity-80 transition-opacity">
                    <img src="/branding/main-logo.png" alt="Logo" className="h-16 w-auto object-contain" />
                </Link>
                <Link href="/login" className="text-sm font-medium text-white/70 hover:text-white transition-colors flex items-center gap-2">
                    <span>لديك حساب؟</span>
                    <span className="text-[#D4A843] font-bold">تسجيل الدخول</span>
                </Link>
            </nav>

            {/* Form */}
            <main className="relative z-10 w-full max-w-2xl px-4 py-6 pb-16">
                <div className="bg-card/95 backdrop-blur-xl border border-border shadow-2xl rounded-2xl p-8 md:p-10">
                    <div className="text-center mb-8">
                        <div className="w-16 h-16 bg-[#D4A843]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                            <GraduationCap className="w-8 h-8 text-[#D4A843]" />
                        </div>
                        <h1 className="text-3xl font-bold text-foreground mb-2">تسجيل مدرس جديد</h1>
                        <p className="text-muted-foreground">أكمل بياناتك للتسجيل كمدرس في أكاديمية إتقان</p>
                    </div>

                    {/* Info Banner */}
                    <div className="mb-6 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-xl text-sm text-amber-800 dark:text-amber-300 text-center">
                        سيتم مراجعة طلبك من قبل إدارة الأكاديمية قبل تفعيل حسابك كمدرس
                    </div>

                    {error && (
                        <div className="mb-6 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700 text-center">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-8">
                        {/* Section 1: Basic Info */}
                        <div>
                            <h2 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
                                <User className="w-5 h-5 text-primary" />
                                البيانات الأساسية
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="md:col-span-2">
                                    <label htmlFor="full_name" className="block text-sm font-medium text-foreground/80 mb-1">الاسم الثلاثي *</label>
                                    <div className="relative">
                                        <User className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground w-5 h-5" />
                                        <input
                                            id="full_name"
                                            type="text"
                                            value={form.full_name_triple}
                                            onChange={(e) => updateField('full_name_triple', e.target.value)}
                                            placeholder="الاسم الأول الأب الجد"
                                            className="w-full pr-10 pl-4 py-3 bg-secondary/20 dark:bg-secondary/10 border border-border rounded-xl focus:ring-2 focus:ring-primary focus:border-primary transition-colors text-sm text-foreground"
                                            required
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label htmlFor="teacher_email" className="block text-sm font-medium text-foreground/80 mb-1">البريد الإلكتروني *</label>
                                    <div className="relative">
                                        <Mail className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground w-5 h-5" />
                                        <input
                                            id="teacher_email"
                                            type="email"
                                            value={form.email}
                                            onChange={(e) => updateField('email', e.target.value)}
                                            placeholder="name@example.com"
                                            dir="ltr"
                                            className="w-full pr-10 pl-4 py-3 bg-secondary/20 dark:bg-secondary/10 border border-border rounded-xl focus:ring-2 focus:ring-primary focus:border-primary transition-colors text-sm text-foreground"
                                            required
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label htmlFor="teacher_password" className="block text-sm font-medium text-foreground/80 mb-1">كلمة المرور *</label>
                                    <div className="relative">
                                        <Lock className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground w-5 h-5" />
                                        <input
                                            id="teacher_password"
                                            type={showPw ? 'text' : 'password'}
                                            value={form.password}
                                            onChange={(e) => updateField('password', e.target.value)}
                                            placeholder="6 أحرف على الأقل"
                                            dir="ltr"
                                            className="w-full pr-10 pl-10 py-3 bg-secondary/20 dark:bg-secondary/10 border border-border rounded-xl focus:ring-2 focus:ring-primary focus:border-primary transition-colors text-sm text-foreground"
                                            required
                                            minLength={6}
                                        />
                                        <button type="button" onClick={() => setShowPw(!showPw)} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground" aria-label="toggle password">
                                            {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                        </button>
                                    </div>
                                </div>
                                <div>
                                    <label htmlFor="teacher_phone" className="block text-sm font-medium text-foreground/80 mb-1">رقم الجوال *</label>
                                    <div className="relative">
                                        <Phone className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground w-5 h-5" />
                                        <input
                                            id="teacher_phone"
                                            type="tel"
                                            value={form.phone}
                                            onChange={(e) => updateField('phone', e.target.value)}
                                            placeholder="05xxxxxxxx"
                                            dir="ltr"
                                            className="w-full pr-10 pl-4 py-3 bg-secondary/20 dark:bg-secondary/10 border border-border rounded-xl focus:ring-2 focus:ring-primary focus:border-primary transition-colors text-sm text-foreground"
                                            required
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label htmlFor="teacher_gender" className="block text-sm font-medium text-foreground/80 mb-1">الجنس *</label>
                                    <div className="relative">
                                        <select
                                            id="teacher_gender"
                                            value={form.gender}
                                            onChange={(e) => updateField('gender', e.target.value)}
                                            className="w-full pr-4 pl-4 py-3 bg-secondary/20 dark:bg-secondary/10 border border-border rounded-xl focus:ring-2 focus:ring-primary focus:border-primary transition-colors text-sm text-foreground appearance-none"
                                            required
                                        >
                                            <option value="" className="bg-card">اختر الجنس</option>
                                            <option value="male" className="bg-card">ذكر</option>
                                            <option value="female" className="bg-card">أنثى</option>
                                        </select>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-foreground/80 mb-1">الجنسية *</label>
                                    <Popover open={nationalityOpen} onOpenChange={setNationalityOpen}>
                                        <PopoverTrigger asChild>
                                            <button
                                                type="button"
                                                className={cn(
                                                    "w-full pr-4 pl-4 py-3 bg-secondary/20 dark:bg-secondary/10 border border-border rounded-xl focus:ring-2 focus:ring-primary focus:border-primary transition-colors text-sm flex items-center justify-between text-right",
                                                    !form.nationality && "text-muted-foreground"
                                                )}
                                            >
                                                {form.nationality || "اختر الجنسية"}
                                                <ChevronsUpDown className="w-4 h-4 opacity-50 shrink-0" />
                                            </button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="end">
                                            <Command>
                                                <CommandInput placeholder="ابحث عن جنسية..." className="text-right" />
                                                <CommandList className="max-h-[200px] overflow-y-auto">
                                                    <CommandEmpty className="py-6 text-center text-sm">لا توجد نتائج.</CommandEmpty>
                                                    <CommandGroup>
                                                        {NATIONALITIES.map((nat) => (
                                                            <CommandItem
                                                                key={nat}
                                                                value={nat}
                                                                onSelect={(currentValue) => {
                                                                    updateField('nationality', currentValue === form.nationality ? "" : currentValue)
                                                                    setNationalityOpen(false)
                                                                }}
                                                                className="text-right flex items-center justify-between cursor-pointer"
                                                            >
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

                        {/* Section 2: Professional Info */}
                        <div>
                            <h2 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
                                <BookOpen className="w-5 h-5 text-primary" />
                                البيانات المهنية
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label htmlFor="qualification" className="block text-sm font-medium text-foreground/80 mb-1">المؤهل العلمي</label>
                                    <input
                                        id="qualification"
                                        type="text"
                                        value={form.qualification}
                                        onChange={(e) => updateField('qualification', e.target.value)}
                                        placeholder="مثال: بكالوريوس تربية"
                                        className="w-full px-4 py-3 bg-secondary/20 dark:bg-secondary/10 border border-border rounded-xl focus:ring-2 focus:ring-primary focus:border-primary transition-colors text-sm text-foreground"
                                    />
                                </div>
                                <div>
                                    <label htmlFor="years_exp" className="block text-sm font-medium text-foreground/80 mb-1">سنوات الخبرة</label>
                                    <input
                                        id="years_exp"
                                        type="number"
                                        min="0"
                                        value={form.years_of_experience}
                                        onChange={(e) => updateField('years_of_experience', e.target.value)}
                                        placeholder="5"
                                        className="w-full px-4 py-3 bg-secondary/20 dark:bg-secondary/10 border border-border rounded-xl focus:ring-2 focus:ring-primary focus:border-primary transition-colors text-sm text-foreground"
                                    />
                                </div>
                                <div className="md:col-span-2">
                                    <label htmlFor="teaching_subjects" className="block text-sm font-medium text-foreground/80 mb-1">المواد التي تدرّسها</label>
                                    <textarea
                                        id="teaching_subjects"
                                        value={form.teaching_subjects}
                                        onChange={(e) => updateField('teaching_subjects', e.target.value)}
                                        placeholder="مثال: تجويد القرآن، العقيدة، الفقه، اللغة العربية..."
                                        rows={3}
                                        className="w-full px-4 py-3 bg-secondary/20 dark:bg-secondary/10 border border-border rounded-xl focus:ring-2 focus:ring-primary focus:border-primary transition-colors text-sm text-foreground resize-none"
                                    />
                                </div>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-3.5 px-4 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-0.5 flex items-center justify-center gap-2 disabled:opacity-60"
                        >
                            {loading ? (
                                <span className="flex items-center gap-2">
                                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    جاري إرسال الطلب...
                                </span>
                            ) : (
                                'إرسال طلب التسجيل'
                            )}
                        </button>
                    </form>

                    {/* Links */}
                    <div className="mt-8 pt-6 border-t border-border space-y-3 text-center">
                        <p className="text-sm text-muted-foreground">
                            تريد التسجيل كطالب؟{' '}
                            <Link href="/register" className="font-bold text-primary hover:underline">سجل كطالب من هنا</Link>
                        </p>
                        <p className="text-sm text-muted-foreground">
                            تريد الانضمام كمقرئ؟{' '}
                            <Link href="/reader-register" className="font-bold text-primary hover:underline">سجل كمقرئ من هنا</Link>
                        </p>
                    </div>
                </div>
            </main>

            <footer className="relative z-10 py-4 text-center w-full flex flex-col items-center gap-2">
                <img src="/branding/main-logo.png" alt="Itqan" className="h-10 w-auto opacity-30 grayscale brightness-200" />
                <p className="text-xs text-white/20">
                    {'2026 '}{'منصة إتقان التعليمية'}{'. '}{'جميع الحقوق محفوظة'}
                </p>
            </footer>
        </div>
    )
}
