"use client"

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { cn } from '@/lib/utils'
import { useI18n } from '@/lib/i18n/context'
import { LanguageSwitcher } from '@/components/language-switcher'
import { GlobalSearch } from '@/components/global-search'
import { NotificationDropdown } from '@/components/notification-dropdown'
import { ThemeToggle } from '@/components/theme-toggle'
import { ModeSwitcher } from '@/components/mode-switcher'
import {
  LayoutDashboard, Mic, FileText, Calendar, Bell, User, LogOut,
  Menu, X, Users, Settings, BarChart3, ClipboardList, Clock, MessageSquare,
  Search, Plus, BookOpen, Award, UserCheck, CalendarCheck, CalendarDays,
  MessagesSquare, Megaphone, ScrollText, PieChart, Star, Medal, ShieldCheck,
  Globe, Home, Archive, Shield, Phone, BookMarked, FileEdit, Route, Target, GraduationCap, Mail,
  Trophy, PanelLeftClose, PanelLeftOpen, Library, Video, ListChecks
} from 'lucide-react'
import { usePublicSettings } from '@/lib/hooks/use-public-settings'
import { useSidebarCollapsed } from '@/hooks/use-sidebar-collapsed'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'

type NavItem = { href: string; label: string; icon: React.ElementType; badge?: number | string | null }
type NavSection = { title?: string; items: NavItem[] }

