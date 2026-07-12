// Central definitions for the three admin tiers and the Super Admin "mode"
// switching. Shared between server (layout/API guards) and client (sidebar,
// role switcher) so the rules live in exactly one place.

export type AdminTier = "super_admin" | "maqraa_admin" | "academy_admin"

// The "mode" a Super Admin is currently acting as. Stored in a cookie so it
// survives navigation and server renders. Non-super admins are locked to the
// mode matching their tier.
export type AdminMode = "super" | "maqraa" | "academy"

export const ADMIN_MODE_COOKIE = "itqan-admin-mode"

// Routes only a Super Admin may ever see/edit — the public-facing site, design
// system, and platform-wide governance. Maqraa/Academy admins never get these.
export const SUPER_ADMIN_ONLY_PREFIXES = [
  "/admin/homepage",
  "/admin/seo",
  "/admin/theme",
  "/admin/branding",
  "/admin/role-management",
  "/admin/analytics",
  "/admin/security",
  "/admin/backup",
  "/admin/content-pages",
  "/admin/audit-log",
  "/admin/integrations",
]

export function isSuperAdminOnlyPath(pathname: string): boolean {
  return SUPER_ADMIN_ONLY_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(p + "/")
  )
}

// Human-readable, bilingual metadata for each mode. Used by the switcher and
// the "you are acting as…" banner.
export const ADMIN_MODE_META: Record<
  AdminMode,
  { labelAr: string; labelEn: string; descAr: string; accent: string }
> = {
  super: {
    labelAr: "المدير العام",
    labelEn: "Super Admin",
    descAr: "تحكم كامل في المنصة والموقع الخارجي",
    accent: "amber",
  },
  maqraa: {
    labelAr: "مدير المقرأة",
    labelEn: "Maqraa Admin",
    descAr: "إدارة التلاوة والتسميع والمقرئين",
    accent: "emerald",
  },
  academy: {
    labelAr: "مدير الأكاديمية",
    labelEn: "Academy Admin",
    descAr: "إدارة الدورات والطلاب والمعلمين",
    accent: "blue",
  },
}

// Bilingual catalogue describing every role and what it can do. Drives the
// read-only Role Management overview so the client understands the system
// without reading code. `assignableAsPrimary` marks roles a Super Admin may set
// as a user's primary role from the assignment screen.
export type RoleCatalogEntry = {
  id: string
  labelAr: string
  labelEn: string
  group: "admin" | "academy" | "maqraa" | "general"
  summaryAr: string
  summaryEn: string
  capabilitiesAr: string[]
  capabilitiesEn: string[]
  assignableAsPrimary: boolean
  tone: "amber" | "emerald" | "blue" | "slate"
}

