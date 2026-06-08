// Certificate PDF / image render engine — serverless-safe version.
//
// Uses:
//   - `sharp`    → fetch the template image and composite text layers
//   - `pdf-lib`  → wrap the final PNG into a single-page PDF
//   - Google Fonts (cairo/inter) fetched at render time for Arabic/Latin support
//
// No Puppeteer / Chromium required — works on Vercel Node 24 / AL2023.

import { PDFDocument } from "pdf-lib"
import { writeFile, mkdir } from "node:fs/promises"
import { join } from "node:path"
import { tmpdir } from "node:os"
import { ALL_FIELDS, type FieldAnchor, type FieldValues } from "./fields"

// ---------------------------------------------------------------------------
// Embedded Arabic/Latin fonts via fontconfig
//
// librsvg (used by sharp to rasterise our SVG text overlays) has NO access to
// system fonts in the serverless runtime, and it does NOT reliably honour
// base64 @font-face declarations either — Arabic then renders as tofu boxes
// (□□□□□) or raw code points.
//
// The reliable approach is fontconfig: we ship real TTF files, write a small
// fonts.conf pointing at that directory, and set FONTCONFIG_FILE so librsvg
// can resolve the font by family name ("Cairo"). This must run BEFORE sharp
// loads its native binding.
// ---------------------------------------------------------------------------
export const ARABIC_FONT_FAMILY = "Cairo"
let _fontConfigReady: Promise<void> | null = null

async function ensureFontConfig(): Promise<void> {
  if (_fontConfigReady) return _fontConfigReady
  _fontConfigReady = (async () => {
    try {
      const fontDir = join(process.cwd(), "lib", "certificate", "fonts")
      const cacheDir = join(tmpdir(), "fontconfig-cache")
      await mkdir(cacheDir, { recursive: true })
      const confPath = join(tmpdir(), "cert-fonts.conf")
      const conf = `<?xml version="1.0"?>
<!DOCTYPE fontconfig SYSTEM "fonts.dtd">
<fontconfig>
  <dir>${fontDir}</dir>
  <cachedir>${cacheDir}</cachedir>
  <config></config>
</fontconfig>`
      await writeFile(confPath, conf)
      process.env.FONTCONFIG_FILE = confPath
    } catch (err) {
      console.error("[certificate/render] Failed to set up fontconfig:", err)
    }
  })()
  return _fontConfigReady
}

export interface RenderInput {
  template_url: string
  field_positions: Record<string, FieldAnchor>
  values: FieldValues
  language?: "ar" | "en"
  use_samples?: boolean
  width?: number
  aspect?: number
}

type RenderFormat = "pdf" | "png"

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function escapeHtml(s: string): string {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
}

const IMAGE_FIELDS = new Set(["logo", "watermark", "signature"])