const getRoleConfig = (t: any): Record<'student' | 'reader' | 'admin' | 'student_supervisor' | 'reciter_supervisor', { sections: NavSection[], label: string, name: string, sublabel: string }> => ({
  student: {
    sections: [
      {
        items: [
          { href: '/student', label: t.student.dashboard, icon: LayoutDashboard },
          { href: '/student/submit', label: t.student.submitTask || t.admin.sidebarSubmitTask, icon: Mic || null },
          { href: '/student/recitations', label: t.student.recitations, icon: FileText },
          { href: '/student/memorization-paths', label: t.student.memorizationPaths || t.admin.sidebarMemorizationPaths, icon: Route },
          { href: '/student/tajweed-paths', label: t.tajweedPaths?.tajweedTitle || t.admin.sidebarTajweedPaths, icon: GraduationCap },
          { href: '/student/mushaf', label: t.student.mushaf || t.admin.sidebarMyMushaf, icon: BookOpen },
          { href: '/student/mushaf-progress', label: t.admin.sidebarMushafMap, icon: Target },
          { href: '/student/competitions', label: t.admin.sidebarCompetitions, icon: Trophy },
          { href: '/student/sessions', label: t.student.sessions, icon: CalendarCheck },
          { href: '/student/halaqat', label: t.admin.sidebarMyHalaqat, icon: GraduationCap },
          { href: '/student/chat', label: t.student.chat, icon: MessageSquare },
          { href: '/student/certificates', label: t.student.certificates || t.student.certificate, icon: Award },
          { href: '/student/points', label: t.admin.sidebarMyPoints, icon: Star },
          { href: '/student/badges', label: t.admin.sidebarMyBadges, icon: Medal },
          { href: '/student/wird', label: t.admin.sidebarDailyWird, icon: BookMarked },
          { href: '/community/maqraa/forum', label: t.admin.sidebarMaqraaForum || t.admin.sidebarForum, icon: MessagesSquare },
          { href: '/academy/fiqh', label: t.admin.sidebarFiqhLibrary || t.academy?.fiqhLibrary, icon: Library },
          { href: '/library', label: t.admin.sidebarBooksLibrary || t.academy?.booksLibrary, icon: BookOpen },
        ]
      },
      {
        title: t.shell.account,
        items: [
          { href: '/student/family', label: t.admin.sidebarGuardianFamily, icon: Users },
          { href: '/student/notifications', label: t.student.notifications, icon: Bell },
          { href: '/student/profile', label: t.student.profile, icon: User },
        ]
      }
    ],
    label: t.shell?.studentPortal, name: t.auth.student, sublabel: t.auth.student
  },
  reader: {
    sections: [
      {
        items: [
          { href: '/reader', label: t.reader.dashboard, icon: LayoutDashboard },
          { href: '/reader/calendar', label: t.reader.calendar || t.admin.calendar, icon: Calendar },
          { href: '/reader/recitations', label: t.reader.reviewList, icon: ClipboardList },
          { href: '/reader/students', label: t.admin.sidebarMyStudents, icon: Users },
          { href: '/reader/enrollment-requests', label: t.admin.sidebarEnrollmentRequests, icon: UserCheck },
          { href: '/reader/memorization-paths', label: t.reader.memorizationPaths?.title || t.admin.sidebarMemorizationPaths, icon: Route },
          { href: '/reader/learning-paths', label: t.admin.sidebarLearningPaths, icon: GraduationCap },
          { href: '/reader/competitions', label: t.admin.sidebarJudgeCompetitions, icon: Trophy },
          { href: '/reader/sessions', label: t.reader.sessions || t.admin.sidebarMySessions, icon: Calendar },
          { href: '/reader/halaqat', label: t.admin.sidebarMyHalaqat, icon: GraduationCap },
          { href: '/reader/certificates', label: t.admin.sidebarCertificatesCenter, icon: Award },
          { href: '/reader/schedule', label: t.reader.schedule, icon: Clock },
          { href: '/reader/chat', label: t.reader.chat, icon: MessageSquare },
          { href: '/reader/parent-messages', label: t.admin.sidebarParentMessages, icon: Mail },
          { href: '/community/maqraa/forum', label: t.admin.sidebarMaqraaForum || t.admin.sidebarForum, icon: MessagesSquare },
          { href: '/academy/fiqh', label: t.admin.sidebarFiqhLibrary || t.academy?.fiqhLibrary, icon: Library },
          { href: '/library', label: t.admin.sidebarBooksLibrary || t.academy?.booksLibrary, icon: BookOpen },
          { href: '/reader/notifications', label: t.student.notifications, icon: Bell },
          { href: '/reader/profile', label: t.reader.profile, icon: User },
        ]
      }
    ],
    label: t.shell?.certifiedReader, name: t.shell?.certifiedReader, sublabel: t.shell?.certifiedReader
  },
  admin: {
    sections: [
      {
        title: t.main, items: [
          { href: '/admin', label: t.admin.dashboard, icon: LayoutDashboard },
        ]
      },
      {
        title: t.admin.sidebarUsersPermissions, items: [
          { href: '/admin/users', label: t.admin.users, icon: Users },
          { href: '/admin/supervisors', label: t.admin.sidebarManageSupervisors, icon: Shield },
          { href: '/admin/invitations', label: t.admin.sidebarInvitations || t.admin.invitations, icon: Mail },
          { href: '/admin/readers', label: t.admin.readers, icon: BookOpen },
          { href: '/admin/reader-applications', label: t.admin.readerApplications, icon: UserCheck },
        ]
      },
      {
        title: t.admin.sidebarEducationalProcess, items: [
          { href: '/admin/recitations', label: t.admin.recitations, icon: FileText },
          { href: '/academy/admin/competitions', label: t.admin.sidebarAcademyCompetitions || 'مسابقات الأكاديمية', icon: Trophy },
          { href: '/admin/memorization-paths', label: t.admin.sidebarMemorizationPaths || t.admin.memorizationPaths, icon: Route },
          { href: '/admin/tajweed-paths', label: t.admin.sidebarTajweedPaths || t.tajweedPaths?.tajweedTitle, icon: GraduationCap },
          { href: '/admin/bookings', label: t.admin.bookings, icon: CalendarDays },
          { href: '/admin/halaqat', label: t.admin.sidebarHalaqat, icon: GraduationCap },
          { href: '/admin/video-settings', label: t.admin.sidebarVideoBroadcast, icon: Video },
          { href: '/admin/certificates', label: t.admin.certificates.title, icon: Award },
        ]
      },
      {
        title: t.admin.sidebarCommunity, items: [
          { href: '/admin/competitions', label: t.admin.sidebarCompetitions, icon: Trophy },
          { href: '/admin/conversations', label: t.admin.conversations, icon: MessagesSquare },
          { href: '/community/maqraa/admin', label: t.admin.sidebarForum, icon: MessagesSquare },
          { href: '/community/maqraa/admin/manage', label: t.admin.sidebarManageForum, icon: Shield },
          { href: '/academy/fiqh', label: t.admin.sidebarFiqhLibrary || t.academy?.fiqhLibrary, icon: Library },
          { href: '/admin/library/books', label: t.admin.sidebarBooksLibrary || t.academy?.booksLibrary, icon: BookOpen },
        ]
      },
      {
        title: t.shell.statsAndReports, items: [
          { href: '/admin/reports', label: t.admin.reports, icon: BarChart3 },
          { href: '/admin/activity-logs', label: t.admin.activityLogs, icon: ScrollText },
        ]
      },
      {
        title: t.admin.settings, items: [
          { href: '/admin/notifications', label: t.student.notifications, icon: Bell },
          { href: '/admin/announcements', label: t.admin.announcements, icon: Megaphone },
          { href: '/admin/email-templates', label: t.admin.emailTemplates, icon: ScrollText },
          { href: '/admin/settings', label: t.admin.systemSettings, icon: Settings },
        ]
      },
      {
        title: t.shell.advancedTools, items: [
          { href: '/admin/homepage', label: t.admin.homepage, icon: Home },
          { href: '/admin/seo', label: t.admin.seo, icon: Globe },
          { href: '/admin/security', label: t.admin.security, icon: Shield },
          { href: '/admin/backup', label: t.admin.backup, icon: Archive },
        ]
      },
    ],
    label: t.shell?.generalSupervisor, name: t.shell?.generalSupervisor, sublabel: t.shell?.generalSupervisor
  },
  student_supervisor: {
    sections: [
      {
        items: [
          { href: '/admin', label: t.admin.dashboard, icon: LayoutDashboard },
          { href: '/admin/supervisor-tasks', label: t.admin.sidebarSupervisorTasks, icon: ListChecks },
          { href: '/admin/users', label: t.admin.users, icon: Users },
          { href: '/admin/recitations', label: t.admin.recitations, icon: FileText },
          { href: '/academy/admin/competitions', label: t.admin.sidebarCompetitions || t.academy?.competitions, icon: Trophy },
          { href: '/admin/conversations', label: t.admin.conversations, icon: MessagesSquare },
          { href: '/community/maqraa/forum', label: t.admin.sidebarForum || t.academy?.forum, icon: MessagesSquare },
          { href: '/academy/fiqh', label: t.admin.sidebarFiqhLibrary || t.academy?.fiqhLibrary, icon: Library },
        ]
      },
      {
        title: t.shell.account,
        items: [
          { href: '/admin/activity-logs', label: t.admin.sidebarActivityLog, icon: ScrollText },
          { href: '/admin/profile', label: t.student.profile, icon: User },
        ]
      }
    ],
    label: t.auth.studentSupervisor, name: t.auth.studentSupervisor, sublabel: t.auth.studentSupervisor
  },
  reciter_supervisor: {
    sections: [
      {
        items: [
          { href: '/admin', label: t.admin.dashboard, icon: LayoutDashboard },
          { href: '/admin/supervisor-tasks', label: t.admin.sidebarSupervisorTasks, icon: ListChecks },
          { href: '/admin/readers', label: t.admin.readers, icon: BookOpen },
          { href: '/admin/reader-applications', label: t.admin.readerApplications, icon: UserCheck },
          { href: '/admin/recitations', label: t.admin.recitations, icon: FileText },
          { href: '/admin/competitions', label: t.admin.sidebarCompetitions, icon: Trophy },
          { href: '/admin/conversations', label: t.admin.conversations, icon: MessagesSquare },
          { href: '/community/maqraa/forum', label: t.admin.sidebarForum || t.academy?.forum, icon: MessagesSquare },
          { href: '/community/maqraa/admin/manage', label: t.admin.sidebarManageForum, icon: Shield },
          { href: '/academy/fiqh', label: t.admin.sidebarFiqhLibrary || t.academy?.fiqhLibrary, icon: Library },
        ]
      },
      {
        title: t.shell.account,
        items: [
          { href: '/admin/activity-logs', label: t.admin.sidebarActivityLog, icon: ScrollText },
          { href: '/admin/profile', label: t.student.profile, icon: User },
        ]
      }
    ],
    label: t.auth.reciterSupervisor, name: t.auth.reciterSupervisor, sublabel: t.auth.reciterSupervisor
  }
})

