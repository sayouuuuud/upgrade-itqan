// Shared types for the community platform (forum / consultations / articles).

export type Community = "academy" | "maqraa"
export type PostType = "discussion" | "qna"

export type ForumCategoryAcademy =
  | "general"
  | "tarbiya"
  | "academic"
  | "announcements"
  | "questions"
  | "advice"

export type ForumCategoryMaqraa =
  | "general"
  | "tajweed"
  | "qiraat"
  | "hifd"
  | "announcements"
  | "questions"

export type ForumCategory = ForumCategoryAcademy | ForumCategoryMaqraa

export type ReportStatus = "open" | "reviewed" | "dismissed" | "actioned"
export type ReportTargetType = "post" | "reply"

export type ArticleStatus =
  | "draft"
  | "pending_review"
  | "published"
  | "rejected"
  | "archived"

export type ArticleCategory =
  | "tarbiya"
  | "academic"
  | "general"
  | "tajweed"
  | "qiraat"
  | "hifd"
  | "fiqh"
  | "aqeedah"
  | "seerah"
  | "tafseer"
  | "parenting"

export interface ForumPost {
  id: string
  author_id: string
  community: Community
  post_type: PostType
  title: string
  content: string
  category: ForumCategory
  tags: string[]
  is_pinned: boolean
  is_locked: boolean
  is_approved: boolean
  is_hidden: boolean
  hidden_reason: string | null
  best_reply_id: string | null
  views_count: number
  replies_count: number
  last_reply_at: string | null
  last_reply_by: string | null
  created_at: string
  updated_at: string
  // joined fields
  author_name?: string
  author_avatar?: string | null
  author_role?: string
}

export interface ForumReply {
  id: string
  post_id: string
  author_id: string
  content: string
  is_approved: boolean
  is_best_answer: boolean
  likes_count: number
  created_at: string
  updated_at: string
  // joined
  author_name?: string
  author_avatar?: string | null
  author_role?: string
  liked_by_me?: boolean
}

export interface ForumReport {
  id: string
  target_type: ReportTargetType
  target_id: string
  reporter_id: string
  community: Community
  reason: string
  details: string | null
  status: ReportStatus
  reviewed_by: string | null
  reviewed_at: string | null
  created_at: string
}

export interface Article {
  id: string
  author_id: string
  community: Community
  title: string
  slug: string
  excerpt: string | null
  content: string
  cover_image_url: string | null
  category: ArticleCategory
  tags: string[]
  status: ArticleStatus
  reviewed_by: string | null
  reviewed_at: string | null
  rejected_reason: string | null
  views_count: number
  likes_count: number
  comments_count: number
  reading_minutes: number | null
  published_at: string | null
  created_at: string
  updated_at: string
  // joined
  author_name?: string
  author_avatar?: string | null
  liked_by_me?: boolean
}

export interface ArticleComment {
  id: string
  article_id: string
  author_id: string
  content: string
  is_hidden: boolean
  created_at: string
  updated_at: string
  author_name?: string
  author_avatar?: string | null
}

export const ACADEMY_FORUM_CATEGORIES: ForumCategoryAcademy[] = [
  "general",
  "tarbiya",
  "academic",
  "announcements",
  "questions",
  "advice",
]

export const MAQRAA_FORUM_CATEGORIES: ForumCategoryMaqraa[] = [
  "general",
  "tajweed",
  "qiraat",
  "hifd",
  "announcements",
  "questions",
]

export const ACADEMY_ARTICLE_CATEGORIES: ArticleCategory[] = [
  "tarbiya",
  "academic",
  "general",
  "fiqh",
  "aqeedah",
  "seerah",
  "tafseer",
  "parenting",
]

export const MAQRAA_ARTICLE_CATEGORIES: ArticleCategory[] = [
  "tajweed",
  "qiraat",
  "hifd",
  "general",
  "tafseer",
]

export const CATEGORY_LABELS_AR: Record<string, string> = {
  general: "عام",
  tarbiya: "تربية",
  academic: "أكاديمي",
  announcements: "إعلانات",
  questions: "أسئلة",
  advice: "نصائح",
  tajweed: "تجويد",
  qiraat: "قراءات",
  hifd: "حفظ",
  fiqh: "فقه",
  aqeedah: "عقيدة",
  seerah: "سيرة",
  tafseer: "تفسير",
  parenting: "إرشاد أسري",
}

export const REPORT_REASONS: { value: string; label_ar: string }[] = [
  { value: "spam", label_ar: "محتوى مكرر أو إعلاني" },
  { value: "offensive", label_ar: "محتوى مسيء" },
  { value: "off_topic", label_ar: "خارج نطاق القسم" },
  { value: "misinformation", label_ar: "معلومات مغلوطة" },
  { value: "other", label_ar: "سبب آخر" },
]
