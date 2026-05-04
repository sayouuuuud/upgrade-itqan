"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { useRouter } from "next/navigation"
import { useI18n } from "@/lib/i18n/context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Search, Users, BookOpen, UserCheck,
  UserX, Edit, Trash2, UserPlus, Filter, TrendingUp, Loader2,
  Mail, Shield, User as UserIcon, ChevronLeft, ChevronRight
} from "lucide-react"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
  DialogFooter
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"

export default function AdminUsersPage() {
  const { t, locale } = useI18n()
  const router = useRouter()
  const isAr = locale === "ar"

  const [searchQuery, setSearchQuery] = useState("")
  const [activeTab, setActiveTab] = useState<"students" | "readers" | "admins" | "supervisors">("students")
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [pagination, setPagination] = useState<any>(null)
  const [currentPage, setCurrentPage] = useState(1)

  // Modals state
  const [isAddUserOpen, setIsAddUserOpen] = useState(false)
  const [isEditUserOpen, setIsEditUserOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<any>(null)

  // Form state
  const [formData, setFormData] = useState({ 
    name: "", 
    email: "", 
    password: "", 
    role: "student", 
    gender: "",
    has_academy_access: true,
    has_quran_access: true
  })
  const [submitting, setSubmitting] = useState(false)
  const [currentUserRole, setCurrentUserRole] = useState<string>("")

  // Fetch current user to check role
  useEffect(() => {
    async function fetchMe() {
      try {
        const res = await fetch('/api/auth/me')
        if (res.ok) {
          const data = await res.json()
          setCurrentUserRole(data.user.role)
        }
      } catch (err) {
        console.error("Failed to fetch current user", err)
      }
    }
    fetchMe()
  }, [])

  // Fetch users based on activeTab
  useEffect(() => {
    setCurrentPage(1) // Reset to first page when changing tabs
    fetchUsers(1)
  }, [activeTab])

  useEffect(() => {
    fetchUsers(currentPage, searchQuery)
  }, [currentPage])

  const fetchUsers = async (page: number = 1, search: string = "") => {
    setLoading(true)
    try {
      const role = activeTab === "students" ? "student" : activeTab === "readers" ? "reader" : activeTab === "supervisors" ? "supervisors" : "admin"
      const searchParam = search ? `&search=${encodeURIComponent(search)}` : ""
      const res = await fetch(`/api/admin/users?role=${role}&page=${page}&limit=10${searchParam}`)
      if (res.ok) {
        const data = await res.json()
        setUsers(data.users || [])
        setPagination(data.pagination)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (query: string) => {
    setSearchQuery(query)
    setCurrentPage(1) // Reset to first page when searching
    fetchUsers(1, query) // Fetch with search
  }


  const handleToggleStatus = async (userId: string, currentStatus: boolean) => {
    try {
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, isActive: !currentStatus })
      })
      if (res.ok) {
        setUsers(users.map(u => u.id === userId ? { ...u, is_active: !currentStatus } : u))
      }
    } catch {
      alert(t.admin.errorTogglingStatus)
    }
  }

  const handleCreateUser = async () => {
    if (!formData.name || !formData.email || !formData.password) return
    setSubmitting(true)
    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      })
      if (res.ok) {
        setIsAddUserOpen(false)
        fetchUsers(currentPage, searchQuery)
      } else {
        const err = await res.json()
        alert(err.error || t.admin.errorCreatingUser)
      }
    } catch {
      alert(t.auth.errorOccurred)
    } finally {
      setSubmitting(false)
      const defaultRole = currentUserRole === 'reciter_supervisor' ? 'reader' : 'student'
      setFormData({ 
        name: "", 
        email: "", 
        password: "", 
        role: defaultRole, 
        gender: "",
        has_academy_access: true,
        has_quran_access: true
      })
    }
  }

  const handleEditSubmit = async () => {
    if (!selectedUser) return
    setSubmitting(true)
    try {
      const { name, email, password, role, gender, has_academy_access, has_quran_access } = formData
      const body: any = { userId: selectedUser.id }
      if (name) body.name = name
      if (email) body.email = email
      if (password) body.password = password
      if (role) body.role = role
      if (gender) body.gender = gender
      if (typeof has_academy_access === 'boolean') body.has_academy_access = has_academy_access
      if (typeof has_quran_access === 'boolean') body.has_quran_access = has_quran_access

      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      })
      if (res.ok) {
        setIsEditUserOpen(false)
        fetchUsers(currentPage, searchQuery)
      } else {
        const err = await res.json()
        alert(err.error || t.admin.errorUpdatingUser)
      }
    } catch {
      alert(t.admin.connectionError || "Error connecting to server")
    } finally {
      setSubmitting(false)
    }
  }

  const openEditModal = (user: any) => {
    setSelectedUser(user)
    setFormData({ 
      name: user.name, 
      email: user.email, 
      password: "", 
      role: user.role, 
      gender: user.gender || "",
      has_academy_access: user.has_academy_access !== false,
      has_quran_access: user.has_quran_access !== false
    })
    setIsEditUserOpen(true)
  }

  const avatarColors = [
    "bg-blue-500/10 text-blue-400 border-blue-500/20",
    "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    "bg-purple-500/10 text-purple-400 border-purple-500/20",
    "bg-orange-500/10 text-orange-400 border-orange-500/20",
    "bg-rose-500/10 text-rose-400 border-rose-500/20",
  ]

  return (
    <div className="bg-card min-h-full -m-6 lg:-m-8 p-6 lg:p-8 space-y-8" dir={isAr ? "rtl" : "ltr"}>
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-foreground mb-2 flex items-center gap-3">
            <Users className="w-8 h-8 text-primary" />
            {t.admin.usersManagementTitle}
          </h1>
          <p className="text-muted-foreground font-bold tracking-wide">
            {t.admin.usersManagementDesc}
          </p>
        </div>
        <Button
          className="w-full sm:w-auto rounded-2xl font-black bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/20 h-12 px-6 gap-2"
          onClick={() => {
            const defaultRole = currentUserRole === 'reciter_supervisor' ? 'reader' : 'student'
            setFormData({ 
              name: "", 
              email: "", 
              password: "", 
              role: defaultRole, 
              gender: "",
              has_academy_access: true,
              has_quran_access: true
            })
            setIsAddUserOpen(true)
          }}
        >
          <UserPlus className="w-5 h-5 ml-1" />
          {t.admin.addUser}
        </Button>
      </div>

      {/* Tabs and Search Row */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="flex p-1 bg-muted/50 border border-border rounded-2xl w-full lg:w-auto flex-1 overflow-x-auto overflow-y-hidden hide-scrollbar gap-1">
          {[
            { id: "students", label: t.admin.students },
            { id: "readers", label: t.admin.readers },
            { id: "admins", label: t.admin.admins },
            { id: "supervisors", label: t.admin.supervisors }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`whitespace-nowrap px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === tab.id
                ? "bg-primary text-primary-foreground shadow-lg shadow-primary/10"
                : "text-muted-foreground hover:text-foreground hover:bg-muted"
                }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <div className="relative w-full lg:max-w-sm">
          <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder={t.search}
            className="pr-12 h-12 border-border bg-card rounded-2xl focus:ring-4 focus:ring-primary/10 transition-all font-bold w-full"
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Table Card */}
      <div className="bg-card rounded-3xl shadow-sm border border-border overflow-hidden">
        <div className="overflow-x-auto min-h-[400px]">
          {loading ? (
            <div className="flex justify-center p-24">
              <Loader2 className="w-10 h-10 animate-spin text-primary" />
            </div>
          ) : (
            <table className="w-full text-right border-collapse">
              <thead>
                <tr className="bg-muted/50 text-muted-foreground text-[11px] font-black uppercase tracking-widest border-b border-border">
                  <th className="px-6 py-5 font-black whitespace-nowrap">{t.auth.fullName}</th>
                  <th className="px-6 py-5 font-black whitespace-nowrap">{t.auth.email}</th>
                  <th className="px-6 py-5 font-black whitespace-nowrap">{t.admin.joinDate}</th>
                  <th className="px-6 py-5 font-black whitespace-nowrap">{t.auth.role}</th>
                  {activeTab === 'readers' && (
                    <th className="px-6 py-5 font-black whitespace-nowrap">{t.readerRegister.nationality}</th>
                  )}
                  <th className="px-6 py-5 font-black whitespace-nowrap">{t.reader.status}</th>
                  <th className="px-6 py-5 text-center font-black whitespace-nowrap">{t.admin.action}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {users.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-20 text-center">
                      <div className="flex flex-col items-center justify-center text-muted-foreground">
                        <Users className="w-12 h-12 opacity-20 mb-4" />
                        <p className="font-bold">{isAr ? "لا توجد نتائج" : "No results found"}</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  users.map((user: any, idx: number) => (
                    <motion.tr
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.2, delay: idx * 0.05 }}
                      key={user.id}
                      onClick={() => router.push(`/academy/admin/users/${user.id}`)}
                      className="hover:bg-muted/30 transition-colors group cursor-pointer whitespace-nowrap"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-4">
                          <div className={`w-11 h-11 rounded-2xl flex items-center justify-center font-black text-sm shrink-0 border transition-all ${user.gender === 'female' ? 'bg-pink-500/10 text-pink-500 border-pink-500/20' : avatarColors[idx % avatarColors.length]}`}>
                            {user.avatar_url ? (
                              <img src={user.avatar_url} alt={user.name} className="w-full h-full rounded-2xl object-cover" />
                            ) : (
                              user.gender === 'female' ? <UserIcon className="w-5 h-5 opacity-80" /> : (user.name || "U").charAt(0)
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="font-black text-foreground text-sm group-hover:text-primary transition-colors flex items-center gap-1.5">
                              {user.name}
                              {user.gender === 'female' && <span className="w-1.5 h-1.5 rounded-full bg-pink-400 opacity-60 inline-block" title="طالبة / معلمة" />}
                            </p>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-tighter">ID: #{user.id.substring(0, 8)}</span>
                              {user.is_online && (
                                <span className="flex items-center gap-1">
                                  <span className="w-1.5 h-1.5 bg-success rounded-full animate-pulse" />
                                  <span className="text-[9px] font-black text-success uppercase tracking-widest">{t.admin.onlineNow}</span>
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-xs font-bold text-muted-foreground" dir="ltr">
                        {user.email}
                      </td>
                      <td className="px-6 py-4 text-xs font-bold text-muted-foreground">
                        {new Date(user.created_at).toLocaleDateString(isAr ? "ar-SA" : "en-US")}
                      </td>
                      <td className="px-6 py-4">
                        {user.role === 'student' ? (
                          <Badge className="bg-blue-500/10 text-blue-400 border-blue-500/20 font-black text-[10px] uppercase tracking-widest rounded-lg pointer-events-none">
                            {t.auth.student}
                          </Badge>
                        ) : user.role === 'admin' ? (
                          <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 font-black text-[10px] uppercase tracking-widest rounded-lg pointer-events-none">
                            {t.auth.admin}
                          </Badge>
                        ) : user.role === 'reader' ? (
                          <Badge className="bg-purple-500/10 text-purple-400 border-purple-500/20 font-black text-[10px] uppercase tracking-widest rounded-lg pointer-events-none">
                            {t.auth.reader}
                          </Badge>
                        ) : user.role === 'student_supervisor' ? (
                          <Badge className="bg-orange-500/10 text-orange-400 border-orange-500/20 font-black text-[10px] uppercase tracking-widest rounded-lg pointer-events-none">
                            {t.auth.studentSupervisor}
                          </Badge>
                        ) : (
                          <Badge className="bg-rose-500/10 text-rose-400 border-rose-500/20 font-black text-[10px] uppercase tracking-widest rounded-lg pointer-events-none">
                            {t.auth.reciterSupervisor}
                          </Badge>
                        )}
                        <div className="flex gap-1 mt-1">
                          {user.has_quran_access !== false && (
                            <Badge variant="outline" className="text-[8px] px-1 py-0 border-emerald-500/30 text-emerald-500 bg-emerald-500/5">
                              {isAr ? "قرآن" : "Quran"}
                            </Badge>
                          )}
                          {user.has_academy_access !== false && (
                            <Badge variant="outline" className="text-[8px] px-1 py-0 border-blue-500/30 text-blue-500 bg-blue-500/5">
                              {isAr ? "أكاديمية" : "Academy"}
                            </Badge>
                          )}
                        </div>
                      </td>
                      {activeTab === 'readers' && (
                        <td className="px-6 py-4 text-xs font-black text-muted-foreground">
                          {user.nationality || '-'}
                        </td>
                      )}
                      <td className="px-6 py-4">
                        {user.is_active ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                            {t.active}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-rose-500/10 text-rose-500 border border-rose-500/20">
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                            {t.admin.banned}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                        <div className="flex justify-center items-center gap-3">
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              openEditModal(user)
                            }}
                            className="p-2 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-xl transition-all border border-transparent hover:border-primary/20"
                            title={t.edit}
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              handleToggleStatus(user.id, user.is_active)
                            }}
                            className={`p-2 rounded-xl transition-all border border-transparent ${user.is_active
                              ? "text-muted-foreground hover:text-orange-400 hover:bg-orange-500/10 hover:border-orange-500/20"
                              : "text-emerald-400 bg-emerald-500/10 border-emerald-500/20 hover:bg-emerald-500/20"
                              }`}
                            title={
                              user.is_active
                                ? t.admin.block
                                : t.admin.activate
                            }
                          >
                            {user.is_active ? (
                              <UserX className="w-4 h-4" />
                            ) : (
                              <UserCheck className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  )
                  ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Footer info and pagination */}
        <div className="bg-muted/30 px-6 py-5 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-[11px] font-black uppercase tracking-widest text-muted-foreground">
            {isAr ? "إجمالي المستخدمين" : "Total users"}: <span className="text-foreground">{pagination?.totalUsers || 0}</span>
            {pagination && (
              <span className="mr-4">
                {isAr ? "صفحة" : "Page"} {pagination.currentPage} {isAr ? "من" : "of"} {pagination.totalPages}
              </span>
            )}
          </div>

          {pagination && pagination.totalPages > 1 && (
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={!pagination.hasPreviousPage || loading}
                className="rounded-xl font-black text-xs h-8 px-3"
              >
                <ChevronRight className={`w-4 h-4 ${isAr ? "ml-1" : "mr-1"}`} />
                {isAr ? "السابق" : "Previous"}
              </Button>

              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                  let pageNum
                  if (pagination.totalPages <= 5) {
                    pageNum = i + 1
                  } else if (pagination.currentPage <= 3) {
                    pageNum = i + 1
                  } else if (pagination.currentPage >= pagination.totalPages - 2) {
                    pageNum = pagination.totalPages - 4 + i
                  } else {
                    pageNum = pagination.currentPage - 2 + i
                  }

                  return (
                    <Button
                      key={pageNum}
                      variant={pageNum === pagination.currentPage ? "default" : "outline"}
                      size="sm"
                      onClick={() => setCurrentPage(pageNum)}
                      disabled={loading}
                      className="rounded-xl font-black text-xs h-8 w-8 p-0"
                    >
                      {pageNum}
                    </Button>
                  )
                })}
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.min(pagination.totalPages, prev + 1))}
                disabled={!pagination.hasNextPage || loading}
                className="rounded-xl font-black text-xs h-8 px-3"
              >
                {isAr ? "التالي" : "Next"}
                <ChevronLeft className={`w-4 h-4 ${isAr ? "mr-1" : "ml-1"}`} />
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Add User Modal */}
      <Dialog open={isAddUserOpen} onOpenChange={setIsAddUserOpen}>
        <DialogContent className="rounded-3xl border-none shadow-2xl bg-card max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-xl font-black text-foreground">{t.admin.newUserModalTitle}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
            <div className="space-y-2">
              <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground">{t.auth.fullName}</Label>
              <Input
                className="rounded-2xl h-11 bg-muted/30 border-border focus:bg-card font-bold"
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground">{t.auth.email}</Label>
              <Input
                className="rounded-2xl h-11 bg-muted/30 border-border focus:bg-card font-bold"
                type="email"
                value={formData.email}
                onChange={e => setFormData({ ...formData, email: e.target.value })}
                dir="ltr"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground">{isAr ? "كلمة المرور" : t.auth.password}</Label>
              <Input
                className="rounded-2xl h-11 bg-muted/30 border-border focus:bg-card font-bold"
                type="password"
                value={formData.password}
                onChange={e => setFormData({ ...formData, password: e.target.value })}
                dir="ltr"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground">{t.auth.role}</Label>
              <select
                className="w-full h-11 border border-border rounded-2xl px-4 bg-muted/30 text-foreground text-sm font-bold outline-none focus:ring-4 focus:ring-primary/10 transition-all"
                value={formData.role}
                onChange={e => setFormData({ ...formData, role: e.target.value })}
              >
                {(currentUserRole === 'admin' || currentUserRole === 'student_supervisor') && (
                  <option value="student">{t.auth.student}</option>
                )}
                {(currentUserRole === 'admin' || currentUserRole === 'student_supervisor') && (
                  <option value="teacher">{t.auth.teacher}</option>
                )}
                {currentUserRole === 'admin' && (
                  <>
                    <option value="admin">{t.auth.admin}</option>
                    <option value="student_supervisor">{t.auth.studentSupervisor}</option>
                  </>
                )}
              </select>
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground">{t.auth.genderOptional}</Label>
              <select
                className="w-full h-11 border border-border rounded-2xl px-4 bg-muted/30 text-foreground text-sm font-bold outline-none focus:ring-4 focus:ring-primary/10 transition-all"
                value={formData.gender}
                onChange={e => setFormData({ ...formData, gender: e.target.value })}
              >
                <option value="">{t.auth.unspecified}</option>
                <option value="male">{t.auth.male}</option>
                <option value="female">{t.auth.female}</option>
              </select>
            </div>
            
            <div className="md:col-span-2 p-4 bg-muted/20 rounded-2xl border border-border/50 space-y-3">
              <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground">
                {isAr ? "صلاحيات الوصول للمنصات" : "Platform Access Permissions"}
              </Label>
              <div className="flex flex-wrap gap-6">
                <label className="flex items-center gap-2 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={formData.has_quran_access}
                    onChange={e => setFormData({ ...formData, has_quran_access: e.target.checked })}
                    className="w-4 h-4 rounded border-border text-primary focus:ring-primary/20"
                  />
                  <span className="text-sm font-bold group-hover:text-primary transition-colors">
                    {isAr ? "منصة القرآن" : "Quran Platform"}
                  </span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={formData.has_academy_access}
                    onChange={e => setFormData({ ...formData, has_academy_access: e.target.checked })}
                    className="w-4 h-4 rounded border-border text-primary focus:ring-primary/20"
                  />
                  <span className="text-sm font-bold group-hover:text-primary transition-colors">
                    {isAr ? "الأكاديمية" : "Academy"}
                  </span>
                </label>
              </div>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setIsAddUserOpen(false)} className="rounded-2xl font-black">{t.cancel}</Button>
            <Button onClick={handleCreateUser} disabled={submitting} className="rounded-2xl font-black bg-primary text-primary-foreground hover:bg-primary/90">
              {submitting && <Loader2 className="w-4 h-4 ml-2 animate-spin" />}
              {t.save}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit User Modal */}
      <Dialog open={isEditUserOpen} onOpenChange={setIsEditUserOpen}>
        <DialogContent className="rounded-3xl border-none shadow-2xl bg-card max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-xl font-black text-foreground">{t.admin.editUserModalTitle}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
            <div className="space-y-2">
              <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground">{t.auth.fullName}</Label>
              <Input
                className="rounded-2xl h-11 bg-muted/30 border-border focus:bg-card font-bold"
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground">{t.auth.email}</Label>
              <Input
                className="rounded-2xl h-11 bg-muted/30 border-border focus:bg-card font-bold"
                type="email"
                value={formData.email}
                onChange={e => setFormData({ ...formData, email: e.target.value })}
                dir="ltr"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground">{t.admin.passwordLeaveBlank}</Label>
              <Input
                className="rounded-2xl h-11 bg-muted/30 border-border focus:bg-card font-bold"
                type="password"
                value={formData.password}
                onChange={e => setFormData({ ...formData, password: e.target.value })}
                dir="ltr"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground">{t.auth.role}</Label>
              <select
                className="w-full h-11 border border-border rounded-2xl px-4 bg-muted/30 text-foreground text-sm font-bold outline-none focus:ring-4 focus:ring-primary/10 transition-all"
                value={formData.role}
                onChange={e => setFormData({ ...formData, role: e.target.value })}
              >
                {(currentUserRole === 'admin' || currentUserRole === 'student_supervisor') && (
                  <option value="student">{t.auth.student}</option>
                )}
                {(currentUserRole === 'admin' || currentUserRole === 'student_supervisor') && (
                  <option value="teacher">{t.auth.teacher}</option>
                )}
                {currentUserRole === 'admin' && (
                  <>
                    <option value="admin">{t.auth.admin}</option>
                    <option value="student_supervisor">{t.auth.studentSupervisor}</option>
                  </>
                )}
              </select>
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground">{t.auth.genderOptional}</Label>
              <select
                className="w-full h-11 border border-border rounded-2xl px-4 bg-muted/30 text-foreground text-sm font-bold outline-none focus:ring-4 focus:ring-primary/10 transition-all"
                value={formData.gender || ""}
                onChange={e => setFormData({ ...formData, gender: e.target.value })}
              >
                <option value="">{t.auth.unspecified}</option>
                <option value="male">{t.auth.male}</option>
                <option value="female">{t.auth.female}</option>
              </select>
            </div>

            <div className="md:col-span-2 p-4 bg-muted/20 rounded-2xl border border-border/50 space-y-3">
              <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground">
                {isAr ? "صلاحيات الوصول للمنصات" : "Platform Access Permissions"}
              </Label>
              <div className="flex flex-wrap gap-6">
                <label className="flex items-center gap-2 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={formData.has_quran_access}
                    onChange={e => setFormData({ ...formData, has_quran_access: e.target.checked })}
                    className="w-4 h-4 rounded border-border text-primary focus:ring-primary/20"
                  />
                  <span className="text-sm font-bold group-hover:text-primary transition-colors">
                    {isAr ? "منصة القرآن" : "Quran Platform"}
                  </span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={formData.has_academy_access}
                    onChange={e => setFormData({ ...formData, has_academy_access: e.target.checked })}
                    className="w-4 h-4 rounded border-border text-primary focus:ring-primary/20"
                  />
                  <span className="text-sm font-bold group-hover:text-primary transition-colors">
                    {isAr ? "الأكاديمية" : "Academy"}
                  </span>
                </label>
              </div>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setIsEditUserOpen(false)} className="rounded-2xl font-black">{t.cancel}</Button>
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
