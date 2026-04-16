/**
 * User Database Queries
 * Handles user operations for both auth and LMS
 */

import { query, queryOne } from "../db"
import { UserRole } from "../types/lms"
import type { User as LMSUser } from "../types/lms"

export async function getUserById(userId: string): Promise<LMSUser | null> {
  return queryOne<LMSUser>(
    `SELECT * FROM users WHERE id = $1`,
    [userId]
  )
}

export async function getUserByEmail(email: string): Promise<LMSUser | null> {
  return queryOne<LMSUser>(
    `SELECT * FROM users WHERE email = $1`,
    [email]
  )
}

export async function createLMSUser(
  userId: string,
  email: string,
  name: string,
  role: UserRole = UserRole.STUDENT,
  gender?: string
): Promise<LMSUser | null> {
  return queryOne<LMSUser>(
    `INSERT INTO users (id, email, name, role, gender) 
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [userId, email, name, role, gender]
  )
}

export async function updateUserRole(userId: string, role: UserRole): Promise<boolean> {
  const result = await query(
    `UPDATE users SET role = $1, updatedAt = CURRENT_TIMESTAMP WHERE id = $2`,
    [role, userId]
  )
  return result.length > 0
}

export async function getAllTeachers(): Promise<LMSUser[]> {
  return query<LMSUser>(
    `SELECT * FROM users WHERE role = 'TEACHER' ORDER BY name ASC`
  )
}

export async function getAllStudents(): Promise<LMSUser[]> {
  return query<LMSUser>(
    `SELECT * FROM users WHERE role = 'STUDENT' ORDER BY name ASC`
  )
}

export async function getAllParents(): Promise<LMSUser[]> {
  return query<LMSUser>(
    `SELECT * FROM users WHERE role = 'PARENT' ORDER BY name ASC`
  )
}

export async function getUsersByRole(role: UserRole): Promise<LMSUser[]> {
  return query<LMSUser>(
    `SELECT * FROM users WHERE role = $1 ORDER BY name ASC`,
    [role]
  )
}

export async function getUserPermissions(userId: string): Promise<string[]> {
  const permissions = await query<{ permission_id: string }>(
    `SELECT DISTINCT rp.permission_id 
     FROM role_permissions rp
     JOIN users u ON rp.role_id = u.role
     WHERE u.id = $1`,
    [userId]
  )
  return permissions.map((p: any) => p.permission_id)
}

export async function hasPermission(userId: string, permissionId: string): Promise<boolean> {
  const result = await query<{ exists: boolean }>(
    `SELECT EXISTS(
       SELECT 1 FROM role_permissions rp
       JOIN users u ON rp.role_id = u.role
       WHERE u.id = $1 AND rp.permission_id = $2
     ) as exists`,
    [userId, permissionId]
  )
  return result[0]?.exists || false
}

export async function getTeacherStudents(teacherId: string): Promise<LMSUser[]> {
  return query<LMSUser>(
    `SELECT DISTINCT u.* FROM users u
     JOIN course_enrollments ce ON u.id = ce.student_id
     JOIN courses c ON ce.course_id = c.id
     WHERE c.teacher_id = $1 AND u.role = 'STUDENT'
     ORDER BY u.name ASC`,
    [teacherId]
  )
}
