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
import { AdminRoleSwitcher } from '@/components/admin/admin-role-switcher'
import {
  LayoutDashboard, BookOpen, Calendar, Bell, User, LogOut,
  Menu, X, Users, Settings, Trophy, MessageSquare, ClipboardList,
  GraduationCap, PlayCircle, FileText, Target, Award, Star,
  HelpCircle, Megaphone, UserPlus, BarChart3, Clock, Video,
  BookMarked, Route, Globe, Sparkles, Grid, UserCheck, Shield, ShieldCheck, Archive,
  PanelLeftClose, PanelLeftOpen, Library, ChevronDown
} from 'lucide-react'
import { usePublicSettings } from '@/lib/hooks/use-public-settings'
import { useSidebarCollapsed } from '@/hooks/use-sidebar-collapsed'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'

type NavItem = { href: string; label: string; icon: React.ElementType; badge?: number | string | null }
type NavSection = { title?: string; items: NavItem[] }

type AcademyRole = 'academy_student' | 'teacher' | 'academy_admin' | 'parent' | 'supervisor' | 'fiqh_questions_supervisor' | 'content_supervisor'

// ── Collapsible nav section ────────────────────────────────────────────────
function AcademyCollapsibleNavSection({
  section, si, isCollapsedSidebar, isActive, sectionKey, sectionHasActive,
  unreadCount, onLinkClick,
}: {
  section: NavSection
  si: number
  isCollapsedSidebar: boolean
  isActive: (href: string) => boolean
  sectionKey: string
  sectionHasActive: boolean
  unreadCount: number
  onLinkClick: () => void
}) {
  const hasTitle = !!section.title

  const [open, setOpen] = useState<boolean>(() => {
    if (!hasTitle || sectionHasActive) return true
    if (typeof window === 'undefined') return true
    const stored = localStorage.getItem(sectionKey)
    return stored === null ? true : stored === '1'
  })

  useEffect(() => {
    if (sectionHasActive) setOpen(true)
  }, [sectionHasActive])

  const toggle = () => {
    if (!hasTitle) return
    const next = !open
    setOpen(next)
    try { localStorage.setItem(sectionKey, next ? '1' : '0') } catch {}
  }

  const showAccordion = hasTitle && !isCollapsedSidebar

  const items = section.items.map((item) => {
    const active = isActive(item.href)
    const isNotifications = item.href.includes('notifications')
    const collapsedDot = item.badge
      ? item.badge
      : (isNotifications && unreadCount > 0) ? (unreadCount > 99 ? '99+' : unreadCount) : null

    const linkEl = (
      <Link key={item.href} href={item.href} onClick={onLinkClick}
        className={cn(
          'flex items-center gap-3 rounded-xl transition-all text-sm group relative',
          isCollapsedSidebar ? 'lg:justify-center lg:px-0 lg:py-3 px-4 py-2.5' : 'px-3 py-2.5',
          active
            ? 'bg-academy text-white font-bold shadow-md'
            : 'text-muted-foreground hover:bg-muted hover:text-academy'
        )}
      >
        <item.icon className={cn("w-5 h-5 shrink-0 transition-transform duration-200", active && "scale-110")} />
        <span className={cn('font-medium truncate', isCollapsedSidebar && 'lg:hidden')}>{item.label}</span>
        {!isCollapsedSidebar && item.badge && (
          <span className="mr-auto bg-destructive text-destructive-foreground text-[10px] px-1.5 py-0.5 rounded-full min-w-[18px] text-center font-bold animate-pulse">{item.badge}</span>
        )}
        {!isCollapsedSidebar && isNotifications && unreadCount > 0 && !item.badge && (
          <span className="mr-auto bg-destructive text-destructive-foreground text-[10px] px-1.5 py-0.5 rounded-full min-w-[18px] text-center font-bold animate-pulse">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
        {isCollapsedSidebar && collapsedDot != null && (
          <span className="hidden lg:flex absolute -top-1 -left-1 bg-destructive text-destructive-foreground text-[9px] leading-none px-1 py-0.5 rounded-full min-w-[16px] h-[16px] items-center justify-center font-bold">{collapsedDot}</span>
        )}
        {active && <div className={cn('absolute right-0 w-1 h-6 bg-white rounded-l-full', isCollapsedSidebar && 'lg:hidden')} />}
      </Link>
    )

    if (isCollapsedSidebar) {
      return (
        <Tooltip key={item.href}>
          <TooltipTrigger asChild>{linkEl}</TooltipTrigger>
          <TooltipContent side="left" className="hidden lg:block">{item.label}</TooltipContent>
        </Tooltip>
      )
    }
    return linkEl
  })

  return (
    <div className={cn(si > 0 && !showAccordion && 'mt-2')}>
      {showAccordion ? (
        <div className={cn('mb-0.5', si > 0 && 'mt-4')}>
          <button
            type="button"
            onClick={toggle}
            className={cn(
              'w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-left transition-colors',
              'text-muted-foreground hover:text-foreground hover:bg-muted/60',
              sectionHasActive && 'text-foreground'
            )}
          >
            <span className="text-[11px] font-bold uppercase tracking-widest select-none">
              {section.title}
            </span>
            <ChevronDown className={cn(
              'w-3.5 h-3.5 shrink-0 transition-transform duration-200',
              open && 'rotate-180'
            )} />
          </button>
          <div className={cn(
            'overflow-hidden transition-all duration-200',
            open ? 'max-h-[1000px] opacity-100 mt-0.5' : 'max-h-0 opacity-0'
          )}>
            <div className="space-y-0.5">{items}</div>
          </div>
        </div>
      ) : (
        <div className="space-y-0.5">{items}</div>
      )}
    </div>
  )
}

const getAcademyRoleConfig = (t: any, role: AcademyRole): { sections: NavSection[], label: string, name: string, sublabel: string } => {
  const configs: Record<AcademyRole, { sections: NavSection[], label: string, name: string, sublabel: string }> = {
    academy_student: {
      sections: [
        {
          title: t.main || 'الرئيسية',
          items: [
            { href: '/academy/student', label: t.academy?.dashboard || 'لوحة التحكم', icon: LayoutDashboard },
            { href: '/academy/student/calendar', label: t.academy?.calendar || 'التقويم', icon: Calendar },
            { href: '/academy/student/path', label: t.academy?.learningPath || 'المسار التعليمي', icon: Route },
          ]
        },
        {
          title: t.academyAdmin?.sidebarEducationalProcess || 'الدراسة',
          items: [
            { href: '/academy/student/courses', label: t.academy?.myCourses || 'دوراتي', icon: BookOpen },
            { href: '/academy/student/courses/browse', label: t.academy?.browseCourses || 'تصفح الدورات', icon: GraduationCap },
            { href: '/academy/student/courses/archive', label: t.academy?.archive || 'الأرشيف', icon: Archive },
            { href: '/academy/student/enrollment-requests', label: t.academy?.enrollmentRequests || 'طلبات الانضمام', icon: UserPlus },
            { href: '/academy/student/tasks', label: t.academy?.tasks || 'المهام', icon: ClipboardList },
            { href: '/academy/student/sessions', label: t.academy?.liveSessions || 'الجلسات الحية', icon: Video },
            { href: '/academy/student/halaqat', label: t.academy?.halaqat || 'حلقاتي', icon: GraduationCap },
          ]
        },
        {
          title: t.academy?.achievements || 'الإنجازات',
          items: [
            { href: '/academy/student/progress', label: t.academy?.progress || 'تقدمي', icon: Target },
            { href: '/academy/student/competitions', label: t.academy?.competitions || 'المسابقات', icon: Trophy },
            { href: '/academy/student/leaderboard', label: t.academy?.leaderboard || 'لوحة المتصدرين', icon: Trophy },
            { href: '/academy/student/badges', label: t.academy?.badges || 'الشارات', icon: Award },
            { href: '/academy/student/certificates', label: t.academy?.certificates || 'الشهادات', icon: GraduationCap },
          ]
        },
        {
          title: t.academyAdmin?.sidebarCommunity || 'المجتمع والمكتبة',
          items: [
            { href: '/academy/student/chat', label: t.academy?.chat || 'الرسائل', icon: MessageSquare },
            { href: '/community/academy/forum', label: t.academy?.forum || 'المنتدى والمقالات', icon: MessageSquare },
            { href: '/academy/fiqh', label: t.academy?.fiqhLibrary || 'المكتبة الفقهية', icon: Library },
            { href: '/academy/library', label: t.academy?.booksLibrary || 'مكتبة الكتب', icon: BookOpen },
          ]
        },
        {
          title: t.shell?.account || 'الحساب',
          items: [
            { href: '/academy/student/family', label: t.academy?.guardianFamily || 'ولي الأمر والعائلة', icon: Users },
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
          title: t.main || 'الرئيسية',
          items: [
            { href: '/academy/teacher', label: t.academy?.dashboard || 'لوحة التحكم', icon: LayoutDashboard },
            { href: '/academy/teacher/calendar', label: t.academy?.calendar || 'التقويم', icon: Calendar },
          ]
        },
        {
          title: t.academyAdmin?.sidebarEducationalProcess || 'التدريس',
          items: [
            { href: '/academy/teacher/courses', label: t.academy?.myCourses || 'دوراتي', icon: BookOpen },
            { href: '/academy/teacher/enrollment-requests', label: t.academy?.enrollmentRequests || 'طلبات الانضمام', icon: Bell },
            { href: '/academy/teacher/sessions', label: t.academy?.liveSessions || 'الجلسات والبث المباشر', icon: Video },
            { href: '/academy/teacher/tasks', label: t.academy?.tasks || 'المهام', icon: ClipboardList },
            { href: '/academy/teacher/students', label: t.academy?.myStudents || 'طلابي', icon: Users },
            { href: '/academy/teacher/halaqat', label: t.academy?.halaqat || 'الحلقات', icon: GraduationCap },
            { href: '/academy/teacher/paths', label: t.academy?.learningPaths || 'المسارات التعليمية', icon: Route },
            { href: '/academy/teacher/certificates', label: t.academy?.certificatesCenter || 'اعتماد الشهادات', icon: Award },
            { href: '/academy/teacher/competitions', label: t.academyAdmin?.sidebarCompetitionJudging || 'تحكيم المسابقات', icon: Trophy },
          ]
        },
        {
          title: t.academyAdmin?.sidebarCommunity || 'المجتمع والمكتبة',
          items: [
            { href: '/academy/teacher/chat', label: t.academy?.chat || 'الرسائل', icon: MessageSquare },
            { href: '/community/academy/forum', label: t.academy?.forum || 'المنتدى والمقالات', icon: FileText },
            { href: '/academy/fiqh', label: t.academy?.fiqhLibrary || 'المكتبة الفقهية', icon: Library },
            { href: '/academy/library', label: t.academy?.booksLibrary || 'مكتبة الكتب', icon: BookOpen },
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
          ]
        },
        {
          title: t.academyAdmin?.sidebarEducationalProcess,
          items: [
            { href: '/academy/admin/courses', label: t.academy?.courses || 'الدورات', icon: BookOpen },
            { href: '/academy/admin/archive', label: t.academyAdmin?.archiveTitle, icon: Archive },
            { href: '/academy/admin/categories', label: t.academy?.categories || 'التصنيفات', icon: Grid },
            { href: '/academy/admin/learning-paths', label: t.academy?.learningPaths || 'المسارات التعليمية', icon: Route },
          ]
        },
        {
          title: t.academyAdmin?.sidebarUsersPermissions,
          items: [
            { href: '/academy/admin/teachers', label: t.academy?.teachers || 'المدرسين', icon: GraduationCap },
            { href: '/academy/admin/teacher-applications', label: t.academy?.teacherApplications || 'طلبات التدريس', icon: UserCheck },
            { href: '/academy/admin/application-questions', label: t.academy?.applicationQuestions || 'أسئلة طلبات الانضمام', icon: ClipboardList },
            { href: '/academy/admin/students', label: t.academy?.students || 'الطلاب', icon: Users },
            { href: '/academy/admin/supervisors', label: t.academyAdmin?.supervision || 'الإشراف', icon: Shield },
            { href: '/academy/admin/users', label: t.admin?.users || 'المستخدمين', icon: Users },
            { href: '/academy/admin/invitations', label: t.academy?.invitations || 'الدعوات', icon: UserPlus },
          ]
        },
        {
          title: t.academyAdmin?.sidebarEngagement,
          items: [
            { href: '/academy/admin/competitions', label: t.academy?.competitions || 'المسابقات', icon: Trophy },
            { href: '/academy/admin/leaderboard', label: t.academy?.leaderboard || 'لوحة المتصدرين', icon: Star },
            { href: '/academy/admin/badges', label: t.academy?.badges || 'الشارات', icon: Award },
          ]
        },
        {
          title: t.academyAdmin?.sidebarCommunity,
          items: [
            { href: '/community/academy/admin', label: t.academy?.forum || 'المنتدى', icon: MessageSquare },
            { href: '/community/academy/admin/manage', label: t.academyAdmin?.sidebarManageForum, icon: Shield },
            { href: '/academy/admin/fiqh', label: t.academy?.fiqhQuestions || 'صندوق الأسئلة الفقهية', icon: HelpCircle },
            { href: '/academy/fiqh', label: t.academy?.fiqhLibrary || 'المكتبة الفقهية', icon: Library },
            { href: '/academy/library', label: t.academy?.booksLibrary || 'مكتبة الكتب (تصفح)', icon: BookOpen },
            { href: '/academy/admin/library/books', label: t.academyAdmin?.sidebarManageLibrary, icon: BookOpen },
            { href: '/academy/admin/announcements', label: t.admin?.announcements || 'الإعلانات', icon: Megaphone },
            { href: '/academy/admin/conversations', label: t.admin?.conversations || 'مركز المحادثات', icon: MessageSquare },
          ]
        },
        {
          title: t.academyAdmin?.sidebarHalaqatBroadcast,
          items: [
            { href: '/academy/admin/halaqat', label: t.academy?.halaqat || 'الحلقات', icon: GraduationCap },
            { href: '/academy/admin/video-settings', label: t.academyAdmin?.sidebarVideoSettings, icon: Video },
          ]
        },
        {
          title: t.admin?.settings || 'الإعدادات',
          items: [
            { href: '/academy/admin/certificates', label: t.academy?.certificatesCenter || t.academy?.certificates || 'مركز الشهادات', icon: Award },
            { href: '/academy/admin/access-control', label: t.academy?.accessControl || 'التحكم بالوصول', icon: Shield },
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
            { href: '/academy/parent/calendar', label: t.academy?.calendar || 'التقويم', icon: Calendar },
            { href: '/academy/parent/children', label: t.academy?.myChildren || 'أبنائي', icon: Users },
            { href: '/academy/parent/messages', label: t.academy?.chat || 'الرسائل', icon: MessageSquare },
            { href: '/community/academy/forum', label: t.academy?.forum || 'المنتدى', icon: MessageSquare },
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
            { href: '/community/academy/forum', label: t.academy?.forum || 'المنتدى', icon: MessageSquare },
            { href: '/community/academy/moderation', label: t.academy?.forumModeration || 'إشراف المنتدى', icon: ShieldCheck },
            { href: '/academy/fiqh-supervisor/questions', label: t.academy?.fiqhQuestions || 'الأسئلة الفقهية', icon: HelpCircle },
            { href: '/academy/fiqh', label: t.academy?.fiqhLibrary || 'المكتبة الفقهية', icon: Library },
            { href: '/academy/supervisor/teachers', label: t.academy?.teacherVerification || 'توثيق المدرسين', icon: UserCheck },

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
    },
    fiqh_questions_supervisor: {
      sections: [
        {
          items: [
            { href: '/academy/fiqh-supervisor', label: t.academyAdmin?.sidebarDashboard, icon: LayoutDashboard },
            { href: '/academy/fiqh-supervisor/questions', label: t.academyAdmin?.sidebarFiqhQuestions, icon: HelpCircle },
            { href: '/academy/fiqh', label: t.academyAdmin?.fiqhLibrary, icon: Library },
            { href: '/academy/fiqh-supervisor/messages', label: t.academyAdmin?.sidebarFiqhMessages, icon: MessageSquare },
            { href: '/community/academy/forum', label: t.academy?.forum || 'المنتدى', icon: MessageSquare },
          ]
        },
        {
          title: t.shell?.account || 'الحساب',
          items: [
            { href: '/academy/fiqh-supervisor/notifications', label: t.student?.notifications || 'الإشعارات', icon: Bell },
            { href: '/academy/fiqh-supervisor/profile', label: t.academyAdmin?.sidebarProfile, icon: User },
          ]
        }
      ],
      label: t.academyAdmin?.sidebarFiqhSupervisorTitle,
      name: t.academyAdmin?.sidebarFiqhSupervisorName,
      sublabel: t.academyAdmin?.sidebarFiqhSupervisorName
    },
    content_supervisor: {
      sections: [
        {
          title: t.main || 'الرئيسية',
          items: [
            { href: '/academy/content-supervisor', label: t.academyAdmin?.sidebarDashboard || 'لوحة التحكم', icon: LayoutDashboard },
          ]
        },
        {
          title: t.academyAdmin?.sidebarEducationalProcess || 'العملية التعليمية',
          items: [
            { href: '/academy/content-supervisor/lessons', label: t.academyAdmin?.sidebarContentLessons || 'الدروس', icon: BookOpen },
            { href: '/academy/content-supervisor/courses', label: t.academy?.courses || 'الدورات', icon: GraduationCap },
            { href: '/academy/content-supervisor/series', label: t.academy?.series || 'السلاسل', icon: Library },
            { href: '/academy/content-supervisor/paths', label: t.academy?.readerPaths || 'مسارات المقرئ', icon: Route },
            { href: '/academy/content-supervisor/academy-paths', label: t.academy?.academyPaths || 'مسارات الأكاديمية', icon: GraduationCap },
            { href: '/academy/content-supervisor/archive', label: t.academyAdmin?.sidebarContentArchive || 'أرشيف الدورات', icon: Archive },
          ]
        },
        {
          title: t.academyAdmin?.sidebarCommunity || 'المجتمع',
          items: [
            { href: '/academy/content-supervisor/messages', label: t.academyAdmin?.sidebarContentMessages || 'الرسائل', icon: MessageSquare },
            { href: '/community/academy/forum', label: t.academy?.forum || 'المنتدى', icon: MessageSquare },
            { href: '/community/academy/moderation', label: t.academy?.forumModeration || 'إشراف المنتدى', icon: ShieldCheck },
            { href: '/academy/fiqh', label: t.academy?.fiqhLibrary || 'المكتبة الفقهية', icon: Library },
            { href: '/academy/library', label: t.academy?.booksLibrary || 'مكتبة الكتب', icon: BookOpen },
          ]
        },
        {
          title: t.shell?.account || 'الحساب',
          items: [
            { href: '/academy/content-supervisor/notifications', label: t.student?.notifications || 'الإشعارات', icon: Bell },
            { href: '/academy/content-supervisor/profile', label: t.academyAdmin?.sidebarProfile, icon: User },
          ]
        }
      ],
      label: t.academyAdmin?.sidebarContentSupervisorTitle,
      name: t.academyAdmin?.sidebarContentSupervisorName,
      sublabel: t.academyAdmin?.sidebarContentSupervisorName
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
  adminMode?: 'super' | 'maqraa' | 'academy'
}

export function AcademyDashboardShell({
  role,
  children,
  headerTitle,
  showModeSwitcher = true,
  libraryRole = null,
  adminMode = 'academy'
}: AcademyDashboardShellProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { collapsed, toggle: toggleCollapsed } = useSidebarCollapsed()
  const { t } = useI18n()
  const [user, setUser] = useState<{
    name: string;
    email: string;
    role: string;
    avatar_url?: string | null;
    gender?: string;
    has_quran_access?: boolean;
    has_academy_access?: boolean;
    approval_status?: string;
  } | null>(null)
  const [unreadCount, setUnreadCount] = useState(0)
  const [unreadMessages, setUnreadMessages] = useState(0)
  const [pendingCerts, setPendingCerts] = useState(0)
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
          setUnreadMessages(data.messages || 0)
        }
      } catch { }
      // Pending certificate requests for the student.
      try {
        const r = await fetch('/api/academy/student/certificates/pending-count')
        if (r.ok) {
          const d = await r.json()
          setPendingCerts(d.count || 0)
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

  // Gate the sidebar: pending/rejected applicants see only the pending dashboard link.
  const isPendingApplicant =
    role === 'teacher' &&
    user?.approval_status &&
    ['pending_approval', 'rejected'].includes(user.approval_status)

  const config = isPendingApplicant
    ? {
        ...rawConfig,
        name: userName,
        sections: [
          {
            items: [
              {
                href: '/academy/pending',
                label: t.academy?.applicationStatus || 'طلب الانضمام',
                icon: ClipboardList,
              },
            ],
          },
        ] as NavSection[],
      }
    : { ...rawConfig, name: userName }

  // Inject unread direct message counts + pending-certificate badge
  // into the sidebar items.  When the student has data_required
  // certificate requests we also show a prominent "إكمال بيانات الشهادة"
  // entry just below the existing certificates link.
  const sectionsWithBadges = config.sections.map(section => {
    let items = section.items.map(item => {
      const isChat = item.href.endsWith('/chat') || item.href.endsWith('/conversations') || item.href.endsWith('/messages')
      if (isChat && unreadMessages > 0) {
        return { ...item, badge: unreadMessages }
      }
      if (item.href === '/academy/student/certificates' && pendingCerts > 0) {
        return { ...item, badge: pendingCerts }
      }
      return item
    })

    // Insert dedicated "complete certificate data" entry under the
    // existing certificates link when the student has pending data.
    if (role === 'academy_student' && pendingCerts > 0) {
      const idx = items.findIndex(i => i.href === '/academy/student/certificates')
      if (idx >= 0) {
        items = [
          ...items.slice(0, idx + 1),
          {
            href: '/academy/student/certificates#data-required',
            label: t.academy?.completeCertificateData || 'إكمال بيانات الشهادة',
            icon: Sparkles,
            badge: pendingCerts,
          } as NavItem,
          ...items.slice(idx + 1),
        ]
      }
    }

    return { ...section, items }
  })

  const finalConfig = { ...config, sections: sectionsWithBadges }

  const isActive = (href: string) => {
    const basePaths: Record<string, string> = {
      academy_student: '/academy/student',
      teacher: '/academy/teacher',
      academy_admin: '/academy/admin',
      parent: '/academy/parent',
      supervisor: '/academy/supervisor',
      fiqh_questions_supervisor: '/academy/fiqh-supervisor',
      content_supervisor: '/academy/content-supervisor',
    }
    const basePath = basePaths[role] || `/academy/${role}`
    return pathname === href || (href !== basePath && pathname.startsWith(href + '/'))
  }

  return (
    <div className={`theme-academy h-screen flex overflow-hidden bg-background transition-colors duration-500 ${user?.gender?.toLowerCase() === 'female' ? 'theme-female' : ''}`}>
      {/* Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <TooltipProvider delayDuration={150}>
      <aside className={cn(
        'fixed inset-y-0 right-0 z-50 flex flex-col transition-[width,transform] duration-200 lg:translate-x-0 lg:static shadow-sm',
        sidebarOpen ? 'translate-x-0' : 'translate-x-full',
        'bg-card border-l border-border',
        collapsed ? 'w-72 lg:w-20' : 'w-72'
      )}>
        {/* Top bar — AdminRoleSwitcher for admins, logo for others */}
        <div className={cn(
          'flex items-center gap-2 border-b border-border relative overflow-hidden shrink-0 min-h-16 py-3',
          'bg-gradient-to-l from-academy/5 to-transparent',
          collapsed ? 'lg:flex-col lg:justify-center lg:gap-2 lg:px-2 px-4' : 'px-4',
          showModeSwitcher && libraryRole === 'admin' ? 'justify-between' : 'justify-center'
        )}>
          {/* AdminRoleSwitcher — only for super admin, mirrors dashboard-shell exactly */}
          {showModeSwitcher && libraryRole === 'admin' && (
            <div className={cn('min-w-0', collapsed ? 'lg:w-full' : 'flex-1')}>
              <AdminRoleSwitcher currentMode={adminMode ?? 'academy'} collapsed={collapsed} />
            </div>
          )}

          {/* Logo — shown for non-admin roles only */}
          {!(showModeSwitcher && libraryRole === 'admin') && (
            <Link href="/" className={cn('block text-center w-full', collapsed ? 'px-0' : 'px-4')}>
              <span className={cn(
                "font-black text-primary leading-none tracking-tight",
                collapsed ? "text-2xl" : "text-3xl"
              )}>
                {collapsed ? "إ" : "إتقان"}
              </span>
            </Link>
          )}

          {/* Desktop collapse toggle — after switcher in DOM so renders to its left */}
          <button
            type="button"
            onClick={toggleCollapsed}
            className={cn(
              'hidden lg:flex items-center justify-center p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors shrink-0',
              !(showModeSwitcher && libraryRole === 'admin') && (collapsed ? 'absolute top-2 left-1/2 -translate-x-1/2' : 'absolute top-2 left-2')
            )}
            aria-label={collapsed ? (t.shell?.expandSidebar || 'Expand sidebar') : (t.shell?.collapseSidebar || 'Collapse sidebar')}
            title={collapsed ? (t.shell?.expandSidebar || 'Expand sidebar') : (t.shell?.collapseSidebar || 'Collapse sidebar')}
          >
            {collapsed ? <PanelLeftOpen className="w-4 h-4" /> : <PanelLeftClose className="w-4 h-4" />}
          </button>

          <button
            className="lg:hidden p-1 shrink-0"
            onClick={() => setSidebarOpen(false)}
            aria-label="close"
          >
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>

        {/* Navigation */}
        <nav className={cn('flex-1 overflow-y-auto overflow-x-hidden py-4 space-y-0.5', collapsed ? 'lg:px-2 px-4' : 'px-3')}>
          {finalConfig.sections.map((section, si) => {
            const sectionKey = `itqan_academy_nav_open_${section.title ?? si}`
            const sectionHasActive = section.items.some(i => isActive(i.href))
            return (
              <AcademyCollapsibleNavSection
                key={si}
                section={section}
                si={si}
                isCollapsedSidebar={collapsed}
                isActive={isActive}
                sectionKey={sectionKey}
                sectionHasActive={sectionHasActive}
                unreadCount={unreadCount}
                onLinkClick={() => setSidebarOpen(false)}
              />
            )
          })}
        </nav>

        {/* Bottom section */}
        <div className={cn('border-t border-border mt-auto', collapsed ? 'lg:p-2 p-4' : 'p-4')}>
          <div className={cn(
            'flex items-center rounded-xl mb-2 bg-muted/30 border border-border transition-colors',
            collapsed ? 'lg:justify-center lg:p-2 gap-3 px-4 py-3' : 'gap-3 px-4 py-3'
          )}>
            <div className="w-10 h-10 rounded-full overflow-hidden bg-academy/10 text-academy flex items-center justify-center font-bold text-sm ring-2 ring-background shadow-sm shrink-0">
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
            <div className={cn('flex-1 min-w-0', collapsed && 'lg:hidden')}>
              <p className="text-sm font-bold text-foreground truncate">{config.name}</p>
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider truncate">
                {config.sublabel}
              </p>
            </div>
          </div>

          {collapsed ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <Link
                  href="/"
                  className="hidden lg:flex items-center justify-center px-4 py-2 rounded-lg transition-colors text-sm text-muted-foreground hover:text-academy"
                >
                  <Globe className="w-4 h-4" />
                </Link>
              </TooltipTrigger>
              <TooltipContent side="left">{t.shell?.viewSite || 'عرض الموقع'}</TooltipContent>
            </Tooltip>
          ) : null}
          <Link
            href="/"
            className={cn(
              'flex items-center gap-3 px-4 py-2 rounded-lg transition-colors text-sm text-muted-foreground hover:text-academy',
              collapsed && 'lg:hidden'
            )}
          >
            <Globe className="w-4 h-4" />
            <span className="font-medium">{t.shell?.viewSite || 'عرض الموقع'}</span>
          </Link>
        </div>
      </aside>
      </TooltipProvider>

      {/* Main */}
      <div className="flex-1 flex flex-col h-full overflow-hidden min-w-0">
        <header className="h-16 border-b border-border flex items-center justify-between px-6 lg:px-8 bg-background/95 backdrop-blur-md z-10 sticky top-0">
          <div className="flex items-center gap-4">
            <button
              className="lg:hidden p-2 text-muted-foreground hover:text-academy"
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
            <ThemeToggle />
            <LanguageSwitcher variant="outline" />

            <NotificationDropdown
              // #27: Always route academy users to academy notifications pages
              // so they don't get redirected to the Qur'an side.
              role={
                role === 'academy_admin' ? 'academy/admin' :
                role === 'content_supervisor' ? 'academy/content-supervisor' :
                role === 'fiqh_questions_supervisor' ? 'academy/fiqh-supervisor' :
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
              <LogOut className="w-5 h-5 rtl:rotate-180" />
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
