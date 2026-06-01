-- ============================================================================
-- 050 - QA SEED: test data for empty queues (#4 tasks/points, #5 moderation)
-- ----------------------------------------------------------------------------
-- Why: QA reported that the student dashboard shows empty "tasks" and "points
-- history", and the supervisor/admin moderation queues (fiqh + forum) are empty,
-- so reviewers have nothing to act on. This script seeds realistic sample rows
-- for ONE test student so those screens can be exercised end-to-end.
--
-- Safe to run multiple times: every insert is guarded so re-running will not
-- create duplicates.
--
-- HOW TO RUN (against the deployed database, NOT the sandbox):
--   psql "$POSTGRES_URL" -f scripts/050-qa-seed-test-data.sql
--   -- or paste into the Supabase/Neon SQL editor.
--
-- CONFIGURE: change the email below to the student account you test with.
-- ============================================================================

DO $$
DECLARE
  v_student_email TEXT := 'student@test.com';  -- <-- change to your test student
  v_student   UUID;
  v_teacher   UUID;
  v_category  UUID;
  v_course    UUID;
BEGIN
  -- 1) Resolve the target student (fallback: most recent user with student role)
  SELECT id INTO v_student FROM users WHERE lower(email) = lower(v_student_email) LIMIT 1;
  IF v_student IS NULL THEN
    SELECT id INTO v_student FROM users WHERE role = 'student' ORDER BY created_at DESC LIMIT 1;
  END IF;
  IF v_student IS NULL THEN
    RAISE EXCEPTION 'No student found. Set v_student_email to an existing student account.';
  END IF;

  -- 2) Resolve a teacher (fallback to any admin) to own the course / assign tasks
  SELECT id INTO v_teacher FROM users WHERE role = 'teacher' ORDER BY created_at LIMIT 1;
  IF v_teacher IS NULL THEN
    SELECT id INTO v_teacher FROM users WHERE role = 'admin' ORDER BY created_at LIMIT 1;
  END IF;
  IF v_teacher IS NULL THEN
    v_teacher := v_student; -- last-resort so NOT NULL FKs are satisfied
  END IF;

  -- 3) Ensure a category exists (courses.category_id is NOT NULL)
  SELECT id INTO v_category FROM categories ORDER BY created_at LIMIT 1;
  IF v_category IS NULL THEN
    INSERT INTO categories (id, name_ar, name_en, slug)
    VALUES (gen_random_uuid(), 'عام', 'General', 'general')
    RETURNING id INTO v_category;
  END IF;

  -- 4) Ensure a published course owned by the teacher
  SELECT id INTO v_course FROM courses WHERE slug = 'qa-test-course' LIMIT 1;
  IF v_course IS NULL THEN
    INSERT INTO courses (id, title, slug, description, teacher_id, category_id, is_published, is_public)
    VALUES (gen_random_uuid(), 'دورة تجريبية للاختبار', 'qa-test-course',
            'دورة تجريبية أنشئت لاختبار لوحة الطالب.', v_teacher, v_category, TRUE, TRUE)
    RETURNING id INTO v_course;
  END IF;

  -- 5) Enroll the student in the course (active)
  INSERT INTO enrollments (student_id, course_id, status)
  SELECT v_student, v_course, 'ACTIVE'
  WHERE NOT EXISTS (
    SELECT 1 FROM enrollments WHERE student_id = v_student AND course_id = v_course
  );

  -- 6) Tasks assigned directly to the student (mix of upcoming + overdue)
  INSERT INTO tasks (assigned_by, assigned_to, course_id, title, description, due_date, status, points_reward)
  SELECT v_teacher, v_student, v_course, t.title, t.descr, t.due, 'pending', t.pts
  FROM (VALUES
    ('حفظ سورة الملك',        'احفظ سورة الملك كاملة وسجّل تلاوتك.', NOW() + INTERVAL '3 days', 30),
    ('مراجعة أحكام النون الساكنة', 'راجع أحكام النون الساكنة والتنوين وأرسل ملخصاً.', NOW() + INTERVAL '7 days', 20),
    ('واجب التجويد الأسبوعي',  'حل تمارين التجويد المرفقة في الدرس الثالث.', NOW() - INTERVAL '2 days', 15)
  ) AS t(title, descr, due, pts)
  WHERE NOT EXISTS (
    SELECT 1 FROM tasks x WHERE x.assigned_to = v_student AND x.title = t.title
  );

  -- 7) Points history (so the student "points" screen is not empty)
  INSERT INTO points_log (user_id, points, reason, description, created_at)
  SELECT v_student, p.pts, p.reason, p.descr, NOW() - (p.days_ago || ' days')::INTERVAL
  FROM (VALUES
    (15, 'task',         'إكمال واجب التجويد', 1),
    (10, 'daily_login',  'تسجيل دخول يومي', 2),
    (25, 'recitation',   'تلاوة سورة الملك', 3),
    (50, 'juz_complete', 'إتمام جزء عمّ', 5)
  ) AS p(pts, reason, descr, days_ago)
  WHERE NOT EXISTS (
    SELECT 1 FROM points_log l
    WHERE l.user_id = v_student AND l.description = p.descr
  );

  -- 8) Fiqh questions in the moderation queue (answer IS NULL => "pending")
  INSERT INTO fiqh_questions (asked_by, question, category, is_published, asked_at)
  SELECT v_student, q.question, q.cat, FALSE, NOW() - (q.h || ' hours')::INTERVAL
  FROM (VALUES
    ('ما حكم الجمع بين الصلاتين في السفر؟', 'salah', 5),
    ('هل يجب إخراج زكاة الفطر نقداً أم طعاماً؟', 'zakat', 20),
    ('ما الحكم إذا نسيت ركناً في الصلاة؟', 'salah', 30)
  ) AS q(question, cat, h)
  WHERE NOT EXISTS (
    SELECT 1 FROM fiqh_questions f WHERE f.asked_by = v_student AND f.question = q.question
  );

  -- 9) Forum posts (so the forum moderation list is not empty)
  INSERT INTO forum_posts (author_id, title, content, category)
  SELECT v_student, fp.title, fp.content, fp.cat
  FROM (VALUES
    ('نصائح لحفظ القرآن', 'ما هي أفضل الطرق التي تنصحون بها لتثبيت الحفظ؟', 'quran'),
    ('سؤال عن أحكام التجويد', 'أجد صعوبة في تطبيق المدود، هل من نصيحة؟', 'questions')
  ) AS fp(title, content, cat)
  WHERE NOT EXISTS (
    SELECT 1 FROM forum_posts p WHERE p.author_id = v_student AND p.title = fp.title
  );

  RAISE NOTICE 'QA seed complete for student %, teacher %, course %', v_student, v_teacher, v_course;
END $$;