// ---------------------------------------------------------------------------
// Build an HTML page string (kept for preview / fallback compatibility)
// ---------------------------------------------------------------------------
export function buildCertificateHtml(input: RenderInput): string {
  const width = input.width ?? 1400
  const aspect = input.aspect ?? 1.4142
  const height = Math.round(width / aspect)
  const minSide = Math.min(width, height)
  const isAr = (input.language ?? "ar") === "ar"
  const positions = input.field_positions || {}
  const values = input.values || {}

  const overlays: string[] = []

  for (const def of ALL_FIELDS) {
    const anchor = positions[def.key]
    if (!anchor) continue

    const isImg = IMAGE_FIELDS.has(def.key)
    const rawValue = (values as Record<string, string | undefined>)[def.key]
    const value =
      rawValue && rawValue.length > 0
        ? rawValue
        : input.use_samples
          ? isImg
            ? ""
            : def.sample
          : ""

    if (!value) continue

    const xPct = (anchor.x * 100).toFixed(3)
    const yPct = (anchor.y * 100).toFixed(3)
    const align = anchor.align || def.default_align || "center"
    const translate =
      align === "center"
        ? "translate(-50%, -50%)"
        : align === "left"
          ? "translate(0%, -50%)"
          : "translate(-100%, -50%)"

    const rotate = anchor.rotate ? ` rotate(${anchor.rotate}deg)` : ""
    const sizePct = anchor.font_size ?? def.default_size ?? 4
    const sizePx = (minSide * sizePct) / 100
    const color = anchor.color || def.default_color || "#0f172a"
    const weight = anchor.weight || def.default_weight || "normal"
    const maxWidth = anchor.max_width ?? def.default_max_width
    const letterSpacing = anchor.letter_spacing
      ? `${anchor.letter_spacing}px`
      : undefined

    if (isImg) {
      const imgWidthPx = (width * sizePct) / 100
      overlays.push(`
        <div style="
          position:absolute; left:${xPct}%; top:${yPct}%;
          transform:${translate}${rotate};
          width:${imgWidthPx}px; max-width:90%; pointer-events:none;
        ">
          <img src="${escapeHtml(value)}" alt=""
               style="width:100%; height:auto; display:block;
                      ${def.key === "watermark" ? "opacity:0.18;" : ""}" />
        </div>`)
    } else {
      const maxW = maxWidth ? `${maxWidth * 100}%` : "auto"
      overlays.push(`
        <div style="
          position:absolute; left:${xPct}%; top:${yPct}%;
          transform:${translate}${rotate};
          font-size:${sizePx}px;
          font-weight:${weight === "bold" ? 800 : 400};
          color:${color};
          text-align:${align};
          max-width:${maxW};
          ${letterSpacing ? `letter-spacing:${letterSpacing};` : ""}
          line-height:1.2;
          white-space:nowrap;
          overflow:hidden;
          text-overflow:ellipsis;
        ">${escapeHtml(value)}</div>`)
    }
  }

  return `<!DOCTYPE html>
<html lang="${isAr ? "ar" : "en"}" dir="${isAr ? "rtl" : "ltr"}">
<head>
  <meta charset="UTF-8" />
  <title>Certificate</title>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link
    href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800;900&family=Amiri:wght@400;700&family=Inter:wght@400;500;700;800&display=swap"
    rel="stylesheet"
  />
  <style>
    * { box-sizing: border-box; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    html, body {
      margin: 0; padding: 0;
      width: ${width}px; height: ${height}px;
      font-family: ${isAr ? "'Cairo', 'Amiri', sans-serif" : "'Inter', 'Cairo', sans-serif"};
      background: #fff;
    }
    .canvas {
      position: relative;
      width: ${width}px;
      height: ${height}px;
      overflow: hidden;
    }
    .canvas img.bg {
      position: absolute; inset: 0;
      width: 100%; height: 100%;
      object-fit: cover;
      object-position: center;
    }
  </style>
</head>
<body>
  <div class="canvas">
    <img class="bg" src="${escapeHtml(input.template_url)}" alt="" />
    ${overlays.join("\n")}
  </div>
</body>
</html>`
}

