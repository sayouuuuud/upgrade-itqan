import { NextRequest, NextResponse } from 'next/server'
import { queryOne } from '@/lib/db'
import type { User, UserRole } from '@/lib/types/lms'

/**
 * RBAC Middleware - Enforces role-based access control
 * 
 * Usage in API routes:
 * 
 * export async function POST(req: NextRequest) {
 *   const user = await verifyAndGetUser(req)
 *   if (!user) return unauthorized()
 *   
 *   const allowed = await checkPermission(user.role, 'COURSES', 'CREATE')
 *   if (!allowed) return forbidden('Cannot create courses')
 *   
 *   // Your logic here
 * }
 */

/**
 * Extract user from request (from session/auth header)
 * Assumes auth token is in Authorization header or session cookie
 */
export async function verifyAndGetUser(req: NextRequest): Promise<User | null> {
  try {
    const authHeader = req.headers.get('authorization')
    
    if (!authHeader?.startsWith('Bearer ')) {
      return null
    }
    
    const token = authHeader.substring(7)
    
    // Verify token and get user ID (implement based on your auth system)
    // This is a placeholder - integrate with your actual auth system
    const userId = verifyToken(token)
    
    if (!userId) return null
    
    // Fetch user from database
    const user = await queryOne<User>(
      'SELECT id, name, email, role, gender FROM users WHERE id = $1',
      [userId]
    )
    
    return user || null
  } catch (err) {
    console.error('[RBAC] Error verifying user:', err)
    return null
  }
}

/**
 * Verify JWT token (implement based on your auth system)
 */
function verifyToken(token: string): string | null {
  try {
    // Placeholder - implement with your actual token verification
    // Example: const decoded = jwt.verify(token, process.env.JWT_SECRET)
    // return decoded.userId
    return null // Replace with actual implementation
  } catch {
    return null
  }
}

/**
 * Check if user has permission for a specific resource action
 */
export async function checkPermission(
  role: UserRole,
  resource: string,
  action: string
): Promise<boolean> {
  try {
    const result = await queryOne<{ can_access: boolean }>(
      `SELECT can_access FROM permission_mappings 
       WHERE role = $1 AND resource = $2 AND action = $3`,
      [role, resource, action]
    )
    
    return result?.can_access ?? false
  } catch (err) {
    console.error('[RBAC] Error checking permission:', err)
    return false
  }
}

/**
 * Strict Role Segregation Rules
 * 
 * Scenario 1: TEACHER Role
 * - Can ONLY create courses linked to their teacher_id
 * - Can ONLY edit lessons in their own courses
 * - ZERO access to recitations table
 * - Cannot manage other users or roles
 */
export async function isTeacherAuthorized(
  userId: string,
  courseId?: string
): Promise<boolean> {
  try {
    if (courseId) {
      // Check if teacher owns this course
      const course = await queryOne<{ teacher_id: string }>(
        'SELECT teacher_id FROM courses WHERE id = $1',
        [courseId]
      )
      return course?.teacher_id === userId
    }
    return true // Teacher can create new courses
  } catch (err) {
    console.error('[RBAC] Error checking teacher authorization:', err)
    return false
  }
}

/**
 * Scenario 2: READERS_SUPERVISOR Role
 * - Can update status of READER users (e.g., Pending to Active)
 * - Cannot create courses
 * - Cannot access student data
 */
export async function isReadersSupervisorAuthorized(
  userId: string,
  targetUserId: string
): Promise<boolean> {
  try {
    // Check if target user is actually a READER
    const targetUser = await queryOne<{ role: string }>(
      'SELECT role FROM users WHERE id = $1',
      [targetUserId]
    )
    
    return targetUser?.role === 'READER'
  } catch (err) {
    console.error('[RBAC] Error checking readers supervisor authorization:', err)
    return false
  }
}

/**
 * Scenario 3: Course Access Control
 * 
 * Rules:
 * - If is_public = TRUE: Anyone can view
 * - If is_public = FALSE: Only check if student_id in Enrollments table
 * - Return 403 Forbidden if unauthorized
 */
export async function checkCourseAccess(
  courseId: string,
  userId: string
): Promise<{ canAccess: boolean; reason?: string }> {
  try {
    // Get course details
    const course = await queryOne<{ is_public: boolean }>(
      'SELECT is_public FROM courses WHERE id = $1',
      [courseId]
    )
    
    if (!course) {
      return { canAccess: false, reason: 'Course not found' }
    }
    
    // If public, everyone can access
    if (course.is_public) {
      return { canAccess: true }
    }
    
    // If private, check enrollment
    const enrollment = await queryOne<{ id: string }>(
      'SELECT id FROM enrollments WHERE student_id = $1 AND course_id = $2',
      [userId, courseId]
    )
    
    if (enrollment) {
      return { canAccess: true }
    }
    
    return { canAccess: false, reason: 'Not enrolled in this course' }
  } catch (err) {
    console.error('[RBAC] Error checking course access:', err)
    return { canAccess: false, reason: 'Access check failed' }
  }
}

/**
 * PARENT role permissions
 * - Read-only access to linked students' progress
 * - Can view courses and lessons their students are enrolled in
 * - Cannot create content or modify data
 */
export async function getParentStudents(parentId: string): Promise<string[]> {
  try {
    const results = await queryOne<{ student_ids: string[] }>(
      `SELECT array_agg(student_id) as student_ids 
       FROM parent_student_links 
       WHERE parent_id = $1 AND is_active = TRUE`,
      [parentId]
    )
    
    return results?.student_ids ?? []
  } catch (err) {
    console.error('[RBAC] Error getting parent students:', err)
    return []
  }
}

/**
 * Standard Response Helpers
 */

export function unauthorized(message = 'Unauthorized') {
  return NextResponse.json({ error: message }, { status: 401 })
}

export function forbidden(message = 'Forbidden') {
  return NextResponse.json({ error: message }, { status: 403 })
}

export function badRequest(message = 'Bad Request') {
  return NextResponse.json({ error: message }, { status: 400 })
}

export function notFound(message = 'Not Found') {
  return NextResponse.json({ error: message }, { status: 404 })
}

export function serverError(message = 'Internal Server Error') {
  return NextResponse.json({ error: message }, { status: 500 })
}

/**
 * Helper: Require specific role
 */
export async function requireRole(req: NextRequest, requiredRole: UserRole) {
  const user = await verifyAndGetUser(req)
  
  if (!user) {
    return { user: null, response: unauthorized('No valid session') }
  }
  
  if (user.role !== requiredRole) {
    return { user, response: forbidden(`This endpoint requires ${requiredRole} role`) }
  }
  
  return { user, response: null }
}

/**
 * Helper: Require one of multiple roles
 */
export async function requireRoles(req: NextRequest, allowedRoles: UserRole[]) {
  const user = await verifyAndGetUser(req)
  
  if (!user) {
    return { user: null, response: unauthorized('No valid session') }
  }
  
  if (!allowedRoles.includes(user.role as UserRole)) {
    return { user, response: forbidden(`Access requires one of: ${allowedRoles.join(', ')}`) }
  }
  
  return { user, response: null }
}

/**
 * Helper: Require specific permission
 */
export async function requirePermission(
  req: NextRequest,
  resource: string,
  action: string
) {
  const user = await verifyAndGetUser(req)
  
  if (!user) {
    return { user: null, response: unauthorized('No valid session') }
  }
  
  const hasPermission = await checkPermission(user.role as UserRole, resource, action)
  
  if (!hasPermission) {
    return { 
      user, 
      response: forbidden(`No permission to ${action} ${resource}`) 
    }
  }
  
  return { user, response: null }
}
