import type {
  CourseLevel,
  CourseStatus,
  EnrollmentStatus,
  TaskStatus,
  TaskType,
  SessionStatus,
  MemorizationQuality,
  PointsAction,
  CompetitionStatus,
  ForumCategory,
  FiqhStatus,
} from '../types'

// ==================== COURSES ====================

export interface AcademyCourse {
  id: string
  title: string
  description?: string
  thumbnail_url?: string
  teacher_id: string
  teacher_name?: string
  category_id?: string
  category_name?: string
  level: CourseLevel
  status: CourseStatus
  is_public: boolean
  allow_enrollment: boolean
  max_students?: number
  enrolled_count?: number
  price?: number
  duration_weeks?: number
  created_at: string
  updated_at?: string
}

export interface CourseLesson {
  id: string
  course_id: string
  title: string
  content?: string
  video_url?: string
  audio_url?: string
  pdf_url?: string
  order_index: number
  duration_minutes?: number
  is_free: boolean
  created_at: string
}

export interface CourseCategory {
  id: string
  name: string
  description?: string
  icon?: string
  parent_id?: string
  order_index: number
}

// ==================== ENROLLMENTS ====================

export interface Enrollment {
  id: string
  student_id: string
  student_name?: string
  student_avatar?: string
  course_id: string
  course_title?: string
  enrolled_at: string
  status: EnrollmentStatus
  progress_percent: number
  completed_lessons: number
  total_lessons?: number
  last_lesson_id?: string
  completed_at?: string
}

// ==================== SESSIONS ====================

export interface CourseSession {
  id: string
  course_id: string
  course_title?: string
  teacher_id: string
  teacher_name?: string
  title: string
  description?: string
  scheduled_at: string
  duration_minutes: number
  meeting_link?: string
  status: SessionStatus
  recording_url?: string
  attendees_count?: number
  created_at: string
}

export interface SessionAttendance {
  id: string
  session_id: string
  student_id: string
  student_name?: string
  joined_at: string
  left_at?: string
  duration_minutes?: number
}

// ==================== TASKS ====================

export interface Task {
  id: string
  course_id: string
  course_title?: string
  teacher_id: string
  title: string
  description?: string
  type: TaskType
  due_date?: string
  points_value: number
  surah_number?: number
  ayah_from?: number
  ayah_to?: number
  created_at: string
}

export interface TaskSubmission {
  id: string
  task_id: string
  task_title?: string
  student_id: string
  student_name?: string
  submitted_at: string
  content?: string
  file_url?: string
  audio_url?: string
  status: TaskStatus
  grade?: number
  feedback?: string
  graded_at?: string
  graded_by?: string
}

// ==================== MEMORIZATION ====================

export interface MemorizationLog {
  id: string
  student_id: string
  student_name?: string
  teacher_id?: string
  teacher_name?: string
  surah_number: number
  surah_name?: string
  ayah_from: number
  ayah_to: number
  quality: MemorizationQuality
  mistakes_count?: number
  notes?: string
  audio_url?: string
  points_earned: number
  logged_at: string
}

export interface MemorizationProgress {
  student_id: string
  total_ayahs: number
  total_juz: number
  last_memorized_surah: number
  last_memorized_ayah: number
  streak_days: number
  total_reviews: number
}

// ==================== LEARNING PATHS ====================

export interface LearningPath {
  id: string
  title: string
  description?: string
  thumbnail_url?: string
  level: CourseLevel
  estimated_weeks: number
  courses_count?: number
  enrolled_count?: number
  created_by: string
  is_active: boolean
  created_at: string
}

export interface LearningPathCourse {
  id: string
  path_id: string
  course_id: string
  course_title?: string
  order_index: number
  is_required: boolean
}

export interface StudentPathProgress {
  id: string
  student_id: string
  path_id: string
  path_title?: string
  current_course_id?: string
  completed_courses: number
  total_courses?: number
  progress_percent: number
  started_at: string
  completed_at?: string
}

// ==================== POINTS & GAMIFICATION ====================

export interface UserPoints {
  user_id: string
  total_points: number
  current_level: number
  streak_days: number
  longest_streak: number
  last_activity_date?: string
}

