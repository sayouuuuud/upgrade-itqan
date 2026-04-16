/**
 * better-auth-config.ts
 *
 * Compatibility shim — this project uses a custom JWT-based auth system (lib/auth.ts).
 * This file exports an `auth` object that mirrors the better-auth API surface
 * used by legacy API routes (e.g. app/api/lms/courses/route.ts) so they compile
 * and run correctly without requiring the actual better-auth library plugins.
 */

import { getSession } from "@/lib/auth"
import type { JWTPayload } from "@/lib/auth"
import { headers } from "next/headers"

export type BetterAuthSession = {
    user: {
        id: string
        email: string
        name: string
        role: string
    }
}

/**
 * Adapts our custom getSession() to the better-auth `auth.api.getSession()` interface.
 * Legacy routes call: `await auth.api.getSession({ headers: req.headers })`
 */
export const auth = {
    api: {
        getSession: async (_opts?: { headers?: HeadersInit }): Promise<BetterAuthSession | null> => {
            const session: JWTPayload | null = await getSession()
            if (!session) return null
            return {
                user: {
                    id: session.sub,
                    email: session.email,
                    name: session.name,
                    role: session.role,
                },
            }
        },
    },
}
