import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function testCourseApi() {
    const { query } = await import('./lib/db');
    const courseId = '0ace7728-39f2-4c7c-aef0-2217ea7da951';
    // Mock student ID (using a dummy one if we don't have session)
    const studentId = 'some-student-id';

    console.log(`Testing course API for course ${courseId}...`);
    try {
        const lessons = await query(`
      SELECT l.id, l.title, l.description, l.order_index, l.duration_minutes,
             (SELECT COUNT(*)>0 FROM lesson_progress lp WHERE lp.lesson_id = l.id AND lp.student_id = $2) as is_completed
      FROM lessons l 
      WHERE l.course_id = $1 
      ORDER BY l.order_index ASC
    `, [courseId, studentId]);
        console.log(`API Lessons:`, lessons);
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

testCourseApi();
