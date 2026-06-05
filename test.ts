import { query } from './lib/db.ts';
async function run() {
  const res = await query('SELECT id, path_id, stage_type, title, course_id, lesson_id FROM tajweed_path_stages');
  console.log(res);
}
run();
