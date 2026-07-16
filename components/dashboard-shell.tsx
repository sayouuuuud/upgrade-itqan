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
import { AdminModeBanner } from '@/components/admin/admin-mode-banner'
import { AdminRoleSwitcher } from '@/components/admin/admin-role-switcher'
import { AdminOnboardingTour } from '@/components/admin/admin-onboarding-tour'
import { Palette, Sparkles, Grid, UserPlus, HelpCircle, ChevronDown } from 'lucide-react'

type NavItem = { href: string; label: string; icon: React.ElementType; badge?: number | string | null }
type NavSection = { title?: string; items: NavItem[] }

/**
 * Wrap regular dashboard pages with this to get consistent padding.
 * Pages that need a full-bleed sticky header (like admin/homepage) should
 * NOT use this wrapper — they manage their own layout instead.
 */
export function DashboardPageWrapper({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn('p-6 lg:p-8', className)}>{children}</div>
}

const getRoleConfig = (t: any): Record<'student' | 'reader' | 'admin' | 'student_supervisor' | 'reciter_supervisor', { sections: NavSection[], label: string, name: string, sublabel: string }> => ({
  student: {
    sections: [
      {
        title: t.main || 'الرئيسية',
        items: [
          { href: '/student', label: t.student.dashboard, icon: LayoutDashboard },
          { href: '/student/wird', label: t.admin.sidebarDailyWird, icon: BookMarked },
        ]
      },
      {
        title: t.admin.sidebarEducationalProcess || 'التلاوة والتعليم',
        items: [
          { href: '/student/submit', label: t.student.submitTask || t.admin.sidebarSubmitTask, icon: Mic || null },
          { href: '/student/recitations', label: t.student.recitations, icon: FileText },
          { href: '/student/memorization-paths', label: t.student.memorizationPaths || t.admin.sidebarMemorizationPaths, icon: Route },
          { href: '/student/tajweed-paths', label: t.tajweedPaths?.tajweedTitle || t.admin.sidebarTajweedPaths, icon: GraduationCap },
          { href: '/student/mushaf', label: t.student.mushaf || t.admin.sidebarMyMushaf, icon: BookOpen },
          { href: '/student/mushaf-progress', label: t.admin.sidebarMushafMap, icon: Target },
          { href: '/student/sessions', label: t.student.sessions, icon: CalendarCheck },
          { href: '/student/halaqat', label: t.admin.sidebarMyHalaqat, icon: GraduationCap },
        ]
      },
      {
        title: t.shell?.statsAndReports || 'الإنجازات',
        items: [
          { href: '/student/certificates', label: t.student.certificates || t.student.certificate, icon: Award },
          { href: '/student/points', label: t.admin.sidebarMyPoints, icon: Star },
          { href: '/student/badges', label: t.admin.sidebarMyBadges, icon: Medal },
          { href: '/student/competitions', label: t.admin.sidebarCompetitions, icon: Trophy },
        ]
      },
      {
        title: t.admin.sidebarCommunity || 'المجتمع والمكتبة',
        items: [
          { href: '/student/chat', label: t.student.chat, icon: MessageSquare },
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
        title: t.main || 'الرئيسية',
        items: [
          { href: '/reader', label: t.reader.dashboard, icon: LayoutDashboard },
          { href: '/reader/calendar', label: t.reader.calendar || t.admin.calendar, icon: Calendar },
          { href: '/reader/schedule', label: t.reader.schedule, icon: Clock },
        ]
      },
      {
        title: t.admin.sidebarEducationalProcess || 'الطلاب والجلسات',
        items: [
          { href: '/reader/recitations', label: t.reader.reviewList, icon: ClipboardList },
          { href: '/reader/students', label: t.admin.sidebarMyStudents, icon: Users },
          { href: '/reader/enrollment-requests', label: t.admin.sidebarEnrollmentRequests, icon: UserCheck },
          { href: '/reader/sessions', label: t.reader.sessions || t.admin.sidebarMySessions, icon: Calendar },
          { href: '/reader/halaqat', label: t.admin.sidebarMyHalaqat, icon: GraduationCap },
          { href: '/reader/certificates', label: t.admin.sidebarCertificatesCenter, icon: Award },
          { href: '/reader/competitions', label: t.admin.sidebarJudgeCompetitions, icon: Trophy },
        ]
      },
      {
        title: t.admin.sidebarUsersPermissions || 'المسارات والمحتوى',
        items: [
          { href: '/reader/memorization-paths', label: t.reader.memorizationPaths?.title || t.admin.sidebarMemorizationPaths, icon: Route },
          { href: '/reader/learning-paths', label: t.admin.sidebarLearningPaths, icon: GraduationCap },
        ]
      },
      {
        title: t.admin.sidebarCommunity || 'المجتمع والمكتبة',
        items: [
          { href: '/reader/chat', label: t.reader.chat, icon: MessageSquare },
          { href: '/reader/parent-messages', label: t.admin.sidebarParentMessages, icon: Mail },
          { href: '/community/maqraa/forum', label: t.admin.sidebarMaqraaForum || t.admin.sidebarForum, icon: MessagesSquare },
          { href: '/academy/fiqh', label: t.admin.sidebarFiqhLibrary || t.academy?.fiqhLibrary, icon: Library },
          { href: '/library', label: t.admin.sidebarBooksLibrary || t.academy?.booksLibrary, icon: BookOpen },
        ]
      },
      {
        title: t.shell.account,
        items: [
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
        title: t.main || 'الرئيسية',
        items: [
          { href: '/admin', label: t.admin.dashboard, icon: LayoutDashboard },
          { href: '/admin/supervisor-tasks', label: t.admin.sidebarSupervisorTasks, icon: ListChecks },
        ]
      },
      {
        title: t.admin.sidebarEducationalProcess || 'الإشراف التعليمي',
        items: [
          { href: '/admin/users', label: t.admin.users, icon: Users },
          { href: '/admin/recitations', label: t.admin.recitations, icon: FileText },
          { href: '/admin/competitions', label: t.admin.sidebarCompetitions || t.academy?.competitions, icon: Trophy },
        ]
      },
      {
        title: t.admin.sidebarCommunity || 'المجتمع والمكتبة',
        items: [
          { href: '/admin/conversations', label: t.admin.conversations, icon: MessagesSquare },
          { href: '/community/maqraa/forum', label: t.admin.sidebarForum || t.academy?.forum, icon: MessagesSquare },
          { href: '/academy/fiqh', label: t.admin.sidebarFiqhLibrary || t.academy?.fiqhLibrary, icon: Library },
        ]
      },
      {
        title: t.shell.account,
        items: [
          { href: '/admin/notifications', label: t.student.notifications, icon: Bell },
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
        title: t.main || 'الرئيسية',
        items: [
          { href: '/admin', label: t.admin.dashboard, icon: LayoutDashboard },
          { href: '/admin/supervisor-tasks', label: t.admin.sidebarSupervisorTasks, icon: ListChecks },
        ]
      },
      {
        title: t.admin.sidebarEducationalProcess || 'إشراف القراء',
        items: [
          { href: '/admin/readers', label: t.admin.readers, icon: BookOpen },
          { href: '/admin/reader-applications', label: t.admin.readerApplications, icon: UserCheck },
          { href: '/admin/recitations', label: t.admin.recitations, icon: FileText },
          { href: '/admin/competitions', label: t.admin.sidebarCompetitions, icon: Trophy },
        ]
      },
      {
        title: t.admin.sidebarCommunity || 'المجتمع والمكتبة',
        items: [
          { href: '/admin/conversations', label: t.admin.conversations, icon: MessagesSquare },
          { href: '/community/maqraa/forum', label: t.admin.sidebarForum || t.academy?.forum, icon: MessagesSquare },
          { href: '/community/maqraa/admin/manage', label: t.admin.sidebarManageForum, icon: Shield },
          { href: '/academy/fiqh', label: t.admin.sidebarFiqhLibrary || t.academy?.fiqhLibrary, icon: Library },
        ]
      },
      {
        title: t.shell.account,
        items: [
          { href: '/admin/notifications', label: t.student.notifications, icon: Bell },
          { href: '/admin/activity-logs', label: t.admin.sidebarActivityLog, icon: ScrollText },
          { href: '/admin/profile', label: t.student.profile, icon: User },
        ]
      }
    ],
    label: t.auth.reciterSupervisor, name: t.auth.reciterSupervisor, sublabel: t.auth.reciterSupervisor
  }
})

type ShellConfig = { sections: NavSection[]; label: string; name: string; sublabel: string }

// ── Super Admin (governance) ────────────────────────────────────────────────
// Platform-wide governance only. No operational maqraa/academy items — the
// Super Admin switches the mode from the segmented control to manage those.
const getSuperConfig = (t: any): ShellConfig => ({
  sections: [
    {
      title: t.main,
      items: [
        { href: '/admin', label: t.admin.dashboard, icon: LayoutDashboard },
        { href: '/admin/analytics', label: t.locale === 'ar' ? 'نظرة عامة على المنصة' : 'Platform Overview', icon: PieChart },
      ],
    },
    {
      title: t.locale === 'ar' ? 'هوية الموقع' : 'Site Identity',
      items: [
        { href: '/admin/homepage',      label: t.locale === 'ar' ? 'الصفحة الرئيسية' : 'Homepage', icon: Home },
        { href: '/admin/seo',           label: t.locale === 'ar' ? 'SEO والميتا داتا' : 'SEO & Metadata', icon: Globe },
        { href: '/admin/theme',         label: t.locale === 'ar' ? 'التصميم والألوان' : 'Theme Editor', icon: Palette },
        { href: '/admin/branding',      label: t.locale === 'ar' ? 'الهوية البصرية' : 'Branding', icon: Sparkles },
        { href: '/admin/content-pages', label: t.locale === 'ar' ? 'صفحات المحتوى الثابت' : 'Static Content Pages', icon: FileText },
      ],
    },
    {
      title: t.locale === 'ar' ? 'الحوكمة والصلاحيات' : 'Governance & Permissions',
      items: [
        { href: '/admin/users',           label: t.admin.users, icon: Users },
        { href: '/admin/role-management', label: t.locale === 'ar' ? 'إدارة الأدوار' : 'Role Management',  icon: ShieldCheck },
        { href: '/admin/security',        label: t.locale === 'ar' ? 'الأمان' : 'Security', icon: Shield },
        { href: '/admin/audit-log',       label: t.locale === 'ar' ? 'سجل التدقيق الموحد' : 'Unified Audit Log', icon: ScrollText },
      ],
    },
    {
      // Forum moderation is centralised under the Super Admin.
      title: t.locale === 'ar' ? 'إدارة المنتدى' : 'Forum Management',
      items: [
        { href: '/community/academy/admin/manage', label: t.locale === 'ar' ? 'إدارة المنتدى' : 'Manage Forum', icon: MessagesSquare },
      ],
    },
    {
      title: t.locale === 'ar' ? 'إعدادات المنصة' : 'Platform Settings',
      items: [
        { href: '/admin/settings',         label: t.admin?.systemSettings || 'إعدادات النظام', icon: Settings },
        { href: '/admin/email-templates',  label: t.admin?.emailTemplates || 'قوالب البري��', icon: ScrollText },
      ],
    },
    {
      title: t.locale === 'ar' ? 'الإشراف والمراقبة' : 'Supervision & Monitoring',
      items: [
        { href: '/admin/backup', label: t.locale === 'ar' ? 'النسخ الاحتياطي' : 'System Backup', icon: Archive },
      ],
    },
    {
      title: t.shell.account,
      items: [
        { href: '/admin/notifications', label: t.student.notifications, icon: Bell },
        { href: '/admin/profile',       label: t.student.profile,       icon: User },
      ],
    },
  ],
  label: 'المدير العام', name: 'المدير العام', sublabel: 'المدير العام',
})

// ── Maqraa mode ────────────────────────���─────────────────────────────���─���──��─
// The classic admin sidebar, minus every platform-wide / general item that now
// lives exclusively in the Super Admin (super mode) sidebar — so nothing is
// duplicated across modes. Site identity (homepage/seo), security, backup,
// global user management and general platform settings all belong to super.
const MAQRAA_EXCLUDED_HREFS = [
  '/admin/homepage',
  '/admin/seo',
  '/admin/security',
  '/admin/backup',
  '/admin/users',
  '/admin/settings',
  '/admin/email-templates',
  // Academy-only content — these live under /academy and must not leak into
  // the Maqraa sidebar.
  '/academy/fiqh',
  '/academy/admin/competitions',
  '/academy/admin/leaderboard',
  '/academy/admin/badges',
]
const getMaqraaConfig = (t: any): ShellConfig => {
  const admin = getRoleConfig(t).admin
  const sections = admin.sections
    .map((s) => ({ ...s, items: s.items.filter((i) => !MAQRAA_EXCLUDED_HREFS.includes(i.href)) }))
    .filter((s) => s.items.length > 0)
  // Maqraa-specific settings live under /maqraah/admin/settings (specialised
  // settings only — global/system settings belong to the Super Admin).
  sections.push({
    title: t.locale === 'ar' ? 'إعدادات المقرأة' : 'Maqraa Settings',
    items: [
      { href: '/maqraah/admin/settings', label: t.locale === 'ar' ? 'إعدادات المقرأة' : 'Maqraa Settings', icon: Settings },
    ],
  })
  return { sections, label: 'مدير المقرأة', name: 'مدير المقرأة', sublabel: 'مدير المقرأة' }
}

// ── Academy mode ────────────────────────────────────────────────────────────
// Mirrors the classic academy_admin sidebar (links stay under /academy/admin/…
// where the working pages live).
const getAcademyConfig = (t: any): ShellConfig => ({
  sections: [
    {
      title: t.main || 'الر��يسية',
      items: [
        { href: '/academy/admin', label: t.academy?.dashboard || 'لوحة التحكم', icon: LayoutDashboard },
        { href: '/academy/admin/analytics', label: t.academy?.analytics || 'التحليلات', icon: BarChart3 },
      ],
    },
    {
      title: t.academyAdmin?.sidebarEducationalProcess,
      items: [
        { href: '/academy/admin/courses', label: t.academy?.courses || 'الدورات', icon: BookOpen },
        { href: '/academy/admin/archive', label: t.academyAdmin?.archiveTitle, icon: Archive },
        { href: '/academy/admin/categories', label: t.academy?.categories || 'التصنيفات', icon: Grid },
        { href: '/academy/admin/learning-paths', label: t.academy?.learningPaths || 'المسارات التعليمية', icon: Route },
      ],
    },
    {
      title: t.academyAdmin?.sidebarUsersPermissions,
      items: [
        { href: '/academy/admin/teachers', label: t.academy?.teachers || 'المدرسين', icon: GraduationCap },
        { href: '/academy/admin/teacher-applications', label: t.academy?.teacherApplications || 'طلبات التدريس', icon: UserCheck },
        { href: '/academy/admin/application-questions', label: t.academy?.applicationQuestions || 'أ��ئلة طلبات الانضمام', icon: ClipboardList },
        { href: '/academy/admin/students', label: t.academy?.students || 'الطلاب', icon: Users },
        { href: '/academy/admin/supervisors', label: t.academyAdmin?.supervision || 'الإشراف', icon: Shield },
        { href: '/academy/admin/invitations', label: t.academy?.invitations || 'الدعوات', icon: UserPlus },
      ],
    },
    {
      title: t.academyAdmin?.sidebarEngagement,
      items: [
        { href: '/academy/admin/competitions', label: t.academy?.competitions || 'المسابقات', icon: Trophy },
        { href: '/academy/admin/leaderboard', label: t.academy?.leaderboard || 'لوحة المتصدرين', icon: Star },
        { href: '/academy/admin/badges', label: t.academy?.badges || 'الشارات', icon: Award },
      ],
    },
    {
      title: t.academyAdmin?.sidebarCommunity,
      items: [
        { href: '/community/academy/admin', label: t.academy?.forum || 'المنتدى', icon: MessagesSquare },
        { href: '/academy/admin/fiqh', label: t.academy?.fiqhQuestions || 'صندوق الأسئلة الفقهية', icon: HelpCircle },
        { href: '/academy/fiqh', label: t.academy?.fiqhLibrary || 'المكتبة الفقهية', icon: Library },
        { href: '/academy/library', label: t.academy?.booksLibrary || 'مكتبة الكتب (تصفح)', icon: BookOpen },
        { href: '/academy/admin/library/books', label: t.academyAdmin?.sidebarManageLibrary, icon: BookOpen },
        { href: '/academy/admin/announcements', label: t.admin?.announcements || 'الإعلانات', icon: Megaphone },
        { href: '/academy/admin/conversations', label: t.admin?.conversations || 'مركز المحادثات', icon: MessagesSquare },
      ],
    },
    {
      title: t.academyAdmin?.sidebarHalaqatBroadcast,
      items: [
        { href: '/academy/admin/halaqat', label: t.academy?.halaqat || 'الحلقات', icon: GraduationCap },
        { href: '/academy/admin/video-settings', label: t.academyAdmin?.sidebarVideoSettings, icon: Video },
      ],
    },
    {
      title: t.admin?.settings || 'الإعدادات',
      items: [
        { href: '/academy/admin/certificates', label: t.academy?.certificatesCenter || t.academy?.certificates || 'مركز الشهادات', icon: Award },
        { href: '/academy/admin/access-control', label: t.academy?.accessControl || 'التحكم بالوصول', icon: Shield },
        { href: '/academy/admin/settings', label: t.admin?.systemSettings || 'إعدادات النظام', icon: Settings },
      ],
    },
  ],
  label: t.academy?.adminPortal || 'إدارة الأكاديمية',
  name: t.academy?.admin || 'مدير الأكاديمية',
  sublabel: t.academy?.academyAdmin || 'مدير الأكاديمية',
})

// Pick the sidebar config for an admin tier based on the active mode. Each mode
// is fully scoped: no item from one mode ever leaks into another.
function getConfigForMode(mode: 'super' | 'maqraa' | 'academy', t: any): ShellConfig {
  if (mode === 'academy') return getAcademyConfig(t)
  if (mode === 'maqraa') return getMaqraaConfig(t)
  return getSuperConfig(t)
}

// Supervisors keep their own dedicated sidebars; every other role maps straight
// through. Admin tiers are handled separately via getConfigForMode.
function resolveConfigRole(
  role: 'student' | 'reader' | 'admin' | 'super_admin' | 'maqraa_admin' | 'academy_admin' | 'student_supervisor' | 'reciter_supervisor',
): 'student' | 'reader' | 'admin' | 'student_supervisor' | 'reciter_supervisor' {
  if (role === 'super_admin' || role === 'maqraa_admin' || role === 'academy_admin') return 'admin'
  return role
}

// ── Collapsible nav section ────────────────────────────────────────────────
function CollapsibleNavSection({
  section, si, isCollapsedSidebar, isActive, sectionKey, sectionHasActive,
  unreadCount, t, onLinkClick, activeClass, hoverClass, indicatorClass,
}: {
  section: NavSection
  si: number
  isCollapsedSidebar: boolean
  isActive: (href: string) => boolean
  sectionKey: string
  sectionHasActive: boolean
  unreadCount: number
  t: any
  onLinkClick: () => void
  activeClass: string
  hoverClass: string
  indicatorClass: string
}) {
  // Sections without a title are always visible (no accordion header).
  const hasTitle = !!section.title

  // Initialise open state: sections with active items start open,
  // others read from localStorage (default open).
  const [open, setOpen] = useState<boolean>(() => {
    if (!hasTitle || sectionHasActive) return true
    if (typeof window === 'undefined') return true
    const stored = localStorage.getItem(sectionKey)
    return stored === null ? true : stored === '1'
  })

  // When an active item appears in this section (e.g. navigation), force open.
  useEffect(() => {
    if (sectionHasActive) setOpen(true)
  }, [sectionHasActive])

  const toggle = () => {
    if (!hasTitle) return
    const next = !open
    setOpen(next)
    try { localStorage.setItem(sectionKey, next ? '1' : '0') } catch {}
  }

  // In icon-only collapsed mode: skip the accordion header, show all items.
  const showAccordion = hasTitle && !isCollapsedSidebar

  const items = section.items.map((item) => {
    const active = isActive(item.href)
    const isNotifications = item.label === t.student?.notifications || item.label === t.notifications?.title || item.href.includes('notifications')
    const badgeNode = item.badge ? (
      <span className="mr-auto bg-destructive text-destructive-foreground text-[10px] px-1.5 py-0.5 rounded-full min-w-[18px] text-center font-bold animate-pulse">{item.badge}</span>
    ) : isNotifications && unreadCount > 0 ? (
      <span className="mr-auto bg-destructive text-destructive-foreground text-[10px] px-1.5 py-0.5 rounded-full min-w-[18px] text-center font-bold animate-pulse">
        {unreadCount > 99 ? '99+' : unreadCount}
      </span>
    ) : null
    const collapsedDot = item.badge
      ? item.badge
      : (isNotifications && unreadCount > 0) ? (unreadCount > 99 ? '99+' : unreadCount) : null

    const linkEl = (
      <Link key={item.href} href={item.href} onClick={onLinkClick}
        className={cn(
          'flex items-center gap-3 rounded-xl transition-all text-sm group relative',
          isCollapsedSidebar ? 'lg:justify-center lg:px-0 lg:py-3 px-4 py-2.5' : 'px-3 py-2.5',
          active ? activeClass : hoverClass
        )}
      >
        <item.icon className={cn("w-5 h-5 shrink-0 transition-transform duration-200", active && "scale-110")} />
        <span className={cn('font-medium truncate', isCollapsedSidebar && 'lg:hidden')}>{item.label}</span>
        {!isCollapsedSidebar && badgeNode}
        {isCollapsedSidebar && collapsedDot != null && (
          <span className="hidden lg:flex absolute -top-1 -left-1 bg-destructive text-destructive-foreground text-[9px] leading-none px-1 py-0.5 rounded-full min-w-[16px] h-[16px] items-center justify-center font-bold">{collapsedDot}</span>
        )}
        {active && <div className={cn('absolute right-0 w-1 h-6 rounded-l-full', indicatorClass, isCollapsedSidebar && 'lg:hidden')} />}
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
          {/* Section accordion header */}
          <button
            type="button"
            onClick={toggle}
            className={cn(
              'w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-left transition-colors',
              'text-muted-foreground hover:text-foreground hover:bg-muted/60 group',
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
          {/* Items */}
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

export function DashboardShell({ role, children, headerTitle, adminMode }: { role: 'student' | 'reader' | 'admin' | 'super_admin' | 'maqraa_admin' | 'academy_admin' | 'student_supervisor' | 'reciter_supervisor'; children: React.ReactNode; headerTitle?: string; adminMode?: 'super' | 'maqraa' | 'academy' }) {
  const pathname = usePathname()
  const router = useRouter()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { collapsed, toggle: toggleCollapsed } = useSidebarCollapsed()
  const { t } = useI18n()
  const app = (t as any).app as Record<string, string> | undefined
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

  const isSuperAdminRole = role === 'admin' || role === 'super_admin'
  // Admin tiers (super / maqraa / academy) render a fully mode-scoped sidebar.
  // The segmented switcher (super only) changes the active mode; scoped admins
  // are pinned to their own mode. No item from one mode leaks into another.
  const isAdminTier =
    role === 'admin' || role === 'super_admin' || role === 'maqraa_admin' || role === 'academy_admin'
  const effectiveMode: 'super' | 'maqraa' | 'academy' =
    adminMode ?? (isSuperAdminRole ? 'super' : role === 'academy_admin' ? 'academy' : 'maqraa')
  const rawConfig = isAdminTier
    ? getConfigForMode(effectiveMode, t)
    : getRoleConfig(t)[resolveConfigRole(role)]

  // Inject unread direct message counts + pending-certificate badge
  // into the sidebar items. When the maqraa student has data_required
  // certificate requests we also surface a dedicated
  // "إكمال بيا��ات الشهادة" entry below /student/certificates.
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

  const homeHref = resolveConfigRole(role) === 'admin' ? '/admin' : `/${role}`
  const isActive = (href: string) => pathname === href || (href !== homeHref && pathname.startsWith(href + '/'))

  return (
    <div className={cn(
      "h-screen flex overflow-hidden bg-background transition-colors duration-500",
      isReader && "theme-islamic",
      (role === 'admin' || role === 'super_admin' || role === 'maqraa_admin' || role === 'academy_admin' || role === 'student' || role === 'reader' || role === 'student_supervisor' || role === 'reciter_supervisor') && "admin-theme"
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
          'flex items-center gap-2 border-b border-border relative overflow-hidden shrink-0 min-h-16 py-3',
          isReader ? 'bg-primary/5' : 'bg-card',
          collapsed ? 'lg:flex-col lg:justify-center lg:gap-2 lg:px-2' : 'px-4',
          // When the super-admin switcher is present it owns the full width;
          // otherwise keep the (now empty) bar centered as before.
          isSuperAdminRole ? 'justify-between' : 'justify-center'
        )}>
          {/* Super Admin platform switcher — lives at the very top of the sidebar */}
          {isSuperAdminRole && (
            <div className={cn('min-w-0', collapsed ? 'lg:w-full' : 'flex-1')}>
              <AdminRoleSwitcher currentMode={adminMode ?? 'super'} collapsed={collapsed} />
            </div>
          )}

          {/* Desktop collapse toggle — comes after switcher in DOM so it renders to its left (sidebar is RTL) */}
          <button
            type="button"
            onClick={toggleCollapsed}
            className={cn(
              'hidden lg:flex items-center justify-center p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors shrink-0',
              !isSuperAdminRole && (collapsed ? 'absolute top-2 left-1/2 -translate-x-1/2' : 'absolute top-2 left-2')
            )}
            aria-label={collapsed ? (t.shell?.expandSidebar || 'Expand sidebar') : (t.shell?.collapseSidebar || 'Collapse sidebar')}
            title={collapsed ? (t.shell?.expandSidebar || 'Expand sidebar') : (t.shell?.collapseSidebar || 'Collapse sidebar')}
          >
            {collapsed ? <PanelLeftOpen className="w-4 h-4" /> : <PanelLeftClose className="w-4 h-4" />}
          </button>

          <button className="lg:hidden p-1 shrink-0" onClick={() => setSidebarOpen(false)} aria-label="close">
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>

        {/* Navigation */}
        <nav className={cn('flex-1 overflow-y-auto overflow-x-hidden py-4 space-y-0.5', collapsed ? 'lg:px-2 px-4' : 'px-3')}>
          {config.sections.map((section, si) => {
            const sectionKey = `itqan_nav_open_${section.title ?? si}`
            const sectionHasActive = section.items.some(i => isActive(i.href))
            return (
              <CollapsibleNavSection
                key={si}
                section={section}
                si={si}
                isCollapsedSidebar={collapsed}
                isActive={isActive}
                sectionKey={sectionKey}
                sectionHasActive={sectionHasActive}
                unreadCount={unreadCount}
                t={t}
                onLinkClick={() => setSidebarOpen(false)}
                activeClass="bg-primary text-primary-foreground font-bold shadow-md"
                hoverClass="text-muted-foreground hover:bg-primary/10 hover:text-primary"
                indicatorClass="bg-primary-foreground"
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
        {/* Super-admin borrowed-mode indicator: a loud reminder the admin is
            operating outside their default super-admin context. */}
        {isSuperAdminRole && (adminMode === 'maqraa' || adminMode === 'academy') && (
          <AdminModeBanner mode={adminMode} />
        )}
        <header className={cn(
          'border-b border-border flex items-center justify-between px-6 lg:px-8 bg-background/95 backdrop-blur-md z-40 sticky top-0 left-0 right-0',
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
                <GlobalSearch role={resolveConfigRole(role) as 'admin' | 'reader'} />
              </div>
            )}

            <ThemeToggle />
            <LanguageSwitcher variant="outline" />

            <NotificationDropdown
              role={resolveConfigRole(role) === 'admin' ? 'admin' : role}
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

      {/* First-visit onboarding tour for any admin tier. */}
      {resolveConfigRole(role) === 'admin' && <AdminOnboardingTour role={role} adminMode={adminMode} />}
    </div>
  )
}
