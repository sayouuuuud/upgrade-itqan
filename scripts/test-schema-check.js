const { Pool } = require('pg');
let url = process.env.POSTGRES_URL || process.env.DATABASE_URL;
if (url && url.includes('supabase')) {
  if (/sslmode=[^&]+/.test(url)) url = url.replace(/sslmode=[^&]+/, 'sslmode=no-verify');
  else url += (url.includes('?') ? '&' : '?') + 'sslmode=no-verify';
}
const pool = new Pool({ connectionString: url, ssl: { rejectUnauthorized: false } });
(async () => {
  try {
    const cols = await pool.query(`SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'notifications' ORDER BY ordinal_position`);
    console.log('NOTIFICATIONS columns:'); console.table(cols.rows);
    
    const lessonCols = await pool.query(`SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'lessons' AND column_name = 'status'`);
    console.log('LESSONS.status:'); console.table(lessonCols.rows);
    
    const enrCols = await pool.query(`SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'enrollments' AND column_name IN ('status','rejection_reason')`);
    console.log('ENROLLMENTS:'); console.table(enrCols.rows);
    
    const triggers = await pool.query(`SELECT event_object_table, trigger_name FROM information_schema.triggers WHERE event_object_schema='public' ORDER BY event_object_table`);
    console.log('TRIGGERS:'); console.table(triggers.rows);
    
    const notifCount = await pool.query(`SELECT COUNT(*) FROM notifications`);
    console.log('Notifications count:', notifCount.rows[0]);
    
    const notifTypes = await pool.query(`SELECT type, COUNT(*) FROM notifications GROUP BY type ORDER BY 2 DESC LIMIT 30`);
    console.log('Notification types:'); console.table(notifTypes.rows);
    
    const enrStatuses = await pool.query(`SELECT status, COUNT(*) FROM enrollments GROUP BY status`);
    console.log('Enrollment statuses:'); console.table(enrStatuses.rows);
  } catch (e) {
    console.error('ERROR:', e.message);
  } finally {
    await pool.end();
  }
})();
