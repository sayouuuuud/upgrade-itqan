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

import {
  AccessToken,
  RoomServiceClient,
  EgressClient,
  EncodedFileOutput,
  EncodedFileType,
  S3Upload,
} from 'livekit-server-sdk'

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

function livekitHttpUrl(): string {
  return LIVEKIT_URL
    .replace(/^wss:\/\//, 'https://')
    .replace(/^ws:\/\//, 'http://')
}

let roomService: RoomServiceClient | null = null

export function getRoomService(): RoomServiceClient | null {
  if (!LIVEKIT_URL || !LIVEKIT_API_KEY || !LIVEKIT_API_SECRET) return null
  if (!roomService) {
    roomService = new RoomServiceClient(livekitHttpUrl(), LIVEKIT_API_KEY, LIVEKIT_API_SECRET)
  }
  return roomService
}

let egressClient: EgressClient | null = null

export function getEgressClient(): EgressClient | null {
  if (!LIVEKIT_URL || !LIVEKIT_API_KEY || !LIVEKIT_API_SECRET) return null
  if (!egressClient) {
    egressClient = new EgressClient(livekitHttpUrl(), LIVEKIT_API_KEY, LIVEKIT_API_SECRET)
  }
  return egressClient
}

export interface RecordingS3Config {
  accessKey: string
  secret: string
  bucket: string
  region: string
  endpoint?: string
  pathPrefix?: string
}

function parseS3FromEnv(): RecordingS3Config | null {
  const accessKey = process.env.RECORDING_S3_ACCESS_KEY || process.env.AWS_ACCESS_KEY_ID
  const secret = process.env.RECORDING_S3_SECRET_KEY || process.env.AWS_SECRET_ACCESS_KEY
  const bucket = process.env.RECORDING_S3_BUCKET || process.env.AWS_S3_BUCKET_NAME
  const region = process.env.RECORDING_S3_REGION || process.env.AWS_REGION || 'us-east-1'
  const endpoint = process.env.RECORDING_S3_ENDPOINT
  const pathPrefix = process.env.RECORDING_S3_PATH_PREFIX || 'recordings'
  if (!accessKey || !secret || !bucket) return null
  return { accessKey, secret, bucket, region, endpoint, pathPrefix }
}

export function isRecordingConfigured(): boolean {
  return !!parseS3FromEnv()
}

/**
 * Start a room-composite recording for a LiveKit room. The output is an MP4
 * uploaded to the configured S3-compatible bucket.
 *
 * Returns the LiveKit Egress info on success, or null when LiveKit/S3 isn't
 * configured. Throws on LiveKit API errors so callers can surface them.
 */
export async function startRoomRecording(
  roomName: string,
  filenameHint: string
): Promise<{ egressId: string; filepath: string } | null> {
  const client = getEgressClient()
  const s3 = parseS3FromEnv()
  if (!client || !s3) return null

  const safeHint = filenameHint.replace(/[^a-zA-Z0-9_-]/g, '-')
  const filepath = `${s3.pathPrefix || 'recordings'}/${safeHint}-${Date.now()}.mp4`

  const output = new EncodedFileOutput({
    fileType: EncodedFileType.MP4,
    filepath,
    output: {
      case: 's3',
      value: new S3Upload({
        accessKey: s3.accessKey,
        secret: s3.secret,
        bucket: s3.bucket,
        region: s3.region,
        endpoint: s3.endpoint,
        forcePathStyle: !!s3.endpoint,
      }),
    },
  })

  const info = await client.startRoomCompositeEgress(
    roomName,
    { file: output },
    { layout: 'grid' }
  )
  return { egressId: info.egressId, filepath }
}

export async function stopEgress(egressId: string): Promise<void> {
  const client = getEgressClient()
  if (!client) return
  try {
    await client.stopEgress(egressId)
  } catch (err) {
    console.error('[livekit] stopEgress failed', err)
  }
}

/**
 * Build a public URL for a recorded MP4 stored in S3 (or compatible). Falls
 * back to null when storage isn't configured.
 */
export function buildRecordingUrl(filepath: string | null | undefined): string | null {
  if (!filepath) return null
  const s3 = parseS3FromEnv()
  if (!s3) return null
  if (s3.endpoint) {
    return `${s3.endpoint.replace(/\/$/, '')}/${s3.bucket}/${filepath}`
  }
  return `https://${s3.bucket}.s3.${s3.region}.amazonaws.com/${filepath}`
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

/**
 * Make sure a room with the given name exists with the requested
 * `maxParticipants` cap. Idempotent — if the room already exists LiveKit
 * keeps the existing settings, so we look it up first and only create when
 * missing.
 *
 * Returns true when the call succeeded or the room already existed,
 * false when LiveKit isn't configured.
 */
export async function ensureRoom(
  roomName: string,
  opts: {
    maxParticipants?: number
    emptyTimeoutSeconds?: number
    departureTimeoutSeconds?: number
    metadata?: Record<string, unknown>
  } = {}
): Promise<boolean> {
  const svc = getRoomService()
  if (!svc) return false
  try {
    const existing = await svc.listRooms([roomName])
    if (existing.length > 0) {
      // Room already exists — `createRoom` would error with AlreadyExists. We
      // skip mutating an in-flight room so we don't churn settings while a
      // call is happening. The settings take effect on the next start.
      return true
    }
    await svc.createRoom({
      name: roomName,
      maxParticipants: opts.maxParticipants && opts.maxParticipants > 0 ? opts.maxParticipants : undefined,
      emptyTimeout: opts.emptyTimeoutSeconds,
      departureTimeout: opts.departureTimeoutSeconds,
      metadata: opts.metadata ? JSON.stringify(opts.metadata) : undefined,
    })
    return true
  } catch (err) {
    console.error('[livekit] ensureRoom failed', err)
    return false
  }
}

/**
 * Forcibly remove a participant identity from a LiveKit room. Used by the
 * waiting-room flow when a host denies pending guests.
 */
export async function removeParticipant(roomName: string, identity: string): Promise<boolean> {
  const svc = getRoomService()
  if (!svc) return false
  try {
    await svc.removeParticipant(roomName, identity)
    return true
  } catch (err) {
    console.error('[livekit] removeParticipant failed', err)
    return false
  }
}
