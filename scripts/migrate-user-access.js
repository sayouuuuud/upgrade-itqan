const { Pool } = require("pg");
const dotenv = require("dotenv");
const path = require("path");

// Load .env.local
dotenv.config({ path: path.join(__dirname, '..', '.env.local') });

if (!process.env.DATABASE_URL) {
    console.error("No DATABASE_URL found in .env.local");
    process.exit(1);
}

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
});

async function runMigration() {
    console.log("Starting migration...");

    try {
        const client = await pool.connect();

        console.log("Adding columns (if not exist)...");
        await client.query(`
      ALTER TABLE users
      ADD COLUMN IF NOT EXISTS has_quran_access BOOLEAN DEFAULT TRUE,
      ADD COLUMN IF NOT EXISTS has_academy_access BOOLEAN DEFAULT FALSE,
      ADD COLUMN IF NOT EXISTS platform_preference TEXT DEFAULT 'both';
    `);

        console.log("Updating existing users based on their roles...");

        // Quran Access = TRUE, Academy Access = FALSE
        await client.query(`
      UPDATE users SET has_quran_access = TRUE, has_academy_access = FALSE 
      WHERE role IN ('student', 'reader', 'student_supervisor', 'reciter_supervisor');
    `);

        // Both Access = TRUE
        await client.query(`
      UPDATE users SET has_academy_access = TRUE, has_quran_access = TRUE 
      WHERE role IN ('admin', 'academy_admin');
    `);

        // Quran Access = FALSE, Academy Access = TRUE
        await client.query(`
      UPDATE users SET has_academy_access = TRUE, has_quran_access = FALSE 
      WHERE role IN ('teacher', 'parent', 'supervisor');
    `);

        console.log("Migration completed successfully.");
        client.release();
    } catch (err) {
        console.error("Migration error:", err);
    } finally {
        pool.end();
    }
}

runMigration();