export interface PointsLog {
  id: string
  user_id: string
  action: PointsAction
  points: number
  description?: string
  reference_id?: string
  reference_type?: string
  created_at: string
}

export interface Badge {
  id: string
  name: string
  description?: string
  icon_url?: string
  points_required?: number
  criteria_type: string
  criteria_value?: number
}

export interface UserBadge {
  id: string
  user_id: string
  badge_id: string
  badge_name?: string
  badge_icon?: string
  earned_at: string
}

// ==================== COMPETITIONS ====================

export interface Competition {
  id: string
  title: string
  description?: string
  type: string
  start_date: string
  end_date: string
  status: CompetitionStatus
  prize_description?: string
  max_participants?: number
  participants_count?: number
  created_by: string
  created_at: string
}

export interface CompetitionEntry {
  id: string
  competition_id: string
  student_id: string
  student_name?: string
  score?: number
  rank?: number
  submission_url?: string
  submitted_at?: string
  judged_at?: string
  judge_notes?: string
}

// ==================== FORUM ====================

export interface ForumPost {
  id: string
  author_id: string
  author_name?: string
  author_avatar?: string
  author_role?: string
  title: string
  content: string
  category: ForumCategory
  is_pinned: boolean
  is_closed: boolean
  views_count: number
  replies_count: number
  created_at: string
  updated_at?: string
}

export interface ForumReply {
  id: string
  post_id: string
  author_id: string
  author_name?: string
  author_avatar?: string
  author_role?: string
  content: string
  is_accepted: boolean
  likes_count: number
  created_at: string
  updated_at?: string
}

// ==================== FIQH QUESTIONS ====================

export interface FiqhQuestion {
  id: string
  asker_id: string
  asker_name?: string
  question: string
  category?: string
  status: FiqhStatus
  answered_by?: string
  answerer_name?: string
  answer?: string
  is_public: boolean
  views_count: number
  created_at: string
  answered_at?: string
}

// ==================== HALAQAT (Study Circles) ====================

export interface Halaqa {
  id: string
  name: string
  description?: string
  teacher_id: string
  teacher_name?: string
  max_students: number
  current_students?: number
  schedule_days?: string[]
  schedule_time?: string
  meeting_link?: string
  is_active: boolean
  created_at: string
}

export interface HalaqaStudent {
  id: string
  halaqa_id: string
  student_id: string
  student_name?: string
  joined_at: string
  is_active: boolean
}

// ==================== INVITATIONS ====================

export interface AcademyInvitation {
  id: string
  code: string
  course_id?: string
  course_title?: string
  halaqa_id?: string
  halaqa_name?: string
  path_id?: string
  path_title?: string
  created_by: string
  max_uses?: number
  used_count: number
  expires_at?: string
  is_active: boolean
  created_at: string
}

// ==================== PARENT-STUDENT ====================

export interface ParentStudentRelation {
  id: string
  parent_id: string
  parent_name?: string
  student_id: string
  student_name?: string
  relation_type: 'father' | 'mother' | 'guardian'
  is_verified: boolean
  created_at: string
}

export interface StudentReport {
  student_id: string
  student_name: string
  total_points: number
  current_level: number
  courses_enrolled: number
  courses_completed: number
  tasks_completed: number
  tasks_pending: number
  memorization_progress: number
  attendance_rate: number
  last_activity?: string
}

// ==================== DASHBOARD STATS ====================

export interface AcademyStudentStats {
  enrolled_courses: number
  completed_courses: number
  pending_tasks: number
  total_points: number
  current_level: number
  streak_days: number
  upcoming_sessions: number
  badges_earned: number
}

export interface AcademyTeacherStats {
  total_courses: number
  active_courses: number
  total_students: number
  pending_submissions: number
  upcoming_sessions: number
  total_halaqat: number
  average_rating?: number
}

export interface AcademyAdminStats {
  total_students: number
  total_teachers: number
  total_courses: number
  active_enrollments: number
  pending_invitations: number
  total_competitions: number
  total_forum_posts: number
  pending_fiqh_questions: number
}

// ==================== API RESPONSES ====================

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  limit: number
  total_pages: number
}

export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
  message?: string
}
