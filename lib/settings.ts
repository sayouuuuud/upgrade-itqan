import { query } from "./db"

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

    // First check dynamic settings
    const smtpConfig = await getSetting<any>("smtp_config", null)

    if (smtpConfig && smtpConfig.host && smtpConfig.port && smtpConfig.user && smtpConfig.password) {
        // Format: smtps://user:pass@smtp.gmail.com
        const protocol = smtpConfig.secure ? 'smtps' : 'smtp'
        const encodedUser = encodeURIComponent(smtpConfig.user)
        const encodedPass = encodeURIComponent(smtpConfig.password)
        return `${protocol}://${encodedUser}:${encodedPass}@${smtpConfig.host}:${smtpConfig.port}`
    }

    return undefined
}

export async function getSmtpFromEmail(): Promise<string> {
    const smtpConfig = await getSetting<any>("smtp_config", null)
    if (smtpConfig && smtpConfig.fromEmail) {
        return smtpConfig.fromName
            ? `"${smtpConfig.fromName}" <${smtpConfig.fromEmail}>`
            : smtpConfig.fromEmail
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
