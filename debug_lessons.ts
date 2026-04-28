import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function checkLessons() {
    const { query } = await import('./lib/db');
    const courseId = '0ace7728-39f2-4c7c-aef0-2217ea7da951';
    console.log(`Checking lessons for course ${courseId}...`);
    try {
        const lessons = await query('SELECT id, title, order_index FROM lessons WHERE course_id = $1', [courseId]);
        console.log(`Found ${lessons.length} lessons:`, lessons);
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

checkLessons();
