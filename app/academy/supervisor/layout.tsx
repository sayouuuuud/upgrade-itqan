import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import { AcademyDashboardShell } from '@/components/academy-dashboard-shell'

export default async function AcademySupervisorLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const session = await getSession()

    if (!session) {
        redirect('/login')
    }

    // Check if user has a supervisor role
    const supervisorRoles = ['supervisor', 'content_supervisor', 'fiqh_supervisor', 'quality_supervisor']
    const isSupervisor = supervisorRoles.includes(session.role) ||
        session.academy_roles?.some((r: string) => supervisorRoles.includes(r))

    if (!isSupervisor && session.role !== 'admin') {
        redirect('/academy/student')
    }

    return (
        <AcademyDashboardShell
            role="supervisor"
            showModeSwitcher={false}
        >
            {children}
        </AcademyDashboardShell>
    )
}
