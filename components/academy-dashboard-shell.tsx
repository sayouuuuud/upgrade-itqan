"use client"

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { cn } from '@/lib/utils'
import { useI18n } from '@/lib/i18n/context'
import { LanguageSwitcher } from '@/components/language-switcher'
import { NotificationDropdown } from '@/components/notification-dropdown'
import { ThemeToggle } from '@/components/theme-toggle'
import { ModeSwitcher } from '@/components/mode-switcher'
import {
  LayoutDashboard, BookOpen, Calendar, Bell, User, LogOut,
  Menu, X, Users, Settings, Trophy, MessageSquare, ClipboardList,
  GraduationCap, PlayCircle, FileText, Target, Award, Star,
  HelpCircle, Megaphone, UserPlus, BarChart3, Clock, Video,
  BookMarked, Route, Globe, Sparkles, Grid, UserCheck, Shield
} from 'lucide-react'
import { usePublicSettings } from '@/lib/hooks/use-public-settings'

type NavItem = { href: string; label: string; icon: React.ElementType; badge?: number | string | null }
type NavSection = { title?: string; items: NavItem[] }

type AcademyRole = 'academy_student' | 'teacher' | 'academy_admin' | 'parent' | 'supervisor'

const getAcademyRoleConfig = (t: any, role: AcademyRole): { sections: NavSection[], label: string, name: string, sublabel: string } => {
  const configs: Record<AcademyRole, { sections: NavSection[], label: string, name: string, sublabel: string }> = {
    academy_student: {
      sections: [
        {
          items: [
            { href: '/academy/student', label: t.academy?.dashboard || 'لوحة التحكم', icon: LayoutDashboard },
            { href: '/academy/student/courses', label: t.academy?.myCourses || 'دوراتي', icon: BookOpen },
            { href: '/academy/student/courses/browse', label: t.academy?.browseCourses || 'تصفح الدورات', icon: GraduationCap },
            { href: '/academy/student/enrollment-requests', label: t.academy?.enrollmentRequests || 'طلبات الانضمام', icon: UserPlus },
            { href: '/academy/student/memorization', label: t.academy?.memorization || 'الحفظ والمراجعة', icon: BookMarked },
            { href: '/academy/student/tasks', label: t.academy?.tasks || 'المهام', icon: ClipboardList },
            { href: '/academy/student/sessions', label: t.academy?.liveSessions || 'الجلسات الحية', icon: Video },
            { href: '/academy/student/path', label: t.academy?.learningPath || 'المسار التعليمي', icon: Route },
            { href: '/academy/student/chat', label: t.academy?.chat || 'الرسائل', icon: MessageSquare },
            { href: '/academy/student/fiqh', label: t.academy?.fiqhQuestions || 'أسئلة فقهية', icon: HelpCircle },
          ]
        },
        {
          title: t.academy?.achievements || 'الإنجازات',
          items: [
            { href: '/academy/student/progress', label: t.academy?.progress || 'تقدمي', icon: Target },
            { href: '/academy/student/leaderboard', label: t.academy?.leaderboard || 'لوحة المتصدرين', icon: Trophy },
            { href: '/academy/student/badges', label: t.academy?.badges || 'الشارات', icon: Award },
            { href: '/academy/student/certificates', label: t.academy?.certificates || 'الشهادات', icon: GraduationCap },
          ]
        },
        {
          title: t.shell?.account || 'الحساب',
          items: [
            { href: '/academy/student/notifications', label: t.student?.notifications || 'الإشعارات', icon: Bell },
            { href: '/academy/student/profile', label: t.student?.profile || 'الملف الشخصي', icon: User },
          ]
        }
      ],
      label: t.academy?.studentPortal || 'بوابة الطالب',
      name: t.auth?.student || 'طالب',
      sublabel: t.academy?.academyStudent || 'طالب الأكاديمية'
    },
    teacher: {
      sections: [
        {
          items: [
            { href: '/academy/teacher', label: t.academy?.dashboard || 'لوحة التحكم', icon: LayoutDashboard },
            { href: '/academy/teacher/courses', label: t.academy?.myCourses || 'دوراتي', icon: BookOpen },
            { href: '/academy/teacher/enrollment-requests', label: t.academy?.enrollmentRequests || 'طلبات الانضمام', icon: Bell },
            { href: '/academy/teacher/schedule', label: t.academy?.schedule || 'الجدول', icon: Calendar },
            { href: '/academy/teacher/tasks', label: t.academy?.tasks || 'المهام', icon: ClipboardList },
            { href: '/academy/teacher/students', label: t.academy?.myStudents || 'طلابي', icon: Users },
            { href: '/academy/teacher/halaqat', label: t.academy?.halaqat || 'الحلقات', icon: GraduationCap },
          ]
        },
        {
          title: t.academy?.liveSection || 'البث المباشر',
          items: [
            { href: '/academy/teacher/live', label: t.academy?.startSession || 'بدء جلسة', icon: PlayCircle },
            { href: '/academy/teacher/recordings', label: t.academy?.recordings || 'التسجيلات', icon: Video },
          ]
        },
        {
          title: t.shell?.account || 'الحساب',
          items: [
            { href: '/academy/teacher/notifications', label: t.student?.notifications || 'الإشعارات', icon: Bell },
            { href: '/academy/teacher/profile', label: t.student?.profile || 'الملف الشخصي', icon: User },
          ]
        }
      ],
      label: t.academy?.teacherPortal || 'بوابة المدرس',
      name: t.academy?.teacher || 'مدرس',
      sublabel: t.academy?.certifiedTeacher || 'مدرس معتمد'
    },
    academy_admin: {
      sections: [
        {
          title: t.main || 'الرئيسية',
          items: [
            { href: '/academy/admin', label: t.academy?.dashboard || 'لوحة التحكم', icon: LayoutDashboard },
            { href: '/academy/admin/analytics', label: t.academy?.analytics || 'التحليلات', icon: BarChart3 },
            { href: '/academy/admin/reports', label: t.academy?.reports || 'التقارير', icon: FileText },
          ]
        },
        {
          title: t.management || 'الإدارة',
          items: [
            { href: '/academy/admin/courses', label: t.academy?.courses || 'الدورات', icon: BookOpen },
            { href: '/academy/admin/categories', label: t.academy?.categories || 'التصنيفات', icon: Grid },
            { href: '/academy/admin/teachers', label: t.academy?.teachers || 'المدرسين', icon: GraduationCap },
            { href: '/academy/admin/teacher-applications', label: t.academy?.teacherApplications || 'طلبات التدريس', icon: UserCheck },
            { href: '/academy/admin/students', label: t.academy?.students || 'الطلاب', icon: Users },
            { href: '/academy/admin/paths', label: t.academy?.learningPaths || 'المسارات التعليمية', icon: Route },
            { href: '/academy/admin/invitations', label: t.academy?.invitations || 'الدعوات', icon: UserPlus },
          ]
        },
        {
          title: t.academy?.engagement || 'التفاعل',
          items: [
            { href: '/academy/admin/competitions', label: t.academy?.competitions || 'المسابقات', icon: Trophy },
            { href: '/academy/admin/leaderboard', label: t.academy?.leaderboard || 'لوحة المتصدرين', icon: Star },
            { href: '/academy/admin/badges', label: t.academy?.badges || 'الشارات', icon: Award },
          ]
        },
        {
          title: t.academy?.community || 'المجتمع',
          items: [
            { href: '/academy/admin/forum', label: t.academy?.forum || 'المنتدى', icon: MessageSquare },
            { href: '/academy/admin/fiqh', label: t.academy?.fiqhQuestions || 'أسئلة فقهية', icon: HelpCircle },
            { href: '/academy/admin/announcements', label: t.admin?.announcements || 'الإعلانات', icon: Megaphone },
          ]
        },
        {
          title: t.admin?.settings || 'الإعدادات',
          items: [
            { href: '/academy/admin/access-control', label: t.academy?.accessControl || 'التحكم بالوصول', icon: Shield },
            { href: '/academy/admin/halaqat', label: t.academy?.halaqat || 'الحلقات', icon: GraduationCap },
            { href: '/academy/admin/settings', label: t.admin?.systemSettings || 'إعدادات النظام', icon: Settings },
          ]
        }
      ],
      label: t.academy?.adminPortal || 'إدارة الأكاديمية',
      name: t.academy?.admin || 'مدير',
      sublabel: t.academy?.academyAdmin || 'مدير الأكاديمية'
    },
    parent: {
      sections: [
        {
          items: [
            { href: '/academy/parent', label: t.academy?.dashboard || 'لوحة التحكم', icon: LayoutDashboard },
            { href: '/academy/parent/children', label: t.academy?.myChildren || 'أبنائي', icon: Users },
            { href: '/academy/parent/reports', label: t.academy?.reports || 'التقارير', icon: FileText },
            { href: '/academy/parent/progress', label: t.academy?.progress || 'التقدم', icon: Target },
          ]
        },
        {
          title: t.shell?.account || 'الحساب',
          items: [
            { href: '/academy/parent/notifications', label: t.student?.notifications || 'الإشعارات', icon: Bell },
            { href: '/academy/parent/profile', label: t.student?.profile || 'الملف الشخصي', icon: User },
          ]
        }
      ],
      label: t.academy?.parentPortal || 'بوابة ولي الأمر',
      name: t.academy?.parent || 'ولي أمر',
      sublabel: t.academy?.parentAccount || 'حساب ولي الأمر'
    },
    supervisor: {
      sections: [
        {
          items: [
            { href: '/academy/supervisor/content', label: t.academy?.contentReview || 'إشراف المحتوى', icon: BookOpen },
            { href: '/academy/supervisor/forum', label: t.academy?.forumModeration || 'إشراف المنتدى', icon: MessageSquare },
            { href: '/academy/supervisor/fiqh', label: t.academy?.fiqhQuestions || 'الأسئلة الفقهية', icon: HelpCircle },
            { href: '/academy/supervisor/teachers', label: t.academy?.teacherVerification || 'توثيق المدرسين', icon: UserCheck },
            { href: '/academy/supervisor/quality', label: t.academy?.qualityMonitor || 'مراقبة الجودة', icon: BarChart3 },
          ]
        },
        {
          title: t.shell?.account || 'الحساب',
          items: [
            { href: '/academy/supervisor/notifications', label: t.student?.notifications || 'الإشعارات', icon: Bell },
            { href: '/academy/supervisor/profile', label: t.student?.profile || 'الملف الشخصي', icon: User },
          ]
        }
      ],
      label: t.academy?.supervisorPortal || 'لوحة المشرف',
      name: t.academy?.supervisor || 'مشرف',
      sublabel: t.academy?.academySupervisor || 'مشرف الأكاديمية'
    }
  }

  return configs[role] || configs.academy_student
}

