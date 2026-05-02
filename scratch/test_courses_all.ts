import { query } from "../lib/db";

async function debug() {
    const session_sub = '70f5cd5b-1669-4ce3-9594-7ca01450a697'; // A teacher/admin sub
    const rows = await query(`
      SELECT 
        c.id, c.title, c.description, c.thumbnail_url,
        COALESCE(c.difficulty_level, c.level, 'beginner') as level,
        c.status,
        c.created_at,
        cat.name as category_name,
        c.category_id,
        u.name as teacher_name,
        COUNT(DISTINCT l.id)::int as total_lessons,
        COUNT(DISTINCT e.id)::int as total_enrolled,
        MAX(CASE WHEN e_me.student_id = $1 THEN e_me.status ELSE NULL END) as my_enrollment_status,
        MAX(CASE WHEN e_me.student_id = $1 THEN e_me.id::text ELSE NULL END) as my_enrollment_id
      FROM courses c
      LEFT JOIN users u ON c.teacher_id = u.id
      LEFT JOIN categories cat ON c.category_id = cat.id
      LEFT JOIN lessons l ON l.course_id = c.id AND l.status = 'published'
      LEFT JOIN enrollments e ON e.course_id = c.id AND e.status = 'active'
      LEFT JOIN enrollments e_me ON e_me.course_id = c.id
      WHERE (c.status = 'published' OR c.is_published = true)
      GROUP BY c.id, c.title, c.description, c.thumbnail_url, c.difficulty_level, c.level, c.status, cat.name, c.category_id, u.name, c.created_at
      ORDER BY c.created_at DESC
    `, [session_sub]);
    console.log("Courses count:", rows.length);
    console.log("First course:", rows[0]);
}

debug();