export const ROLE_CATALOG: RoleCatalogEntry[] = [
  {
    id: "admin",
    labelAr: "المدير العام (Super Admin)",
    labelEn: "Super Admin",
    group: "admin",
    tone: "amber",
    summaryAr: "تحكم كامل في المنصة بالكامل بما في ذلك الموقع الخارجي والتصميم والحوكمة.",
    summaryEn: "Full control over the entire platform, including the public website, design, and governance.",
    capabilitiesAr: [
      "كل صلاحيات مدير المقرأة ومدير الأكاديمية",
      "التبديل بين أوضاع المقرأة والأكاديمية",
      "تعديل الصفحة الخارجية (الرئيسية) والـ SEO",
      "تعديل التصميم والألوان والخطوط",
      "إدارة الأدوار والصلاحيات للمستخدمين",
      "النسخ الاحتياطي وإعدادات الأمان والإحصائيات الشاملة",
    ],
    capabilitiesEn: [
      "All permissions of Maqraa Admin and Academy Admin",
      "Switching between Maqraa and Academy modes",
      "Editing public website (homepage) and SEO",
      "Editing design, colors, and fonts",
      "Managing user roles and permissions",
      "Backups, security settings, and global analytics",
    ],
    assignableAsPrimary: true,
  },
  {
    id: "maqraa_admin",
    labelAr: "مدير المقرأة",
    labelEn: "Maqraa Admin",
    group: "maqraa",
    tone: "emerald",
    summaryAr: "إدارة جانب التلاوة والتسميع والمقرئين والحلقات.",
    summaryEn: "Managing recitation, listening sessions, reciters, and halaqat.",
    capabilitiesAr: [
      "إدارة المقرئين وطلبات الانضمام",
      "متابعة التلاوات والتسميع والتقييم",
      "إدارة الحلقات ومسارات الحفظ والتجويد",
      "المسابقات والشهادات الخاصة بالمقرأة",
      "لا يصل إلى الموقع الخارجي أو التصميم أو الأمان",
    ],
    capabilitiesEn: [
      "Managing reciters and join applications",
      "Tracking recitations, listening sessions, and evaluations",
      "Managing halaqat, memorization, and tajweed paths",
      "Competitions and certificates for the Maqraa",
      "No access to external website, design, or security settings",
    ],
    assignableAsPrimary: true,
  },
  {
    id: "academy_admin",
    labelAr: "مدير الأكاديمية",
    labelEn: "Academy Admin",
    group: "academy",
    tone: "blue",
    summaryAr: "إدارة جانب الأكاديمية من دورات وطلاب ومعلمين.",
    summaryEn: "Managing the academy, including courses, students, and teachers.",
    capabilitiesAr: [
      "إدارة الدورات والدروس والمحتوى",
      "إدارة الطلاب والمعلمين",
      "المسابقات والشهادات الأكاديمية",
      "إحصائيات الأكاديمية",
      "لا يصل إلى الموقع الخارجي أو التصميم أو الأمان",
    ],
    capabilitiesEn: [
      "Managing courses, lessons, and content",
      "Managing students and teachers",
      "Academy competitions and certificates",
      "Academy statistics",
      "No access to external website, design, or security settings",
    ],
    assignableAsPrimary: true,
  },
  {
    id: "student_supervisor",
    labelAr: "مشرف الطلاب",
    labelEn: "Student Supervisor",
    group: "general",
    tone: "slate",
    summaryAr: "متابعة الطلاب والمهام الإشرافية الخاصة بهم.",
    summaryEn: "Tracking students and their supervisory tasks.",
    capabilitiesAr: ["متابعة الطلاب", "مهام الإشراف", "متابعة التلاوات"],
    capabilitiesEn: ["Tracking students", "Supervisory tasks", "Tracking recitations"],
    assignableAsPrimary: true,
  },
  {
    id: "reciter_supervisor",
    labelAr: "مشرف المقرئين",
    labelEn: "Reciter Supervisor",
    group: "general",
    tone: "slate",
    summaryAr: "متابعة المقرئين وطلبات انضمامهم.",
    summaryEn: "Tracking reciters and their join applications.",
    capabilitiesAr: ["متابعة المقرئين", "طلبات انضمام المقرئين", "متابعة التلاوات"],
    capabilitiesEn: ["Tracking reciters", "Reciter join applications", "Tracking recitations"],
    assignableAsPrimary: true,
  },
  {
    id: "teacher",
    labelAr: "معلم",
    labelEn: "Teacher",
    group: "academy",
    tone: "slate",
    summaryAr: "إنشاء وإدارة دوراته ودروسه وطلابه.",
    summaryEn: "Creating and managing courses, lessons, and students.",
    capabilitiesAr: ["إنشاء الدورات والدروس", "تقييم الطلاب", "الجلسات المباشرة"],
    capabilitiesEn: ["Creating courses and lessons", "Evaluating students", "Live sessions"],
    assignableAsPrimary: false,
  },
  {
    id: "reader",
    labelAr: "مقرئ معتمد",
    labelEn: "Certified Reciter",
    group: "maqraa",
    tone: "slate",
    summaryAr: "تقييم التلاوات وإدارة جلسات التسميع.",
    summaryEn: "Evaluating recitations and managing listening sessions.",
    capabilitiesAr: ["تقييم التلاوات", "إدارة جلسات التسميع", "متابعة طلابه"],
    capabilitiesEn: ["Evaluating recitations", "Managing listening sessions", "Tracking students"],
    assignableAsPrimary: false,
  },
  {
    id: "parent",
    labelAr: "ولي أمر",
    labelEn: "Parent",
    group: "general",
    tone: "slate",
    summaryAr: "متابعة تقدم أبنائه فقط دون تعديل.",
    summaryEn: "Tracking only the progress of their children without modification.",
    capabilitiesAr: ["متابعة تقارير الأبناء"],
    capabilitiesEn: ["Tracking children's reports"],
    assignableAsPrimary: false,
  },
  {
    id: "student",
    labelAr: "طالب",
    labelEn: "Student",
    group: "general",
    tone: "slate",
    summaryAr: "الوصول للمحتوى والتلاوة والمسابقات.",
    summaryEn: "Accessing content, recitations, and competitions.",
    capabilitiesAr: ["المقررات المسجل بها", "إرسال التلاوات", "المسابقات والشهادات"],
    capabilitiesEn: ["Enrolled courses", "Submitting recitations", "Competitions and certificates"],
    assignableAsPrimary: false,
  },
]

