const { Client } = require('pg');
require('dotenv').config({ path: '.env.local' });

const connectionString = process.env.POSTGRES_URL || process.env.DATABASE_URL;

if (!connectionString) {
    console.error("No database URL found in .env.local");
    process.exit(1);
}

const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false }
});

async function run() {
    await client.connect();
    console.log("Connected to database...");

    try {
        // 1. Test students query
        console.log("\n--- Testing Students Query ---");
        const studentsRes = await client.query(`
      SELECT 
        e.id as enrollment_id,
        e.student_id,
        u.name,
        u.email,
        u.phone,
        u.avatar_url,
        e.progress_percentage as progress,
        e.status,
        e.enrolled_at,
        (SELECT COUNT(*) FROM lesson_progress lp WHERE lp.enrollment_id = e.id AND lp.is_completed = true) as completed_lessons
      FROM enrollments e
      JOIN users u ON e.student_id = u.id
      LIMIT 1;
    `);
        console.log("Students Query PASS! Found fields:", studentsRes.fields.map(f => f.name));

        // 2. Test lesson_attachments schema
        console.log("\n--- Testing lesson_attachments Table ---");
        const attachmentsRes = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'lesson_attachments';
    `);
        if (attachmentsRes.rows.length > 0) {
            console.log("lesson_attachments PASS! Columns:");
            attachmentsRes.rows.forEach(r => console.log(`  - ${r.column_name}: ${r.data_type}`));
        } else {
            console.error("FAIL: lesson_attachments table does NOT exist!");
        }

        // 3. Test insert syntax into lesson_attachments (with rollback)
        console.log("\n--- Testing lesson_attachments Insert Syntax (Rollback) ---");
        await client.query('BEGIN');
        try {
            // Need a real lesson_id first
            const lessonsRes = await client.query('SELECT id FROM lessons LIMIT 1');
            if (lessonsRes.rows.length === 0) {
                console.log("No lessons to test attachment insertion. Skipping.");
            } else {
                const lessonId = lessonsRes.rows[0].id;
                const insertRes = await client.query(`
          INSERT INTO lesson_attachments (lesson_id, file_url, file_type, file_name)
          VALUES ($1, $2, $3, $4)
          RETURNING id
        `, [lessonId, 'https://example.com/test.pdf', 'PDF', 'test.pdf']);
                console.log("Insert syntax PASS! Generated ID:", insertRes.rows[0].id);
            }
        } finally {
            await client.query('ROLLBACK');
        }

        console.log("\nAll backend queries tested successfully!");
    } catch (err) {
        console.error("Test failed with error:", err.message);
    } finally {
        await client.end();
    }
}

run();
