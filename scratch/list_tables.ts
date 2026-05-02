import { query } from "../lib/db";

async function debug() {
    const tables = await query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'");
    console.log("Tables:", tables.map(t => t.table_name).join(", "));
}

debug();
