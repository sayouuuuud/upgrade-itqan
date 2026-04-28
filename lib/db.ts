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
  // For Supabase, ensure sslmode is set correctly
  let finalUrl = databaseUrl
  if (finalUrl.includes('supabase') && !finalUrl.includes('sslmode')) {
    finalUrl = finalUrl + (finalUrl.includes('?') ? '&' : '?') + 'sslmode=no-verify'
  }

  const poolConfig: any = {
    connectionString: finalUrl,
    ssl: {
      rejectUnauthorized: false,
    },
    max: 10,
    min: 2,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 8000,
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
  pool.connect().then(c => c.release()).catch(() => { })
  pool.connect().then(c => c.release()).catch(() => { })
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
    const result = await pool.query(text, params as any[])
    return result.rows as T[]
  } catch (error: any) {
    if (error instanceof Error && error.message?.includes('SELF_SIGNED_CERT')) {
      console.warn("[DB] SSL certificate warning (retryable):", error.message)
      return [] as T[]
    }
    console.error("[DB] Query error:", error)
    throw error
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
