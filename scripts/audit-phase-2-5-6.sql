SELECT
  'tables' AS section,
  to_regclass('public.users')                  AS users,
  to_regclass('public.user_points')            AS user_points,
  to_regclass('public.points_log')             AS points_log,
  to_regclass('public.badges')                 AS badges,
  to_regclass('public.user_badges')            AS user_badges,
  to_regclass('public.fiqh_questions')         AS fiqh_questions,
  to_regclass('public.academy_teachers')       AS academy_teachers,
  to_regclass('public.teacher_verifications')  AS teacher_verifications,
  to_regclass('public.supervisor_assignments') AS supervisor_assignments,
  to_regclass('public.tasks')                  AS tasks,
  to_regclass('public.task_submissions')       AS task_submissions,
  to_regclass('public.live_sessions')          AS live_sessions,
  to_regclass('public.session_attendance')     AS session_attendance,
  to_regclass('public.enrollments')            AS enrollments,
  to_regclass('public.courses')                AS courses,
  to_regclass('public.notifications')          AS notifications;

SELECT table_name, column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name IN (
    'user_points','points_log','badges','user_badges',
    'fiqh_questions','academy_teachers','teacher_verifications','supervisor_assignments',
    'tasks','task_submissions','live_sessions','session_attendance',
    'enrollments','courses','users','notifications'
  )
ORDER BY table_name, ordinal_position;

