"use client"

import { useState, Suspense, useEffect } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { useI18n } from '@/lib/i18n/context'
import { RoleSelection } from './components/RoleSelection'
import { StudentForm } from './components/StudentForm'
import { TeacherForm } from './components/TeacherForm'
import { ReaderForm } from './components/ReaderForm'

type Role = 'student' | 'parent' | 'teacher' | 'reader' | null

function RegisterContent() {
  const searchParams = useSearchParams()
  const initialRoleParam = searchParams.get('role') as Role
  const [selectedRole, setSelectedRole] = useState<Role>(initialRoleParam)
  const { t } = useI18n()

  useEffect(() => {
    if (initialRoleParam) {
      setSelectedRole(initialRoleParam)
    }
  }, [initialRoleParam])

  return (
    <div className="min-h-screen flex flex-col justify-center items-center relative overflow-hidden bg-[#0B3D2E]">
      {/* Background */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 opacity-10" style={{ background: 'radial-gradient(circle at top left, #145A3E 0%, #0B3D2E 40%, #072A1F 100%)' }} />
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
      </div>

      {/* Nav */}
      <nav className="absolute top-0 left-0 right-0 p-6 flex justify-between items-center z-20 max-w-7xl mx-auto w-full">
        <Link href="/" className="hover:opacity-80 transition-opacity">
          <img src="/branding/main-logo.png" alt="Logo" className="h-16 w-auto object-contain" />
        </Link>
        <Link href="/login" className="text-sm font-medium text-white/70 hover:text-white transition-colors flex items-center gap-2">
          <span>{t.auth.alreadyHaveAccount}</span>
          <span className="text-[#D4A843] font-bold">{t.login}</span>
        </Link>
      </nav>

      {/* Main Content */}
      <main className="relative z-10 w-full max-w-3xl px-4 py-24">
        <div className="bg-card/95 backdrop-blur-xl border border-border shadow-2xl rounded-2xl p-8 md:p-10 transition-all duration-500">
          {!selectedRole ? (
            <RoleSelection onSelect={setSelectedRole} />
          ) : (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              {selectedRole === 'student' && <StudentForm initialRole="student" onBack={() => setSelectedRole(null)} />}
              {selectedRole === 'parent' && <StudentForm initialRole="parent" onBack={() => setSelectedRole(null)} />}
              {selectedRole === 'teacher' && <TeacherForm onBack={() => setSelectedRole(null)} />}
              {selectedRole === 'reader' && <ReaderForm onBack={() => setSelectedRole(null)} />}
            </div>
          )}
        </div>
      </main>

      <footer className="absolute bottom-4 text-center w-full z-10 flex flex-col items-center gap-2">
        <img src="/branding/main-logo.png" alt="Itqan" className="h-10 w-auto opacity-30 grayscale brightness-200" />
        <p className="text-xs text-white/20">
          {'2026 '}{t.appName}{'. '}{t.footer.rights}
        </p>
      </footer>
    </div>
  )
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#0B3D2E] flex items-center justify-center"><div className="w-8 h-8 border-4 border-[#D4A843] border-t-transparent rounded-full animate-spin"></div></div>}>
      <RegisterContent />
    </Suspense>
  )
}
