
import { query } from "./lib/db.ts";

async function main() {
    try {
        const results = await query(`
            SELECT column_name, column_default, is_nullable 
            FROM information_schema.columns 
            WHERE table_name = 'users' AND column_name IN ('has_quran_access', 'has_academy_access');
        `);
        console.log(JSON.stringify(results, null, 2));
    } catch (e) {
        console.error(e);
    }
}

main();
