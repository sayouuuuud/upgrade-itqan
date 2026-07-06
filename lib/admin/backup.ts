// Unified backup "envelope" contract shared by the Admin backup center.
//
// Every export (database / settings / theme) is wrapped in a signed envelope so
// that on import we can detect exactly what kind of file the admin picked and
// refuse a mismatched file with a helpful message (e.g. "this is a THEME file,
// not a SETTINGS file"). This module is intentionally free of any server-only
// imports so it can run in both the API routes and the client page.

export const BACKUP_APP = "itqan" as const
export const BACKUP_VERSION = "2.0" as const

export type BackupKind = "database" | "settings" | "theme"

export const BACKUP_KINDS: BackupKind[] = ["database", "settings", "theme"]

// Human-readable labels used when building error/success messages.
export const BACKUP_KIND_LABELS: Record<BackupKind, { ar: string; en: string }> = {
  database: { ar: "قاعدة البيانات", en: "Database" },
  settings: { ar: "الإعدادات", en: "Settings" },
  theme: { ar: "الثيم", en: "Theme" },
}

export type BackupEnvelope<T = unknown> = {
  // Signature marker — presence of this flag identifies a v2 envelope.
  __itqan_backup: true
  app: typeof BACKUP_APP
  kind: BackupKind
  version: string
  exported_at: string
  // Optional descriptive metadata (record counts, generator id, etc.)
  meta?: Record<string, unknown>
  payload: T
}

// Wrap a payload in a signed envelope ready to be serialized and downloaded.
export function makeEnvelope<T>(
  kind: BackupKind,
  payload: T,
  meta?: Record<string, unknown>
): BackupEnvelope<T> {
  return {
    __itqan_backup: true,
    app: BACKUP_APP,
    kind,
    version: BACKUP_VERSION,
    exported_at: new Date().toISOString(),
    ...(meta ? { meta } : {}),
    payload,
  }
}

// Build a safe download filename for a given kind.
export function backupFilename(kind: BackupKind): string {
  const date = new Date().toISOString().split("T")[0]
  return `itqan-${kind}-backup-${date}.json`
}

// ── Detection ──────────────────────────────────────────────────────────────
// Best-effort detection of a file's kind. Handles the new signed envelope AND
// the older un-versioned formats that may already exist on admins' machines so
// legacy files keep importing (and still get correctly routed / rejected).
export function detectKind(obj: any): BackupKind | null {
  if (!obj || typeof obj !== "object") return null

  // New signed envelope.
  if (obj.__itqan_backup === true && typeof obj.kind === "string") {
    return BACKUP_KINDS.includes(obj.kind) ? obj.kind : null
  }

  // Legacy database backup: { data: { users, ... }, counts }
  if (obj.data && typeof obj.data === "object" && ("users" in obj.data || "recitations" in obj.data)) {
    return "database"
  }

  // Legacy settings backup: { scope: "maqraah", settings: {...} }
  if (obj.settings && typeof obj.settings === "object" && (obj.scope === "maqraah" || obj.scope === "settings")) {
    return "settings"
  }

  // Legacy theme: { theme: { colors, ... } } OR a raw theme object.
  if (obj.theme && typeof obj.theme === "object" && obj.theme.colors) return "theme"
  if (obj.colors && typeof obj.colors === "object" && ("primary" in obj.colors || "background" in obj.colors)) {
    return "theme"
  }

  return null
}

export type ParseFailReason = "invalid_json" | "not_backup" | "wrong_kind"

export type ParseResult<T> =
  | { ok: true; kind: BackupKind; payload: T; legacy: boolean; raw: any }
  | { ok: false; reason: ParseFailReason; detectedKind: BackupKind | null }

// Extract the payload for a given detected kind, normalizing legacy shapes so
// the API layer always receives the same structure regardless of file age.
function extractPayload(kind: BackupKind, obj: any): any {
  // New envelope always carries payload directly.
  if (obj.__itqan_backup === true) return obj.payload

  // Legacy shapes → normalized payloads matching the new envelope payloads.
  if (kind === "database") {
    // Legacy: { data: { users: [...], ... } } → { tables: { ... } }
    return { tables: obj.data ?? {} }
  }
  if (kind === "settings") {
    // Legacy: { settings: { key: { value, type } } } → { settings: {...} }
    return { settings: obj.settings ?? {} }
  }
  if (kind === "theme") {
    // Legacy: { theme: {...} } or raw theme object.
    return { theme: obj.theme ?? obj }
  }
  return null
}

// Parse a raw JSON string and validate it against the expected kind.
// Returns a structured result the caller can turn into a localized message.
export function parseBackup<T = any>(raw: string, expected: BackupKind): ParseResult<T> {
  let obj: any
  try {
    obj = JSON.parse(raw)
  } catch {
    return { ok: false, reason: "invalid_json", detectedKind: null }
  }

  const detected = detectKind(obj)
  if (!detected) {
    return { ok: false, reason: "not_backup", detectedKind: null }
  }
  if (detected !== expected) {
    return { ok: false, reason: "wrong_kind", detectedKind: detected }
  }

  const legacy = obj.__itqan_backup !== true
  return { ok: true, kind: detected, payload: extractPayload(detected, obj) as T, legacy, raw: obj }
}
