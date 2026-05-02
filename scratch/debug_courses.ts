import { query } from "../lib/db";

async function debug() {
    console.log("--- Checking Courses Data ---");
    const courses = await query("SELECT id, title, status, is_published FROM courses LIMIT 5");
    console.log("Courses Sample:", JSON.stringify(courses, null, 2));
    
    const count = await query("SELECT COUNT(*) FROM courses");
    console.log("Total Courses:", count[0].count);
    
    const publishedCount = await query("SELECT COUNT(*) FROM courses WHERE status = 'published' OR is_published = true");
    console.log("Published Courses:", publishedCount[0].count);
}

debug();
