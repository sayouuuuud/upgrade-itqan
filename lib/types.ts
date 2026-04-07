export type UserRole = 'student' | 'reader' | 'admin' | 'teacher' | 'parent' | 'academy_admin'

// Academy-specific types
export type AcademyRole = 'academy_student' | 'teacher' | 'academy_admin' | 'parent'
export type CourseLevel = 'beginner' | 'intermediate' | 'advanced'
export type CourseStatus = 'draft' | 'published' | 'archived'
export type EnrollmentStatus = 'active' | 'completed' | 'dropped' | 'suspended'
export type TaskStatus = 'pending' | 'submitted' | 'graded' | 'late'
export type TaskType = 'memorization' | 'recitation' | 'written' | 'quiz'
export type SessionStatus = 'scheduled' | 'live' | 'completed' | 'cancelled'
export type MemorizationQuality = 'excellent' | 'good' | 'acceptable' | 'needs_review'
export type PointsAction = 'task_complete' | 'memorization' | 'attendance' | 'competition_win' | 'streak_bonus' | 'badge_earned' | 'forum_answer' | 'manual'
export type CompetitionStatus = 'upcoming' | 'active' | 'completed'
export type ForumCategory = 'general' | 'quran' | 'tajweed' | 'fiqh' | 'other'
export type FiqhStatus = 'pending' | 'answered' | 'closed'
export type RecitationStatus = 'pending' | 'in_review' | 'mastered' | 'needs_session' | 'session_booked' | 'rejected'
export type BookingStatus = 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'no_show' | 'rescheduled'
export type UserGender = 'male' | 'female'
export type ReaderApprovalStatus = 'auto_approved' | 'pending_approval' | 'approved' | 'rejected'

export interface User {
  id: string
  name: string
  email: string
  role: UserRole
  gender?: UserGender
  avatar_url?: string
  phone?: string
  is_active: boolean
  approval_status?: ReaderApprovalStatus
  verification_code?: string
  verification_expires_at?: string
  email_verified?: boolean
  reset_code?: string
  reset_expires_at?: string
  created_at: string
}

export interface ReaderProfile {
  id: string
  user_id: string
  full_name_triple: string
  phone: string
  city: string
  gender: UserGender
  qualification?: string
  memorized_parts?: number
  years_of_experience?: number
  certificate_file_url?: string
}

export interface Recitation {
  id: string
  student_id: string
  student_name: string
  student_avatar?: string
  file_url: string
  surah: string
  surah_number: number
  ayah_from: number
  ayah_to: number
  status: RecitationStatus
  duration: string
  notes?: string
  assigned_reader_id?: string
  assigned_reader_name?: string
  review_grade?: 'passed' | 'needs_review'
  review_notes?: string
  review_tags?: string[]
  reviewed_at?: string
  created_at: string
}

export interface Booking {
  id: string
  reader_id: string
  reader_name: string
  student_id: string
  student_name: string
  slot_start: string
  slot_end: string
  status: BookingStatus
  meeting_link?: string
  platform: string
  created_at: string
}

export interface BookingComment {
  id: string
  booking_id: string
  user_id: string
  user_name: string
  comment_text: string
  created_at: string
}

export interface CertificateData {
  id: string
  student_id: string
  university?: string
  college?: string
  city?: string
  gender?: UserGender
  pdf_file_url?: string
  certificate_issued: boolean
  certificate_url?: string
  certificate_pdf_url?: string
  created_at?: string
  updated_at?: string
}

export interface TimeSlot {
  id: string
  start: string
  end: string
  is_booked: boolean
}

export interface Notification {
  id: string
  user_id: string
  type: 'review_complete' | 'new_recitation' | 'booking_confirmed' | 'session_reminder' | 'system' | 'mastered' | 'needs_session' | 'session_booked' | 'status_change'
  title: string
  body: string
  is_read: boolean
  created_at: string
}

export interface Message {
  id: string
  sender_id: string
  sender_name: string
  receiver_id: string
  content: string
  created_at: string
}

export interface AdminStats {
  total_users: number
  active_students: number
  approved_readers: number
  new_registrations: number
  total_recitations: number
  pending_recitations: number
  completed_sessions: number
  weekly_recitations: number[]
  pending_reader_applications?: number
}

export interface ReaderApplication {
  id: string
  name: string
  email: string
  full_name_triple: string
  phone: string
  city: string
  gender: UserGender
  qualification?: string
  memorized_parts?: number
  years_of_experience?: number
  certificate_file_url?: string
  approval_status: ReaderApprovalStatus
  created_at: string
}
