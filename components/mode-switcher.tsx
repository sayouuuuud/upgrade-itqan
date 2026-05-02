"use client"

import { useState, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { useI18n } from '@/lib/i18n/context'
import {
  BookOpen,
  GraduationCap,
  Mic,
  ChevronDown,
  Check
} from 'lucide-react'

interface Mode {
  id: string
  label: string
  icon: React.ElementType
  href: string
  description: string
  color: string
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
  const pathname = usePathname()
  const { t } = useI18n()
  const [isOpen, setIsOpen] = useState(false)

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
      description: t.modeSwitcher?.libraryDesc || 'تلاوات وتسميع القرآن والتصحيح',
      color: 'text-emerald-600 bg-emerald-100 dark:bg-emerald-900/30'
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
      description: t.modeSwitcher?.academyDesc || 'الدورات والدروس التفاعلية',
      color: 'text-blue-600 bg-blue-100 dark:bg-blue-900/30'
    })
  }

  // Close dropdown on outside click — must be before any early return to satisfy React hooks rules
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (isOpen && !(e.target as Element).closest('.mode-switcher')) {
        setIsOpen(false)
      }
    }
    document.addEventListener('click', handleClick)
    return () => document.removeEventListener('click', handleClick)
  }, [isOpen])

  // Don't show switcher if only one mode available
  if (modes.length <= 1) return null

  const currentModeData = modes.find(m => m.id === currentMode) || modes[0]
  if (!currentModeData) return null

  function getAcademyHref(role: string, academyRole?: string | null): string {
    if (role === 'teacher') return '/academy/teacher'
    if (role === 'academy_admin' || role === 'admin') return '/academy/admin'
    if (role === 'parent') return '/academy/parent'
    if (academyRole === 'teacher') return '/academy/teacher'
    if (academyRole === 'academy_admin') return '/academy/admin'
    return '/academy/student'
  }

  const handleModeChange = (mode: Mode) => {
    setIsOpen(false)
    if (mode.id !== currentMode) {
      router.push(mode.href)
    }
  }

  return (
    <div className="mode-switcher relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "flex items-center gap-2 px-3 py-2 rounded-lg transition-all",
          "border border-border hover:border-primary/50",
          "bg-background hover:bg-muted"
        )}
      >
        <div className={cn("p-1.5 rounded-md", currentModeData.color)}>
          <currentModeData.icon className="w-4 h-4" />
        </div>
        <span className="text-sm font-medium hidden sm:inline">{currentModeData.label}</span>
        <ChevronDown className={cn(
          "w-4 h-4 text-muted-foreground transition-transform",
          isOpen && "rotate-180"
        )} />
      </button>

      {isOpen && (
        <div className={cn(
          "absolute top-full mt-2 right-0 z-50",
          "w-64 p-2 rounded-xl",
          "bg-card border border-border shadow-xl",
          "animate-in fade-in-0 zoom-in-95"
        )}>
          <div className="text-xs font-semibold text-muted-foreground px-2 py-1 mb-1">
            {t.modeSwitcher?.switchMode || 'تبديل الوضع'}
          </div>
          {modes.map((mode) => (
            <button
              key={mode.id}
              onClick={() => handleModeChange(mode)}
              className={cn(
                "w-full flex items-center gap-3 p-3 rounded-lg transition-all",
                mode.id === currentMode
                  ? "bg-primary/10 text-primary"
                  : "hover:bg-muted text-foreground"
              )}
            >
              <div className={cn("p-2 rounded-lg", mode.color)}>
                <mode.icon className="w-5 h-5" />
              </div>
              <div className="flex-1 text-right">
                <div className="font-medium text-sm">{mode.label}</div>
                <div className="text-xs text-muted-foreground">{mode.description}</div>
              </div>
              {mode.id === currentMode && (
                <Check className="w-4 h-4 text-primary" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
