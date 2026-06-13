-- ============================================
-- 064: Fix Parent Child Detail Column Mismatches
-- The get_parent_child_detail function referenced columns that do not exist:
--   - enrollments.created_at  -> actual column is enrollments.enrolled_at
--   - recitations.grade/notes -> grade/feedback live in recitation_feedback
-- It also used an invalid `ORDER BY` placed AFTER jsonb_agg() instead of inside it.
-- These errors caused the route to return 500, which the parent dashboard
-- surfaced as "الطالب غير موجود أو غير مربوط بحسابك" (student not found/linked).
-- ============================================

BEGIN;

CREATE OR REPLACE FUNCTION get_parent_child_detail(
  p_parent_id UUID,
  p_child_id UUID
)
RETURNS JSONB AS $$
DECLARE
  result JSONB;
  link_record RECORD;
  child_info JSONB;
  enrollments_data JSONB;
  recent_recitations_data JSONB;
  upcoming_bookings_data JSONB;
  weekly_activity_data JSONB;
  badges_data JSONB;
  progress_data JSONB;
BEGIN
  -- Verify the link exists and is active
  SELECT pc.id, pc.relation, pc.created_at, pc.confirmed_at
  INTO link_record
  FROM parent_children pc
  WHERE pc.parent_id = p_parent_id
    AND pc.child_id = p_child_id
    AND pc.status = 'active';

  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'Child not linked or not active');
  END IF;

  -- Child info
  SELECT jsonb_build_object(
    'id', u.id,
    'name', u.name,
    'email', u.email,
    'avatar_url', u.avatar_url,
    'gender', u.gender,
    'created_at', u.created_at
  ) INTO child_info
  FROM users u
  WHERE u.id = p_child_id;

  -- Enrollments (fixed: enrolled_at column, ORDER BY inside aggregate)
  SELECT COALESCE(
    jsonb_agg(
      jsonb_build_object(
        'id', e.id,
        'course_id', e.course_id,
        'course_title', c.title,
        'status', e.status,
        'progress', ROUND(COALESCE(e.progress_percentage, 0))::INT,
        'enrolled_at', e.enrolled_at
      )
      ORDER BY e.enrolled_at DESC
    ),
    '[]'::jsonb
  ) INTO enrollments_data
  FROM enrollments e
  JOIN courses c ON c.id = e.course_id
  WHERE e.student_id = p_child_id;

  -- Recent recitations (grade/notes pulled from recitation_feedback)
  SELECT COALESCE(
    jsonb_agg(
      jsonb_build_object(
        'id', r.id,
        'surah_name', r.surah_name,
        'surah_number', r.surah_number,
        'grade', r.overall_score,
        'notes', r.feedback,
        'created_at', r.created_at
      )
      ORDER BY r.created_at DESC
    ),
    '[]'::jsonb
  ) INTO recent_recitations_data
  FROM (
    SELECT rec.id, rec.surah_name, rec.surah_number, rec.created_at,
           rf.overall_score, rf.feedback
    FROM recitations rec
    LEFT JOIN LATERAL (
      SELECT feedback, NULL::numeric AS overall_score
      FROM recitation_feedback
      WHERE recitation_id = rec.id
      ORDER BY created_at DESC
      LIMIT 1
    ) rf ON TRUE
    WHERE rec.student_id = p_child_id
    ORDER BY rec.created_at DESC
    LIMIT 20
  ) r;

  -- Upcoming bookings
  SELECT COALESCE(
    jsonb_agg(
      jsonb_build_object(
        'id', b.id,
        'reader_name', u.name,
        'scheduled_at', b.scheduled_at,
        'status', b.status,
        'meeting_link', b.meeting_link
      )
      ORDER BY b.scheduled_at ASC
    ),
    '[]'::jsonb
  ) INTO upcoming_bookings_data
  FROM bookings b
  JOIN users u ON u.id = b.reader_id
  WHERE b.student_id = p_child_id
    AND b.scheduled_at >= NOW()
    AND b.status NOT IN ('cancelled');

  -- Weekly activity (last 7 days breakdown)
  WITH days AS (
    SELECT generate_series(0, 6) AS day_offset
  ),
  activity AS (
    SELECT
      EXTRACT(DAY FROM NOW() - created_at)::INT AS day_offset,
      COUNT(*) AS cnt
    FROM recitations
    WHERE student_id = p_child_id
      AND created_at >= NOW() - INTERVAL '7 days'
    GROUP BY EXTRACT(DAY FROM NOW() - created_at)
    UNION ALL
    SELECT
      EXTRACT(DAY FROM NOW() - submitted_at)::INT AS day_offset,
      COUNT(*) AS cnt
    FROM task_submissions
    WHERE student_id = p_child_id
      AND submitted_at >= NOW() - INTERVAL '7 days'
    GROUP BY EXTRACT(DAY FROM NOW() - submitted_at)
  )
  SELECT COALESCE(
    jsonb_agg(
      jsonb_build_object(
        'day_offset', d.day_offset,
        'count', COALESCE(a.cnt, 0)
      )
      ORDER BY d.day_offset
    ),
    '[]'::jsonb
  ) INTO weekly_activity_data
  FROM days d
  LEFT JOIN activity a ON a.day_offset = d.day_offset;

  -- Badges
  SELECT COALESCE(
    jsonb_agg(
      jsonb_build_object(
        'id', sb.id,
        'badge_name', sb.badge_name,
        'badge_description', sb.badge_description,
        'badge_icon', sb.badge_icon_url,
        'earned_at', COALESCE(sb.earned_at, sb.awarded_at)
      )
      ORDER BY COALESCE(sb.earned_at, sb.awarded_at) DESC
    ),
    '[]'::jsonb
  ) INTO badges_data
  FROM badges sb
  WHERE sb.user_id = p_child_id;

  -- Overall progress
  SELECT jsonb_build_object(
    'total_courses', COUNT(*),
    'active_courses', COUNT(*) FILTER (WHERE LOWER(e.status) = 'active'),
    'completed_courses', COUNT(*) FILTER (WHERE LOWER(e.status) = 'completed'),
    'avg_progress', ROUND(COALESCE(AVG(e.progress_percentage), 0))::INT,
    'total_recitations_30d', (
      SELECT COUNT(*) FROM recitations
      WHERE student_id = p_child_id
        AND created_at >= NOW() - INTERVAL '30 days'
    )
  ) INTO progress_data
  FROM enrollments e
  WHERE e.student_id = p_child_id;

  result := jsonb_build_object(
    'link', jsonb_build_object(
      'id', link_record.id,
      'relation', link_record.relation,
      'linked_at', link_record.created_at,
      'confirmed_at', link_record.confirmed_at
    ),
    'child', child_info,
    'progress', progress_data,
    'enrollments', enrollments_data,
    'recent_recitations', recent_recitations_data,
    'upcoming_bookings', upcoming_bookings_data,
    'weekly_activity', weekly_activity_data,
    'badges', badges_data
  );

  RETURN result;
END;
$$ LANGUAGE plpgsql STABLE;

COMMIT;
