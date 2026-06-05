require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function run() {
  try {
    const res = await pool.query(`SELECT s.id, s.position, s.title, s.description, s.content,
              s.video_url, s.pdf_url, s.passage_text, s.estimated_minutes, s.created_at,
              s.stage_type, s.course_id, s.halaqa_id, s.lesson_id,
              c.title as course_title,
              h.title as halaqa_title,
              l.title as lesson_title
         FROM tajweed_path_stages s
         LEFT JOIN courses c ON s.course_id = c.id
         LEFT JOIN halaqat h ON s.halaqa_id = h.id
         LEFT JOIN lessons l ON s.lesson_id = l.id
        WHERE s.path_id = $1
        ORDER BY s.position ASC`, ['7c9dc130-ec32-4b24-9ae4-fc25c15b5bae']);
    console.log(res.rows);
  } catch (e) {
    console.error(e);
  }
  process.exit(0);
}
run();
