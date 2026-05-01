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

SELECT con.conname, rel.relname AS table_name, pg_get_constraintdef(con.oid) AS def
FROM pg_constraint con
JOIN pg_class rel ON rel.oid = con.conrelid
JOIN pg_namespace nsp ON nsp.oid = rel.relnamespace
WHERE nsp.nspname = 'public'
  AND rel.relname IN ('fiqh_questions','academy_teachers','teacher_verifications','points_log','tasks','enrollments')
  AND con.contype = 'c'
ORDER BY rel.relname, con.conname;
