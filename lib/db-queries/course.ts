/**
 * Course Database Queries
 * Handles all course-related operations
 */

import { query, queryOne } from "../db"
import type { Course, CourseEnrollment, StudentProgress } from "../types/lms"

export async function getCourseById(courseId: string): Promise<Course | null> {
  return queryOne<Course>(
    `SELECT * FROM courses WHERE id = $1`,
    [courseId]
  )
}

export async function getCoursesByTeacher(teacherId: string): Promise<Course[]> {
  return query<Course>(
    `SELECT * FROM courses WHERE teacher_id = $1 ORDER BY createdAt DESC`,
    [teacherId]
  )
}

export async function getAllCourses(limit = 50, offset = 0): Promise<Course[]> {
  return query<Course>(
    `SELECT * FROM courses ORDER BY createdAt DESC LIMIT $1 OFFSET $2`,
    [limit, offset]
  )
}

/**
 * Get all courses filtered by teacher gender (for gender segregation)
 * Returns courses where the teacher's gender matches the student's gender
 */
export async function getAllCoursesWithGenderFilter(
  studentGender: string,
  limit = 50,
  offset = 0
): Promise<Course[]> {
  return query<Course>(
    `SELECT c.* FROM courses c
     JOIN users u ON c.teacher_id = u.id
     WHERE u.gender = $1
     ORDER BY c.createdAt DESC 
     LIMIT $2 OFFSET $3`,
    [studentGender, limit, offset]
  )
}

export async function createCourse(
  teacherId: string,
  title: string,
  description: string,
  category?: string
): Promise<Course | null> {
  return queryOne<Course>(
    `INSERT INTO courses (teacher_id, title, description, category, status)
     VALUES ($1, $2, $3, $4, 'active')
     RETURNING *`,
    [teacherId, title, description, category]
  )
}

export async function updateCourse(
  courseId: string,
  updates: Partial<Course>
): Promise<Course | null> {
  const setClauses: string[] = []
  const values: any[] = []
  let paramIndex = 1

  Object.entries(updates).forEach(([key, value]) => {
    if (key !== 'id' && key !== 'createdAt') {
      setClauses.push(`${key} = $${paramIndex}`)
      values.push(value)
      paramIndex++
    }
  })

  if (setClauses.length === 0) return getCourseById(courseId)

  values.push(courseId)
  const query_str = `UPDATE courses SET ${setClauses.join(', ')}, updatedAt = CURRENT_TIMESTAMP WHERE id = $${paramIndex} RETURNING *`

  return queryOne<Course>(query_str, values)
}

export async function deleteCourse(courseId: string): Promise<boolean> {
  const result = await query(
    `DELETE FROM courses WHERE id = $1`,
    [courseId]
  )
  return result.length > 0
}

export async function enrollStudent(
  courseId: string,
  studentId: string
): Promise<CourseEnrollment | null> {
  return queryOne<CourseEnrollment>(
    `INSERT INTO course_enrollments (course_id, student_id, status)
     VALUES ($1, $2, 'active')
     RETURNING *`,
    [courseId, studentId]
  )
}

export async function getEnrolledStudents(courseId: string): Promise<any[]> {
  return query(
    `SELECT u.*, ce.enrollment_date, ce.status FROM course_enrollments ce
     JOIN users u ON ce.student_id = u.id
     WHERE ce.course_id = $1
     ORDER BY u.name ASC`,
    [courseId]
  )
}

export async function getStudentCourses(studentId: string): Promise<any[]> {
  return query(
    `SELECT c.*, COUNT(DISTINCT l.id) as lessonsCount
     FROM course_enrollments ce
     JOIN courses c ON ce.course_id = c.id
     LEFT JOIN lessons l ON c.id = l.course_id
     WHERE ce.student_id = $1 AND ce.status = 'active'
     GROUP BY c.id
     ORDER BY c.createdAt DESC`,
    [studentId]
  )
}

export async function removeCourseEnrollment(courseId: string, studentId: string): Promise<boolean> {
  const result = await query(
    `DELETE FROM course_enrollments WHERE course_id = $1 AND student_id = $2`,
    [courseId, studentId]
  )
  return result.length > 0
}

export async function getStudentProgress(studentId: string, courseId: string): Promise<StudentProgress[]> {
  return query<StudentProgress>(
    `SELECT * FROM student_progress
     WHERE student_id = $1 AND course_id = $2
     ORDER BY lastAccessedAt DESC`,
    [studentId, courseId]
  )
}

export async function updateStudentProgress(
  studentId: string,
  courseId: string,
  lessonId: string,
  isCompleted: boolean
): Promise<StudentProgress | null> {
  return queryOne<StudentProgress>(
    `INSERT INTO student_progress (student_id, course_id, lesson_id, is_completed, completedAt)
     VALUES ($1, $2, $3, $4, $5)
     ON CONFLICT (student_id, course_id, lesson_id) 
     DO UPDATE SET is_completed = $4, completedAt = $5, lastAccessedAt = CURRENT_TIMESTAMP
     RETURNING *`,
    [studentId, courseId, lessonId, isCompleted, isCompleted ? new Date() : null]
  )
}

export async function getStudentProgressPercentage(studentId: string, courseId: string): Promise<number> {
  const result = await queryOne<{ percentage: number }>(
    `SELECT ROUND(100.0 * COUNT(DISTINCT sp.lesson_id) FILTER (WHERE sp.is_completed) / 
     NULLIF(COUNT(DISTINCT l.id), 0), 2) as percentage
     FROM lessons l
     LEFT JOIN student_progress sp ON l.id = sp.lesson_id AND sp.student_id = $1
     WHERE l.course_id = $2`,
    [studentId, courseId]
  )
  return result?.percentage || 0
}
