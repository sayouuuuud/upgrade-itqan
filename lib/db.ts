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
  // For Supabase, ensure sslmode is set correctly.
  // pg v8.16+ treats `sslmode=require` as `verify-full`, which fails on the
  // Supabase pooler's self-signed certificate chain. We force `no-verify`
  // so the explicit `ssl: { rejectUnauthorized: false }` actually applies.
  let finalUrl = databaseUrl
  if (finalUrl.includes('supabase')) {
    if (/sslmode=[^&]+/.test(finalUrl)) {
      finalUrl = finalUrl.replace(/sslmode=[^&]+/, 'sslmode=no-verify')
    } else {
      finalUrl = finalUrl + (finalUrl.includes('?') ? '&' : '?') + 'sslmode=no-verify'
    }
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

  // Prevent unhandled 'error' events on idle clients from crashing the process.
  // The Supabase pooler periodically drops idle connections, which makes pg emit
  // an 'error' on the pool. Without this listener it becomes an uncaughtException
  // that takes down the dev server (causing empty responses / JSON parse errors).
  pool.on("error", (err) => {
    console.error("[DB] Idle client error (handled, pool will recover):", err.message)
  })

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
  } catch (error) {
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

/**
 * Run a set of statements inside a single transaction on one dedicated client.
 *
 * The callback receives a scoped `query` function bound to that client, so all
 * statements share the same connection. On success the transaction is
 * committed; on any thrown error it is rolled back. Used by operations that
 * must be all-or-nothing (e.g. finalizing competition ranks + winners + points)
 * to avoid leaving partially-written results behind.
 */
export async function withTransaction<T>(
  fn: (tx: <R = Record<string, unknown>>(text: string, params?: unknown[]) => Promise<R[]>) => Promise<T>
): Promise<T> {
  if (!pool) {
    throw new Error("[DB] No database configured for transaction")
  }
  const client = await pool.connect()
  const tx = async <R = Record<string, unknown>>(text: string, params?: unknown[]): Promise<R[]> => {
    const result = await client.query(text, params as any[])
    return result.rows as R[]
  }
  try {
    await client.query("BEGIN")
    const out = await fn(tx)
    await client.query("COMMIT")
    return out
  } catch (error) {
    try {
      await client.query("ROLLBACK")
    } catch (rollbackError) {
      console.error("[DB] Rollback failed:", rollbackError)
    }
    throw error
  } finally {
    client.release()
  }
}

export const hasDatabase = () => !!pool

export default pool
