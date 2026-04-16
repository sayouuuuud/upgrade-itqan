/**
 * Parent-Student Relationship Database Queries
 * Handles family monitoring relationships
 */

import { query, queryOne } from "../db"
import type { ParentStudentLink as ParentStudentRelation } from "../types/lms"

export async function linkParentToStudent(
  parentId: string,
  studentId: string,
  relationship: string = "parent"
): Promise<ParentStudentRelation | null> {
  return queryOne<ParentStudentRelation>(
    `INSERT INTO parent_student_relations (parent_id, student_id, relationship, status)
     VALUES ($1, $2, $3, 'active')
     RETURNING *`,
    [parentId, studentId, relationship]
  )
}

export async function getStudentChildren(parentId: string): Promise<any[]> {
  return query(
    `SELECT u.*, psr.relationship, psr.status, psr.linkedAt
     FROM parent_student_relations psr
     JOIN users u ON psr.student_id = u.id
     WHERE psr.parent_id = $1 AND psr.status = 'active'
     ORDER BY u.name ASC`,
    [parentId]
  )
}

export async function getStudentParents(studentId: string): Promise<any[]> {
  return query(
    `SELECT u.*, psr.relationship, psr.status, psr.linkedAt
     FROM parent_student_relations psr
     JOIN users u ON psr.parent_id = u.id
     WHERE psr.student_id = $1 AND psr.status = 'active'
     ORDER BY u.name ASC`,
    [studentId]
  )
}

export async function getChildrenProgress(parentId: string): Promise<any[]> {
  return query(
    `SELECT 
      u.id,
      u.name,
      u.email,
      c.id as courseId,
      c.title as courseTitle,
      ROUND(100.0 * COUNT(DISTINCT sp.lesson_id) FILTER (WHERE sp.is_completed) / 
            NULLIF(COUNT(DISTINCT l.id), 0), 2) as progressPercentage,
      COUNT(DISTINCT l.id) as totalLessons,
      COUNT(DISTINCT sp.lesson_id) FILTER (WHERE sp.is_completed) as completedLessons
     FROM parent_student_relations psr
     JOIN users u ON psr.student_id = u.id
     LEFT JOIN course_enrollments ce ON u.id = ce.student_id
     LEFT JOIN courses c ON ce.course_id = c.id
     LEFT JOIN lessons l ON c.id = l.course_id
     LEFT JOIN student_progress sp ON u.id = sp.student_id AND l.id = sp.lesson_id
     WHERE psr.parent_id = $1 AND psr.status = 'active'
     GROUP BY u.id, u.name, u.email, c.id, c.title
     ORDER BY u.name ASC, c.createdAt DESC`,
    [parentId]
  )
}

export async function removeParentStudentLink(parentId: string, studentId: string): Promise<boolean> {
  const result = await query(
    `UPDATE parent_student_relations SET status = 'inactive' 
     WHERE parent_id = $1 AND student_id = $2`,
    [parentId, studentId]
  )
  return result.length > 0
}

export async function checkRelationshipExists(parentId: string, studentId: string): Promise<boolean> {
  const result = await query<{ exists: boolean }>(
    `SELECT EXISTS(
       SELECT 1 FROM parent_student_relations 
       WHERE parent_id = $1 AND student_id = $2 AND status = 'active'
     ) as exists`,
    [parentId, studentId]
  )
  return result[0]?.exists || false
}

export async function getChildCourseProgress(parentId: string, studentId: string, courseId: string): Promise<any> {
  return queryOne(
    `SELECT 
      c.id,
      c.title,
      c.description,
      COUNT(DISTINCT l.id) as totalLessons,
      COUNT(DISTINCT sp.lesson_id) FILTER (WHERE sp.is_completed) as completedLessons,
      ROUND(100.0 * COUNT(DISTINCT sp.lesson_id) FILTER (WHERE sp.is_completed) / 
            NULLIF(COUNT(DISTINCT l.id), 0), 2) as progressPercentage,
      MAX(sp.lastAccessedAt) as lastAccessed,
      array_agg(json_build_object(
        'id', l.id,
        'title', l.title,
        'isCompleted', sp.is_completed,
        'completedAt', sp.completedAt
      ) ORDER BY l.order_index) as lessons
     FROM courses c
     LEFT JOIN lessons l ON c.id = l.course_id
     LEFT JOIN student_progress sp ON l.id = sp.lesson_id AND sp.student_id = $2
     WHERE c.id = $3 
     AND EXISTS(
       SELECT 1 FROM parent_student_relations psr
       WHERE psr.parent_id = $1 AND psr.student_id = $2 AND psr.status = 'active'
     )
     GROUP BY c.id, c.title, c.description`,
    [parentId, studentId, courseId]
  )
}
