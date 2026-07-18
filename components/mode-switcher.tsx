"use client"

import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { useI18n } from '@/lib/i18n/context'
import { motion } from 'framer-motion'
import {
  GraduationCap,
  Mic
} from 'lucide-react'

interface Mode {
  id: string
  label: string
  icon: React.ElementType
  href: string
  description: string
}

interface ModeSwitcherProps {
  currentMode: 'library' | 'academy'
  userRole: string
  academyRole?: string | null
  hasQuranAccess?: boolean
  hasAcademyAccess?: boolean
}

export function ModeSwitcher({ currentMode, userRole, academyRole, hasQuranAccess, hasAcademyAccess }: ModeSwitcherProps) {
  const router = useRouter()
  const { t } = useI18n()
  const app = (t as any).app as Record<string, string> | undefined

  // Define available modes based on user role
  const modes: Mode[] = []

  // Library mode (for students and readers and admins)
  if (hasQuranAccess) {
    let libraryHref = '/student'
    if (userRole === 'reader') libraryHref = '/reader'
    if (['admin', 'student_supervisor', 'reciter_supervisor'].includes(userRole)) libraryHref = '/admin'

    modes.push({
      id: 'library',
      label: t.modeSwitcher?.library || 'المقرأة',
      icon: Mic,
      href: libraryHref,
      description: t.modeSwitcher?.libraryDesc || 'تلاوات وتسميع القرآن والتصحيح'
    })
  }

  // Academy mode (for academy students, teachers, parents, admins)
  if (hasAcademyAccess) {
    const academyHref = getAcademyHref(userRole, academyRole)
    modes.push({
      id: 'academy',
      label: t.modeSwitcher?.academy || 'الأكاديمية',
      icon: GraduationCap,
      href: academyHref,
      description: t.modeSwitcher?.academyDesc || 'الدورات والدروس التفاعلية'
    })
  }

  // Don't show switcher if only one mode available
  // Exception: if an admin/super-admin (userRole === 'admin') has both access,
  // always show it so they can switch back from academy to library
  const isAdminWithBothAccess = userRole === 'admin' && hasQuranAccess && hasAcademyAccess
  if (modes.length <= 1 && !isAdminWithBothAccess) return null

  function getAcademyHref(role: string, academyRole?: string | null): string {
    if (role === 'teacher') return '/academy/teacher'
    if (role === 'academy_admin' || role === 'admin') return '/academy/admin'
    if (role === 'parent') return '/academy/parent'
    if (academyRole === 'teacher') return '/academy/teacher'
    if (academyRole === 'academy_admin') return '/academy/admin'
    return '/academy/student'
  }

  const handleModeChange = (mode: Mode) => {
    if (mode.id !== currentMode) {
      router.push(mode.href)
    }
  }

  return (
    <div className="flex items-center bg-muted/40 dark:bg-zinc-950/40 p-1 rounded-xl border border-border/60 shadow-inner relative gap-0.5 select-none">
      {modes.map((mode) => {
        const isActive = mode.id === currentMode
        const Icon = mode.icon
        return (
          <button
            key={mode.id}
            onClick={() => handleModeChange(mode)}
            title={mode.description}
            className={cn(
              "relative flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-semibold transition-all duration-300 cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-primary",
              isActive
                ? mode.id === 'library'
                  ? "text-emerald-600 dark:text-emerald-400"
                  : "text-blue-600 dark:text-blue-400"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <span className="relative z-10 flex items-center gap-1.5">
              <Icon className={cn("w-4.5 h-4.5 transition-transform duration-300", isActive && "scale-110")} />
              <span className="hidden sm:inline">{mode.label}</span>
            </span>
            {isActive && (
              <motion.div
                layoutId="activeModeIndicator"
                className={cn(
                  "absolute inset-0 rounded-lg shadow-sm border",
                  mode.id === 'library'
                    ? "bg-emerald-500/10 border-emerald-500/20 dark:bg-emerald-500/15"
                    : "bg-blue-500/10 border-blue-500/20 dark:bg-blue-500/15"
                )}
                transition={{ type: 'spring', stiffness: 380, damping: 30 }}
              />
            )}
          </button>
        )
      })}
    </div>
  )
}
