import { query } from "../lib/db";

async function debug() {
    const columns = await query("SELECT column_name FROM information_schema.columns WHERE table_name = 'lessons'");
    console.log("Lessons columns:", columns.map(c => c.column_name).join(", "));
    
    const tasks = await query("SELECT column_name FROM information_schema.columns WHERE table_name = 'tasks'");
    console.log("Tasks columns:", tasks.map(c => c.column_name).join(", "));
}

debug();
