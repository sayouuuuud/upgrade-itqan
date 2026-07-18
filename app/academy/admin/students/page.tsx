"use client"

import { useState, useEffect } from 'react'
import { Users, Search, BookOpen, GraduationCap, TrendingUp, Filter, MoreVertical, Mail, Calendar, User, Activity, Edit, Loader2 } from 'lucide-react'
import { useI18n } from '@/lib/i18n/context'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface Student {
  id: string
  name: string
  email: string
  gender: string
  created_at: string
  courses_count: number
  active_courses: number
}

export default function AcademyAdminStudentsPage() {
  const { t, locale } = useI18n()
  const language = locale
  const a = t.academyAdmin || t.admin
  const [students, setStudents] = useState<Student[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterGender, setFilterGender] = useState<'all' | 'male' | 'female'>('all')

  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null)
  const [editForm, setEditForm] = useState({ name: '', password: '' })
  const [submitting, setSubmitting] = useState(false)

  const openEditModal = (student: Student) => {
    setSelectedStudent(student)
    setEditForm({ name: student.name || '', password: '' })
    setIsEditModalOpen(true)
  }

  const handleEditSubmit = async () => {
    if (!selectedStudent) return
    setSubmitting(true)
    try {
      const body: any = { userId: selectedStudent.id }
      if (editForm.name && editForm.name !== selectedStudent.name) body.name = editForm.name
      if (editForm.password) body.password = editForm.password

      if (!body.name && !body.password) {
        setIsEditModalOpen(false)
        return
      }

      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      })

      if (res.ok) {
        setIsEditModalOpen(false)
        setStudents(prev => prev.map(s => s.id === selectedStudent.id ? { ...s, name: editForm.name || s.name } : s))
      } else {
        const err = await res.json()
        alert(err.error || "Failed to update student")
      }
    } catch (err) {
      alert("Connection error")
    } finally {
      setSubmitting(false)
    }
  }

  useEffect(() => {
    async function fetchStudents() {
      try {
        const res = await fetch('/api/academy/admin/students')
        if (res.ok) {
          const json = await res.json()
          setStudents(json.data || [])
        }
      } catch (error) {
        console.error('Failed to fetch students:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchStudents()
  }, [])

  const filtered = students.filter(s => {
    const matchesSearch = s.name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          s.email?.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesGender = filterGender === 'all' || s.gender === filterGender
    return matchesSearch && matchesGender
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
      </div>
    )
  }

  const totalStudents = students.length
  const activeStudents = students.filter(s => s.active_courses > 0).length
  const totalEnrollments = students.reduce((sum, s) => sum + (s.courses_count || 0), 0)

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-8">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <div className="p-2.5 bg-primary/10 rounded-xl text-primary">
              <Users className="w-6 h-6" />
            </div>
            {a.academyStudents || t.admin.students}
          </h1>
          <p className="text-muted-foreground text-sm flex items-center gap-2">
            <Activity className="w-4 h-4" />
            {a.total || 'Total'} {totalStudents} {language === 'ar' ? 'مسجلين في الأكاديمية' : 'registered in the academy'}
          </p>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-card border border-border/50 rounded-2xl p-6 shadow-sm relative overflow-hidden group hover:shadow-md transition-shadow">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
            <Users className="w-24 h-24" />
          </div>
          <div className="relative z-10 flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-lg">
                <Users className="w-5 h-5" />
              </div>
              <p className="text-sm font-medium text-muted-foreground">{a.totalStudents || 'Total Students'}</p>
            </div>
            <div>
              <p className="text-4xl font-bold tracking-tight">{totalStudents}</p>
              <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                <TrendingUp className="w-3 h-3 text-green-500" />
                <span className="text-green-500 font-medium">100%</span> {language === 'ar' ? 'من الإجمالي' : 'of total'}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-card border border-border/50 rounded-2xl p-6 shadow-sm relative overflow-hidden group hover:shadow-md transition-shadow">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
            <Activity className="w-24 h-24" />
          </div>
          <div className="relative z-10 flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-green-500/10 text-green-600 dark:text-green-400 rounded-lg">
                <BookOpen className="w-5 h-5" />
              </div>
              <p className="text-sm font-medium text-muted-foreground">{a.inActiveCourses || 'Active Courses'}</p>
            </div>
            <div>
              <p className="text-4xl font-bold tracking-tight">{activeStudents}</p>
              <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                <span className="text-muted-foreground font-medium">{totalStudents > 0 ? Math.round((activeStudents / totalStudents) * 100) : 0}%</span> {language === 'ar' ? 'نشطين حالياً' : 'currently active'}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-card border border-border/50 rounded-2xl p-6 shadow-sm relative overflow-hidden group hover:shadow-md transition-shadow">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
            <GraduationCap className="w-24 h-24" />
          </div>
          <div className="relative z-10 flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-purple-500/10 text-purple-600 dark:text-purple-400 rounded-lg">
                <GraduationCap className="w-5 h-5" />
              </div>
              <p className="text-sm font-medium text-muted-foreground">{a.totalEnrollments || 'Total Enrollments'}</p>
            </div>
            <div>
              <p className="text-4xl font-bold tracking-tight">{totalEnrollments}</p>
              <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                <span className="text-muted-foreground font-medium">{totalStudents > 0 ? (totalEnrollments / totalStudents).toFixed(1) : 0}</span> {language === 'ar' ? 'دورة لكل طالب' : 'courses per student'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="bg-card border border-border/50 rounded-2xl shadow-sm flex flex-col overflow-hidden">
        {/* Toolbar */}
        <div className="p-5 border-b border-border/50 flex flex-col sm:flex-row sm:items-center gap-4 justify-between bg-muted/20">
          <div className="relative w-full sm:max-w-md">
            <Search className={`absolute ${language === 'ar' ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground`} />
            <input
              type="text"
              placeholder={a.searchPlaceholder || 'Search students...'}
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className={`w-full ${language === 'ar' ? 'pr-10 pl-4' : 'pl-10 pr-4'} py-2.5 text-sm rounded-xl border border-border/50 bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all shadow-sm`}
            />
          </div>
          <div className="flex items-center gap-2">
            <div className="bg-background border border-border/50 rounded-xl p-1 flex items-center shadow-sm">
              <button 
                onClick={() => setFilterGender('all')}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${filterGender === 'all' ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
              >
                {language === 'ar' ? 'الكل' : 'All'}
              </button>
              <button 
                onClick={() => setFilterGender('male')}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${filterGender === 'male' ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
              >
                {a.male || 'Male'}
              </button>
              <button 
                onClick={() => setFilterGender('female')}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${filterGender === 'female' ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
              >
                {a.female || 'Female'}
              </button>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-16 text-center">
              <div className="w-20 h-20 bg-muted/50 rounded-full flex items-center justify-center mb-6">
                <Search className="w-10 h-10 text-muted-foreground/50" />
              </div>
              <h3 className="text-lg font-semibold mb-2">
                {searchQuery ? (a.noSearchResults || 'No results found') : (a.noStudentsYet || 'No students yet')}
              </h3>
              <p className="text-sm text-muted-foreground max-w-sm">
                {searchQuery ? (language === 'ar' ? 'حاول استخدام كلمات بحث مختلفة أو تغيير الفلاتر.' : 'Try using different search terms or changing filters.') : (language === 'ar' ? 'لم يتم تسجيل أي طلاب في الأكاديمية حتى الآن.' : 'No students have registered in the academy yet.')}
              </p>
            </div>
          ) : (
            <table className="w-full text-sm text-left whitespace-nowrap">
              <thead className="text-xs text-muted-foreground uppercase bg-muted/30">
                <tr>
                  <th className={`px-6 py-4 font-semibold ${language === 'ar' ? 'text-right' : 'text-left'}`}>{a.student || 'Student'}</th>
                  <th className={`px-6 py-4 font-semibold ${language === 'ar' ? 'text-right' : 'text-left'}`}>{a.gender || 'Gender'}</th>
                  <th className={`px-6 py-4 font-semibold ${language === 'ar' ? 'text-right' : 'text-left'}`}>{a.coursesActiveTotal || 'Courses'}</th>
                  <th className={`px-6 py-4 font-semibold ${language === 'ar' ? 'text-right' : 'text-left'}`}>{a.joinDate || 'Join Date'}</th>
                  <th className="px-6 py-4 font-semibold text-center">{language === 'ar' ? 'إجراءات' : 'Actions'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {filtered.map(student => (
                  <tr key={student.id} className="hover:bg-muted/30 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 text-primary flex items-center justify-center font-bold text-sm shrink-0 border border-primary/10 shadow-sm">
                          {student.name?.charAt(0) || '?'}
                        </div>
                        <div className="flex flex-col">
                          <span className="font-semibold text-foreground group-hover:text-primary transition-colors">{student.name}</span>
                          <span className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                            <Mail className="w-3 h-3" />
                            {student.email}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium border ${
                        student.gender === 'male' 
                          ? 'bg-blue-500/10 text-blue-600 border-blue-500/20 dark:text-blue-400' 
                          : student.gender === 'female' 
                            ? 'bg-pink-500/10 text-pink-600 border-pink-500/20 dark:text-pink-400' 
                            : 'bg-muted text-muted-foreground border-border'
                      }`}>
                        <User className="w-3 h-3" />
                        {student.gender === 'male' ? (a.male || 'Male') : student.gender === 'female' ? (a.female || 'Female') : '—'}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1.5 bg-green-500/10 text-green-600 dark:text-green-400 px-2 py-1 rounded-md text-xs font-medium border border-green-500/20">
                          <Activity className="w-3 h-3" />
                          <span>{student.active_courses} {language === 'ar' ? 'نشط' : 'Active'}</span>
                        </div>
                        <span className="text-muted-foreground/40">•</span>
                        <div className="flex items-center gap-1.5 text-muted-foreground text-xs font-medium">
                          <BookOpen className="w-3 h-3" />
                          <span>{student.courses_count} {language === 'ar' ? 'إجمالي' : 'Total'}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5 text-muted-foreground text-sm">
                        <Calendar className="w-4 h-4" />
                        {new Date(student.created_at).toLocaleDateString(language === 'ar' ? 'ar-EG' : 'en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        })}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button className="p-2 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-lg transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100">
                            <MoreVertical className="w-4 h-4" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                          <DropdownMenuItem onClick={() => openEditModal(student)} className="cursor-pointer gap-2">
                            <Edit className="w-4 h-4" />
                            {language === 'ar' ? 'تعديل البيانات' : 'Edit Info'}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        
        {/* Pagination/Footer Info */}
        {filtered.length > 0 && (
          <div className="p-4 border-t border-border/50 text-xs text-muted-foreground flex justify-between items-center bg-muted/10">
            <span>
              {language === 'ar' ? 'يعرض' : 'Showing'} <span className="font-semibold text-foreground">{filtered.length}</span> {language === 'ar' ? 'من' : 'of'} <span className="font-semibold text-foreground">{students.length}</span> {language === 'ar' ? 'طالب' : 'students'}
            </span>
          </div>
        )}
      </div>

      {/* Edit Student Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="rounded-3xl border-none shadow-2xl bg-card max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-black text-foreground">{language === 'ar' ? 'تعديل بيانات الطالب' : 'Edit Student Info'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground">{t.auth.fullName}</Label>
              <Input
                className="rounded-2xl h-11 bg-muted/30 border-border focus:bg-card font-bold"
                value={editForm.name}
                onChange={e => setEditForm({ ...editForm, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground">{t.admin.passwordLeaveBlank}</Label>
              <Input
                className="rounded-2xl h-11 bg-muted/30 border-border focus:bg-card font-bold"
                type="password"
                value={editForm.password}
                onChange={e => setEditForm({ ...editForm, password: e.target.value })}
                dir="ltr"
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setIsEditModalOpen(false)} className="rounded-2xl font-black">{t.cancel}</Button>
            <Button onClick={handleEditSubmit} disabled={submitting} className="rounded-2xl font-black bg-primary text-primary-foreground hover:bg-primary/90">
              {submitting && <Loader2 className="w-4 h-4 ml-2 animate-spin" />}
              {t.profile.saveChanges}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
