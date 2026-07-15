"use client"

import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react'
import { ar } from './locales/ar'
import { en } from './locales/en'

export type Locale = 'ar' | 'en'

// The Arabic locale is the single source of truth for the shape of translations.
// Every other locale must match this shape — TypeScript enforces it below.
//
// Two legacy namespaces (`addedTranslations_2026`, `extracted_2026_v2`) use raw
// Arabic strings as keys and are accessed dynamically via `(t as any)[...]`.
// Their keys legitimately differ between locales, so we loosen them to a string
// map instead of forcing key-for-key parity — everything else stays strictly typed.
type RawSchema = typeof ar

// Build a version of every namespace that also accepts unknown string keys,
// recursively. This lets components index into nested objects with dynamic
// string keys (e.g. statuses[status], types[type]) without TS7053 errors
// while still keeping autocomplete on known keys.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DeepLoose<T> = T extends Record<string, any>
  ? { [K in keyof T]: DeepLoose<T[K]> } & { [key: string]: any }
  : T
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type LoosenNamespaces<T> = { [K in keyof T]: DeepLoose<T[K]> }

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type TranslationSchema = LoosenNamespaces<Omit<RawSchema, 'addedTranslations_2026' | 'extracted_2026_v2'>> & {
  addedTranslations_2026: Record<string, string>
  extracted_2026_v2: Record<string, any>
  [key: string]: any
}

// Backward-compatible alias: existing code imports `Translations`.
export type Translations = TranslationSchema

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const en_typed: TranslationSchema = en as any

/**
 * Deep-merge a locale on top of the Arabic base.
 * Any key missing in the target locale falls back to the Arabic value
 * instead of rendering blank. Arrays and primitives are replaced wholesale.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function deepMerge(base: any, override: any): any {
  if (Array.isArray(base) || typeof base !== 'object' || base === null) {
    return override ?? base
  }
  const result: any = { ...base }
  for (const key of Object.keys(base)) {
    const b = base[key]
    const o = override?.[key]
    if (b && typeof b === 'object' && !Array.isArray(b)) {
      result[key] = deepMerge(b, o ?? {})
    } else {
      result[key] = o !== undefined ? o : b
    }
  }
  return result
}

// Precompute merged tables once (module scope) so every locale is fully populated.
const translations: Record<Locale, TranslationSchema> = {
  ar,
  en: deepMerge(ar, en_typed) as TranslationSchema,
}

const LOCALE_STORAGE_KEY = 'itqan-locale'
const LOCALE_COOKIE_KEY = 'locale'

function isLocale(v: unknown): v is Locale {
  return v === 'ar' || v === 'en'
}

function readStoredLocale(): Locale | null {
  if (typeof document === 'undefined') return null
  try {
    const fromStorage = window.localStorage.getItem(LOCALE_STORAGE_KEY)
    if (isLocale(fromStorage)) return fromStorage
    const match = document.cookie.match(/(?:^|;\s*)locale=(ar|en)/)
    if (match && isLocale(match[1])) return match[1]
  } catch {
    // ignore storage/cookie access errors (private mode, SSR, etc.)
  }
  return null
}

function persistLocale(locale: Locale) {
  if (typeof document === 'undefined') return
  try {
    window.localStorage.setItem(LOCALE_STORAGE_KEY, locale)
    // 1 year cookie so the server/middleware can read the preference too
    document.cookie = `${LOCALE_COOKIE_KEY}=${locale}; path=/; max-age=31536000; samesite=lax`
  } catch {
    // ignore
  }
}

function applyDocumentLocale(locale: Locale) {
  if (typeof document === 'undefined') return
  document.documentElement.lang = locale
  document.documentElement.dir = locale === 'ar' ? 'rtl' : 'ltr'
}

interface I18nContextType {
  locale: Locale
  dir: 'rtl' | 'ltr'
  t: TranslationSchema
  setLocale: (locale: Locale) => void
  toggleLocale: () => void
}

const I18nContext = createContext<I18nContextType | undefined>(undefined)

export function LanguageProvider({ children }: { children: ReactNode }) {
  // Start from 'ar' to match the server-rendered <html lang="ar">, then
  // reconcile with the stored preference after mount to avoid hydration mismatch.
  const [locale, setLocaleState] = useState<Locale>('ar')

  useEffect(() => {
    const stored = readStoredLocale()
    if (stored && stored !== 'ar') {
      setLocaleState(stored)
      applyDocumentLocale(stored)
    }
  }, [])

  const setLocale = useCallback((newLocale: Locale) => {
    setLocaleState(newLocale)
    applyDocumentLocale(newLocale)
    persistLocale(newLocale)
  }, [])

  const toggleLocale = useCallback(() => {
    setLocaleState((prev) => {
      const next = prev === 'ar' ? 'en' : 'ar'
      applyDocumentLocale(next)
      persistLocale(next)
      return next
    })
  }, [])

  return (
    <I18nContext.Provider
      value={{
        locale,
        dir: locale === 'ar' ? 'rtl' : 'ltr',
        t: translations[locale],
        setLocale,
        toggleLocale,
      }}
    >
      {children}
    </I18nContext.Provider>
  )
}

export function useI18n() {
  const context = useContext(I18nContext)
  if (!context) throw new Error('useI18n must be used within LanguageProvider')
  return context
}
