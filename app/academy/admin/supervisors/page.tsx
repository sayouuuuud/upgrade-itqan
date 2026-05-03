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
  Users, UserPlus, Shield, BookOpen, Loader2,
  Search, MoreVertical, Mail, Phone, Trash2, CheckCircle
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
  role: string
  is_active: boolean
  created_at: string
  avatar_url: string | null
  courses_count: number
  teachers_count: number
}

export default function AcademySupervisorsPage() {
  const { locale } = useI18n()
  const isAr = locale === 'ar'

  const [supervisors, setSupervisors] = useState<Supervisor[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [creating, setCreating] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: ''
  })

  const fetchSupervisors = async () => {
    try {
      const res = await fetch('/api/academy/admin/supervisors')
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
    fetchSupervisors()
  }, [])

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
        toast.success(data.message || (isAr ? 'تم إنشاء المشرف بنجاح' : 'Supervisor created'))
        setIsCreateOpen(false)
        setFormData({ name: '', email: '', password: '', phone: '' })
        fetchSupervisors()
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
        fetchSupervisors()
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

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder={isAr ? 'بحث...' : 'Search...'}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pr-10 rounded-xl"
        />
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

                <div className="flex items-center gap-2 mt-4">
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

                <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-border">
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1 text-2xl font-black text-foreground">
                      <BookOpen className="w-5 h-5 text-primary" />
                      {supervisor.courses_count}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {isAr ? 'دورات' : 'Courses'}
                    </p>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1 text-2xl font-black text-foreground">
                      <Users className="w-5 h-5 text-blue-500" />
                      {supervisor.teachers_count}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {isAr ? 'معلمين' : 'Teachers'}
                    </p>
                  </div>
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
              <Label>{isAr ? 'رقم الهاتف (اختياري)' : 'Phone (optional)'}</Label>
              <Input
                type="tel"
                placeholder={isAr ? 'أدخل رقم الهاتف' : 'Enter phone'}
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="rounded-xl"
                dir="ltr"
              />
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
