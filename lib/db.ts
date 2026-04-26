// Database connection helper
// Compatible with: Supabase, Vercel Postgres, any PostgreSQL

import { Pool } from "pg"
import dns from "dns"

// Fix for Node 18+ DNS resolution issues with Supabase IPv6 endpoints
dns.setDefaultResultOrder("ipv4first")

declare global {
  var _dbPool: Pool | undefined
}

let pool: Pool | null = null

// Use POSTGRES_URL (from Supabase) as primary, fallback to DATABASE_URL
let databaseUrl = process.env.POSTGRES_URL || process.env.DATABASE_URL

if (databaseUrl) {
  // For Supabase pooler, add sslmode=no-verify to the connection string
  // This resolves "self-signed certificate in certificate chain" errors
  if (databaseUrl.includes('supabase') && !databaseUrl.includes('sslmode')) {
    const separator = databaseUrl.includes('?') ? '&' : '?'
    databaseUrl = databaseUrl + separator + 'sslmode=no-verify'
  }
  
  const poolConfig: any = {
    connectionString: databaseUrl,
    ssl: {
      rejectUnauthorized: false,  // Allow self-signed certificates
    },
    max: 10,                        // max concurrent connections
    min: 2,                         // keep 2 connections warm always
    idleTimeoutMillis: 30000,       // close idle connections after 30s
    connectionTimeoutMillis: 8000,  // give up after 8s
    allowExitOnIdle: false,
  }

  if (process.env.NODE_ENV === "production") {
    pool = new Pool(poolConfig)
  } else {
    if (!global._dbPool) {
      global._dbPool = new Pool(poolConfig)
    }
    pool = global._dbPool
  }
  
  console.log("[DB] Connected to database at:", databaseUrl.split('@')[1]?.split('/')[0] || 'unknown host')
}

// Warm up pool on startup (keeps 2 connections open so first requests are fast)
if (pool && process.env.NODE_ENV === 'production') {
  pool.connect().then(c => c.release()).catch(() => {})
  pool.connect().then(c => c.release()).catch(() => {})
}

export async function query<T = Record<string, unknown>>(
  text: string,
  params?: unknown[]
): Promise<T[]> {
  if (!pool) {
    console.warn("[DB] No POSTGRES_URL or DATABASE_URL - Using mock data mode")
    return [] as T[]
  }

  try {
    // Use pool.query() directly — avoids acquire/release overhead per query
    const result = await pool.query(text, params as any[])
    return result.rows as T[]
  } catch (error) {
    // SSL certificate errors from Supabase pooler are expected and can be retried
    if (error instanceof Error && error.message?.includes('SELF_SIGNED_CERT')) {
      console.warn("[DB] SSL certificate warning (retryable):", error.message)
      // Return empty array for metadata queries that fail due to SSL
      return [] as T[]
    }
    console.error("[DB] Query error:", error)
    throw error  // ← Throw error to expose constraint violations and actual issues
  }
}

export async function queryOne<T = Record<string, unknown>>(
  text: string,
  params?: unknown[]
): Promise<T | null> {
  const rows = await query<T>(text, params)
  return rows[0] || null
}

export const hasDatabase = () => !!pool

export default pool
