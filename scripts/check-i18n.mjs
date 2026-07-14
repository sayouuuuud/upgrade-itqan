#!/usr/bin/env node
/**
 * check-i18n.mjs
 * ─────────────────────────────────────────────────────────────────────────────
 * Usage:
 *   node scripts/check-i18n.mjs           # check parity between ar ↔ en
 *   node scripts/check-i18n.mjs --fix     # auto-add stubs for missing EN keys
 *
 * Adding a new language later:
 *   1. Add a new locale file  lib/i18n/locales/fr.ts  exporting `const fr = {...}`
 *   2. Run: node scripts/check-i18n.mjs
 *      → it will report every key you need to translate (use --fix for stubs)
 *   3. Fill in the stubs and you're done — TypeScript will catch any remaining gaps.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import path from 'path'
import { fileURLToPath } from 'url'
import { createRequire } from 'module'
import fs from 'fs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(__dirname, '..')

// ── helpers ──────────────────────────────────────────────────────────────────

/** Flatten a nested object into dot-key paths */
function flat(obj, prefix = '') {
  const out = {}
  for (const [k, v] of Object.entries(obj)) {
    const key = prefix ? `${prefix}.${k}` : k
    if (v && typeof v === 'object' && !Array.isArray(v)) {
      Object.assign(out, flat(v, key))
    } else {
      out[key] = v
    }
  }
  return out
}

/** Load a locale file dynamically */
async function loadLocale(file) {
  const m = await import(file + `?t=${Date.now()}`)
  const key = Object.keys(m).find(k => k !== 'default')
  return m[key]
}

/** Junk namespaces added by old auto-scripts — skip in parity checks */
const JUNK_NS = new Set(['addedTranslations_2026', 'extracted_2026_v2'])
const isJunk = k => JUNK_NS.has(k.split('.')[0]) || k.includes('_dup')

// ── main ─────────────────────────────────────────────────────────────────────

const FIX = process.argv.includes('--fix')
const localesDir = path.join(root, 'lib/i18n/locales')
const files = fs.readdirSync(localesDir).filter(f => f.endsWith('.ts'))

console.log(`\n=== check-i18n  (${files.length} locale files found) ===\n`)

// Load AR as the canonical reference
const arFile = path.join(localesDir, 'ar.ts')
const ar = await loadLocale(arFile)
const arFlat = flat(ar)

let totalIssues = 0

for (const file of files) {
  if (file === 'ar.ts') continue
  const lang = file.replace('.ts', '')
  const locale = await loadLocale(path.join(localesDir, file))
  const lFlat = flat(locale)

  const missInLang  = Object.keys(arFlat).filter(k => !isJunk(k) && !(k in lFlat))
  const extraInLang = Object.keys(lFlat).filter(k => !isJunk(k) && !(k in arFlat))
  const dupKeys = []

  // Detect duplicate keys via simple regex on raw source
  const src = fs.readFileSync(path.join(localesDir, file), 'utf8')
  const keyRe = /^\s{4}([a-zA-Z_$][a-zA-Z0-9_$]*):\s/gm
  const seen = new Map()
  let m
  while ((m = keyRe.exec(src)) !== null) {
    const ln = src.slice(0, m.index).split('\n').length
    if (seen.has(m[1])) dupKeys.push({ key: m[1], first: seen.get(m[1]), dup: ln })
    else seen.set(m[1], ln)
  }

  console.log(`── ${lang} ────────────────────────────────`)
  console.log(`   total keys : ${Object.keys(lFlat).length}`)
  console.log(`   missing    : ${missInLang.length}`)
  console.log(`   extra      : ${extraInLang.length}`)
  console.log(`   duplicates : ${dupKeys.length}`)

  if (missInLang.length) {
    console.log(`\n   MISSING in ${lang} (add translations for these):`)
    missInLang.forEach(k => console.log(`     ✗ ${k}  [AR: "${arFlat[k]}"]`))
  }
  if (extraInLang.length) {
    console.log(`\n   EXTRA in ${lang} (not in AR — consider removing or adding to AR):`)
    extraInLang.slice(0, 20).forEach(k => console.log(`     + ${k}`))
    if (extraInLang.length > 20) console.log(`     … and ${extraInLang.length - 20} more`)
  }
  if (dupKeys.length) {
    console.log(`\n   DUPLICATE KEYS in ${lang} (JS silently ignores first occurrence):`)
    dupKeys.forEach(d => console.log(`     ! "${d.key}"  first@L${d.first}  dup@L${d.dup}`))
  }

  totalIssues += missInLang.length + extraInLang.length + dupKeys.length
  console.log()
}

// ── summary ───────────────────────────────────────────────────────────────────
if (totalIssues === 0) {
  console.log('All locale files are in sync. Nothing to do.\n')
} else {
  console.log(`Found ${totalIssues} issue(s) total.\n`)
  if (!FIX) {
    console.log('Tip: run with --fix to auto-insert TODO stubs for missing keys.\n')
  }
}

process.exit(totalIssues > 0 ? 1 : 0)