// Academy roles a Super Admin can grant in addition to the primary role.
export const ASSIGNABLE_ACADEMY_ROLES: { id: string; labelAr: string; labelEn: string }[] = [
  { id: "maqraa_admin", labelAr: "مدير المقرأة", labelEn: "Maqraa Admin" },
  { id: "academy_admin", labelAr: "مدير الأكاديمية", labelEn: "Academy Admin" },
  { id: "teacher", labelAr: "معلم", labelEn: "Teacher" },
  { id: "content_supervisor", labelAr: "مشرف المحتوى", labelEn: "Content Supervisor" },
  { id: "fiqh_supervisor", labelAr: "مشرف الفقه", labelEn: "Fiqh Supervisor" },
  { id: "quality_supervisor", labelAr: "مشرف الجودة", labelEn: "Quality Supervisor" },
  { id: "supervisor", labelAr: "مشرف عام", labelEn: "General Supervisor" },
]

// Primary roles a Super Admin can assign from the user-roles screen.
export const ASSIGNABLE_PRIMARY_ROLES = ROLE_CATALOG.filter((r) => r.assignableAsPrimary).map((r) => r.id)

// Which modes a given primary role is allowed to use. Super admins can switch
// between all three; scoped admins are pinned to their own mode.
export function allowedModesForRole(role: string, academyRoles: string[] = []): AdminMode[] {
  if (role === "admin" || role === "super_admin") return ["super", "maqraa", "academy"]
  const modes: AdminMode[] = []
  if (role === "maqraa_admin" || academyRoles.includes("maqraa_admin")) modes.push("maqraa")
  if (role === "academy_admin" || academyRoles.includes("academy_admin")) modes.push("academy")
  return modes
}

// The default landing mode for a role (first allowed mode, super defaults to super).
export function defaultModeForRole(role: string, academyRoles: string[] = []): AdminMode {
  const modes = allowedModesForRole(role, academyRoles)
  return modes[0] ?? "maqraa"
}

// Resolve the effective mode from a stored cookie value + the user's role,
// guarding against a stale/forbidden cookie (e.g. a demoted user).
export function resolveAdminMode(
  cookieValue: string | undefined,
  role: string,
  academyRoles: string[] = []
): AdminMode {
  const allowed = allowedModesForRole(role, academyRoles)
  if (cookieValue && allowed.includes(cookieValue as AdminMode)) {
    return cookieValue as AdminMode
  }
  return defaultModeForRole(role, academyRoles)
}
