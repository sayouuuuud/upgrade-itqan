"use client"

import { useState, useEffect } from 'react'
import { Users, Search, BookOpen, GraduationCap } from 'lucide-react'

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
  const [students, setStudents] = useState<Student[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')

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

  const filtered = students.filter(s =>
    s.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.email?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Users className="w-7 h-7 text-blue-600" />
            طلاب الأكاديمية
          </h1>
          <p className="text-muted-foreground mt-1">إجمالي: {students.length} طالب</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid sm:grid-cols-3 gap-4">
        <div className="bg-card border border-border rounded-xl p-4">
          <p className="text-sm text-muted-foreground">إجمالي الطلاب</p>
          <p className="text-3xl font-bold text-blue-600 mt-1">{students.length}</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-4">
          <p className="text-sm text-muted-foreground">في دورات نشطة</p>
          <p className="text-3xl font-bold text-green-600 mt-1">
            {students.filter(s => s.active_courses > 0).length}
          </p>
        </div>
        <div className="bg-card border border-border rounded-xl p-4">
          <p className="text-sm text-muted-foreground">إجمالي الالتحاقات</p>
          <p className="text-3xl font-bold text-purple-600 mt-1">
            {students.reduce((sum, s) => sum + (s.courses_count || 0), 0)}
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
        <input
          type="text"
          placeholder="ابحث بالاسم أو الإيميل..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          className="w-full pr-10 pl-4 py-2.5 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Table */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        {filtered.length === 0 ? (
          <div className="p-12 text-center">
            <GraduationCap className="w-14 h-14 mx-auto mb-4 text-muted-foreground opacity-40" />
            <p className="text-muted-foreground">
              {searchQuery ? 'لا توجد نتائج بحث' : 'لا يوجد طلاب بعد'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted/50 border-b border-border">
                <tr>
                  <th className="text-right p-4 text-sm font-bold text-muted-foreground">الطالب</th>
                  <th className="text-right p-4 text-sm font-bold text-muted-foreground">الجنس</th>
                  <th className="text-right p-4 text-sm font-bold text-muted-foreground">الدورات (نشطة / إجمالي)</th>
                  <th className="text-right p-4 text-sm font-bold text-muted-foreground">تاريخ الانضمام</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map(student => (
                  <tr key={student.id} className="hover:bg-muted/30 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 flex items-center justify-center font-bold text-sm shrink-0">
                          {student.name?.charAt(0) || '؟'}
                        </div>
                        <div>
                          <p className="font-bold">{student.name}</p>
                          <p className="text-xs text-muted-foreground">{student.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 text-sm">
                      <span className="px-2 py-1 bg-muted rounded-full text-xs font-medium">
                        {student.gender === 'male' ? 'ذكر' : student.gender === 'female' ? 'أنثى' : '—'}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-1.5 text-sm">
                        <BookOpen className="w-4 h-4 text-muted-foreground" />
                        <span className="font-bold text-green-600">{student.active_courses}</span>
                        <span className="text-muted-foreground">/ {student.courses_count}</span>
                      </div>
                    </td>
                    <td className="p-4 text-sm text-muted-foreground">
                      {new Date(student.created_at).toLocaleDateString('ar-EG')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
