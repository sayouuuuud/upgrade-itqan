-- ============================================================================
-- 050 - QA SEED: test data for empty queues (#4 tasks/points, #5 moderation)
-- ----------------------------------------------------------------------------
-- Why: QA automation was "blocked" on many screens because the deployed database
-- has no data for the test accounts (empty tasks, points, moderation queues,
-- parent children, courses to resume, recitation/memorization history, reported
-- forum content). This script seeds realistic sample rows so every one of those
-- screens can be exercised end-to-end:
--   * tasks assigned to the student            (student "tasks")
--   * points history                           (student "points")
--   * an enrolled course + in-progress lesson  (student "resume course")
--   * recitations (pending + approved)         (recitation review / memorization)
--   * fiqh questions awaiting an answer        (fiqh moderation queue)
--   * forum post + reply + report              (forum moderation queue)
--   * parent <-> child link (active)           (parent oversight "my children")
--
-- Safe to run multiple times: every insert is guarded so re-running will not
-- create duplicates.
--
-- HOW TO RUN (against the deployed database, NOT the sandbox):
--   psql "$POSTGRES_URL" -f scripts/050-qa-seed-test-data.sql
--   -- or paste into the Supabase/Neon SQL editor.
--
-- CONFIGURE: change the two emails below to the accounts you test with.
-- ============================================================================

DO $$
DECLARE
  v_student_email TEXT := 'student@test.com';  -- <-- change to your test student
  v_parent_email  TEXT := 'parent@test.com';   -- <-- change to your test parent
  v_student   UUID;
  v_parent    UUID;
  v_teacher   UUID;
  v_reader    UUID;
  v_category  UUID;
  v_course    UUID;
  v_lesson    UUID;
  v_enrollment UUID;
  v_post      UUID;
  v_reply     UUID;
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

  -- 2b) Resolve a parent account (for parent oversight screen)
  SELECT id INTO v_parent FROM users WHERE lower(email) = lower(v_parent_email) LIMIT 1;
  IF v_parent IS NULL THEN
    SELECT id INTO v_parent FROM users WHERE role = 'parent' ORDER BY created_at DESC LIMIT 1;
  END IF;

  -- 2c) Resolve an approved reader (for recitation review queue)
  SELECT id INTO v_reader FROM users
  WHERE role = 'reader' AND COALESCE(approval_status, 'approved') = 'approved'
  ORDER BY created_at LIMIT 1;
  IF v_reader IS NULL THEN
    SELECT id INTO v_reader FROM users WHERE role = 'reader' ORDER BY created_at LIMIT 1;
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

  -- 4b) Ensure the course has at least one published lesson (so "resume course" works)
  SELECT id INTO v_lesson FROM lessons WHERE course_id = v_course ORDER BY lesson_order LIMIT 1;
  IF v_lesson IS NULL THEN
    INSERT INTO lessons (course_id, title, description, lesson_order, duration_minutes, is_published)
    VALUES (v_course, 'الدرس الأول: مقدمة في التجويد',
            'مقدمة تعريفية بأحكام التجويد.', 1, 12, TRUE)
    RETURNING id INTO v_lesson;
  END IF;

  -- 5) Enroll the student in the course (active)
  SELECT id INTO v_enrollment FROM enrollments
  WHERE student_id = v_student AND course_id = v_course LIMIT 1;
  IF v_enrollment IS NULL THEN
    INSERT INTO enrollments (student_id, course_id, status)
    VALUES (v_student, v_course, 'ACTIVE')
    RETURNING id INTO v_enrollment;
  END IF;

  -- 5b) Lesson progress (in-progress) so the dashboard shows a course to resume
  IF v_enrollment IS NOT NULL AND v_lesson IS NOT NULL THEN
    INSERT INTO lesson_progress (enrollment_id, lesson_id, is_in_progress, watched_duration_seconds, started_at)
    VALUES (v_enrollment, v_lesson, TRUE, 180, NOW() - INTERVAL '1 day')
    ON CONFLICT (enrollment_id, lesson_id) DO NOTHING;
  END IF;

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

  -- 7b) Roll the seeded points_log up into a user_points row. The student
  --     "points" screen reads total_points / level / streak from user_points
  --     (via getUserPointsSummary), NOT from points_log — so without this row
  --     the screen would still show 0 even though the history above exists.
  INSERT INTO user_points (user_id, total_points, level, streak_days, longest_streak, last_activity_date)
  SELECT v_student,
         COALESCE((SELECT SUM(points) FROM points_log WHERE user_id = v_student), 0),
         'beginner', 4, 6, CURRENT_DATE
  ON CONFLICT (user_id) DO UPDATE
    SET total_points = (SELECT COALESCE(SUM(points), 0) FROM points_log WHERE user_id = v_student),
        streak_days = GREATEST(user_points.streak_days, 4),
        longest_streak = GREATEST(user_points.longest_streak, 6),
        last_activity_date = CURRENT_DATE,
        updated_at = NOW();

  -- 8) Fiqh questions for the admin / officer assignment queue.
  --     The fiqh inbox + admin views filter on status IN
  --     ('pending','assigned','in_progress'), so we MUST set status='pending'
  --     (unassigned) and a real category_id — otherwise the rows exist but
  --     never appear in the "manage fiqh assignments" screen.
  INSERT INTO fiqh_questions (asked_by, title, question, category, category_id, status, is_published, asked_at)
  SELECT v_student, q.title, q.question, q.cat, v_category, 'pending', FALSE,
         NOW() - (q.h || ' hours')::INTERVAL
  FROM (VALUES
    ('الجمع في السفر', 'ما حكم الجمع بين الصلاتين في السفر؟', 'salah', 5),
    ('زكاة الفطر',     'هل يجب إخراج زكاة الفطر نقداً أم طعاماً؟', 'zakat', 20),
    ('نسيان ركن',      'ما الحكم إذا نسيت ركناً في الصلاة؟', 'salah', 30)
  ) AS q(title, question, cat, h)
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

  -- 10) Link the parent to the student (active) so the parent oversight screen
  --     ("My children") is not empty. Capture the reply id for the report below.
  IF v_parent IS NOT NULL AND v_parent <> v_student THEN
    INSERT INTO parent_children (parent_id, child_id, relation, status)
    VALUES (v_parent, v_student, 'guardian', 'active')
    ON CONFLICT (parent_id, child_id) DO UPDATE SET status = 'active';
  END IF;

  -- 11) Recitations: one pending (for the reader/review queue) + one mastered
  --     (so the student "memorization / recitation progress" screen has history).
  --     Allowed statuses: pending, in_review, mastered, needs_session, session_booked, rejected.
  INSERT INTO recitations (student_id, assigned_reader_id, surah_name, surah_number, ayah_from, ayah_to,
                           audio_url, recitation_type, status, created_at)
  SELECT v_student, v_reader, 'الفاتحة', 1, 1, 7,
         'https://example.com/qa-recitation-pending.mp3', 'tilawa', 'pending', NOW() - INTERVAL '2 hours'
  WHERE NOT EXISTS (
    SELECT 1 FROM recitations WHERE student_id = v_student AND status = 'pending'
  );

  INSERT INTO recitations (student_id, assigned_reader_id, surah_name, surah_number, ayah_from, ayah_to,
                           audio_url, recitation_type, status, reviewed_at, created_at)
  SELECT v_student, v_reader, 'الإخلاص', 112, 1, 4,
         'https://example.com/qa-recitation-approved.mp3', 'hifd', 'mastered',
         NOW() - INTERVAL '5 days', NOW() - INTERVAL '6 days'
  WHERE NOT EXISTS (
    SELECT 1 FROM recitations WHERE student_id = v_student AND surah_number = 112 AND status = 'mastered'
  );

  -- 12) A forum reply, then a report on it, so the forum moderation queue
  --     (reported content) has an item to action.
  SELECT id INTO v_post FROM forum_posts WHERE author_id = v_student ORDER BY created_at LIMIT 1;
  IF v_post IS NOT NULL THEN
    SELECT id INTO v_reply FROM forum_replies WHERE post_id = v_post ORDER BY created_at LIMIT 1;
    IF v_reply IS NULL THEN
      INSERT INTO forum_replies (post_id, author_id, content)
      VALUES (v_post, v_student, 'رد تجريبي للاختبار، يحتوي على محتوى تم الإبلاغ عنه.')
      RETURNING id INTO v_reply;
    END IF;

    INSERT INTO forum_reports (target_type, target_id, reporter_id, community, reason, details, status)
    SELECT 'reply', v_reply, v_student, 'academy', 'inappropriate',
           'بلاغ تجريبي لاختبار طابور الإشراف.', 'open'
    WHERE NOT EXISTS (
      SELECT 1 FROM forum_reports WHERE target_type = 'reply' AND target_id = v_reply
    );
  END IF;

  RAISE NOTICE 'QA seed complete for student %, parent %, teacher %, reader %, course %',
    v_student, v_parent, v_teacher, v_reader, v_course;
END $$;