SELECT
  'expected_columns' AS section,
  bool_or(table_name='user_points'            AND column_name='user_id')                AS user_points_user_id,
  bool_or(table_name='user_points'            AND column_name='total_points')           AS user_points_total_points,
  bool_or(table_name='user_points'            AND column_name='current_streak')         AS user_points_current_streak,
  bool_or(table_name='user_points'            AND column_name='longest_streak')         AS user_points_longest_streak,
  bool_or(table_name='user_points'            AND column_name='last_activity_date')     AS user_points_last_activity_date,
  bool_or(table_name='points_log'             AND column_name='user_id')                AS points_log_user_id,
  bool_or(table_name='points_log'             AND column_name='action')                 AS points_log_action,
  bool_or(table_name='points_log'             AND column_name='reason')                 AS points_log_reason,
  bool_or(table_name='points_log'             AND column_name='points')                 AS points_log_points,
  bool_or(table_name='points_log'             AND column_name='reference_type')         AS points_log_reference_type,
  bool_or(table_name='points_log'             AND column_name='reference_id')           AS points_log_reference_id,
  bool_or(table_name='points_log'             AND column_name='metadata')               AS points_log_metadata,
  bool_or(table_name='points_log'             AND column_name='created_at')             AS points_log_created_at,
  bool_or(table_name='badges'                 AND column_name='badge_type')             AS badges_badge_type,
  bool_or(table_name='badges'                 AND column_name='criteria_value')         AS badges_criteria_value,
  bool_or(table_name='badges'                 AND column_name='name_ar')                AS badges_name_ar,
  bool_or(table_name='badges'                 AND column_name='points_reward')          AS badges_points_reward,
  bool_or(table_name='user_badges'            AND column_name='user_id')                AS user_badges_user_id,
  bool_or(table_name='user_badges'            AND column_name='badge_id')               AS user_badges_badge_id,
  bool_or(table_name='user_badges'            AND column_name='earned_at')              AS user_badges_earned_at,
  bool_or(table_name='fiqh_questions'         AND column_name='asker_id')               AS fiqh_asker_id,
  bool_or(table_name='fiqh_questions'         AND column_name='answered_by')            AS fiqh_answered_by,
  bool_or(table_name='fiqh_questions'         AND column_name='question')               AS fiqh_question,
  bool_or(table_name='fiqh_questions'         AND column_name='answer')                 AS fiqh_answer,
  bool_or(table_name='fiqh_questions'         AND column_name='status')                 AS fiqh_status,
  bool_or(table_name='fiqh_questions'         AND column_name='category')               AS fiqh_category,
  bool_or(table_name='fiqh_questions'         AND column_name='question_type')          AS fiqh_question_type,
  bool_or(table_name='fiqh_questions'         AND column_name='madhab')                 AS fiqh_madhab,
  bool_or(table_name='fiqh_questions'         AND column_name='evidence_level')         AS fiqh_evidence_level,
  bool_or(table_name='fiqh_questions'         AND column_name='references')             AS fiqh_references,
  bool_or(table_name='fiqh_questions'         AND column_name='answered_at')            AS fiqh_answered_at,
  bool_or(table_name='academy_teachers'       AND column_name='user_id')                AS at_user_id,
  bool_or(table_name='academy_teachers'       AND column_name='status')                 AS at_status,
  bool_or(table_name='academy_teachers'       AND column_name='specialization')         AS at_specialization,
  bool_or(table_name='academy_teachers'       AND column_name='bio')                    AS at_bio,
  bool_or(table_name='academy_teachers'       AND column_name='credentials')            AS at_credentials,
  bool_or(table_name='academy_teachers'       AND column_name='trust_score')            AS at_trust_score,
  bool_or(table_name='academy_teachers'       AND column_name='verified_by')            AS at_verified_by,
  bool_or(table_name='academy_teachers'       AND column_name='verified_at')            AS at_verified_at,
  bool_or(table_name='teacher_verifications'  AND column_name='teacher_id')             AS tv_teacher_id,
  bool_or(table_name='teacher_verifications'  AND column_name='supervisor_id')          AS tv_supervisor_id,
  bool_or(table_name='teacher_verifications'  AND column_name='action')                 AS tv_action,
  bool_or(table_name='teacher_verifications'  AND column_name='notes')                  AS tv_notes,
  bool_or(table_name='teacher_verifications'  AND column_name='created_at')             AS tv_created_at,
  bool_or(table_name='supervisor_assignments' AND column_name='supervisor_id')          AS sa_supervisor_id,
  bool_or(table_name='supervisor_assignments' AND column_name='area')                   AS sa_area,
  bool_or(table_name='tasks'                  AND column_name='points_reward')          AS tasks_points_reward,
  bool_or(table_name='tasks'                  AND column_name='max_score')              AS tasks_max_score,
  bool_or(table_name='tasks'                  AND column_name='course_id')              AS tasks_course_id,
  bool_or(table_name='task_submissions'       AND column_name='student_id')             AS ts_student_id,
  bool_or(table_name='task_submissions'       AND column_name='task_id')                AS ts_task_id,
  bool_or(table_name='task_submissions'       AND column_name='score')                  AS ts_score,
  bool_or(table_name='task_submissions'       AND column_name='status')                 AS ts_status,
  bool_or(table_name='live_sessions'          AND column_name='course_id')              AS ls_course_id,
  bool_or(table_name='live_sessions'          AND column_name='scheduled_at')           AS ls_scheduled_at,
  bool_or(table_name='live_sessions'          AND column_name='title')                  AS ls_title,
  bool_or(table_name='session_attendance'     AND column_name='session_id')             AS sa2_session_id,
  bool_or(table_name='session_attendance'     AND column_name='student_id')             AS sa2_student_id,
  bool_or(table_name='session_attendance'     AND column_name='joined_at')              AS sa2_joined_at,
  bool_or(table_name='enrollments'            AND column_name='student_id')             AS enroll_student_id,
  bool_or(table_name='enrollments'            AND column_name='course_id')              AS enroll_course_id,
  bool_or(table_name='enrollments'            AND column_name='status')                 AS enroll_status,
  bool_or(table_name='users'                  AND column_name='role')                   AS users_role,
  bool_or(table_name='users'                  AND column_name='display_name')           AS users_display_name,
  bool_or(table_name='users'                  AND column_name='email')                  AS users_email,
  bool_or(table_name='users'                  AND column_name='avatar_url')             AS users_avatar_url
FROM information_schema.columns
WHERE table_schema='public';

SELECT 'badges_count'     AS section, COUNT(*) AS n FROM badges;
SELECT 'fiqh_count'       AS section, COUNT(*) AS n, status FROM fiqh_questions GROUP BY status;
SELECT 'teachers_count'   AS section, COUNT(*) AS n, status FROM academy_teachers GROUP BY status;

SELECT con.conname, pg_get_constraintdef(con.oid) AS def
FROM pg_constraint con
JOIN pg_class rel ON rel.oid = con.conrelid
JOIN pg_namespace nsp ON nsp.oid = rel.relnamespace
WHERE nsp.nspname = 'public'
  AND rel.relname IN ('fiqh_questions','academy_teachers','teacher_verifications','points_log','tasks')
  AND con.contype = 'c'
ORDER BY rel.relname, con.conname;
