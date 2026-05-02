import { query } from "../lib/db";

async function debug() {
    const columns = await query("SELECT column_name FROM information_schema.columns WHERE table_name = 'users'");
    console.log("Users columns:", columns.map(c => c.column_name).join(", "));
}

debug();
