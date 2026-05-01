SELECT table_name, column_name, data_type
  FROM information_schema.columns
 WHERE table_schema = 'public'
   AND table_name IN ('academy_teachers','live_sessions','session_attendance','users')
 ORDER BY table_name, ordinal_position;
