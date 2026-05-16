"use client"

import { GraduationCap, BookOpen, User, Users } from 'lucide-react'
import { useI18n } from '@/lib/i18n/context'
import { motion } from 'framer-motion'

interface RoleSelectionProps {
  onSelect: (role: 'student' | 'parent' | 'teacher' | 'reader') => void
}

export function RoleSelection({ onSelect }: RoleSelectionProps) {
  const { t } = useI18n()

  const roles = [
    {
      id: 'student',
      title: t.locale === 'ar' ? 'طالب' : 'Student',
      description: t.locale === 'ar' ? 'التسجيل كطالب لحفظ القرآن أو الدراسة الأكاديمية' : 'Register as a student to memorize Quran or study academically',
      icon: GraduationCap,
      color: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 hover:border-emerald-500 hover:bg-emerald-500/5',
    },
    {
      id: 'parent',
      title: t.locale === 'ar' ? 'ولي أمر' : 'Parent',
      description: t.locale === 'ar' ? 'متابعة أداء أبنائك وإدارة حساباتهم' : 'Follow up on your children\'s performance and manage their accounts',
      icon: Users,
      color: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20 hover:border-blue-500 hover:bg-blue-500/5',
    },
    {
      id: 'teacher',
      title: t.locale === 'ar' ? 'معلم أكاديمية' : 'Academy Teacher',
      description: t.locale === 'ar' ? 'التسجيل لتدريس المواد الأكاديمية (فقه، عقيدة...)' : 'Register to teach academic subjects (Fiqh, Aqeedah...)',
      icon: BookOpen,
      color: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20 hover:border-amber-500 hover:bg-amber-500/5',
    },
    {
      id: 'reader',
      title: t.locale === 'ar' ? 'مقرئ قرآن' : 'Quran Reciter',
      description: t.locale === 'ar' ? 'التسجيل لتحفيظ القرآن الكريم وتصحيح التلاوة' : 'Register to teach Quran memorization and recitation correction',
      icon: User,
      color: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20 hover:border-purple-500 hover:bg-purple-500/5',
    },
  ] as const

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-3">
          {t.locale === 'ar' ? 'أهلاً بك في منصة إتقان' : 'Welcome to Itqan Platform'}
        </h1>
        <p className="text-muted-foreground text-lg">
          {t.locale === 'ar' ? 'اختر نوع الحساب الذي ترغب بإنشائه' : 'Select the type of account you want to create'}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {roles.map((role, idx) => (
          <motion.button
            key={role.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            onClick={() => onSelect(role.id as any)}
            className={`flex flex-col items-center p-6 text-center border-2 rounded-2xl transition-all duration-300 ${role.color}`}
          >
            <div className="p-4 bg-background/50 rounded-full mb-4">
              <role.icon className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold mb-2">{role.title}</h3>
            <p className="text-sm opacity-80">{role.description}</p>
          </motion.button>
        ))}
      </div>
    </div>
  )
}
