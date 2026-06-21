import { describe, it, expect } from 'vitest'
import {
  resolveStudentDashboardRedirect,
  isStudentLike,
  isFullAdmin,
  type AccessSessionLike,
} from '@/lib/academy/access'

/**
 * Regression tests for issue #1: an authenticated non-student (admin, teacher,
 * supervisor) must NOT be able to view the /academy/student dashboard by typing
 * the URL. The student layout delegates this decision to
 * resolveStudentDashboardRedirect(), so we lock the behavior down here.
 */
describe('academy student RBAC guard (#1)', () => {
  const session = (role: string, academy_roles?: string[]): AccessSessionLike => ({
    role,
    academy_roles,
  })

  it('allows a student to stay on the student dashboard', () => {
    expect(resolveStudentDashboardRedirect(session('student'))).toBeNull()
    expect(isStudentLike(session('student'))).toBe(true)
  })

  it('allows a parent to stay on the student dashboard', () => {
    expect(resolveStudentDashboardRedirect(session('parent'))).toBeNull()
  })

  it('allows a user whose academy_roles include student', () => {
    expect(resolveStudentDashboardRedirect(session('reader', ['student']))).toBeNull()
  })

  it('redirects an admin to the admin dashboard', () => {
    expect(resolveStudentDashboardRedirect(session('admin'))).toBe('/academy/admin')
  })

  it('redirects a teacher to the teacher dashboard', () => {
    expect(resolveStudentDashboardRedirect(session('teacher'))).toBe('/academy/teacher')
    expect(resolveStudentDashboardRedirect(session('reader', ['teacher']))).toBe(
      '/academy/teacher',
    )
  })

  it('redirects every supervisor variant to the supervisor dashboard', () => {
    for (const role of [
      'supervisor',
      'content_supervisor',
      'fiqh_supervisor',
      'quality_supervisor',
      'student_supervisor',
      'reciter_supervisor',
      'academy_admin',
    ]) {
      expect(resolveStudentDashboardRedirect(session(role))).toBe('/academy/supervisor')
    }
  })

  it('sends an unknown authenticated role to the academy root', () => {
    expect(resolveStudentDashboardRedirect(session('mystery_role'))).toBe('/academy')
  })

  it('prefers admin over a supervisor academy_role', () => {
    expect(resolveStudentDashboardRedirect(session('admin', ['content_supervisor']))).toBe(
      '/academy/admin',
    )
  })
})

/**
 * Regression tests for issue #2: the Access Control page (per-user platform
 * permissions) must be reachable by FULL admins only. Scoped supervisors that
 * the broader /academy/admin layout admits must NOT pass this stricter guard.
 */
describe('access-control full-admin guard (#2)', () => {
  const session = (role: string, academy_roles?: string[]): AccessSessionLike => ({
    role,
    academy_roles,
  })

  it('admits a full admin', () => {
    expect(isFullAdmin(session('admin'))).toBe(true)
    expect(isFullAdmin(session('academy_admin'))).toBe(true)
    expect(isFullAdmin(session('reader', ['admin']))).toBe(true)
  })

  it('rejects scoped supervisors that the section layout would admit', () => {
    expect(isFullAdmin(session('student_supervisor'))).toBe(false)
    expect(isFullAdmin(session('reciter_supervisor'))).toBe(false)
  })

  it('rejects students, teachers, parents and other supervisors', () => {
    for (const role of ['student', 'parent', 'teacher', 'supervisor', 'fiqh_supervisor']) {
      expect(isFullAdmin(session(role))).toBe(false)
    }
  })
})
