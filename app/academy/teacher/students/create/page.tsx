"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ArrowRight, UserPlus, Mail, Lock, User } from 'lucide-react'
import Link from 'next/link'
import { useI18n } from '@/lib/i18n/context'

export default function CreateStudentPage() {
    const router = useRouter()
    const { t } = useI18n()
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [success, setSuccess] = useState('')

    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        gender: 'male',
    })

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError('')
        setSuccess('')

        try {
            // We will create the API route /api/academy/teacher/students/create
            const res = await fetch('/api/academy/teacher/students/create', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData),
            })

            const data = await res.json()

            if (!res.ok) {
                throw new Error(data.error || 'حدث خطأ أثناء إنشاء حساب الطالب')
            }

            setSuccess('تم إنشاء حساب الطالب بنجاح!')
            setFormData({ name: '', email: '', password: '', gender: 'male' })

            // Navigate back after a short delay
            setTimeout(() => {
                router.push('/academy/teacher/students')
            }, 2000)

        } catch (err: any) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFormData(prev => ({
            ...prev,
            [e.target.name]: e.target.value
        }))
    }

    return (
        <div className="space-y-6 max-w-2xl mx-auto">
            <div className="flex items-center gap-4">
                <Link href="/academy/teacher/students">
                    <Button variant="ghost" size="icon" className="rounded-full">
                        <ArrowRight className="w-5 h-5" />
                    </Button>
                </Link>
                <div>
                    <h1 className="text-3xl font-bold">إضافة طالب جديد</h1>
                    <p className="text-muted-foreground mt-1">إنشاء حساب لطالب جديد لضمه إلى دوراتك</p>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <UserPlus className="w-5 h-5 text-primary" />
                        بيانات الطالب
                    </CardTitle>
                    <CardDescription>
                        سيتم إنشاء حساب جديد للطالب ومنحه صلاحية الوصول للأكاديمية
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {error && (
                        <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-lg border border-red-200 text-sm">
                            {error}
                        </div>
                    )}
                    {success && (
                        <div className="mb-6 p-4 bg-green-50 text-green-600 rounded-lg border border-green-200 text-sm">
                            {success}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium mb-1">الاسم الكامل</label>
                            <div className="relative">
                                <User className="absolute right-3 top-3 w-4 h-4 text-muted-foreground" />
                                <Input
                                    name="name"
                                    value={formData.name}
                                    onChange={handleChange}
                                    placeholder="محمد أحمد"
                                    className="pr-10"
                                    required
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-1">البريد الإلكتروني</label>
                            <div className="relative">
                                <Mail className="absolute right-3 top-3 w-4 h-4 text-muted-foreground" />
                                <Input
                                    name="email"
                                    type="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    placeholder="student@example.com"
                                    className="pr-10 text-left"
                                    dir="ltr"
                                    required
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-1">كلمة المرور المؤقتة</label>
                            <div className="relative">
                                <Lock className="absolute right-3 top-3 w-4 h-4 text-muted-foreground" />
                                <Input
                                    name="password"
                                    type="password"
                                    value={formData.password}
                                    onChange={handleChange}
                                    placeholder="******"
                                    className="pr-10 text-left"
                                    dir="ltr"
                                    required
                                    minLength={6}
                                />
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">يجب أن تكون 6 أحرف على الأقل</p>
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-1">الجنس</label>
                            <select
                                name="gender"
                                value={formData.gender}
                                onChange={handleChange}
                                className="w-full flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                <option value="male">ذكر</option>
                                <option value="female">أنثى</option>
                            </select>
                        </div>

                        <Button type="submit" disabled={loading} className="w-full mt-6">
                            {loading ? 'جاري الإنشاء...' : 'إنشاء حساب الطالب'}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    )
}
