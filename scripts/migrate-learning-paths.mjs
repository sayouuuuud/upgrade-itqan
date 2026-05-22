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

    console.log("Updating tajweed_paths table...");
    await client.query(`
      ALTER TABLE tajweed_paths
      ADD COLUMN IF NOT EXISTS target_audience TEXT,
      ADD COLUMN IF NOT EXISTS what_you_will_learn JSONB DEFAULT '[]'::jsonb,
      ADD COLUMN IF NOT EXISTS prerequisites JSONB DEFAULT '[]'::jsonb,
      ADD COLUMN IF NOT EXISTS promo_video_url TEXT,
      ADD COLUMN IF NOT EXISTS certification_type TEXT DEFAULT 'certificate_of_completion',
      ADD COLUMN IF NOT EXISTS enrollment_type TEXT DEFAULT 'open',
      ADD COLUMN IF NOT EXISTS price NUMERIC DEFAULT 0,
      ADD COLUMN IF NOT EXISTS tags JSONB DEFAULT '[]'::jsonb;
    `);

    console.log("Updating tajweed_path_stages table...");
    await client.query(`
      ALTER TABLE tajweed_path_stages
      ADD COLUMN IF NOT EXISTS video_url TEXT,
      ADD COLUMN IF NOT EXISTS content_html TEXT,
      ADD COLUMN IF NOT EXISTS is_preview BOOLEAN DEFAULT false;
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
