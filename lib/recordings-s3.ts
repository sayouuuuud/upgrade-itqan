/**
 * S3 helpers for client-driven multipart recording uploads.
 *
 * Reuses the same `RECORDING_S3_*` env vars as the LiveKit Egress fallback so
 * one set of credentials covers both code paths.
 */
import {
  S3Client,
  CreateMultipartUploadCommand,
  UploadPartCommand,
  CompleteMultipartUploadCommand,
  AbortMultipartUploadCommand,
  ListPartsCommand,
} from '@aws-sdk/client-s3'

export interface RecordingS3Config {
  accessKey: string
  secret: string
  bucket: string
  region: string
  endpoint?: string
  pathPrefix: string
}

let cachedClient: S3Client | null = null
let cachedConfig: RecordingS3Config | null = null

function readConfig(): RecordingS3Config | null {
  const accessKey = process.env.RECORDING_S3_ACCESS_KEY || process.env.AWS_ACCESS_KEY_ID
  const secret = process.env.RECORDING_S3_SECRET_KEY || process.env.AWS_SECRET_ACCESS_KEY
  const bucket = process.env.RECORDING_S3_BUCKET || process.env.AWS_S3_BUCKET_NAME
  const region = process.env.RECORDING_S3_REGION || process.env.AWS_REGION || 'us-east-1'
  const endpoint = process.env.RECORDING_S3_ENDPOINT
  const pathPrefix = process.env.RECORDING_S3_PATH_PREFIX || 'recordings'
  if (!accessKey || !secret || !bucket) return null
  return { accessKey, secret, bucket, region, endpoint, pathPrefix }
}

export function getRecordingS3Config(): RecordingS3Config | null {
  if (cachedConfig) return cachedConfig
  cachedConfig = readConfig()
  return cachedConfig
}

export function isClientRecordingConfigured(): boolean {
  return !!getRecordingS3Config()
}

export function getRecordingS3Client(): { client: S3Client; config: RecordingS3Config } | null {
  const cfg = getRecordingS3Config()
  if (!cfg) return null
  if (!cachedClient) {
    cachedClient = new S3Client({
      region: cfg.region,
      endpoint: cfg.endpoint,
      forcePathStyle: !!cfg.endpoint,
      credentials: {
        accessKeyId: cfg.accessKey,
        secretAccessKey: cfg.secret,
      },
    })
  }
  return { client: cachedClient, config: cfg }
}

export function buildRecordingObjectUrl(key: string): string | null {
  const cfg = getRecordingS3Config()
  if (!cfg) return null
  if (cfg.endpoint) {
    return `${cfg.endpoint.replace(/\/$/, '')}/${cfg.bucket}/${key}`
  }
  return `https://${cfg.bucket}.s3.${cfg.region}.amazonaws.com/${key}`
}

export async function initiateMultipart(
  key: string,
  contentType: string
): Promise<{ uploadId: string; key: string; bucket: string } | null> {
  const ctx = getRecordingS3Client()
  if (!ctx) return null
  const res = await ctx.client.send(
    new CreateMultipartUploadCommand({
      Bucket: ctx.config.bucket,
      Key: key,
      ContentType: contentType,
    })
  )
  if (!res.UploadId) return null
  return { uploadId: res.UploadId, key, bucket: ctx.config.bucket }
}

export async function uploadPart(
  key: string,
  uploadId: string,
  partNumber: number,
  body: Uint8Array | Buffer
): Promise<{ etag: string; size: number } | null> {
  const ctx = getRecordingS3Client()
  if (!ctx) return null
  const res = await ctx.client.send(
    new UploadPartCommand({
      Bucket: ctx.config.bucket,
      Key: key,
      PartNumber: partNumber,
      UploadId: uploadId,
      Body: body,
    })
  )
  if (!res.ETag) return null
  return { etag: res.ETag, size: body.byteLength }
}

export async function completeMultipart(
  key: string,
  uploadId: string,
  parts: Array<{ partNumber: number; etag: string }>
): Promise<string | null> {
  const ctx = getRecordingS3Client()
  if (!ctx) return null
  const sorted = [...parts].sort((a, b) => a.partNumber - b.partNumber)
  const res = await ctx.client.send(
    new CompleteMultipartUploadCommand({
      Bucket: ctx.config.bucket,
      Key: key,
      UploadId: uploadId,
      MultipartUpload: {
        Parts: sorted.map((p) => ({ PartNumber: p.partNumber, ETag: p.etag })),
      },
    })
  )
  return res.Location || buildRecordingObjectUrl(key)
}

export async function abortMultipart(key: string, uploadId: string): Promise<boolean> {
  const ctx = getRecordingS3Client()
  if (!ctx) return false
  try {
    await ctx.client.send(
      new AbortMultipartUploadCommand({
        Bucket: ctx.config.bucket,
        Key: key,
        UploadId: uploadId,
      })
    )
    return true
  } catch (err) {
    console.error('[recordings-s3] abortMultipart failed', err)
    return false
  }
}

export async function listMultipartParts(
  key: string,
  uploadId: string
): Promise<Array<{ partNumber: number; etag: string; size: number }>> {
  const ctx = getRecordingS3Client()
  if (!ctx) return []
  const all: Array<{ partNumber: number; etag: string; size: number }> = []
  let partNumberMarker: string | undefined
  // S3 paginates ListParts in batches of 1000.
  for (;;) {
    const res = await ctx.client.send(
      new ListPartsCommand({
        Bucket: ctx.config.bucket,
        Key: key,
        UploadId: uploadId,
        PartNumberMarker: partNumberMarker,
      })
    )
    for (const p of res.Parts || []) {
      if (typeof p.PartNumber === 'number' && p.ETag) {
        all.push({ partNumber: p.PartNumber, etag: p.ETag, size: p.Size || 0 })
      }
    }
    if (!res.IsTruncated || !res.NextPartNumberMarker) break
    partNumberMarker = res.NextPartNumberMarker
  }
  all.sort((a, b) => a.partNumber - b.partNumber)
  return all
}

export function buildObjectKey(opts: {
  sessionId: string
  recordingId: string
  ext?: string
}): string {
  const cfg = getRecordingS3Config()
  const prefix = cfg?.pathPrefix || 'recordings'
  const ext = (opts.ext || 'webm').replace(/^\./, '')
  return `${prefix}/${opts.sessionId}/${opts.recordingId}.${ext}`
}