interface AcademyDashboardShellProps {
  role: AcademyRole
  children: React.ReactNode
  headerTitle?: string
  showModeSwitcher?: boolean
  libraryRole?: string | null
}

export function AcademyDashboardShell({
  role,
  children,
  headerTitle,
  showModeSwitcher = true,
  libraryRole = null
}: AcademyDashboardShellProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { t } = useI18n()
  const [user, setUser] = useState<{
    name: string;
    email: string;
    role: string;
    avatar_url?: string | null;
    gender?: string;
    has_quran_access?: boolean;
    has_academy_access?: boolean;
  } | null>(null)
  const [unreadCount, setUnreadCount] = useState(0)
  const [avatarError, setAvatarError] = useState(false)
  const { branding } = usePublicSettings()

  useEffect(() => {
    async function fetchUser() {
      try {
        const res = await fetch('/api/auth/me')
        if (res.ok) {
          const data = await res.json()
          setUser(data.user)
        }
      } catch (err) {
        console.error("Failed to fetch user session", err)
      }
    }
    async function fetchCounts() {
      try {
        const res = await fetch('/api/unread-counts')
        if (res.ok) {
          const data = await res.json()
          setUnreadCount(data.notifications || 0)
        }
      } catch { }
    }
    fetchUser()
    fetchCounts()
    const interval = setInterval(fetchCounts, 30000)
    return () => clearInterval(interval)
  }, [])

  const rawConfig = getAcademyRoleConfig(t, role)
  const userName = user?.name || rawConfig.name
  const config = { ...rawConfig, name: userName }

  const isActive = (href: string) => {
    const basePath = `/academy/${role === 'academy_student' ? 'student' : role === 'academy_admin' ? 'admin' : role}`
    return pathname === href || (href !== basePath && pathname.startsWith(href + '/'))
  }

  return (
    <div className={`h-screen flex overflow-hidden bg-background transition-colors duration-500 ${user?.gender?.toLowerCase() === 'female' ? 'theme-female' : ''}`}>
      {/* Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={cn(
        'fixed inset-y-0 right-0 z-50 w-72 flex flex-col transition-transform duration-200 lg:translate-x-0 lg:static shadow-sm',
        sidebarOpen ? 'translate-x-0' : 'translate-x-full',
        'bg-card border-l border-border'
      )}>
        {/* Logo */}
        <div className="py-1 flex items-center justify-center border-b border-border relative overflow-hidden bg-gradient-to-l from-[#1E3A5F]/5 to-transparent">
          <Link href="/" className="w-full block px-4">
            <img
              src={branding?.dashboardLogoUrl || "/branding/dashboard-logo.png"}
              alt={t.appName}
              className="w-full h-auto min-h-[40px] max-h-[100px] object-contain dark:brightness-150 dark:contrast-125 transition-all"
            />
          </Link>
          <button
            className="lg:hidden p-1"
            onClick={() => setSidebarOpen(false)}
            aria-label="close"
          >
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>

        {/* Academy Badge */}
        <div className="px-4 py-3 border-b border-border">
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[#1E3A5F]/10 text-[#1E3A5F] dark:text-[#7faad6]">
            <GraduationCap className="w-5 h-5" />
            <span className="font-semibold text-sm">{t.academy?.title || 'الأكاديمية'}</span>
            <Sparkles className="w-4 h-4 mr-auto" />
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-6 px-4 space-y-1">
          {config.sections.map((section, si) => (
            <div key={si}>
              {section.title && (
                <div className={cn(
                  'text-[10px] font-bold uppercase tracking-widest mb-4 px-3 text-muted-foreground/60',
                  si > 0 && 'mt-8'
                )}>
                  {section.title}
                </div>
              )}
              {section.items.map((item) => {
                const active = isActive(item.href)
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setSidebarOpen(false)}
                    className={cn(
                      'flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-sm group relative',
                      active
                        ? 'bg-[#1E3A5F]/10 text-[#1E3A5F] dark:text-[#7faad6] font-bold shadow-sm'
                        : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                    )}
                  >
                    <item.icon className={cn(
                      "w-5 h-5 shrink-0 transition-transform duration-200",
                      active && "scale-110"
                    )} />
                    <span className="font-medium">{item.label}</span>
                    {item.badge && (
                      <span className="mr-auto bg-destructive text-destructive-foreground text-[10px] px-1.5 py-0.5 rounded-full min-w-[18px] text-center font-bold animate-pulse">
                        {item.badge}
                      </span>
                    )}
                    {item.href.includes('notifications') && unreadCount > 0 && !item.badge && (
                      <span className="mr-auto bg-destructive text-destructive-foreground text-[10px] px-1.5 py-0.5 rounded-full min-w-[18px] text-center font-bold animate-pulse">
                        {unreadCount > 99 ? '99+' : unreadCount}
                      </span>
                    )}
                    {active && (
                      <div className="absolute right-0 w-1 h-6 bg-[#1E3A5F] rounded-l-full" />
                    )}
                  </Link>
                )
              })}
            </div>
          ))}
        </nav>

        {/* Bottom section */}
        <div className="p-4 border-t border-border mt-auto">
          <div className="flex items-center gap-3 px-4 py-3 rounded-xl mb-2 bg-muted/30 border border-border transition-colors">
            <div className="w-10 h-10 rounded-full overflow-hidden bg-[#1E3A5F]/10 text-[#1E3A5F] dark:text-[#7faad6] flex items-center justify-center font-bold text-sm ring-2 ring-background shadow-sm shrink-0">
              {user?.avatar_url && !avatarError ? (
                <img
                  src={user.avatar_url}
                  alt={config.name}
                  className="w-full h-full object-cover"
                  onError={() => setAvatarError(true)}
                />
              ) : (
                <span>{(config.name || 'U')[0]}</span>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-foreground truncate">{config.name}</p>
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider truncate">
                {config.sublabel}
              </p>
            </div>
          </div>

          <Link
            href="/"
            className="flex items-center gap-3 px-4 py-2 rounded-lg transition-colors text-sm text-muted-foreground hover:text-[#1E3A5F] dark:hover:text-[#7faad6]"
          >
            <Globe className="w-4 h-4" />
            <span className="font-medium">{t.shell?.viewSite || 'عرض الموقع'}</span>
          </Link>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col h-full overflow-hidden min-w-0">
        <header className="h-16 border-b border-border flex items-center justify-between px-6 lg:px-8 bg-background/95 backdrop-blur-md z-10 sticky top-0">
          <div className="flex items-center gap-4">
            <button
              className="lg:hidden p-2 text-muted-foreground hover:text-[#1E3A5F] dark:hover:text-[#7faad6]"
              onClick={() => setSidebarOpen(true)}
              aria-label="open menu"
            >
              <Menu className="w-5 h-5" />
            </button>
            <h2 className="text-xl font-bold text-foreground hidden lg:block">
              {headerTitle || config.label}
            </h2>
          </div>
          <div className="flex items-center gap-4">
            {/* Mode Switcher */}
            {showModeSwitcher && libraryRole && (
              <ModeSwitcher
                currentMode="academy"
                userRole={libraryRole}
                academyRole={role}
                hasQuranAccess={user?.has_quran_access}
                hasAcademyAccess={user?.has_academy_access}
              />
            )}

            <ThemeToggle />
            <LanguageSwitcher variant="outline" />

            <NotificationDropdown
              // #27: Always route academy users to academy notifications pages
              // so they don't get redirected to the Qur'an side.
              role={
                role === 'academy_admin' ? 'academy/admin' :
                role === 'teacher' ? 'academy/teacher' :
                role === 'parent' ? 'academy/parent' :
                role === 'supervisor' ? 'academy/supervisor' :
                'academy/student'
              }
              unreadCount={unreadCount}
              onRefresh={async () => {
                const res = await fetch('/api/unread-counts')
                if (res.ok) {
                  const data = await res.json()
                  setUnreadCount(data.notifications || 0)
                }
              }}
            />

            <button
              onClick={async () => {
                await fetch('/api/auth/logout', { method: 'POST' })
                router.push('/')
                router.refresh()
              }}
              className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-xl transition-all"
              title={t.logout}
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  )
}
