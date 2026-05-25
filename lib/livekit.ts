/**
 * LiveKit helpers - server-side token generation and room name conventions.
 *
 * Env vars expected:
 *   LIVEKIT_API_KEY
 *   LIVEKIT_API_SECRET
 *   LIVEKIT_URL          (e.g. wss://your-project.livekit.cloud)
 *
 * Public env (exposed to the browser):
 *   NEXT_PUBLIC_LIVEKIT_URL  (mirrors LIVEKIT_URL; falls back to LIVEKIT_URL)
 */

import { AccessToken, RoomServiceClient } from 'livekit-server-sdk'

export const LIVEKIT_URL =
  process.env.NEXT_PUBLIC_LIVEKIT_URL || process.env.LIVEKIT_URL || ''

const LIVEKIT_API_KEY = process.env.LIVEKIT_API_KEY || ''
const LIVEKIT_API_SECRET = process.env.LIVEKIT_API_SECRET || ''

export function isLiveKitConfigured(): boolean {
  return !!(LIVEKIT_API_KEY && LIVEKIT_API_SECRET && LIVEKIT_URL)
}

export type LiveKitRole = 'host' | 'participant' | 'viewer'

export interface MintTokenOptions {
  roomName: string
  identity: string
  name?: string
  role?: LiveKitRole
  metadata?: Record<string, unknown>
  /** Seconds until the token expires. Default 6h. */
  ttlSeconds?: number
}

/**
 * Mint an access token for a participant to join a LiveKit room.
 *
 * - `host` -> can publish A/V, share screen, manage room.
 * - `participant` -> default, can publish A/V and screen share.
 * - `viewer` -> subscribe only.
 */
export async function mintLiveKitToken(opts: MintTokenOptions): Promise<string> {
  if (!LIVEKIT_API_KEY || !LIVEKIT_API_SECRET) {
    throw new Error('LiveKit credentials missing')
  }
  const role: LiveKitRole = opts.role || 'participant'
  const canPublish = role !== 'viewer'

  const at = new AccessToken(LIVEKIT_API_KEY, LIVEKIT_API_SECRET, {
    identity: opts.identity,
    name: opts.name || opts.identity,
    ttl: opts.ttlSeconds ?? 60 * 60 * 6,
    metadata: opts.metadata ? JSON.stringify(opts.metadata) : undefined,
  })

  at.addGrant({
    room: opts.roomName,
    roomJoin: true,
    canPublish,
    canSubscribe: true,
    canPublishData: canPublish,
    roomAdmin: role === 'host',
    roomCreate: role === 'host',
  })

  return at.toJwt()
}

/**
 * Stable, deterministic room name for a halaqa so the same id always
 * resolves to the same LiveKit room (avoids stale rooms hanging around).
 */
export function halaqaRoomName(halaqaId: string): string {
  return `halaqa-${halaqaId.replace(/-/g, '')}`
}

/**
 * Stable room name for a 1:1 booking session.
 */
export function bookingRoomName(bookingId: string): string {
  return `booking-${bookingId.replace(/-/g, '')}`
}

/**
 * Stable room name for a scheduled course session.
 */
export function courseSessionRoomName(sessionId: string): string {
  return `session-${sessionId.replace(/-/g, '')}`
}

let roomService: RoomServiceClient | null = null

export function getRoomService(): RoomServiceClient | null {
  if (!LIVEKIT_URL || !LIVEKIT_API_KEY || !LIVEKIT_API_SECRET) return null
  if (!roomService) {
    // RoomServiceClient expects the HTTP API URL, not the WS one
    const httpUrl = LIVEKIT_URL
      .replace(/^wss:\/\//, 'https://')
      .replace(/^ws:\/\//, 'http://')
    roomService = new RoomServiceClient(httpUrl, LIVEKIT_API_KEY, LIVEKIT_API_SECRET)
  }
  return roomService
}

/**
 * List the current participants in a LiveKit room. Returns an empty array
 * when the room doesn't exist or credentials are missing.
 */
export async function listRoomParticipants(roomName: string) {
  const svc = getRoomService()
  if (!svc) return []
  try {
    return await svc.listParticipants(roomName)
  } catch {
    return []
  }
}
