import { query } from "./db"

type SmtpConfig = {
    host?: string
    port?: string | number
    secure?: boolean | string
    user?: string
    password?: string
    pass?: string
    fromEmail?: string
    from_email?: string
    fromName?: string
    from_name?: string
}

function asString(value: string | number | undefined) {
    return value === undefined ? "" : String(value).trim()
}

function asBoolean(value: boolean | string | undefined, defaultValue: boolean) {
    if (typeof value === "boolean") return value
    if (typeof value === "string") {
        const normalized = value.trim().toLowerCase()
        if (["true", "1", "yes", "on"].includes(normalized)) return true
        if (["false", "0", "no", "off"].includes(normalized)) return false
    }
    return defaultValue
}

function getSmtpEnvConfig(): SmtpConfig | null {
    if (!process.env.SMTP_HOST) return null

    return {
        host: process.env.SMTP_HOST,
        port: process.env.SMTP_PORT,
        secure: process.env.SMTP_SECURE,
        user: process.env.SMTP_USER,
        password: process.env.SMTP_PASSWORD || process.env.SMTP_PASS,
        fromEmail: process.env.SMTP_FROM_EMAIL,
        fromName: process.env.SMTP_FROM_NAME,
    }
}

function getSmtpUrlFromConfig(config: SmtpConfig | null) {
    if (!config) return undefined

    const host = asString(config.host)
    const port = asString(config.port)
    const user = asString(config.user)
    const password = asString(config.password || config.pass)

    if (!host || !port || !user || !password) {
        return undefined
    }

    const secure = asBoolean(config.secure, port === "465")
    const protocol = secure ? "smtps" : "smtp"
    const encodedUser = encodeURIComponent(user)
    const encodedPass = encodeURIComponent(password)
    return `${protocol}://${encodedUser}:${encodedPass}@${host}:${port}`
}

function getFromEmail(config: SmtpConfig | null) {
    if (!config) return undefined

    const fromEmail = asString(config.fromEmail || config.from_email)
    const fromName = asString(config.fromName || config.from_name)

    if (!fromEmail) return undefined
    return fromName ? `"${fromName}" <${fromEmail}>` : fromEmail
}

// Simple in-memory cache for settings
const settingsCache: Record<string, { value: any; expiry: number }> = {}
const CACHE_TTL = 60 * 1000 // 1 minute cache to balance performance and freshness

export async function getSetting<T>(key: string, defaultValue: T): Promise<T> {
    const now = Date.now()

    // Check cache first
    if (settingsCache[key] && settingsCache[key].expiry > now) {
        return settingsCache[key].value as T
    }

    try {
        const rows = await query(`SELECT setting_value FROM system_settings WHERE setting_key = $1`, [key])

        if (rows.length > 0 && rows[0].setting_value !== null) {
            const value = rows[0].setting_value as T
            // Update cache
            settingsCache[key] = { value, expiry: now + CACHE_TTL }
            return value
        }
    } catch (error) {
        console.error(`Error fetching setting ${key}:`, error)
    }

    return defaultValue
}

export function clearSettingCache(key?: string) {
    if (key) {
        delete settingsCache[key]
    } else {
        // Clear all
        Object.keys(settingsCache).forEach(k => delete settingsCache[k])
    }
}

// Specific helper for SMTP to build the connection string
export async function getSmtpUrl(): Promise<string | undefined> {
    if (process.env.SMTP_CONNECTION_URL) {
        return process.env.SMTP_CONNECTION_URL
    }

    const envSmtpUrl = getSmtpUrlFromConfig(getSmtpEnvConfig())
    if (envSmtpUrl) {
        return envSmtpUrl
    }

    // First check dynamic settings
    const smtpConfig = await getSetting<SmtpConfig | null>("smtp_config", null)

    const settingsSmtpUrl = getSmtpUrlFromConfig(smtpConfig)
    if (settingsSmtpUrl) {
        return settingsSmtpUrl
    }

    return undefined
}

export async function getSmtpFromEmail(): Promise<string> {
    if (process.env.SMTP_FROM) {
        return process.env.SMTP_FROM
    }

    const envFrom = getFromEmail(getSmtpEnvConfig())
    if (envFrom) {
        return envFrom
    }

    const smtpConfig = await getSetting<SmtpConfig | null>("smtp_config", null)
    const settingsFrom = getFromEmail(smtpConfig)
    if (settingsFrom) {
        return settingsFrom
    }

    return '"إتقان التعليمية" <itqaan69@gmail.com>' // New default fallback
}

// Helper for UploadThing (Replaces Cloudinary)
export async function getStorageConfig() {
    const config = await getSetting<any>("storage_config", null)

    if (config && config.uploadthingToken) {
        return {
            token: config.uploadthingToken,
        }
    }

    // Fallback to env
    return {
        token: process.env.UPLOADTHING_TOKEN,
        secret: process.env.UPLOADTHING_SECRET,
        appId: process.env.UPLOADTHING_APP_ID,
    }
}
