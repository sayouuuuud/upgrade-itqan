// Certificate PDF / image render engine.
//
// Given a template image, a set of field_positions (normalised 0..1) and a
// values map, produces an HTML page that puppeteer can rasterise to either
// PDF or PNG.  The rendering rules:
//   * The template image is rendered as a full-bleed background.
//   * Each field is absolutely positioned using the (x, y) anchor.
//   * `align` controls how `x` is interpreted (center / left / right).
//   * `font_size` is expressed in percent of `min(width, height)` so the
//     output scales consistently regardless of the template resolution.
//   * Image-type fields (logo / watermark / signature) consume the
//     `size` field as the image width in percent of the template width.

import { ALL_FIELDS, type FieldAnchor, type FieldValues } from "./fields"

export interface RenderInput {
  template_url: string
  field_positions: Record<string, FieldAnchor>
  values: FieldValues
  language?: "ar" | "en"
  // Allows the caller (preview) to render even when some fields aren't
  // placed yet — falls back to sample text.
  use_samples?: boolean
  // Width of the output page in pixels.  Default 1400 (≈ A4 landscape @ ~150dpi)
  width?: number
  // Aspect ratio (width / height) of the page.  Default 1.4142 (sqrt(2), A4).
  aspect?: number
}

function escapeHtml(s: string): string {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
}

const IMAGE_FIELDS = new Set(["logo", "watermark", "signature"])

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
    // Skip fields that haven't been placed yet, unless we're rendering a
    // preview with samples.
    if (!anchor) continue

    const isImg = IMAGE_FIELDS.has(def.key)
    const rawValue =
      (values as Record<string, string | undefined>)[def.key]
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
      // For images, size is the *width* of the image as a % of template width.
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
// Puppeteer-based renderer.  Returns a Buffer in PDF or PNG.
// ---------------------------------------------------------------------------
type RenderFormat = "pdf" | "png"

async function launchBrowser() {
  const isLocal = process.env.NODE_ENV === "development" || !process.env.VERCEL
  if (isLocal) {
    const puppeteer = (await import("puppeteer")).default
    return puppeteer.launch({
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-gpu",
        "--no-zygote",
        "--single-process",
      ],
      headless: true,
    })
  }
  // Vercel / serverless
  const chromium = (await import("@sparticuz/chromium")).default
  const puppeteerCore = (await import("puppeteer-core")).default
  return puppeteerCore.launch({
    args: chromium.args,
    defaultViewport: chromium.defaultViewport,
    executablePath: await chromium.executablePath(),
    headless: chromium.headless,
  })
}

export async function renderCertificate(
  input: RenderInput,
  format: RenderFormat = "pdf",
): Promise<Buffer> {
  const width = input.width ?? 1400
  const aspect = input.aspect ?? 1.4142
  const height = Math.round(width / aspect)
  const html = buildCertificateHtml(input)

  let browser: Awaited<ReturnType<typeof launchBrowser>> | null = null
  try {
    browser = await launchBrowser()
    const page = await browser.newPage()
    await page.setViewport({
      width,
      height,
      deviceScaleFactor: 2,
    })
    await page.setContent(html, { waitUntil: "networkidle2" })
    // Give web fonts a chance to load.
    await new Promise((r) => setTimeout(r, 600))

    if (format === "png") {
      const png = await page.screenshot({
        type: "png",
        omitBackground: false,
        fullPage: false,
      })
      return Buffer.from(png)
    }

    // PDF — exact-size single page, no margins.
    const pdf = await page.pdf({
      width: `${width}px`,
      height: `${height}px`,
      printBackground: true,
      pageRanges: "1",
      margin: { top: "0", bottom: "0", left: "0", right: "0" },
    })
    return Buffer.from(pdf)
  } finally {
    if (browser) {
      try {
        await Promise.race([
          browser.close(),
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error("browser close timeout")), 5000),
          ),
        ])
      } catch {
        // ignore — page rendered already
      }
    }
  }
}
