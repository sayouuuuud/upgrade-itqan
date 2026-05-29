import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import { query } from '../lib/db';

async function main() {
    try {
        console.log('--- TABLE: course_sessions ---');
        const sessions = await query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'course_sessions'
        `);
        console.log(JSON.stringify(sessions, null, 2));
    } catch (err) {
        console.error('ERROR:', err);
    }
}

main();
