import { getSetting } from "@/lib/settings"
import {
  DEFAULT_THEME,
  THEME_FONTS,
  buildThemeCss,
  normalizeTheme,
  type ThemeConfig,
} from "@/lib/admin/theme"

// Server component. Reads the saved theme from system_settings and injects the
// matching CSS-variable overrides (and an optional Google Fonts stylesheet) so
// the Super Admin's design choices apply across the whole site at runtime —
// no code changes required.
export async function ThemeStyleInjector() {
  let theme: ThemeConfig = DEFAULT_THEME
  try {
    const stored = await getSetting<any>("theme_config", null)
    if (stored) theme = normalizeTheme(stored)
  } catch {
    // Fall back to defaults; never block rendering on a settings failure.
  }

  const fontHref = THEME_FONTS[theme.font]?.href
  const css = buildThemeCss(theme)

  return (
    <>
      {fontHref ? <link rel="stylesheet" href={fontHref} /> : null}
      {/* eslint-disable-next-line react/no-danger */}
      <style id="itqan-theme-overrides" dangerouslySetInnerHTML={{ __html: css }} />
    </>
  )
}
