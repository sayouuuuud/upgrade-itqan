'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { 
  Users, ArrowRight, Plus, Trash2, X, Loader2, 
  CheckCircle2, XCircle, UserPlus, Search, Video,
  Calendar, Clock
} from 'lucide-react'

interface Halaqa {
  id: string
  name: string
  description: string
  teacher_id: string
  gender: string
  max_students: number
  meeting_link: string
  is_active: boolean
  created_at: string
}

interface Student {
  enrollment_id: string
  student_id: string
  student_name: string
  student_email: string
  avatar_url: string | null
  joined_at: string
  is_active: boolean
  attendance_count: number
  total_sessions: number
}

interface AvailableStudent {
  id: string
  name: string
  email: string
  gender: string
}

interface AttendanceRecord {
  id: string
  student_id: string
  student_name: string
  session_date: string
  status: 'present' | 'absent' | 'excused'
}

const genderLabels: Record<string, string> = { 
  male: 'ذكور', 
  female: 'إناث', 
  both: 'مختلط' 
}

export default function HalaqaDetailPage() {
  const params = useParams()
  const router = useRouter()
  const halaqaId = params.id as string

  const [halaqa, setHalaqa] = useState<Halaqa | null>(null)
  const [students, setStudents] = useState<Student[]>([])
  const [availableStudents, setAvailableStudents] = useState<AvailableStudent[]>([])
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [addingStudent, setAddingStudent] = useState<string | null>(null)
  const [removingStudent, setRemovingStudent] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'students' | 'attendance'>('students')

  const fetchHalaqa = useCallback(async () => {
    try {
      const res = await fetch(`/api/academy/admin/halaqat`)
      if (res.ok) {
        const data = await res.json()
        const list = Array.isArray(data) ? data : data.data || []
        const found = list.find((h: Halaqa) => h.id === halaqaId)
        setHalaqa(found || null)
      }
    } catch (error) {
      console.error('Failed to fetch halaqa:', error)
    }
  }, [halaqaId])

  const fetchStudents = useCallback(async () => {
    try {
      const res = await fetch(`/api/academy/admin/halaqat/${halaqaId}/students`)
      if (res.ok) {
        const data = await res.json()
        setStudents(data.students || [])
      }
    } catch (error) {
      console.error('Failed to fetch students:', error)
    }
  }, [halaqaId])

  const fetchAvailableStudents = useCallback(async () => {
    try {
      const res = await fetch('/api/academy/admin/students')
      if (res.ok) {
        const data = await res.json()
        setAvailableStudents(Array.isArray(data) ? data : data.data || [])
      }
    } catch (error) {
      console.error('Failed to fetch available students:', error)
    }
  }, [])

  const fetchAttendance = useCallback(async () => {
    try {
      const res = await fetch(`/api/academy/admin/halaqat/${halaqaId}/attendance`)
      if (res.ok) {
        const data = await res.json()
        setAttendance(data.attendance || [])
      }
    } catch (error) {
      console.error('Failed to fetch attendance:', error)
    }
  }, [halaqaId])

  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      await Promise.all([fetchHalaqa(), fetchStudents(), fetchAttendance()])
      setLoading(false)
    }
    loadData()
  }, [fetchHalaqa, fetchStudents, fetchAttendance])

  const handleAddStudent = async (studentId: string) => {
    setAddingStudent(studentId)
    try {
      const res = await fetch(`/api/academy/admin/halaqat/${halaqaId}/students`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ student_id: studentId })
      })
      if (res.ok) {
        await fetchStudents()
        setShowAddModal(false)
      } else {
        const data = await res.json()
        alert(data.error || 'فشل في إضافة الطالب')
      }
    } catch (error) {
      console.error('Error adding student:', error)
      alert('حدث خطأ')
    } finally {
      setAddingStudent(null)
    }
  }

  const handleRemoveStudent = async (studentId: string) => {
    if (!confirm('هل أنت متأكد من إزالة هذا الطالب من الحلقة؟')) return
    setRemovingStudent(studentId)
    try {
      const res = await fetch(`/api/academy/admin/halaqat/${halaqaId}/students`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ student_id: studentId })
      })
      if (res.ok) {
        await fetchStudents()
      } else {
        alert('فشل في إزالة الطالب')
      }
    } catch (error) {
      console.error('Error removing student:', error)
    } finally {
      setRemovingStudent(null)
    }
  }

  const openAddModal = async () => {
    await fetchAvailableStudents()
    setShowAddModal(true)
    setSearchTerm('')
  }

  // Filter available students based on search and not already in halaqa
  const enrolledIds = new Set(students.map(s => s.student_id))
  const filteredAvailable = availableStudents.filter(s => {
    if (enrolledIds.has(s.id)) return false
    // Filter by halaqa gender if needed
    if (halaqa?.gender === 'male' && s.gender === 'female') return false
    if (halaqa?.gender === 'female' && s.gender === 'male') return false
    // Search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      return s.name.toLowerCase().includes(term) || s.email.toLowerCase().includes(term)
    }
    return true
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
      </div>
    )
  }

  if (!halaqa) {
    return (
      <div className="text-center py-16">
        <p className="text-muted-foreground">لم يتم العثور على الحلقة</p>
        <button 
          onClick={() => router.push('/academy/admin/halaqat')}
          className="mt-4 text-indigo-600 hover:underline"
        >
          العودة للحلقات
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push('/academy/admin/halaqat')}
            className="p-2 hover:bg-muted rounded-lg transition-colors"
          >
            <ArrowRight className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Users className="w-7 h-7 text-indigo-600" />
              {halaqa.name}
            </h1>
            <div className="flex flex-wrap items-center gap-2 mt-1 text-sm text-muted-foreground">
              <span className={`px-2 py-0.5 rounded-full font-medium ${halaqa.is_active !== false ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                {halaqa.is_active !== false ? 'نشطة' : 'متوقفة'}
              </span>
              <span className="bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 px-2 py-0.5 rounded-full font-medium">
                {genderLabels[halaqa.gender] || halaqa.gender}
              </span>
              <span className="flex items-center gap-1">
                <Users className="w-3.5 h-3.5" />
                {students.length} / {halaqa.max_students}
              </span>
            </div>
          </div>
        </div>
        
        {halaqa.meeting_link && (
          <a 
            href={halaqa.meeting_link} 
            target="_blank" 
            rel="noreferrer"
            className="flex items-center gap-2 px-4 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-xl font-bold transition-colors"
          >
            <Video className="w-5 h-5" />
            انضمام للاجتماع
          </a>
        )}
      </div>

      {/* Description */}
      {halaqa.description && (
        <div className="bg-card border border-border rounded-xl p-4">
          <p className="text-muted-foreground">{halaqa.description}</p>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 border-b border-border">
        <button
          onClick={() => setActiveTab('students')}
          className={`px-4 py-2.5 font-medium border-b-2 transition-colors ${
            activeTab === 'students' 
              ? 'border-indigo-600 text-indigo-600' 
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <Users className="w-4 h-4 inline ml-1" />
          الطلاب ({students.length})
        </button>
        <button
          onClick={() => setActiveTab('attendance')}
          className={`px-4 py-2.5 font-medium border-b-2 transition-colors ${
            activeTab === 'attendance' 
              ? 'border-indigo-600 text-indigo-600' 
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <Calendar className="w-4 h-4 inline ml-1" />
          الحضور
        </button>
      </div>

      {/* Students Tab */}
      {activeTab === 'students' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <p className="text-sm text-muted-foreground">
              {students.length} طالب مسجل من أصل {halaqa.max_students}
            </p>
            <button
              onClick={openAddModal}
              disabled={students.length >= halaqa.max_students}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors"
            >
              <UserPlus className="w-4 h-4" />
              إضافة طالب
            </button>
          </div>

          {students.length === 0 ? (
            <div className="bg-card border border-border rounded-xl p-12 text-center">
              <Users className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-30" />
              <p className="text-muted-foreground mb-4">لا يوجد طلاب مسجلين في هذه الحلقة</p>
              <button
                onClick={openAddModal}
                className="px-6 py-2.5 bg-indigo-600 text-white rounded-lg font-bold hover:bg-indigo-700 transition-colors"
              >
                <Plus className="w-4 h-4 inline ml-1" />
                أضف أول طالب
              </button>
            </div>
          ) : (
            <div className="bg-card border border-border rounded-xl overflow-hidden">
              <table className="w-full">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="text-right px-4 py-3 text-sm font-bold">الطالب</th>
                    <th className="text-right px-4 py-3 text-sm font-bold hidden sm:table-cell">تاريخ الانضمام</th>
                    <th className="text-right px-4 py-3 text-sm font-bold">الحضور</th>
                    <th className="text-center px-4 py-3 text-sm font-bold">إجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {students.map((student) => (
                    <tr key={student.enrollment_id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 font-bold">
                            {student.student_name?.charAt(0) || '?'}
                          </div>
                          <div>
                            <p className="font-medium">{student.student_name}</p>
                            <p className="text-xs text-muted-foreground">{student.student_email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-muted-foreground hidden sm:table-cell">
                        {new Date(student.joined_at).toLocaleDateString('ar-SA')}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-green-500 rounded-full"
                              style={{ 
                                width: student.total_sessions > 0 
                                  ? `${(student.attendance_count / student.total_sessions) * 100}%` 
                                  : '0%' 
                              }}
                            />
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {student.attendance_count}/{student.total_sessions}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => handleRemoveStudent(student.student_id)}
                          disabled={removingStudent === student.student_id}
                          className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors disabled:opacity-50"
                          title="إزالة من الحلقة"
                        >
                          {removingStudent === student.student_id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Trash2 className="w-4 h-4" />
                          )}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Attendance Tab */}
      {activeTab === 'attendance' && (
        <div className="space-y-4">
          {attendance.length === 0 ? (
            <div className="bg-card border border-border rounded-xl p-12 text-center">
              <Calendar className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-30" />
              <p className="text-muted-foreground">لا توجد سجلات حضور بعد</p>
            </div>
          ) : (
            <div className="bg-card border border-border rounded-xl overflow-hidden">
              <table className="w-full">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="text-right px-4 py-3 text-sm font-bold">الطالب</th>
                    <th className="text-right px-4 py-3 text-sm font-bold">التاريخ</th>
                    <th className="text-center px-4 py-3 text-sm font-bold">الحالة</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {attendance.map((record) => (
                    <tr key={record.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3 font-medium">{record.student_name}</td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5" />
                          {new Date(record.session_date).toLocaleDateString('ar-SA')}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${
                          record.status === 'present' 
                            ? 'bg-green-100 text-green-700' 
                            : record.status === 'excused'
                            ? 'bg-yellow-100 text-yellow-700'
                            : 'bg-red-100 text-red-700'
                        }`}>
                          {record.status === 'present' ? (
                            <><CheckCircle2 className="w-3 h-3" /> حاضر</>
                          ) : record.status === 'excused' ? (
                            <><Clock className="w-3 h-3" /> معذور</>
                          ) : (
                            <><XCircle className="w-3 h-3" /> غائب</>
                          )}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Add Student Modal */}
      {showAddModal && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          onClick={(e) => e.target === e.currentTarget && setShowAddModal(false)}
        >
          <div className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-lg max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between p-6 border-b border-border">
              <h3 className="text-lg font-bold">إضافة طالب للحلقة</h3>
              <button 
                onClick={() => setShowAddModal(false)}
                className="p-2 hover:bg-muted rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-4 border-b border-border">
              <div className="relative">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="ابحث بالاسم أو البريد..."
                  className="w-full pr-10 pl-4 py-2.5 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {filteredAvailable.length === 0 ? (
                <p className="text-center py-8 text-muted-foreground">
                  {searchTerm ? 'لا توجد نتائج للبحث' : 'لا يوجد طلاب متاحين للإضافة'}
                </p>
              ) : (
                filteredAvailable.map((student) => (
                  <div 
                    key={student.id}
                    className="flex items-center justify-between p-3 bg-muted/30 hover:bg-muted/50 rounded-lg transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 font-bold">
                        {student.name?.charAt(0) || '?'}
                      </div>
                      <div>
                        <p className="font-medium">{student.name}</p>
                        <p className="text-xs text-muted-foreground">{student.email}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleAddStudent(student.id)}
                      disabled={addingStudent === student.id}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm rounded-lg font-medium transition-colors disabled:opacity-50"
                    >
                      {addingStudent === student.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Plus className="w-4 h-4" />
                      )}
                      إضافة
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