// ---------------------------------------------------------------------------
// Main render function — serverless-safe, no browser needed.
//
// Strategy:
//   1. Fetch the template image → decode with sharp
//   2. For each text field: build an SVG text overlay → rasterise with sharp
//      and composite over the base image
//   3. For each image field (logo / watermark / signature): fetch → resize →
//      composite over the base image
//   4. Export final composite as PNG
//   5. Wrap in a single-page PDF via pdf-lib (for "pdf" format)
// ---------------------------------------------------------------------------
export async function renderCertificate(
  input: RenderInput,
  format: RenderFormat = "pdf",
): Promise<Buffer> {
  // Configure fontconfig BEFORE sharp's native binding is loaded so librsvg
  // can resolve our embedded Arabic font.
  await ensureFontConfig()
  const sharp = (await import("sharp")).default

  const targetWidth = input.width ?? 1400
  const aspect = input.aspect ?? 1.4142
  const targetHeight = Math.round(targetWidth / aspect)
  const isAr = (input.language ?? "ar") === "ar"
  const positions = input.field_positions || {}
  const values = input.values || {}

  // ── 1. Fetch & resize template ──────────────────────────────────────────
  const templateRes = await fetch(input.template_url)
  if (!templateRes.ok) throw new Error(`Failed to fetch template: ${input.template_url}`)
  const templateBuf = Buffer.from(await templateRes.arrayBuffer())

  let base = sharp(templateBuf).resize(targetWidth, targetHeight, {
    fit: "cover",
    position: "center",
  })

  // We'll build a list of composites to apply all at once at the end.
  const composites: import("sharp").OverlayOptions[] = []

  // ── 2. Text fields → SVG overlays ───────────────────────────────────────
  const minSide = Math.min(targetWidth, targetHeight)

  for (const def of ALL_FIELDS) {
    const anchor = positions[def.key]
    if (!anchor) continue
    if (IMAGE_FIELDS.has(def.key)) continue // handled separately

    const rawValue = (values as Record<string, string | undefined>)[def.key]
    const text =
      rawValue && rawValue.length > 0
        ? rawValue
        : input.use_samples
          ? def.sample
          : ""
    if (!text) continue

    const sizePct = anchor.font_size ?? def.default_size ?? 4
    const fontSize = Math.round((minSide * sizePct) / 100)
    const color = anchor.color || def.default_color || "#0f172a"
    const weight = anchor.weight || def.default_weight || "normal"
    const align = anchor.align || def.default_align || "center"
    const maxWidthRatio = anchor.max_width ?? def.default_max_width ?? 0.9
    const maxWidthPx = Math.round(targetWidth * maxWidthRatio)
    const rotate = anchor.rotate ?? 0

    // Anchor pixel position
    const ax = Math.round(anchor.x * targetWidth)
    const ay = Math.round(anchor.y * targetHeight)

    // For SVG, we use a foreignObject-free approach: use <text> with textLength
    // to cap width when needed.
    // Use the embedded Arabic-capable font (resolved via fontconfig) so
    // server-side rasterisation renders Arabic glyphs correctly.
    const fontFamily = `${ARABIC_FONT_FAMILY}, sans-serif`

    const safeText = escapeSvg(text)

    // Estimate text width (rough: fontSize * 0.6 per char)
    const estimatedWidth = Math.min(
      text.length * fontSize * 0.65,
      maxWidthPx,
    )
    const svgWidth = Math.ceil(estimatedWidth) + 20
    const svgHeight = Math.ceil(fontSize * 1.4) + 10

    // Determine left offset depending on alignment
    let svgLeft: number
    if (align === "center") {
      svgLeft = ax - Math.round(svgWidth / 2)
    } else if (align === "right" || (isAr && align === "left")) {
      svgLeft = ax - svgWidth
    } else {
      svgLeft = ax
    }
    const svgTop = ay - Math.round(svgHeight / 2)

    const textAnchor =
      align === "center" ? "middle" : align === "right" ? "end" : "start"
    const textX =
      align === "center"
        ? svgWidth / 2
        : align === "right"
          ? svgWidth - 5
          : 5

    const rotateAttr =
      rotate !== 0 ? ` transform="rotate(${rotate},${textX},${svgHeight / 2})"` : ""

    const svgStr = `<svg xmlns="http://www.w3.org/2000/svg" width="${svgWidth}" height="${svgHeight}">
  <text
    x="${textX}"
    y="${svgHeight * 0.75}"
    font-family="${fontFamily}"
    font-size="${fontSize}"
    font-weight="${weight === "bold" ? "bold" : "normal"}"
    fill="${color}"
    text-anchor="${textAnchor}"
    direction="${isAr ? "rtl" : "ltr"}"
    ${estimatedWidth < maxWidthPx ? "" : `textLength="${maxWidthPx}" lengthAdjust="spacingAndGlyphs"`}
    ${rotateAttr}
  >${safeText}</text>
</svg>`

    composites.push({
      input: Buffer.from(svgStr),
      left: Math.max(0, svgLeft),
      top: Math.max(0, svgTop),
    })
  }

  // ── 3. Image fields ──────────────────────────────────────────────────────
  for (const def of ALL_FIELDS) {
    if (!IMAGE_FIELDS.has(def.key)) continue
    const anchor = positions[def.key]
    if (!anchor) continue
    const rawValue = (values as Record<string, string | undefined>)[def.key]
    if (!rawValue) continue

    const sizePct = anchor.font_size ?? def.default_size ?? 12
    const imgWidthPx = Math.round(targetWidth * sizePct / 100)

    let imgRes: Response
    try {
      imgRes = await fetch(rawValue)
      if (!imgRes.ok) continue
    } catch {
      continue
    }
    const imgBuf = Buffer.from(await imgRes.arrayBuffer())

    // Resize image
    const resized = await sharp(imgBuf)
      .resize(imgWidthPx, undefined, { fit: "inside" })
      .ensureAlpha()
      .png()
      .toBuffer()

    const meta = await sharp(resized).metadata()
    const imgH = meta.height ?? 0
    const imgW = meta.width ?? imgWidthPx

    const align = anchor.align || def.default_align || "center"
    const ax = Math.round(anchor.x * targetWidth)
    const ay = Math.round(anchor.y * targetHeight)

    let left: number
    if (align === "center") left = ax - Math.round(imgW / 2)
    else if (align === "right") left = ax - imgW
    else left = ax

    const top = ay - Math.round(imgH / 2)

    // Apply watermark opacity
    if (def.key === "watermark") {
      const withOpacity = await sharp(resized)
        .composite([{
          input: Buffer.alloc(imgH * imgW * 4, 0),
          raw: { width: imgW, height: imgH, channels: 4 },
          blend: "dest-in",
        }])
        .png()
        .toBuffer()
      // simpler approach: use sharp modulate or just lower via SVG opacity layer
      const opacitySvg = `<svg xmlns="http://www.w3.org/2000/svg" width="${imgW}" height="${imgH}">
  <image href="data:image/png;base64,${resized.toString("base64")}" 
         width="${imgW}" height="${imgH}" opacity="0.18"/>
</svg>`
      composites.push({
        input: Buffer.from(opacitySvg),
        left: Math.max(0, left),
        top: Math.max(0, top),
      })
    } else {
      composites.push({
        input: resized,
        left: Math.max(0, left),
        top: Math.max(0, top),
      })
    }
  }

  // ── 4. Composite all layers ──────────────────────────────────────────────
  const pngBuffer = await base
    .composite(composites)
    .png({ quality: 95 })
    .toBuffer()

  if (format === "png") {
    return pngBuffer
  }

  // ── 5. Wrap PNG into a PDF page ──────────────────────────────────────────
  const pdfDoc = await PDFDocument.create()
  const pngImage = await pdfDoc.embedPng(pngBuffer)
  const { width: pxW, height: pxH } = pngImage.scale(1)
  // Convert px → pt (1px = 0.75pt at 96dpi)
  const ptW = (pxW * 3) / 4
  const ptH = (pxH * 3) / 4
  const page = pdfDoc.addPage([ptW, ptH])
  page.drawImage(pngImage, { x: 0, y: 0, width: ptW, height: ptH })

  const pdfBytes = await pdfDoc.save()
  return Buffer.from(pdfBytes)
}

// ---------------------------------------------------------------------------
// SVG-safe text escaping
// ---------------------------------------------------------------------------
function escapeText(s: string): string {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;")
}

function escapeHtmlInner(s: string): string {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
}

function escapeXml(s: string): string {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;")
}

function escapeAttr(s: string): string {
  return String(s).replace(/"/g, "&quot;")
}

function escapeSvg(s: string): string {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
}
