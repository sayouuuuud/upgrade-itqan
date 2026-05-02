import { query } from "../lib/db";

async function debug() {
    try {
        const constraints = await query(`
            SELECT conname, pg_get_constraintdef(c.oid) 
            FROM pg_constraint c 
            JOIN pg_namespace n ON n.oid = c.connamespace 
            WHERE conrelid = 'recitations'::regclass
        `);
        console.log("Recitations Constraints:", JSON.stringify(constraints, null, 2));
        
        const columnInfo = await query(`
            SELECT column_name, data_type, udt_name 
            FROM information_schema.columns 
            WHERE table_name = 'recitations' AND column_name = 'status'
        `);
        console.log("Status Column Info:", JSON.stringify(columnInfo, null, 2));
    } catch (err) {
        console.error(err);
    }
}

debug();
