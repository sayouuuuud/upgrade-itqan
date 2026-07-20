export type DocsLocale = 'ar' | 'en'

export type LocalizedText = Record<DocsLocale, string>

export type DocsSection = {
  id: string
  title: LocalizedText
  intro?: LocalizedText
  steps: Record<DocsLocale, string[]>
  note?: LocalizedText
}

export type DocsGuide = {
  slug: string
  group: 'start' | 'users' | 'staff' | 'admin' | 'support'
  icon: 'start' | 'student' | 'reader' | 'teacher' | 'parent' | 'supervisor' | 'admin' | 'support'
  title: LocalizedText
  description: LocalizedText
  audience: LocalizedText
  keywords: Record<DocsLocale, string[]>
  productRoutes: string[]
  reviewedAt: string
  sections: DocsSection[]
}

export const docsGroups: Array<{ id: DocsGuide['group']; label: LocalizedText }> = [
  { id: 'start', label: { ar: 'ابدأ هنا', en: 'Start here' } },
  { id: 'users', label: { ar: 'أدلة المستخدمين', en: 'User guides' } },
  { id: 'staff', label: { ar: 'المعلمون والمشرفون', en: 'Staff & supervisors' } },
  { id: 'admin', label: { ar: 'أدلة الإدارة', en: 'Administration' } },
  { id: 'support', label: { ar: 'المساعدة', en: 'Help & support' } },
]

