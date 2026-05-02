import { query } from "../lib/db";

async function debug() {
    const statuses = await query("SELECT DISTINCT status FROM enrollments");
    console.log("Enrollment statuses:", JSON.stringify(statuses, null, 2));
    
    const enrollments = await query("SELECT * FROM enrollments LIMIT 5");
    console.log("Enrollments sample:", JSON.stringify(enrollments, null, 2));
}

debug();