export function DashboardShell({ role, children, headerTitle }: { role: 'student' | 'reader' | 'admin' | 'student_supervisor' | 'reciter_supervisor'; children: React.ReactNode; headerTitle?: string }) {
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
    academy_role?: string | null;
    has_quran_access?: boolean;
    has_academy_access?: boolean;
    approval_status?: string;
  } | null>(null)
  const [unreadCount, setUnreadCount] = useState(0)
  const [unreadMessages, setUnreadMessages] = useState(0)
  const [pendingCerts, setPendingCerts] = useState(0)
  const [supervisorTasks, setSupervisorTasks] = useState(0)
  const [avatarError, setAvatarError] = useState(false)
  const { branding } = usePublicSettings()

  // Heartbeat to track online presence
  useEffect(() => {
    const pingHeartbeat = async () => {
      try {
        await fetch('/api/auth/heartbeat', { method: 'POST' })
      } catch (e) { }
    }

    // Initial ping on load
    pingHeartbeat()

    // Ping every 2 minutes while dashboard is open
    const interval = setInterval(pingHeartbeat, 2 * 60 * 1000)
    return () => clearInterval(interval)
  }, [])

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
      // Pending certificate requests for the maqraa student.
      try {
        const r = await fetch('/api/student/certificates/pending-count')
        if (r.ok) {
          const d = await r.json()
          setPendingCerts(d.count || 0)
        }
      } catch { }
      // Pending action items for supervisors.
      try {
        const st = await fetch('/api/admin/supervisor-tasks')
        if (st.ok) {
          const d = await st.json()
          setSupervisorTasks(d.total || 0)
        }
      } catch { }
    }
    fetchUser()
    fetchCounts()
    const interval = setInterval(fetchCounts, 30000)
    return () => clearInterval(interval)
  }, [])

  const rawConfig = getRoleConfig(t)[role]

  // Inject unread direct message counts + pending-certificate badge
  // into the sidebar items. When the maqraa student has data_required
  // certificate requests we also surface a dedicated
  // "إكمال بيانات الشهادة" entry below /student/certificates.
  const sectionsWithBadges = rawConfig.sections.map(section => {
    let items = section.items.map(item => {
      const isChat = item.href.endsWith('/chat') || item.href.endsWith('/conversations')
      if (isChat && unreadMessages > 0) {
        return { ...item, badge: unreadMessages }
      }
      if (item.href === '/student/certificates' && pendingCerts > 0) {
        return { ...item, badge: pendingCerts }
      }
      if (item.href === '/admin/supervisor-tasks' && supervisorTasks > 0) {
        return { ...item, badge: supervisorTasks > 99 ? '99+' : supervisorTasks }
      }
      return item
    })
    if (role === 'student' && pendingCerts > 0) {
      const idx = items.findIndex(i => i.href === '/student/certificates')
      if (idx >= 0) {
        items = [
          ...items.slice(0, idx + 1),
          {
            href: '/student/certificates#data-required',
            label: t.admin.sidebarCompleteCertData,
            icon: Award,
            badge: pendingCerts,
          } as NavItem,
          ...items.slice(idx + 1),
        ]
      }
    }
    return { ...section, items }
  })

  const userName = user?.name || rawConfig.name

  // Gate the sidebar: pending/rejected reader applicants see only the application link.
  const isPendingReader =
    role === 'reader' &&
    user?.approval_status &&
    ['pending_approval', 'rejected'].includes(user.approval_status)

  const config = isPendingReader
    ? {
        ...rawConfig,
        name: userName,
        sections: [
          {
            items: [
              { href: '/reader/pending', label: t.reader?.applicationStatus || t.admin.sidebarJoinApplication, icon: FileEdit },
            ],
          },
        ] as NavSection[],
      }
    : { ...rawConfig, name: userName, sections: sectionsWithBadges }
  const isReader = role === 'reader'

  const sidebarBase = 'bg-card border-l border-border'

  const isActive = (href: string) => pathname === href || (href !== `/${role}` && pathname.startsWith(href + '/'))

  return (
    <div className={cn(
      "h-screen flex overflow-hidden bg-background transition-colors duration-500",
      isReader && "theme-islamic",
      (role === 'admin' || role === 'student' || role === 'reader' || role === 'student_supervisor' || role === 'reciter_supervisor') && "admin-theme"
    )}>
      {/* Overlay */}
      {sidebarOpen && <div className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm lg:hidden" onClick={() => setSidebarOpen(false)} />}

      {/* Sidebar */}
      <TooltipProvider delayDuration={150}>
      <aside className={cn(
        'fixed inset-y-0 right-0 z-50 flex flex-col transition-[width,transform] duration-200 lg:translate-x-0 lg:static shadow-sm',
        sidebarOpen ? 'translate-x-0' : 'translate-x-full',
        'bg-card border-l border-border',
        // On mobile we keep the full-width drawer; collapse only affects lg+.
        collapsed ? 'w-72 lg:w-20' : 'w-72'
      )}>
        <div className={cn(
          'flex items-center border-b border-border relative overflow-hidden shrink-0',
          isReader ? 'bg-primary/5' : 'bg-card',
          collapsed ? 'lg:justify-center lg:px-2' : 'justify-center',
          role === 'student' ? 'h-20' : 'h-16'
        )}>
          <Link href="/" className={cn('block text-center w-full', collapsed ? 'px-0' : 'px-4')}>
            <span className={cn(
              "font-black text-primary leading-none tracking-tight",
              collapsed ? "text-2xl" : "text-3xl"
            )}>
              {collapsed ? "إ" : t.appName}
            </span>
          </Link>

          {/* Desktop collapse toggle */}
          <button
            type="button"
            onClick={toggleCollapsed}
            className={cn(
              'hidden lg:flex items-center justify-center p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors',
              collapsed ? 'absolute top-2 left-1/2 -translate-x-1/2' : 'absolute top-2 left-2'
            )}
            aria-label={collapsed ? (t.shell?.expandSidebar || 'Expand sidebar') : (t.shell?.collapseSidebar || 'Collapse sidebar')}
            title={collapsed ? (t.shell?.expandSidebar || 'Expand sidebar') : (t.shell?.collapseSidebar || 'Collapse sidebar')}
          >
            {collapsed ? <PanelLeftOpen className="w-4 h-4" /> : <PanelLeftClose className="w-4 h-4" />}
          </button>

          <button className="lg:hidden p-1" onClick={() => setSidebarOpen(false)} aria-label="close">
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>

        {/* Navigation */}
        <nav className={cn('flex-1 overflow-y-auto overflow-x-hidden py-6 space-y-1', collapsed ? 'lg:px-2 px-4' : 'px-4')}>
          {config.sections.map((section, si) => (
            <div key={si}>
              {section.title && (
                <div className={cn(
                  'text-[10px] font-bold uppercase tracking-widest mb-4 px-3 text-muted-foreground/60',
                  si > 0 && 'mt-8',
                  collapsed && 'lg:hidden'
                )}>
                  {section.title}
                </div>
              )}
              {section.items.map((item) => {
                const active = isActive(item.href)
                const badgeNode = item.badge ? (
                  <span className="mr-auto bg-destructive text-destructive-foreground text-[10px] px-1.5 py-0.5 rounded-full min-w-[18px] text-center font-bold animate-pulse">{item.badge}</span>
                ) : (item.label === t.student.notifications || item.label === t.notifications.title || item.href.includes('notifications')) ? (
                  unreadCount > 0 && (
                    <span className="mr-auto bg-destructive text-destructive-foreground text-[10px] px-1.5 py-0.5 rounded-full min-w-[18px] text-center font-bold animate-pulse">
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                  )
                ) : null
                const collapsedDot = item.badge
                  ? item.badge
                  : ((item.label === t.student.notifications || item.label === t.notifications.title || item.href.includes('notifications')) && unreadCount > 0)
                    ? (unreadCount > 99 ? '99+' : unreadCount)
                    : null
                const linkEl = (
                  <Link key={item.href} href={item.href} onClick={() => setSidebarOpen(false)}
                    className={cn(
                      'flex items-center gap-3 rounded-xl transition-all text-sm group relative',
                      collapsed ? 'lg:justify-center lg:px-0 lg:py-3 px-4 py-3' : 'px-4 py-3',
                      active
                        ? 'bg-primary/10 text-primary font-bold shadow-sm'
                        : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                    )}
                  >
                    <item.icon className={cn("w-5 h-5 shrink-0 transition-transform duration-200", active && "scale-110")} />
                    <span className={cn('font-medium', collapsed && 'lg:hidden')}>{item.label}</span>
                    {!collapsed && badgeNode}
                    {collapsed && collapsedDot != null && (
                      <span className="hidden lg:flex absolute -top-1 -left-1 bg-destructive text-destructive-foreground text-[9px] leading-none px-1 py-0.5 rounded-full min-w-[16px] h-[16px] items-center justify-center font-bold">{collapsedDot}</span>
                    )}
                    {active && <div className={cn('absolute right-0 w-1 h-6 bg-primary rounded-l-full', collapsed && 'lg:hidden')} />}
                  </Link>
                )
                if (collapsed) {
                  return (
                    <Tooltip key={item.href}>
                      <TooltipTrigger asChild>{linkEl}</TooltipTrigger>
                      <TooltipContent side="left" className="hidden lg:block">{item.label}</TooltipContent>
                    </Tooltip>
                  )
                }
                return linkEl
              })}
            </div>
          ))}
        </nav>

        {/* Bottom section */}
        <div className={cn('border-t border-border mt-auto', collapsed ? 'lg:p-2 p-4' : 'p-4')}>
          <div className={cn(
            'flex items-center rounded-xl mb-2 bg-muted/30 border border-border transition-colors',
            collapsed ? 'lg:justify-center lg:p-2 gap-3 px-4 py-3' : 'gap-3 px-4 py-3'
          )}>
            <div className="w-10 h-10 rounded-full overflow-hidden bg-primary/10 text-primary flex items-center justify-center font-bold text-sm ring-2 ring-background shadow-sm shrink-0">
              {user?.avatar_url && !avatarError ? (
                <img src={user.avatar_url} alt={config.name} className="w-full h-full object-cover" onError={() => setAvatarError(true)} />
              ) : (
                <span>{(config.name || t.userFallbackLetter || 'U')[0]}</span>
              )}
            </div>
            <div className={cn('flex-1 min-w-0', collapsed && 'lg:hidden')}>
              <p className="text-sm font-bold text-foreground truncate">{config.name}</p>
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider truncate">{config.sublabel}</p>
            </div>
          </div>

          {collapsed ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <Link href="/" className="hidden lg:flex items-center justify-center px-4 py-2 rounded-lg transition-colors text-sm text-muted-foreground hover:text-primary">
                  <Globe className="w-4 h-4" />
                </Link>
              </TooltipTrigger>
              <TooltipContent side="left">{t.shell.viewSite}</TooltipContent>
            </Tooltip>
          ) : null}
          <Link href="/" className={cn(
            'flex items-center gap-3 px-4 py-2 rounded-lg transition-colors text-sm text-muted-foreground hover:text-primary',
            collapsed && 'lg:hidden'
          )}>
            <Globe className="w-4 h-4" />
            <span className="font-medium">{t.shell.viewSite}</span>
          </Link>
        </div>
      </aside>
      </TooltipProvider>

      {/* Main */}
      <div className="flex-1 flex flex-col h-full overflow-hidden min-w-0">
        <header className={cn(
          'border-b border-border flex items-center justify-between px-6 lg:px-8 bg-background/95 backdrop-blur-md z-10 sticky top-0',
          role === 'student' ? 'h-20' : 'h-16'
        )}>
          <div className="flex items-center gap-4">
            <button className="lg:hidden p-2 text-muted-foreground hover:text-primary" onClick={() => setSidebarOpen(true)} aria-label="open menu">
              <Menu className="w-5 h-5" />
            </button>
            <h2 className="text-xl font-bold text-foreground hidden lg:block">{headerTitle || config.label}</h2>
          </div>
          <div className="flex items-center gap-4">
            {role !== 'student' && (
              <div className="hidden md:block">
                <GlobalSearch role={role as 'admin' | 'reader'} />
              </div>
            )}
            <ModeSwitcher
              currentMode="library"
              userRole={role}
              academyRole={user?.academy_role}
              hasQuranAccess={user?.has_quran_access}
              hasAcademyAccess={user?.has_academy_access}
            />
            <ThemeToggle />
            <LanguageSwitcher variant="outline" />

            <NotificationDropdown
              role={role}
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
