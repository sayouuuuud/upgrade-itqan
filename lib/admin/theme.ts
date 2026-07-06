// Shared theme-config contract for the Super Admin "Theme Editor".
// Stored under the `theme_config` key in system_settings and injected as CSS
// variable overrides at the document root by <ThemeStyleInjector />.

export type ThemeColors = {
  primary: string
  primaryForeground: string
  secondary: string
  secondaryForeground: string
  accent: string
  accentForeground: string
  background: string
  foreground: string
  ring: string
  // Academy & Maintenance brand colors — exposed so the theme editor can
  // change them without touching globals.css or source files.
  academyPrimary: string
  maintenanceBg: string
  maintenanceGold: string
}

export type ThemeConfig = {
  colors: ThemeColors
  radius: string // e.g. "0.625rem"
  font: ThemeFontId
}

export type ThemeFontId =
  | "cairo"
  | "tajawal"
  | "almarai"
  | "ibm-plex-arabic"
  | "rubik"
  | "noto-kufi-arabic"

// Each selectable font maps to a CSS font stack and (optionally) a Google Fonts
// stylesheet URL that the injector renders so the font actually loads at runtime.
export const THEME_FONTS: Record<
  ThemeFontId,
  { label: string; stack: string; href?: string }
> = {
  cairo: {
    label: "Cairo (الافتراضي)",
    stack: "'Cairo', sans-serif",
  },
  tajawal: {
    label: "Tajawal",
    stack: "'Tajawal', sans-serif",
    href: "https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700;800&display=swap",
  },
  almarai: {
    label: "Almarai",
    stack: "'Almarai', sans-serif",
    href: "https://fonts.googleapis.com/css2?family=Almarai:wght@300;400;700;800&display=swap",
  },
  "ibm-plex-arabic": {
    label: "IBM Plex Arabic",
    stack: "'IBM Plex Sans Arabic', sans-serif",
    href: "https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+Arabic:wght@400;500;600;700&display=swap",
  },
  rubik: {
    label: "Rubik",
    stack: "'Rubik', sans-serif",
    href: "https://fonts.googleapis.com/css2?family=Rubik:wght@400;500;600;700;800&display=swap",
  },
  "noto-kufi-arabic": {
    label: "Noto Kufi Arabic",
    stack: "'Noto Kufi Arabic', sans-serif",
    href: "https://fonts.googleapis.com/css2?family=Noto+Kufi+Arabic:wght@400;500;700;800&display=swap",
  },
}

// Defaults mirror the values shipped in app/globals.css (:root).
export const DEFAULT_THEME: ThemeConfig = {
  colors: {
    primary: "#0D5A3C",
    primaryForeground: "#FFFFFF",
    secondary: "#F5F5F0",
    secondaryForeground: "#0D5A3C",
    accent: "#C9A962",
    accentForeground: "#0D1512",
    background: "#FAFAF8",
    foreground: "#0D1512",
    ring: "#0D5A3C",
    academyPrimary: "#1E3A5F",
    maintenanceBg: "#0B3D2E",
    maintenanceGold: "#D4A843",
  },
  radius: "0.625rem",
  font: "cairo",
}

const HEX_RE = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/

function safeHex(value: unknown, fallback: string): string {
  return typeof value === "string" && HEX_RE.test(value.trim()) ? value.trim() : fallback
}

// Coerce arbitrary stored/incoming data into a valid ThemeConfig so a malformed
// row can never inject broken CSS or crash a render.
export function normalizeTheme(raw: any): ThemeConfig {
  const c = raw?.colors ?? {}
  const d = DEFAULT_THEME.colors
  const font: ThemeFontId = THEME_FONTS[raw?.font as ThemeFontId] ? raw.font : "cairo"
  const radius =
    typeof raw?.radius === "string" && /^[0-9.]+rem$/.test(raw.radius.trim())
      ? raw.radius.trim()
      : DEFAULT_THEME.radius
  return {
    colors: {
      primary: safeHex(c.primary, d.primary),
      primaryForeground: safeHex(c.primaryForeground, d.primaryForeground),
      secondary: safeHex(c.secondary, d.secondary),
      secondaryForeground: safeHex(c.secondaryForeground, d.secondaryForeground),
      accent: safeHex(c.accent, d.accent),
      accentForeground: safeHex(c.accentForeground, d.accentForeground),
      background: safeHex(c.background, d.background),
      foreground: safeHex(c.foreground, d.foreground),
      ring: safeHex(c.ring, d.ring),
      academyPrimary: safeHex(c.academyPrimary, d.academyPrimary),
      maintenanceBg: safeHex(c.maintenanceBg, d.maintenanceBg),
      maintenanceGold: safeHex(c.maintenanceGold, d.maintenanceGold),
    },
    radius,
    font,
  }
}

// Build the CSS that overrides the relevant root variables. Returns null when
// the theme is effectively the default (no overrides needed) to avoid emitting
// dead markup. `--font-cairo` is overridden because globals.css resolves the
// `font-sans` utility through it.
export function buildThemeCss(theme: ThemeConfig): string {
  const { colors: cc, radius, font } = theme
  const stack = THEME_FONTS[font]?.stack ?? THEME_FONTS.cairo.stack
  // Font + radius are mode-agnostic, so they apply in both light and dark.
  // The custom color palette is a LIGHT palette only — it must be scoped to
  // `:root:not(.dark)` so it never clobbers the dark-mode tokens defined in
  // globals.css (`.dark { ... }`). Injecting colors into a plain `:root` block
  // overrode dark mode (the injected style loads after globals.css), producing
  // broken half-light/half-dark surfaces in admin dashboards.
  return `:root{
--radius:${radius};
--font-cairo:${stack};
--academy-primary:${cc.academyPrimary};
--academy-primary-light:color-mix(in srgb,${cc.academyPrimary} 80%,#ffffff);
--academy-primary-dark:color-mix(in srgb,${cc.academyPrimary} 80%,#000000);
--maintenance-bg:${cc.maintenanceBg};
--maintenance-gold:${cc.maintenanceGold};
--maintenance-gold-light:color-mix(in srgb,${cc.maintenanceGold} 60%,#ffffff);
--maintenance-cream:color-mix(in srgb,${cc.maintenanceGold} 10%,#ffffff);
}
:root:not(.dark){
--primary:${cc.primary};
--primary-foreground:${cc.primaryForeground};
--secondary:${cc.secondary};
--secondary-foreground:${cc.secondaryForeground};
--accent:${cc.accent};
--accent-foreground:${cc.accentForeground};
--background:${cc.background};
--foreground:${cc.foreground};
--ring:${cc.ring};
}`
}
