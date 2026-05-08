'use client'

import { useState, useEffect } from 'react'
import { useI18n } from '@/lib/i18n/context'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Users, UserPlus, Shield, Loader2,
  Search, MoreVertical, Trash2, CheckCircle
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { toast } from 'sonner'

interface Supervisor {
  id: string
  name: string
  email: string
  gender: string
  role: string
  is_active: boolean
  created_at: string
  avatar_url: string | null
}

const ROLE_LABELS: Record<string, { ar: string; en: string; cls: string }> = {
  fiqh_supervisor:    { ar: 'مشرف أسئلة الفقه', en: 'Fiqh Q&A Supervisor', cls: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20' },
  content_supervisor: { ar: 'مشرف المحتوى',     en: 'Content Supervisor',  cls: 'bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20' },
  supervisor:         { ar: 'مشرف عام',         en: 'General Supervisor',  cls: 'bg-muted text-foreground border-border' },
}

export default function AcademySupervisorsPage() {
  const { locale } = useI18n()
  const isAr = locale === 'ar'

  const [supervisors, setSupervisors] = useState<Supervisor[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [tab, setTab] = useState<'all' | 'fiqh' | 'content'>('all')
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [creating, setCreating] = useState(false)
  const [formData, setFormData] = useState<{
    name: string; email: string; password: string; gender: string; type: 'fiqh' | 'content'
  }>({
    name: '',
    email: '',
    password: '',
    gender: 'male',
    type: 'fiqh',
  })

  const fetchSupervisors = async (filter: 'all' | 'fiqh' | 'content' = tab) => {
    setLoading(true)
    try {
      const res = await fetch(`/api/academy/admin/supervisors?type=${filter}`)
      if (res.ok) {
        const data = await res.json()
        setSupervisors(data.supervisors || [])
      }
    } catch (error) {
      console.error('Failed to fetch supervisors:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSupervisors(tab)
  }, [tab])

  const handleCreate = async () => {
    if (!formData.name || !formData.email || !formData.password) {
      toast.error(isAr ? 'جميع الحقول مطلوبة' : 'All fields are required')
      return
    }

    setCreating(true)
    try {
      const res = await fetch('/api/academy/admin/supervisors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      const data = await res.json()

      if (res.ok) {
        toast.success(isAr ? 'تم إنشاء المشرف بنجاح' : 'Supervisor created')
        setIsCreateOpen(false)
        setFormData({ name: '', email: '', password: '', gender: 'male', type: formData.type })
        fetchSupervisors(tab)
      } else {
        toast.error(data.error || (isAr ? 'حدث خطأ' : 'An error occurred'))
      }
    } catch (error) {
      toast.error(isAr ? 'حدث خطأ في الاتصال' : 'Connection error')
    } finally {
      setCreating(false)
    }
  }

  const handleDeactivate = async (supervisorId: string) => {
    try {
      const res = await fetch('/api/academy/admin/supervisors', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ supervisorId })
      })

      if (res.ok) {
        toast.success(isAr ? 'تم إلغاء تفعيل المشرف' : 'Supervisor deactivated')
        fetchSupervisors(tab)
      }
    } catch (error) {
      toast.error(isAr ? 'حدث خطأ' : 'An error occurred')
    }
  }

  const filteredSupervisors = supervisors.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.email.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-foreground flex items-center gap-3">
            <Shield className="w-8 h-8 text-primary" />
            {isAr ? 'إدارة المشرفين' : 'Supervisor Management'}
          </h1>
          <p className="text-muted-foreground mt-1">
            {isAr ? 'إنشاء وإدارة حسابات المشرفين في الأكاديمية' : 'Create and manage supervisor accounts'}
          </p>
        </div>
        <Button
          onClick={() => setIsCreateOpen(true)}
          className="gap-2 rounded-xl font-bold"
        >
          <UserPlus className="w-4 h-4" />
          {isAr ? 'إضافة مشرف' : 'Add Supervisor'}
        </Button>
      </div>

      {/* Tabs + Search */}
      <div className="flex flex-col md:flex-row md:items-center gap-3">
        <div className="flex gap-2 bg-muted/40 p-1 rounded-2xl w-fit">
          {([
            { key: 'all',     label: isAr ? 'الكل' : 'All' },
            { key: 'fiqh',    label: isAr ? 'مشرفو أسئلة الفقه' : 'Fiqh Q&A' },
            { key: 'content', label: isAr ? 'مشرفو المحتوى' : 'Content' },
          ] as const).map(({ key, label }) => (
            <button
              key={key}
              type="button"
              onClick={() => setTab(key)}
              className={`px-4 py-1.5 text-sm font-bold rounded-xl transition-colors ${
                tab === key
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        <div className="relative md:max-w-xs flex-1">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder={isAr ? 'بحث...' : 'Search...'}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pr-10 rounded-xl"
          />
        </div>
      </div>

      {/* Supervisors Grid */}
      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : filteredSupervisors.length === 0 ? (
        <Card className="rounded-2xl">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Shield className="w-16 h-16 text-muted-foreground/30 mb-4" />
            <p className="text-lg font-bold text-muted-foreground">
              {isAr ? 'لا يوجد مشرفين' : 'No supervisors found'}
            </p>
            <p className="text-sm text-muted-foreground/60 mt-1">
              {isAr ? 'قم بإضافة مشرف جديد' : 'Add a new supervisor to get started'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredSupervisors.map((supervisor) => (
            <Card key={supervisor.id} className="rounded-2xl hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center">
                      {supervisor.avatar_url ? (
                        <img
                          src={supervisor.avatar_url}
                          alt={supervisor.name}
                          className="w-full h-full rounded-2xl object-cover"
                        />
                      ) : (
                        <span className="text-xl font-black text-primary">
                          {supervisor.name.charAt(0)}
                        </span>
                      )}
                    </div>
                    <div>
                      <h3 className="font-bold text-foreground">{supervisor.name}</h3>
                      <p className="text-sm text-muted-foreground">{supervisor.email}</p>
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="rounded-xl">
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={() => handleDeactivate(supervisor.id)}
                        className="text-destructive focus:text-destructive"
                      >
                        <Trash2 className="w-4 h-4 ml-2" />
                        {isAr ? 'إلغاء التفعيل' : 'Deactivate'}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                <div className="flex flex-wrap items-center gap-2 mt-4">
                  <Badge
                    variant="outline"
                    className={ROLE_LABELS[supervisor.role]?.cls || 'bg-muted text-foreground border-border'}
                  >
                    {isAr
                      ? ROLE_LABELS[supervisor.role]?.ar || supervisor.role
                      : ROLE_LABELS[supervisor.role]?.en || supervisor.role}
                  </Badge>
                  <Badge
                    variant={supervisor.is_active ? 'default' : 'secondary'}
                    className={supervisor.is_active
                      ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
                      : 'bg-red-500/10 text-red-600 border-red-500/20'}
                  >
                    {supervisor.is_active
                      ? (isAr ? 'نشط' : 'Active')
                      : (isAr ? 'غير نشط' : 'Inactive')}
                  </Badge>
                </div>

                <div className="mt-4 pt-4 border-t border-border text-xs text-muted-foreground flex items-center justify-between">
                  <span>{supervisor.gender === 'female' ? 'أنثى' : 'ذكر'}</span>
                  <span>{new Date(supervisor.created_at).toLocaleDateString('ar-EG')}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-primary" />
              {isAr ? 'إضافة مشرف جديد' : 'Add New Supervisor'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>{isAr ? 'نوع المشرف' : 'Supervisor Type'}</Label>
              <div className="grid grid-cols-2 gap-2">
                {([
                  { key: 'fiqh',    ar: 'أسئلة الفقه', en: 'Fiqh Q&A',  desc: isAr ? 'الإجابة على أسئلة الطلاب' : 'Answers student questions' },
                  { key: 'content', ar: 'المحتوى',     en: 'Content',   desc: isAr ? 'مراجعة دروس المعلمين' : 'Reviews teacher lessons' },
                ] as const).map(({ key, ar, en, desc }) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setFormData({ ...formData, type: key })}
                    className={`text-right p-3 rounded-xl border-2 transition-all ${
                      formData.type === key
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/40'
                    }`}
                  >
                    <p className="font-bold text-sm text-foreground">{isAr ? ar : en}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <Label>{isAr ? 'الاسم الكامل' : 'Full Name'}</Label>
              <Input
                placeholder={isAr ? 'أدخل الاسم' : 'Enter name'}
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="rounded-xl"
              />
            </div>
            <div className="space-y-2">
              <Label>{isAr ? 'البريد الإلكتروني' : 'Email'}</Label>
              <Input
                type="email"
                placeholder={isAr ? 'أدخل البريد' : 'Enter email'}
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="rounded-xl"
                dir="ltr"
              />
            </div>
            <div className="space-y-2">
              <Label>{isAr ? 'كلمة المرور' : 'Password'}</Label>
              <Input
                type="password"
                placeholder={isAr ? 'أدخل كلمة المرور' : 'Enter password'}
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="rounded-xl"
              />
            </div>
            <div className="space-y-2">
              <Label>{isAr ? 'الجنس' : 'Gender'}</Label>
              <select
                value={formData.gender}
                onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                className="w-full bg-background border border-input rounded-xl px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="male">{isAr ? 'ذكر' : 'Male'}</option>
                <option value="female">{isAr ? 'أنثى' : 'Female'}</option>
              </select>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsCreateOpen(false)}
              className="rounded-xl"
            >
              {isAr ? 'إلغاء' : 'Cancel'}
            </Button>
            <Button
              onClick={handleCreate}
              disabled={creating}
              className="rounded-xl gap-2"
            >
              {creating ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <CheckCircle className="w-4 h-4" />
              )}
              {isAr ? 'إنشاء' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
