import { Pool } from "pg";
import { config } from "dotenv";

config({ path: ".env.local" });

const pool = new Pool({
  connectionString: process.env.POSTGRES_URL || process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function migrate() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    console.log("Updating tajweed_path_stages table with course_id...");
    await client.query(`
      ALTER TABLE tajweed_path_stages
      ADD COLUMN IF NOT EXISTS course_id UUID;
    `);

    await client.query('COMMIT');
    console.log("Migration successful.");
  } catch (e) {
    await client.query('ROLLBACK');
    console.error("Migration failed:", e);
  } finally {
    client.release();
    pool.end();
  }
}

migrate();
