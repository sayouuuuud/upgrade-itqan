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
  card: string
  cardForeground: string
  popover: string
  popoverForeground: string
  input: string
  success: string
  successForeground: string
  warning: string
  warningForeground: string
  destructive: string
  destructiveForeground: string
  muted: string
  mutedForeground: string
  border: string
  sidebar: string
  sidebarForeground: string
  sidebarPrimary: string
  sidebarPrimaryForeground: string
  sidebarBorder: string
  sidebarRing: string
  // Academy & Maintenance brand colors — exposed so the theme editor can
  // change them without touching globals.css or source files.
  academyPrimary: string
  maintenanceBg: string
  maintenanceGold: string
}

export type ThemeConfig = {
  light: {
    colors: ThemeColors
  }
  dark: {
    colors: ThemeColors
  }
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

// Defaults mirror the values shipped in app/globals.css (:root for light mode).
// Dark mode colors are automatically derived but can be overridden per color.
const DEFAULT_COLORS: ThemeColors = {
  primary: "#0D5A3C",
  primaryForeground: "#FFFFFF",
  secondary: "#F5F5F0",
  secondaryForeground: "#0D5A3C",
  accent: "#C9A962",
  accentForeground: "#0D1512",
  background: "#FAFAF8",
  foreground: "#0D1512",
  ring: "#0D5A3C",
  card: "#FFFFFF",
  cardForeground: "#0D1512",
  popover: "#FFFFFF",
  popoverForeground: "#0D1512",
  input: "#E8E8E3",
  success: "#16A34A",
  successForeground: "#FFFFFF",
  warning: "#F59E0B",
  warningForeground: "#0D1512",
  destructive: "#DC2626",
  destructiveForeground: "#FFFFFF",
  muted: "#F5F5F0",
  mutedForeground: "#6B7280",
  border: "#E8E8E3",
  sidebar: "#FFFFFF",
  sidebarForeground: "#0D1512",
  sidebarPrimary: "#0D5A3C",
  sidebarPrimaryForeground: "#FFFFFF",
  sidebarBorder: "#E8E8E3",
  sidebarRing: "#0D5A3C",
  academyPrimary: "#1E3A5F",
  maintenanceBg: "#0B3D2E",
  maintenanceGold: "#D4A843",
}

export const DEFAULT_THEME: ThemeConfig = {
  light: {
    colors: DEFAULT_COLORS,
  },
  dark: {
    colors: {
      primary: "#3B6BA5",
      primaryForeground: "#F0F4F8",
      secondary: "#1F2937",
      secondaryForeground: "#3B6BA5",
      accent: "#D4A843",
      accentForeground: "#F0F4F8",
      background: "#0F172A",
      foreground: "#F0F4F8",
      ring: "#3B6BA5",
      card: "#0F1614",
      cardForeground: "#F5F5F0",
      popover: "#0F1614",
      popoverForeground: "#F5F5F0",
      input: "#1F2D28",
      success: "#22C55E",
      successForeground: "#FFFFFF",
      warning: "#FBBF24",
      warningForeground: "#080D0B",
      destructive: "#EF4444",
      destructiveForeground: "#FFFFFF",
      muted: "#1A2420",
      mutedForeground: "#9CA3AF",
      border: "#1F2D28",
      sidebar: "#0F1614",
      sidebarForeground: "#F5F5F0",
      sidebarPrimary: "#C9A962",
      sidebarPrimaryForeground: "#080D0B",
      sidebarBorder: "#1F2D28",
      sidebarRing: "#C9A962",
      academyPrimary: "#3B6BA5",
      maintenanceBg: "#0B3D2E",
      maintenanceGold: "#D4A843",
    },
  },
  radius: "0.625rem",
  font: "cairo",
}

const HEX_RE = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/

function safeHex(value: unknown, fallback: string): string {
  return typeof value === "string" && HEX_RE.test(value.trim()) ? value.trim() : fallback
}

// Helper to normalize individual color set
function normalizeColors(c: any, d: ThemeColors): ThemeColors {
  return {
    primary: safeHex(c.primary, d.primary),
    primaryForeground: safeHex(c.primaryForeground, d.primaryForeground),
    secondary: safeHex(c.secondary, d.secondary),
    secondaryForeground: safeHex(c.secondaryForeground, d.secondaryForeground),
    accent: safeHex(c.accent, d.accent),
    accentForeground: safeHex(c.accentForeground, d.accentForeground),
    background: safeHex(c.background, d.background),
    foreground: safeHex(c.foreground, d.foreground),
    ring: safeHex(c.ring, d.ring),
    card: safeHex(c.card, d.card),
    cardForeground: safeHex(c.cardForeground, d.cardForeground),
    popover: safeHex(c.popover, d.popover),
    popoverForeground: safeHex(c.popoverForeground, d.popoverForeground),
    input: safeHex(c.input, d.input),
    success: safeHex(c.success, d.success),
    successForeground: safeHex(c.successForeground, d.successForeground),
    warning: safeHex(c.warning, d.warning),
    warningForeground: safeHex(c.warningForeground, d.warningForeground),
    destructive: safeHex(c.destructive, d.destructive),
    destructiveForeground: safeHex(c.destructiveForeground, d.destructiveForeground),
    muted: safeHex(c.muted, d.muted),
    mutedForeground: safeHex(c.mutedForeground, d.mutedForeground),
    border: safeHex(c.border, d.border),
    sidebar: safeHex(c.sidebar, d.sidebar),
    sidebarForeground: safeHex(c.sidebarForeground, d.sidebarForeground),
    sidebarPrimary: safeHex(c.sidebarPrimary, d.sidebarPrimary),
    sidebarPrimaryForeground: safeHex(c.sidebarPrimaryForeground, d.sidebarPrimaryForeground),
    sidebarBorder: safeHex(c.sidebarBorder, d.sidebarBorder),
    sidebarRing: safeHex(c.sidebarRing, d.sidebarRing),
    academyPrimary: safeHex(c.academyPrimary, d.academyPrimary),
    maintenanceBg: safeHex(c.maintenanceBg, d.maintenanceBg),
    maintenanceGold: safeHex(c.maintenanceGold, d.maintenanceGold),
  }
}

// Coerce arbitrary stored/incoming data into a valid ThemeConfig so a malformed
// row can never inject broken CSS or crash a render. Supports both old (single colors)
// and new (light/dark separated) data formats for backward compatibility.
export function normalizeTheme(raw: any): ThemeConfig {
  const font: ThemeFontId = THEME_FONTS[raw?.font as ThemeFontId] ? raw.font : "cairo"
  const radius =
    typeof raw?.radius === "string" && /^[0-9.]+rem$/.test(raw.radius.trim())
      ? raw.radius.trim()
      : DEFAULT_THEME.radius

  // Support old data format (single colors) by migrating to new format
  // If raw has light/dark, use them; otherwise use old colors field for light and defaults for dark
  const hasNewFormat = raw?.light?.colors || raw?.dark?.colors
  const lightColors = hasNewFormat ? raw?.light?.colors : raw?.colors
  const darkColors = hasNewFormat ? raw?.dark?.colors : undefined

  return {
    light: {
      colors: normalizeColors(lightColors ?? {}, DEFAULT_THEME.light.colors),
    },
    dark: {
      colors: normalizeColors(darkColors ?? {}, DEFAULT_THEME.dark.colors),
    },
    radius,
    font,
  }
}

// Build the CSS that overrides the relevant root variables for both light and dark modes.
export function buildThemeCss(theme: ThemeConfig): string {
  const { light, dark, radius, font } = theme
  const lc = light.colors
  const dc = dark.colors
  const stack = THEME_FONTS[font]?.stack ?? THEME_FONTS.cairo.stack

  return `:root{
--radius:${radius};
--font-cairo:${stack};
--academy-primary:${lc.academyPrimary};
--academy-primary-light:color-mix(in srgb,${lc.academyPrimary} 80%,#ffffff);
--academy-primary-dark:color-mix(in srgb,${lc.academyPrimary} 80%,#000000);
--maintenance-bg:${lc.maintenanceBg};
--maintenance-gold:${lc.maintenanceGold};
--maintenance-gold-light:color-mix(in srgb,${lc.maintenanceGold} 60%,#ffffff);
--maintenance-cream:color-mix(in srgb,${lc.maintenanceGold} 10%,#ffffff);
}
:root:not(.dark), .theme-islamic:not(.dark), .theme-academy:not(.dark), .theme-female:not(.dark), .admin-theme:not(.dark) {
--primary:${lc.primary};
--primary-foreground:${lc.primaryForeground};
--secondary:${lc.secondary};
--secondary-foreground:${lc.secondaryForeground};
--accent:${lc.accent};
--accent-foreground:${lc.accentForeground};
--background:${lc.background};
--foreground:${lc.foreground};
--ring:${lc.ring};
--card:${lc.card};
--card-foreground:${lc.cardForeground};
--popover:${lc.popover};
--popover-foreground:${lc.popoverForeground};
--input:${lc.input};
--success:${lc.success};
--success-foreground:${lc.successForeground};
--warning:${lc.warning};
--warning-foreground:${lc.warningForeground};
--destructive:${lc.destructive};
--destructive-foreground:${lc.destructiveForeground};
--muted:${lc.muted};
--muted-foreground:${lc.mutedForeground};
--border:${lc.border};
--sidebar:${lc.sidebar};
--sidebar-foreground:${lc.sidebarForeground};
--sidebar-primary:${lc.sidebarPrimary};
--sidebar-primary-foreground:${lc.sidebarPrimaryForeground};
--sidebar-border:${lc.sidebarBorder};
--sidebar-ring:${lc.sidebarRing};
}
.dark, .dark .theme-islamic, .theme-islamic.dark, .dark .theme-academy, .theme-academy.dark, .dark .theme-female, .theme-female.dark, .dark .admin-theme, .admin-theme.dark {
--primary:${dc.primary};
--primary-foreground:${dc.primaryForeground};
--secondary:${dc.secondary};
--secondary-foreground:${dc.secondaryForeground};
--accent:${dc.accent};
--accent-foreground:${dc.accentForeground};
--background:${dc.background};
--foreground:${dc.foreground};
--ring:${dc.ring};
--card:${dc.card};
--card-foreground:${dc.cardForeground};
--popover:${dc.popover};
--popover-foreground:${dc.popoverForeground};
--input:${dc.input};
--success:${dc.success};
--success-foreground:${dc.successForeground};
--warning:${dc.warning};
--warning-foreground:${dc.warningForeground};
--destructive:${dc.destructive};
--destructive-foreground:${dc.destructiveForeground};
--muted:${dc.muted};
--muted-foreground:${dc.mutedForeground};
--border:${dc.border};
--sidebar:${dc.sidebar};
--sidebar-foreground:${dc.sidebarForeground};
--sidebar-primary:${dc.sidebarPrimary};
--sidebar-primary-foreground:${dc.sidebarPrimaryForeground};
--sidebar-border:${dc.sidebarBorder};
--sidebar-ring:${dc.sidebarRing};
}`
}
