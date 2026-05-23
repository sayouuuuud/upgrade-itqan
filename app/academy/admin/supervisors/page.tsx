'use client'

import { useState, useEffect } from 'react'
import { useI18n } from '@/lib/i18n/context'
import { Card, CardContent } from '@/components/ui/card'
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
  DialogDescription,
} from '@/components/ui/dialog'
import {
  Users, UserPlus, Shield, Loader2,
  Search, MoreVertical, Trash2, CheckCircle,
  Edit2, UserX, AlertTriangle, UserCheck, Power, ShieldCheck, Sparkles, X, Key
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
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

const ROLE_LABELS: Record<string, { ar: string; en: string; cls: string; gradient: string }> = {
  fiqh_supervisor: { 
    ar: 'مشرف أسئلة الفقه', 
    en: 'Fiqh Q&A Supervisor', 
    cls: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20',
    gradient: 'from-emerald-500/10 to-teal-500/5'
  },
  content_supervisor: { 
    ar: 'مشرف المحتوى',     
    en: 'Content Supervisor',  
    cls: 'bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20',
    gradient: 'from-blue-500/10 to-indigo-500/5'
  },
  supervisor: { 
    ar: 'مشرف عام',         
    en: 'General Supervisor',  
    cls: 'bg-zinc-500/10 text-zinc-700 dark:text-zinc-400 border-zinc-500/20',
    gradient: 'from-zinc-500/10 to-zinc-500/5'
  },
}

export default function AcademySupervisorsPage() {
  const { locale } = useI18n()
  const isAr = locale === 'ar'

  const [supervisors, setSupervisors] = useState<Supervisor[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [tab, setTab] = useState<'all' | 'fiqh' | 'content'>('all')

  // Create Modal State
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [creating, setCreating] = useState(false)
  const [createEmailError, setCreateEmailError] = useState('')
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    gender: 'male',
    type: 'fiqh' as 'fiqh' | 'content',
  })

  // Edit Modal State
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [editing, setEditing] = useState(false)
  const [editEmailError, setEditEmailError] = useState('')
  const [editData, setEditData] = useState({
    id: '',
    name: '',
    email: '',
    password: '',
    gender: 'male',
    type: 'fiqh' as 'fiqh' | 'content',
  })

  // Delete Confirm Modal State
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [targetDelete, setTargetDelete] = useState<Supervisor | null>(null)

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

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
      toast.error(isAr ? 'فشل تحميل بيانات المشرفين' : 'Failed to fetch supervisors')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSupervisors(tab)
  }, [tab])

  // Email validation handlers
  const handleCreateEmailChange = (val: string) => {
    setFormData(prev => ({ ...prev, email: val }))
    if (val && !emailRegex.test(val)) {
      setCreateEmailError(isAr ? 'صيغة البريد الإلكتروني غير صالحة' : 'Invalid email format')
    } else {
      setCreateEmailError('')
    }
  }

  const handleEditEmailChange = (val: string) => {
    setEditData(prev => ({ ...prev, email: val }))
    if (val && !emailRegex.test(val)) {
      setEditEmailError(isAr ? 'صيغة البريد الإلكتروني غير صالحة' : 'Invalid email format')
    } else {
      setEditEmailError('')
    }
  }

  const handleCreate = async () => {
    if (!formData.name || !formData.email || !formData.password) {
      toast.error(isAr ? 'جميع الحقول مطلوبة' : 'All fields are required')
      return
    }

    if (!emailRegex.test(formData.email)) {
      toast.error(isAr ? 'صيغة البريد الإلكتروني غير صالحة' : 'Invalid email format')
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
        setCreateEmailError('')
        fetchSupervisors(tab)
      } else {
        toast.error(data.error || (isAr ? 'حدث خطأ ما' : 'An error occurred'))
      }
    } catch (error) {
      toast.error(isAr ? 'حدث خطأ في الاتصال بالخادم' : 'Connection error')
    } finally {
      setCreating(false)
    }
  }

  const handleEdit = async () => {
    if (!editData.name || !editData.email) {
      toast.error(isAr ? 'الاسم والبريد الإلكتروني مطلوبان' : 'Name and email are required')
      return
    }

    if (!emailRegex.test(editData.email)) {
      toast.error(isAr ? 'صيغة البريد الإلكتروني غير صالحة' : 'Invalid email format')
      return
    }

    setEditing(true)
    try {
      const res = await fetch(`/api/academy/admin/supervisors/${editData.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editData.name,
          email: editData.email,
          gender: editData.gender,
          type: editData.type,
          password: editData.password || undefined // Only update if provided
        })
      })

      const data = await res.json()

      if (res.ok) {
        toast.success(isAr ? 'تم تحديث بيانات المشرف بنجاح' : 'Supervisor details updated')
        setIsEditOpen(false)
        setEditEmailError('')
        fetchSupervisors(tab)
      } else {
        toast.error(data.error || (isAr ? 'حدث خطأ ما' : 'An error occurred'))
      }
    } catch (error) {
      toast.error(isAr ? 'حدث خطأ في الاتصال بالخادم' : 'Connection error')
    } finally {
      setEditing(false)
    }
  }

  const handleToggleStatus = async (id: string, currentStatus: boolean) => {
    const nextStatus = !currentStatus
    try {
      const res = await fetch(`/api/academy/admin/supervisors/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: nextStatus })
      })

      const data = await res.json()

      if (res.ok) {
        toast.success(
          isAr
            ? (nextStatus ? 'تم تفعيل المشرف بنجاح' : 'تم إلغاء تفعيل المشرف بنجاح')
            : (nextStatus ? 'Supervisor activated successfully' : 'Supervisor deactivated successfully')
        )
        fetchSupervisors(tab)
      } else {
        toast.error(data.error || (isAr ? 'حدث خطأ ما' : 'An error occurred'))
      }
    } catch (error) {
      toast.error(isAr ? 'حدث خطأ في الاتصال بالخادم' : 'Connection error')
    }
  }

  const handleHardDelete = async () => {
    if (!targetDelete) return

    setDeleting(true)
    try {
      const res = await fetch(`/api/academy/admin/supervisors/${targetDelete.id}`, {
        method: 'DELETE'
      })

      const data = await res.json()

      if (res.ok) {
        toast.success(isAr ? 'تم حذف المشرف نهائياً من قاعدة البيانات' : 'Supervisor permanently deleted')
        setIsDeleteOpen(false)
        setTargetDelete(null)
        fetchSupervisors(tab)
      } else {
        toast.error(data.error || (isAr ? 'حدث خطأ أثناء الحذف' : 'An error occurred during deletion'))
      }
    } catch (error) {
      toast.error(isAr ? 'حدث خطأ في الاتصال بالخادم' : 'Connection error')
    } finally {
      setDeleting(false)
    }
  }

  const openEditModal = (supervisor: Supervisor) => {
    setEditData({
      id: supervisor.id,
      name: supervisor.name,
      email: supervisor.email,
      password: '',
      gender: supervisor.gender,
      type: supervisor.role === 'content_supervisor' ? 'content' : 'fiqh',
    })
    setEditEmailError('')
    setIsEditOpen(true)
  }

  const openDeleteModal = (supervisor: Supervisor) => {
    setTargetDelete(supervisor)
    setIsDeleteOpen(true)
  }

  const filteredSupervisors = supervisors.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.email.toLowerCase().includes(search.toLowerCase())
  )

  // Calculations for dashboard stats
  const totalCount = supervisors.length
  const activeCount = supervisors.filter(s => s.is_active).length
  const inactiveCount = supervisors.filter(s => !s.is_active).length
  const fiqhCount = supervisors.filter(s => s.role === 'fiqh_supervisor').length
  const contentCount = supervisors.filter(s => s.role === 'content_supervisor').length

  return (
    <div className="space-y-8 max-w-7xl mx-auto p-4 md:p-6 transition-all duration-300">
      
      {/* Decorative background lights */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-primary/5 rounded-full filter blur-3xl pointer-events-none -z-10" />
      <div className="absolute top-1/3 left-1/4 w-80 h-80 bg-blue-500/5 rounded-full filter blur-3xl pointer-events-none -z-10" />

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 bg-white/30 dark:bg-zinc-950/20 backdrop-blur-md p-6 rounded-3xl border border-white/20 dark:border-zinc-800/40 shadow-sm">
        <div className="space-y-1">
          <h1 className="text-3xl font-black tracking-tight text-foreground flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-gradient-to-tr from-primary to-blue-600 text-white shadow-lg shadow-primary/20">
              <Shield className="w-7 h-7" />
            </div>
            {isAr ? 'إدارة المشرفين' : 'Supervisor Management'}
          </h1>
          <p className="text-muted-foreground text-sm max-w-2xl">
            {isAr 
              ? 'بوابة التحكم الكاملة لمشرفي الأكاديمية: الإنشاء والتعديل الفوري، وإيقاف الحسابات وإعادة تفعيلها، أو الحذف التام من قاعدة البيانات.' 
              : 'Complete control gateway for academy supervisors: creation, direct editing, deactivation/reactivation, and absolute database removal.'}
          </p>
        </div>
        <Button
          onClick={() => {
            setFormData({ name: '', email: '', password: '', gender: 'male', type: 'fiqh' })
            setCreateEmailError('')
            setIsCreateOpen(true)
          }}
          className="gap-2.5 rounded-2xl font-bold bg-gradient-to-r from-primary to-blue-600 hover:from-primary/95 hover:to-blue-600/95 text-white shadow-md shadow-primary/10 hover:shadow-lg transition-all duration-300 group px-6 py-6"
        >
          <UserPlus className="w-5 h-5 group-hover:scale-110 transition-transform" />
          {isAr ? 'إضافة مشرف جديد' : 'Add New Supervisor'}
        </Button>
      </div>

      {/* Stats Cards Section */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Supervisors */}
        <Card className="rounded-2xl border-white/20 dark:border-zinc-800/40 bg-white/50 dark:bg-zinc-900/30 backdrop-blur-md hover:-translate-y-1 transition-all duration-300 shadow-sm">
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground font-bold uppercase tracking-wider">{isAr ? 'إجمالي المشرفين' : 'Total Supervisors'}</p>
              <h4 className="text-2xl font-extrabold text-foreground">{totalCount}</h4>
            </div>
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
              <Users className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>

        {/* Fiqh Q&A */}
        <Card className="rounded-2xl border-white/20 dark:border-zinc-800/40 bg-white/50 dark:bg-zinc-900/30 backdrop-blur-md hover:-translate-y-1 transition-all duration-300 shadow-sm">
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground font-bold uppercase tracking-wider">{isAr ? 'مشرفو الفقه' : 'Fiqh Supervisors'}</p>
              <h4 className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400">{fiqhCount}</h4>
            </div>
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500">
              <ShieldCheck className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>

        {/* Content Supervisors */}
        <Card className="rounded-2xl border-white/20 dark:border-zinc-800/40 bg-white/50 dark:bg-zinc-900/30 backdrop-blur-md hover:-translate-y-1 transition-all duration-300 shadow-sm">
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground font-bold uppercase tracking-wider">{isAr ? 'مشرفو المحتوى' : 'Content Supervisors'}</p>
              <h4 className="text-2xl font-extrabold text-blue-600 dark:text-blue-400">{contentCount}</h4>
            </div>
            <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500">
              <Sparkles className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>

        {/* Active Status */}
        <Card className="rounded-2xl border-white/20 dark:border-zinc-800/40 bg-white/50 dark:bg-zinc-900/30 backdrop-blur-md hover:-translate-y-1 transition-all duration-300 shadow-sm">
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground font-bold uppercase tracking-wider">{isAr ? 'النشطون حالياً' : 'Active Status'}</p>
              <div className="flex items-center gap-2">
                <h4 className="text-2xl font-extrabold text-foreground">{activeCount}</h4>
                <span className="text-xs text-muted-foreground">/ {inactiveCount} {isAr ? 'موقفين' : 'suspended'}</span>
              </div>
            </div>
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-600">
              <UserCheck className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white/20 dark:bg-zinc-950/10 backdrop-blur-sm p-3 rounded-2xl border border-white/10 dark:border-zinc-850/20">
        <div className="flex gap-1.5 p-1 bg-zinc-100 dark:bg-zinc-900 rounded-xl w-fit">
          {([
            { key: 'all', label: isAr ? 'الكل' : 'All' },
            { key: 'fiqh', label: isAr ? 'أسئلة الفقه' : 'Fiqh Q&A' },
            { key: 'content', label: isAr ? 'المحتوى' : 'Content' },
          ] as const).map(({ key, label }) => (
            <button
              key={key}
              type="button"
              onClick={() => setTab(key)}
              className={`px-5 py-2 text-xs font-bold rounded-lg transition-all duration-200 ${
                tab === key
                  ? 'bg-white dark:bg-zinc-800 text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="relative max-w-sm w-full">
          <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-muted-foreground" />
          <Input
            placeholder={isAr ? 'البحث عن طريق الاسم أو البريد...' : 'Search by name or email...'}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pr-10 rounded-xl bg-white/40 dark:bg-zinc-900/40 border-white/20 dark:border-zinc-800/40 focus:ring-primary h-10 text-sm"
          />
          {search && (
            <button 
              onClick={() => setSearch('')}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Supervisors Directory / Cards grid */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 gap-4">
          <Loader2 className="w-10 h-10 animate-spin text-primary" />
          <p className="text-sm font-semibold text-muted-foreground animate-pulse">
            {isAr ? 'جاري جلب المشرفين الأفاضل...' : 'Fetching supervisor listings...'}
          </p>
        </div>
      ) : filteredSupervisors.length === 0 ? (
        <Card className="rounded-3xl border border-white/10 dark:border-zinc-800/40 bg-white/30 dark:bg-zinc-900/10 backdrop-blur-md">
          <CardContent className="flex flex-col items-center justify-center py-20 text-center">
            <div className="p-5 rounded-full bg-zinc-100 dark:bg-zinc-900 text-zinc-400 dark:text-zinc-600 mb-4">
              <UserX className="w-12 h-12" />
            </div>
            <p className="text-lg font-bold text-foreground">
              {isAr ? 'لا يوجد مشرفين يطابقون خياراتك' : 'No supervisors match criteria'}
            </p>
            <p className="text-sm text-muted-foreground max-w-xs mt-1">
              {isAr 
                ? 'لم نعثر على حسابات للمشرفين. يمكنك إنشاء حساب جديد بالضغط على زر إضافة مشرف.' 
                : 'No registered supervisors found. Try creating a new one.'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredSupervisors.map((supervisor) => {
            const roleInfo = ROLE_LABELS[supervisor.role] || ROLE_LABELS.supervisor
            return (
              <div
                key={supervisor.id}
                className={`relative group rounded-3xl border border-white/20 dark:border-zinc-800/30 bg-gradient-to-br ${roleInfo.gradient} bg-white/40 dark:bg-zinc-950/20 backdrop-blur-md p-6 hover:-translate-y-1.5 hover:shadow-xl hover:shadow-primary/5 transition-all duration-300`}
              >
                {/* Status indicator pill (top left) */}
                <div className="absolute top-6 left-6 flex items-center gap-1.5">
                  <span className={`w-2 h-2 rounded-full ${supervisor.is_active ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`} />
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                    {supervisor.is_active ? (isAr ? 'نشط' : 'Active') : (isAr ? 'معطل' : 'Disabled')}
                  </span>
                </div>

                <div className="flex items-start gap-4 mt-2">
                  {/* User Avatar */}
                  <div className="relative w-16 h-16 rounded-2xl bg-gradient-to-tr from-primary/20 to-blue-500/20 dark:from-primary/30 dark:to-blue-500/10 flex items-center justify-center shadow-inner group-hover:scale-105 transition-transform duration-300">
                    {supervisor.avatar_url ? (
                      <img
                        src={supervisor.avatar_url}
                        alt={supervisor.name}
                        className="w-full h-full rounded-2xl object-cover"
                      />
                    ) : (
                      <span className="text-2xl font-black text-primary">
                        {supervisor.name.trim().charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>

                  {/* Header metadata */}
                  <div className="flex-1 min-w-0 pr-8">
                    <h3 className="font-bold text-lg text-foreground truncate group-hover:text-primary transition-colors">
                      {supervisor.name}
                    </h3>
                    <p className="text-xs text-muted-foreground truncate font-mono mt-0.5" dir="ltr">
                      {supervisor.email}
                    </p>
                  </div>
                </div>

                {/* Role and Gender badges */}
                <div className="flex items-center gap-2 mt-5">
                  <Badge variant="outline" className={`rounded-xl px-3 py-1 font-bold text-[11px] ${roleInfo.cls}`}>
                    {isAr ? roleInfo.ar : roleInfo.en}
                  </Badge>
                  
                  <Badge variant="outline" className="rounded-xl px-3 py-1 text-[11px] bg-zinc-100 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-muted-foreground font-semibold">
                    {supervisor.gender === 'female' ? (isAr ? 'أنثى' : 'Female') : (isAr ? 'ذكر' : 'Male')}
                  </Badge>
                </div>

                {/* Action buttons footer */}
                <div className="flex items-center justify-between mt-6 pt-4 border-t border-zinc-200/40 dark:border-zinc-800/40 text-xs text-muted-foreground">
                  <div>
                    <span className="font-medium opacity-60">{isAr ? 'تاريخ الانضمام:' : 'Joined:'} </span>
                    <span className="font-bold">{new Date(supervisor.created_at).toLocaleDateString(isAr ? 'ar-EG' : 'en-US')}</span>
                  </div>

                  {/* Context menu for full control */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="w-8 h-8 rounded-xl hover:bg-zinc-200/40 dark:hover:bg-zinc-850/40 text-muted-foreground hover:text-foreground">
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align={isAr ? 'start' : 'end'} className="rounded-xl border-white/20 dark:border-zinc-800/40 backdrop-blur-md shadow-xl">
                      <DropdownMenuItem onClick={() => openEditModal(supervisor)} className="cursor-pointer gap-2 font-semibold">
                        <Edit2 className="w-4 h-4 text-blue-500" />
                        {isAr ? 'تعديل البيانات' : 'Edit Details'}
                      </DropdownMenuItem>

                      {/* Deactivation / Activation toggler */}
                      <DropdownMenuItem 
                        onClick={() => handleToggleStatus(supervisor.id, supervisor.is_active)}
                        className={`cursor-pointer gap-2 font-semibold ${supervisor.is_active ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'}`}
                      >
                        <Power className="w-4 h-4" />
                        {supervisor.is_active 
                          ? (isAr ? 'إيقاف الحساب مؤقتاً' : 'Suspend Account')
                          : (isAr ? 'إعادة تفعيل الحساب' : 'Reactivate Account')}
                      </DropdownMenuItem>

                      <DropdownMenuSeparator className="border-zinc-200/40 dark:border-zinc-800/40" />

                      {/* Permanent removal */}
                      <DropdownMenuItem 
                        onClick={() => openDeleteModal(supervisor)} 
                        className="cursor-pointer gap-2 font-bold text-destructive hover:bg-destructive/10 dark:hover:bg-destructive/20 focus:text-destructive"
                      >
                        <Trash2 className="w-4 h-4" />
                        {isAr ? 'حذف نهائي من النظام' : 'Permanent Delete'}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* 1. Create Dialog Modal */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="sm:max-w-md rounded-3xl border-white/20 dark:border-zinc-800/40 backdrop-blur-lg bg-white/90 dark:bg-zinc-950/90 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl font-black">
              <div className="p-2 rounded-xl bg-primary/10 text-primary">
                <UserPlus className="w-5 h-5" />
              </div>
              {isAr ? 'إضافة مشرف جديد' : 'Register New Supervisor'}
            </DialogTitle>
            <DialogDescription className="text-xs">
              {isAr ? 'قم بملء البيانات لإنشاء حساب لمشرف فقه أو محتوى.' : 'Fill details to create a supervisor account.'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Type selector buttons */}
            <div className="space-y-2">
              <Label className="text-xs font-bold text-muted-foreground">{isAr ? 'نوع ومهمة المشرف' : 'Supervisor Assignment'}</Label>
              <div className="grid grid-cols-2 gap-3">
                {([
                  { key: 'fiqh', ar: 'مشرف فقه', en: 'Fiqh Q&A', desc: isAr ? 'الإجابة على أسئلة الفقه' : 'Responds to Q&As' },
                  { key: 'content', ar: 'مشرف محتوى', en: 'Content', desc: isAr ? 'مراجعة وتقييم الدروس' : 'Reviews academy contents' },
                ] as const).map(({ key, ar, en, desc }) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setFormData({ ...formData, type: key })}
                    className={`text-right p-3 rounded-xl border-2 transition-all flex flex-col justify-between h-20 ${
                      formData.type === key
                        ? 'border-primary bg-primary/5 text-primary'
                        : 'border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 bg-transparent'
                    }`}
                  >
                    <p className="font-extrabold text-sm text-foreground">{isAr ? ar : en}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5 leading-relaxed truncate w-full">{desc}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Name */}
            <div className="space-y-1.5">
              <Label htmlFor="create-name" className="text-xs font-bold text-muted-foreground">{isAr ? 'الاسم الكامل' : 'Full Name'}</Label>
              <Input
                id="create-name"
                placeholder={isAr ? 'مثل: الشيخ محمد أحمد' : 'e.g. Sh. Mohammad Ahmed'}
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="rounded-xl border-zinc-200 dark:border-zinc-800 bg-white/50 dark:bg-zinc-900/50"
              />
            </div>

            {/* Email */}
            <div className="space-y-1.5">
              <Label htmlFor="create-email" className="text-xs font-bold text-muted-foreground">{isAr ? 'البريد الإلكتروني' : 'Email Address'}</Label>
              <Input
                id="create-email"
                type="email"
                placeholder="supervisor@example.com"
                value={formData.email}
                onChange={(e) => handleCreateEmailChange(e.target.value)}
                className={`rounded-xl border-zinc-200 dark:border-zinc-800 bg-white/50 dark:bg-zinc-900/50 ${
                  createEmailError ? 'border-destructive focus:ring-destructive' : ''
                }`}
                dir="ltr"
              />
              {createEmailError && (
                <p className="text-[11px] text-destructive font-semibold flex items-center gap-1.5 animate-pulse">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  {createEmailError}
                </p>
              )}
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <Label htmlFor="create-password" className="text-xs font-bold text-muted-foreground">{isAr ? 'كلمة المرور' : 'Password'}</Label>
              <Input
                id="create-password"
                type="password"
                placeholder="••••••••"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="rounded-xl border-zinc-200 dark:border-zinc-800 bg-white/50 dark:bg-zinc-900/50"
              />
            </div>

            {/* Gender */}
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-muted-foreground">{isAr ? 'الجنس' : 'Gender'}</Label>
              <select
                value={formData.gender}
                onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                className="w-full bg-white/50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="male">{isAr ? 'ذكر' : 'Male'}</option>
                <option value="female">{isAr ? 'أنثى' : 'Female'}</option>
              </select>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setIsCreateOpen(false)}
              className="rounded-xl border-zinc-200 dark:border-zinc-800"
            >
              {isAr ? 'إلغاء' : 'Cancel'}
            </Button>
            <Button
              onClick={handleCreate}
              disabled={creating || !!createEmailError || !formData.name || !formData.email || !formData.password}
              className="rounded-xl gap-2 font-bold bg-primary text-white hover:bg-primary/95"
            >
              {creating ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <CheckCircle className="w-4 h-4" />
              )}
              {isAr ? 'إنشاء الحساب' : 'Create Account'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 2. Edit Dialog Modal */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="sm:max-w-md rounded-3xl border-white/20 dark:border-zinc-800/40 backdrop-blur-lg bg-white/90 dark:bg-zinc-950/90 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl font-black">
              <div className="p-2 rounded-xl bg-blue-500/10 text-blue-500">
                <Edit2 className="w-5 h-5" />
              </div>
              {isAr ? 'تعديل بيانات المشرف' : 'Edit Supervisor Details'}
            </DialogTitle>
            <DialogDescription className="text-xs">
              {isAr ? 'يمكنك تحديث اسم أو بريد أو صلاحيات المشرف هنا.' : 'Modify name, email, or credentials of the supervisor.'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Type Selector */}
            <div className="space-y-2">
              <Label className="text-xs font-bold text-muted-foreground">{isAr ? 'نوع ومهمة المشرف' : 'Supervisor Assignment'}</Label>
              <div className="grid grid-cols-2 gap-3">
                {([
                  { key: 'fiqh', ar: 'مشرف فقه', en: 'Fiqh Q&A', desc: isAr ? 'الإجابة على أسئلة الفقه' : 'Responds to Q&As' },
                  { key: 'content', ar: 'مشرف محتوى', en: 'Content', desc: isAr ? 'مراجعة وتقييم الدروس' : 'Reviews academy contents' },
                ] as const).map(({ key, ar, en, desc }) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setEditData({ ...editData, type: key })}
                    className={`text-right p-3 rounded-xl border-2 transition-all flex flex-col justify-between h-20 ${
                      editData.type === key
                        ? 'border-blue-500 bg-blue-500/5 text-blue-500'
                        : 'border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 bg-transparent'
                    }`}
                  >
                    <p className="font-extrabold text-sm text-foreground">{isAr ? ar : en}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5 leading-relaxed truncate w-full">{desc}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Name */}
            <div className="space-y-1.5">
              <Label htmlFor="edit-name" className="text-xs font-bold text-muted-foreground">{isAr ? 'الاسم الكامل' : 'Full Name'}</Label>
              <Input
                id="edit-name"
                placeholder={isAr ? 'أدخل الاسم' : 'Enter name'}
                value={editData.name}
                onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                className="rounded-xl border-zinc-200 dark:border-zinc-800 bg-white/50 dark:bg-zinc-900/50"
              />
            </div>

            {/* Email */}
            <div className="space-y-1.5">
              <Label htmlFor="edit-email" className="text-xs font-bold text-muted-foreground">{isAr ? 'البريد الإلكتروني' : 'Email Address'}</Label>
              <Input
                id="edit-email"
                type="email"
                placeholder="supervisor@example.com"
                value={editData.email}
                onChange={(e) => handleEditEmailChange(e.target.value)}
                className={`rounded-xl border-zinc-200 dark:border-zinc-800 bg-white/50 dark:bg-zinc-900/50 ${
                  editEmailError ? 'border-destructive focus:ring-destructive' : ''
                }`}
                dir="ltr"
              />
              {editEmailError && (
                <p className="text-[11px] text-destructive font-semibold flex items-center gap-1.5 animate-pulse">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  {editEmailError}
                </p>
              )}
            </div>

            {/* Password (Optional) */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="edit-password" className="text-xs font-bold text-muted-foreground">{isAr ? 'كلمة مرور جديدة (اختياري)' : 'New Password (Optional)'}</Label>
                <Badge variant="secondary" className="text-[9px] scale-95 font-semibold text-muted-foreground gap-1">
                  <Key className="w-2.5 h-2.5" />
                  {isAr ? 'اتركه فارغاً للاحتفاظ بالحالية' : 'Leave blank to keep current'}
                </Badge>
              </div>
              <Input
                id="edit-password"
                type="password"
                placeholder={isAr ? 'أدخل كلمة مرور جديدة' : 'Enter new password'}
                value={editData.password}
                onChange={(e) => setEditData({ ...editData, password: e.target.value })}
                className="rounded-xl border-zinc-200 dark:border-zinc-800 bg-white/50 dark:bg-zinc-900/50"
              />
            </div>

            {/* Gender */}
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-muted-foreground">{isAr ? 'الجنس' : 'Gender'}</Label>
              <select
                value={editData.gender}
                onChange={(e) => setEditData({ ...editData, gender: e.target.value })}
                className="w-full bg-white/50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="male">{isAr ? 'ذكر' : 'Male'}</option>
                <option value="female">{isAr ? 'أنثى' : 'Female'}</option>
              </select>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setIsEditOpen(false)}
              className="rounded-xl border-zinc-200 dark:border-zinc-800"
            >
              {isAr ? 'إلغاء' : 'Cancel'}
            </Button>
            <Button
              onClick={handleEdit}
              disabled={editing || !!editEmailError || !editData.name || !editData.email}
              className="rounded-xl gap-2 font-bold bg-blue-600 text-white hover:bg-blue-600/95"
            >
              {editing ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <CheckCircle className="w-4 h-4" />
              )}
              {isAr ? 'حفظ التغييرات' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 3. Hard Delete Confirmation Dialog */}
      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent className="sm:max-w-md rounded-3xl border-destructive/20 dark:border-destructive/30 backdrop-blur-lg bg-white/95 dark:bg-zinc-950/95 shadow-2xl">
          <DialogHeader className="items-center text-center">
            <div className="w-14 h-14 rounded-full bg-destructive/10 text-destructive flex items-center justify-center mb-3 animate-bounce">
              <AlertTriangle className="w-8 h-8" />
            </div>
            <DialogTitle className="text-xl font-black text-destructive">
              {isAr ? 'تأكيد الحذف النهائي للمشرف' : 'Confirm Permanent Deletion'}
            </DialogTitle>
            <DialogDescription className="text-sm max-w-sm mt-1">
              {isAr 
                ? `هل أنت متأكد تماماً من حذف حساب المشرف "${targetDelete?.name}" نهائياً من قاعدة البيانات؟` 
                : `Are you absolutely sure you want to permanently delete supervisor "${targetDelete?.name}" from the system database?`}
            </DialogDescription>
          </DialogHeader>

          <div className="bg-destructive/5 dark:bg-destructive/10 p-4 rounded-2xl border border-destructive/10 text-xs text-destructive font-semibold space-y-1.5">
            <p className="flex items-center gap-1.5">
              <span>⚠️</span>
              <span>{isAr ? 'هذا الإجراء نهائي ولا يمكن التراجع عنه.' : 'This action is final and cannot be reverted.'}</span>
            </p>
            <p className="flex items-center gap-1.5">
              <span>⚠️</span>
              <span>{isAr ? 'سيتم مسح سجل المشرف من الجداول المرتبطة بالكامل.' : 'The supervisor record will be cleared from related tables.'}</span>
            </p>
          </div>

          <DialogFooter className="gap-2 sm:gap-0 mt-2">
            <Button
              variant="outline"
              onClick={() => {
                setIsDeleteOpen(false)
                setTargetDelete(null)
              }}
              className="rounded-xl border-zinc-200 dark:border-zinc-800"
            >
              {isAr ? 'إلغاء' : 'Cancel'}
            </Button>
            <Button
              onClick={handleHardDelete}
              disabled={deleting}
              className="rounded-xl gap-2 font-bold bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Trash2 className="w-4 h-4" />
              )}
              {isAr ? 'احذف الحساب نهائياً' : 'Delete Permanently'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  )
}