export const docsGuides: DocsGuide[] = [
  {
    slug: 'getting-started', group: 'start', icon: 'start', reviewedAt: '2026-07-21',
    title: { ar: 'إنشاء الحساب والبدء', en: 'Create an account and get started' },
    description: { ar: 'من إنشاء حسابك وحتى الوصول إلى لوحة التحكم المناسبة لدورك.', en: 'From creating your account to reaching the dashboard for your role.' },
    audience: { ar: 'جميع الزوار والمستخدمين الجدد', en: 'All visitors and new users' },
    keywords: { ar: ['تسجيل', 'حساب', 'دخول', 'كلمة المرور', 'تحقق'], en: ['register', 'account', 'login', 'password', 'verify'] },
    productRoutes: ['/register', '/reader-register', '/teacher-register', '/verify', '/login', '/forgot-password'],
    sections: [
      { id: 'choose-account', title: { ar: 'اختر نوع الحساب', en: 'Choose your account type' }, intro: { ar: 'اختيار النوع الصحيح يحدد نموذج التسجيل ومسار الموافقة.', en: 'Your account type determines the registration form and approval flow.' }, steps: { ar: ['اختر حساب طالب للتعلم، حضور الحلقات، وإرسال التلاوات.', 'اختر طلب مقرئ إذا كنت تريد مراجعة تلاوات الطلاب وإدارة جلسات التسميع.', 'اختر طلب معلم إذا كنت ستدير دورات الأكاديمية ودروسها.', 'حسابات الإدارة والإشراف تُمنح بواسطة الإدارة ولا تُنشأ من نموذج التسجيل العام.'], en: ['Choose Student to learn, join circles, and submit recitations.', 'Choose Reader application to review recitations and manage recitation sessions.', 'Choose Teacher application to manage academy courses and lessons.', 'Administration and supervisor access is assigned by management, not through public registration.'] } },
      { id: 'register', title: { ar: 'سجّل حسابًا', en: 'Register your account' }, steps: { ar: ['افتح صفحة التسجيل المناسبة.', 'أدخل بياناتك الصحيحة وبريدًا يمكنك الوصول إليه.', 'أنشئ كلمة مرور قوية، وافق على الشروط، ثم أرسل النموذج.', 'أدخل رمز التحقق الذي يصلك. إذا انتهت صلاحيته، اطلب رمزًا جديدًا من شاشة التحقق.'], en: ['Open the registration page for your account type.', 'Enter accurate information and an email address you can access.', 'Create a strong password, accept the terms, and submit.', 'Enter the verification code you receive. Request a new code if it expires.'] }, note: { ar: 'طلبات المقرئ والمعلم قد تبقى قيد المراجعة قبل تفعيل أدوات الدور.', en: 'Reader and teacher applications may remain under review before role tools are enabled.' } },
      { id: 'login', title: { ar: 'الدخول واستعادة الحساب', en: 'Sign in and recover access' }, steps: { ar: ['افتح تسجيل الدخول وأدخل البريد وكلمة المرور.', 'بعد الدخول ستنتقل إلى اللوحة المتاحة حسب دورك وصلاحياتك.', 'إذا نسيت كلمة المرور، اختر نسيت كلمة المرور واتبع رسالة الاستعادة.', 'إذا ظهرت رسالة انتظار أو رفض، راجع حالة طلب الدور أو تواصل مع الدعم.'], en: ['Open Sign in and enter your email and password.', 'You will be sent to the dashboard available for your role and permissions.', 'Use Forgot password and follow the recovery message if needed.', 'If you see pending or rejected status, review your role application or contact support.'] } },
    ],
  },
  {
    slug: 'student-guide', group: 'users', icon: 'student', reviewedAt: '2026-07-21',
    title: { ar: 'دليل الطالب', en: 'Student guide' },
    description: { ar: 'الدورات، التلاوات، الحلقات، الحجز، التقدم والمكافآت.', en: 'Courses, recitations, circles, booking, progress, and rewards.' },
    audience: { ar: 'طلاب المقرأة والأكاديمية', en: 'Maqraa and academy students' },
    keywords: { ar: ['طالب', 'دورة', 'شراء', 'التحاق', 'تلاوة', 'حلقة', 'واجب', 'شهادة'], en: ['student', 'course', 'purchase', 'enroll', 'recitation', 'circle', 'assignment', 'certificate'] },
    productRoutes: ['/student', '/student/submit', '/student/halaqat', '/student/booking', '/academy/student/courses'],
    sections: [
      { id: 'dashboard', title: { ar: 'استخدم لوحة الطالب', en: 'Use the student dashboard' }, steps: { ar: ['راجع الملخص لمعرفة مهامك والجلسات القادمة.', 'افتح الإشعارات لمعرفة التقييمات والقبول والتحديثات.', 'حدّث ملفك الشخصي وبيانات التواصل عند الحاجة.'], en: ['Review the summary for tasks and upcoming sessions.', 'Open notifications for reviews, approvals, and updates.', 'Keep your profile and contact details current.'] } },
      { id: 'courses', title: { ar: 'الالتحاق بدورة ودراسة الدروس', en: 'Enroll in a course and study lessons' }, steps: { ar: ['افتح الأكاديمية ثم استعرض الدورات المتاحة لك.', 'افتح صفحة الدورة واقرأ الوصف والمتطلبات قبل طلب الالتحاق.', 'اضغط زر الالتحاق أو الشراء الظاهر في صفحة الدورة؛ إذا كانت الدورة مدفوعة ستظهر لك خطوة الدفع المتاحة، وإلا يُسجل طلبك مباشرة.', 'بعد القبول، افتح دوراتي ثم اختر الدورة والدّرس المطلوب.', 'أكمل المحتوى والواجبات بالترتيب وتابع حالة التصحيح من صفحة مهامك.'], en: ['Open the Academy and browse courses available to you.', 'Open a course and review its description and requirements before enrolling.', 'Use the enrollment or purchase action shown on the course. Paid courses show the available payment step; otherwise your enrollment is recorded directly.', 'After approval, open My courses and choose the course and lesson.', 'Complete content and assignments in order, then track grading from your tasks.'] }, note: { ar: 'الأزرار المتاحة تعتمد على نشر الدورة، وصولك للأكاديمية، وحالة الالتحاق.', en: 'Available actions depend on course publication, academy access, and enrollment status.' } },
      { id: 'recitation', title: { ar: 'أرسل تلاوة وتابع تقييمها', en: 'Submit and track a recitation' }, steps: { ar: ['افتح إرسال تلاوة وحدد السورة ونطاق الآيات.', 'سجّل أو ارفع الملف الصوتي ثم راجع البيانات قبل الإرسال.', 'تابع الحالة من تلاواتي: قيد المراجعة، تحتاج مراجعة، متقنة، أو تحتاج جلسة.', 'افتح التلاوة لقراءة ملاحظات المقرئ، ثم أعد المحاولة أو احجز جلسة إذا طُلب ذلك.'], en: ['Open Submit recitation and select the surah and verse range.', 'Record or upload audio, then review the details before submitting.', 'Track it under My recitations: in review, needs review, mastered, or needs a session.', 'Open the recitation for reader feedback, then retry or book a session when requested.'] } },
      { id: 'circles', title: { ar: 'الحلقات والجلسات المباشرة', en: 'Circles and live sessions' }, steps: { ar: ['افتح الحلقات واختر الحلقة المسجل بها أو المتاحة للتقديم.', 'راجع الموعد والمقرئ والتعليمات.', 'عند بدء الموعد استخدم زر الانضمام للغرفة المباشرة.', 'تابع الحضور والتقدم من صفحات الجلسات والتقدم والتقويم.'], en: ['Open Circles and choose your enrolled circle or one open for application.', 'Review the schedule, reader, and instructions.', 'At the scheduled time, use Join to enter the live room.', 'Track attendance and progress from Sessions, Progress, and Calendar.'] } },
      { id: 'rewards', title: { ar: 'التقدم والشهادات والمكافآت', en: 'Progress, certificates, and rewards' }, steps: { ar: ['راجع مسارات الحفظ والتجويد لمعرفة المرحلة الحالية.', 'افتح النقاط والشارات لمعرفة الإنجازات وكيفية اكتسابها.', 'شارك في المسابقات المتاحة واقرأ الشروط قبل الانضمام.', 'عند استيفاء الشروط افتح الشهادات وقدّم الطلب أو نزّل الشهادة المتاحة.'], en: ['Review memorization and tajweed paths for your current stage.', 'Open Points and Badges to see achievements and how to earn them.', 'Join available competitions after reading their rules.', 'When eligible, open Certificates to request or download your certificate.'] } },
    ],
  },
  {
    slug: 'reader-guide', group: 'staff', icon: 'reader', reviewedAt: '2026-07-21',
    title: { ar: 'دليل المقرئ', en: 'Reader guide' }, description: { ar: 'اعتماد الحساب، مراجعة التلاوات، الطلاب والحلقات والجلسات.', en: 'Approval, recitation reviews, students, circles, and sessions.' }, audience: { ar: 'المقرئون المعتمدون والمتقدمون', en: 'Approved and applicant readers' }, keywords: { ar: ['مقرئ', 'تقييم', 'تلاوة', 'جلسة', 'حلقة'], en: ['reader', 'review', 'recitation', 'session', 'circle'] }, productRoutes: ['/reader-register', '/reader/recitations', '/reader/students', '/reader/halaqat', '/reader/schedule'],
    sections: [
      { id: 'approval', title: { ar: 'التقديم والاعتماد', en: 'Apply and get approved' }, steps: { ar: ['أرسل نموذج المقرئ مع المؤهلات والبيانات المطلوبة.', 'تحقق من بريدك ثم انتظر مراجعة الإدارة.', 'بعد القبول سجّل الدخول وأكمل ملفك وجدولك المتاح.'], en: ['Submit the reader form with required details and qualifications.', 'Verify your email and wait for management review.', 'After approval, sign in and complete your profile and availability.'] } },
      { id: 'reviews', title: { ar: 'راجع تلاوة طالب', en: 'Review a student recitation' }, steps: { ar: ['افتح قائمة التلاوات واختر طلبًا مسندًا إليك.', 'استمع للملف كاملًا وراجع السورة ونطاق الآيات.', 'أضف التقدير والملاحظات والوسوم المناسبة.', 'احفظ التقييم وحدد هل أتقن الطالب أم يحتاج مراجعة أو جلسة.'], en: ['Open Recitations and select an item assigned to you.', 'Listen fully and verify the surah and verse range.', 'Add the grade, feedback, and relevant tags.', 'Save and decide whether the student mastered it, needs review, or needs a session.'] } },
      { id: 'sessions', title: { ar: 'أدر الحلقات والجلسات', en: 'Manage circles and sessions' }, steps: { ar: ['راجع جدولك والطلاب وطلبات الالتحاق.', 'افتح الحلقة أو الجلسة لمعرفة الحضور والخطة.', 'ابدأ الغرفة المباشرة في موعدها وسجل ملاحظات الطالب.', 'حدّث النتيجة والتقدم بعد انتهاء الجلسة.'], en: ['Review your schedule, students, and enrollment requests.', 'Open a circle or session for attendance and plan details.', 'Start the live room on time and record student notes.', 'Update the result and progress after the session.'] } },
    ],
  },
  {
    slug: 'teacher-guide', group: 'staff', icon: 'teacher', reviewedAt: '2026-07-21',
    title: { ar: 'دليل المعلم', en: 'Teacher guide' }, description: { ar: 'إدارة دورات الأكاديمية والدروس والطلاب والواجبات والجلسات.', en: 'Manage academy courses, lessons, students, assignments, and sessions.' }, audience: { ar: 'معلمو الأكاديمية المعتمدون', en: 'Approved academy teachers' }, keywords: { ar: ['معلم', 'دورة', 'درس', 'واجب', 'تصحيح'], en: ['teacher', 'course', 'lesson', 'assignment', 'grading'] }, productRoutes: ['/teacher-register', '/teacher/courses', '/academy/teacher'],
    sections: [
      { id: 'course', title: { ar: 'أنشئ وأدر محتوى الدورة', en: 'Create and manage course content' }, steps: { ar: ['بعد اعتمادك افتح لوحة المعلم ثم الدورات.', 'أنشئ أو افتح الدورة المصرح لك بإدارتها.', 'أضف الوحدات والدروس والمواد بالترتيب الصحيح.', 'راجع المحتوى قبل النشر، ولا تنشر مسودة غير مكتملة.', 'تابع التسجيلات والطلاب من صفحة الدورة.'], en: ['After approval, open the teacher dashboard and Courses.', 'Create or open a course you are authorized to manage.', 'Add modules, lessons, and resources in the correct order.', 'Review everything before publishing.', 'Track enrollments and students from the course page.'] } },
      { id: 'assignments', title: { ar: 'الواجبات والتصحيح', en: 'Assignments and grading' }, steps: { ar: ['أنشئ الواجب داخل الدورة وحدد النوع والتعليمات والموعد.', 'راجع التسليمات من لوحة المهام.', 'افتح تسليم الطالب وأضف الدرجة والتغذية الراجعة.', 'احفظ التصحيح ليتلقى الطالب التحديث.'], en: ['Create an assignment with type, instructions, and deadline.', 'Review submissions from the tasks area.', 'Open a submission and add a grade and feedback.', 'Save the grade so the student receives the update.'] } },
      { id: 'live', title: { ar: 'الجلسات والتواصل', en: 'Sessions and communication' }, steps: { ar: ['جدول جلسة مرتبطة بالدورة أو الطالب وحدد وقتها.', 'ابدأ الجلسة المباشرة من صفحة الجلسة عند الموعد.', 'استخدم المحادثات والإشعارات للتواصل المتعلق بالدراسة.', 'سجل الحضور والنتيجة بعد الجلسة.'], en: ['Schedule a session for a course or student.', 'Start the live room from the session page at the scheduled time.', 'Use chats and notifications for study-related communication.', 'Record attendance and outcomes afterward.'] } },
    ],
  },
  {
    slug: 'parent-guide', group: 'users', icon: 'parent', reviewedAt: '2026-07-21',
    title: { ar: 'دليل ولي الأمر', en: 'Parent guide' }, description: { ar: 'ربط الأبناء ومتابعة التقدم والطلبات والتواصل.', en: 'Link children and follow progress, requests, and communication.' }, audience: { ar: 'أولياء الأمور والحسابات العائلية', en: 'Parents and family accounts' }, keywords: { ar: ['ولي الأمر', 'ابن', 'عائلة', 'متابعة', 'موافقة'], en: ['parent', 'child', 'family', 'progress', 'approval'] }, productRoutes: ['/student/family', '/academy/parent'],
    sections: [
      { id: 'link', title: { ar: 'اربط حساب الابن', en: 'Link a child account' }, steps: { ar: ['افتح قسم العائلة أو الأبناء.', 'أرسل طلب الربط باستخدام البيانات المطلوبة.', 'انتظر موافقة الطرف الآخر أو الإدارة حسب نوع الطلب.', 'بعد الربط سيظهر الابن ضمن قائمة المتابعة.'], en: ['Open Family or Children.', 'Send a link request using the required details.', 'Wait for the other party or management to approve.', 'After approval, the child appears in your tracking list.'] } },
      { id: 'follow', title: { ar: 'تابع التقدم بأمان', en: 'Follow progress safely' }, steps: { ar: ['اختر الابن ثم راجع ملخص التقدم والتقويم.', 'راجع الحضور والواجبات والتقييمات المتاحة لك.', 'تابع الإشعارات والطلبات التي تحتاج موافقتك.', 'استخدم قناة الرسائل المخصصة عند الحاجة للتواصل.'], en: ['Choose a child and review progress and calendar.', 'Review attendance, assignments, and visible evaluations.', 'Follow notifications and requests that need your approval.', 'Use the designated messaging channel when communication is needed.'] } },
    ],
  },
  {
    slug: 'supervisor-guide', group: 'staff', icon: 'supervisor', reviewedAt: '2026-07-21',
    title: { ar: 'دليل المشرفين', en: 'Supervisor guide' }, description: { ar: 'دليل نطاقات إشراف الطلاب والمقرئين والمحتوى والفقه والجودة.', en: 'Scopes for student, reader, content, fiqh, and quality supervision.' }, audience: { ar: 'جميع رتب الإشراف', en: 'All supervisor roles' }, keywords: { ar: ['مشرف', 'طلاب', 'مقرئين', 'محتوى', 'فقه', 'جودة'], en: ['supervisor', 'students', 'readers', 'content', 'fiqh', 'quality'] }, productRoutes: ['/admin/supervisor-tasks', '/admin/supervisors', '/academy/supervisor'],
    sections: [
      { id: 'scope', title: { ar: 'اعرف نطاق صلاحيتك', en: 'Know your permission scope' }, steps: { ar: ['افتح لوحة الإشراف وراجع الأقسام الظاهرة لك فقط.', 'مشرف الطلاب يتابع الطلاب والطلبات والتقدم ضمن نطاقه.', 'مشرف المقرئين يتابع الطلبات والأداء والتوزيع ضمن نطاقه.', 'مشرف المحتوى يراجع المواد، ومشرف الفقه يتابع الأسئلة، ومشرف الجودة يراجع الالتزام والجودة.', 'المشرف العام ينسق المهام التي فوّضتها الإدارة دون أن يحل محل المدير العام.'], en: ['Open the supervisor dashboard and use only the sections visible to you.', 'Student supervisors track students, requests, and progress in scope.', 'Reader supervisors track applications, performance, and assignments in scope.', 'Content, fiqh, and quality supervisors review their respective queues.', 'General supervisors coordinate delegated work without replacing the general administrator.'] } },
      { id: 'workflow', title: { ar: 'نفّذ مهمة مراجعة', en: 'Complete a review task' }, steps: { ar: ['افتح المهام أو قائمة المراجعة الخاصة بتخصصك.', 'تحقق من صاحب الطلب والبيانات والحالة الحالية.', 'أضف ملاحظة واضحة واختر القرار المتاح وفق السياسة.', 'أكد الإجراء ثم راقب انتقال الحالة أو عودتها لصاحب الطلب.'], en: ['Open tasks or the review queue for your specialty.', 'Verify the requester, details, and current status.', 'Add a clear note and select an allowed decision.', 'Confirm and verify that the status moves to the next owner.'] }, note: { ar: 'عدم ظهور زر أو قسم يعني غالبًا أنه خارج رتبتك أو نطاقك، ولا ينبغي استخدام حساب رتبة أخرى.', en: 'A missing action usually means it is outside your role or scope; do not use another role’s account.' } },
    ],
  },
  {
    slug: 'admin-guide', group: 'admin', icon: 'admin', reviewedAt: '2026-07-21',
    title: { ar: 'دليل الإدارة', en: 'Administration guide' }, description: { ar: 'إدارة المستخدمين والمحتوى والطلبات والتقارير وإعدادات المنصة حسب الرتبة.', en: 'Manage users, content, requests, reports, and platform settings by rank.' }, audience: { ar: 'المدير العام ومديرو المقرأة والأكاديمية', en: 'General, Maqraa, and Academy administrators' }, keywords: { ar: ['ادمن', 'إدارة', 'مستخدمين', 'صلاحيات', 'تقارير', 'إعدادات'], en: ['admin', 'management', 'users', 'permissions', 'reports', 'settings'] }, productRoutes: ['/admin/users', '/admin/role-management', '/admin/reports', '/admin/settings'],
    sections: [
      { id: 'ranks', title: { ar: 'رتب الإدارة وحدودها', en: 'Administrative ranks and boundaries' }, steps: { ar: ['المدير العام يدير النطاقات العامة والرتب والإعدادات العليا المتاحة له.', 'مدير المقرأة يدير الطلاب والمقرئين والحلقات والتلاوات ومسارات المقرأة.', 'مدير الأكاديمية يدير المعلمين والدورات والدروس والوصول الأكاديمي.', 'استخدم مبدّل وضع الإدارة إذا كان حسابك يحمل أكثر من نطاق، وتأكد من الوضع قبل تنفيذ أي تغيير.'], en: ['The general administrator manages cross-platform areas, roles, and available high-level settings.', 'The Maqraa administrator manages students, readers, circles, recitations, and Maqraa paths.', 'The Academy administrator manages teachers, courses, lessons, and academy access.', 'If available, use the admin mode switcher and verify the active scope before making changes.'] } },
      { id: 'users', title: { ar: 'إدارة مستخدم أو صلاحية', en: 'Manage a user or role' }, steps: { ar: ['افتح المستخدمين وابحث بالبريد أو الاسم.', 'افتح الملف وراجع الحالة الحالية قبل التعديل.', 'فعّل أو عطّل الحساب، أو عدّل الأدوار من شاشة الأدوار إذا كانت رتبتك تسمح.', 'أكد التغيير ثم راجع سجل النشاط أو التدقيق عند الحاجة.'], en: ['Open Users and search by email or name.', 'Open the profile and review current status before editing.', 'Activate, deactivate, or change roles only if your rank allows it.', 'Confirm and review activity or audit history when needed.'] } },
      { id: 'approvals', title: { ar: 'راجع الطلبات والدعوات', en: 'Review applications and invitations' }, steps: { ar: ['افتح قائمة طلبات المقرئين أو القسم الإداري المناسب.', 'راجع البيانات والمرفقات وحالة التحقق.', 'اقبل أو ارفض مع سبب واضح، أو اطلب استكمالًا إن كان الخيار متاحًا.', 'تابع الإشعار المرسل وتأكد من تحديث حالة الحساب.'], en: ['Open reader applications or the relevant administration queue.', 'Review details, attachments, and verification status.', 'Approve, reject with a clear reason, or request completion when available.', 'Confirm the notification and updated account status.'] } },
      { id: 'operations', title: { ar: 'التشغيل والمحتوى والتقارير', en: 'Operations, content, and reporting' }, steps: { ar: ['استخدم أقسام الحلقات والتلاوات والحجوزات والجلسات للمتابعة اليومية.', 'أدر المسارات والمسابقات والشهادات والنقاط والإعلانات من القسم المختص.', 'راجع المجتمع والمكتبة والفقه والمحتوى من شاشات المراجعة المصرح بها.', 'استخدم التقارير والإحصاءات لاتخاذ القرار، والإعدادات والصيانة والنسخ الاحتياطي فقط ضمن سياسة المؤسسة.'], en: ['Use Circles, Recitations, Bookings, and Sessions for daily operations.', 'Manage paths, competitions, certificates, points, and announcements in their sections.', 'Review community, library, fiqh, and content through authorized queues.', 'Use reports for decisions, and settings, maintenance, and backups only under organizational policy.'] } },
    ],
  },
  {
    slug: 'troubleshooting', group: 'support', icon: 'support', reviewedAt: '2026-07-21',
    title: { ar: 'حل المشكلات الشائعة', en: 'Troubleshooting' }, description: { ar: 'حل مشاكل الدخول، الموافقات، المحتوى، الجلسات ورفع الملفات.', en: 'Resolve sign-in, approval, content, session, and upload issues.' }, audience: { ar: 'جميع المستخدمين', en: 'All users' }, keywords: { ar: ['مشكلة', 'لا يعمل', 'انتظار', 'رفع', 'جلسة', 'دعم'], en: ['problem', 'not working', 'pending', 'upload', 'session', 'support'] }, productRoutes: ['/forgot-password', '/contact', '/faq'],
    sections: [
      { id: 'access', title: { ar: 'لا أستطيع الدخول أو رؤية القسم', en: 'I cannot sign in or see a section' }, steps: { ar: ['تأكد من البريد وكلمة المرور ومن إكمال التحقق.', 'استخدم استعادة كلمة المرور بدل تكرار المحاولات.', 'تحقق من أن طلب المعلم أو المقرئ قُبل وأن الحساب نشط.', 'إذا دخلت لكن قسمًا غير ظاهر، فغالبًا لا تملكه رتبتك أو لم يُمنح لك وصول الأكاديمية.'], en: ['Verify your email, password, and email confirmation.', 'Use password recovery instead of repeating failed attempts.', 'Check that your teacher or reader application is approved and the account active.', 'If a section is hidden, your role may not include it or academy access may not be enabled.'] } },
      { id: 'content-session', title: { ar: 'الدورة أو الجلسة أو الملف لا يعمل', en: 'A course, session, or file is unavailable' }, steps: { ar: ['حدّث الصفحة وتحقق من اتصالك ووقت الجلسة.', 'تأكد من قبول الالتحاق ونشر الدرس وعدم انتهاء الجلسة.', 'عند رفع ملف، استخدم النوع والحجم المطلوبين وانتظر اكتمال الرفع قبل الإرسال.', 'إذا استمرت المشكلة، أرسل للدعم اسم الصفحة والوقت ووصفًا دقيقًا للخطوات دون إرسال كلمة المرور.'], en: ['Refresh and check your connection and session time.', 'Confirm enrollment approval, lesson publication, and session status.', 'For uploads, use the required type and size and wait for completion.', 'If it continues, contact support with page name, time, and exact steps—never your password.'] } },
    ],
  },
]

export function getGuide(slug: string) {
  return docsGuides.find((guide) => guide.slug === slug)
}

export function getGuidesByGroup(group: DocsGuide['group']) {
  return docsGuides.filter((guide) => guide.group === group)
}
