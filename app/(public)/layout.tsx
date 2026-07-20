import { getSession } from "@/lib/auth"
import HomepageHeader from "@/components/homepage-header"
import { HomepageFooter } from "@/components/homepage-footer"
import { buildHomepageContent, buildHomepageColorVars } from "@/lib/homepage-content"
import { createClient } from '@supabase/supabase-js'
import { cookies } from "next/headers"

async function getHomepageSettings() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    if (!supabaseUrl || !supabaseAnonKey) return {}
    const supabase = createClient(supabaseUrl, supabaseAnonKey)
    const { data: rows } = await supabase.from('system_settings').select('setting_key, setting_value').eq('setting_type', 'homepage')
    const settings: Record<string, any> = {}
    if (rows) {
      for (const r of rows) settings[r.setting_key] = r.setting_value
    }
    return settings
  } catch (e) {
    return {}
  }
}

export default async function PublicLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession()
  const user = session ? { role: session.role } : null
  
  const settings = await getHomepageSettings()
  // Check locale from cookies (defaulting to ar)
  const cookieStore = await cookies()
  const localeCookie = cookieStore.get("NEXT_LOCALE")
  const locale = (localeCookie?.value === "en" ? "en" : "ar") as "ar" | "en"
  
  const c = buildHomepageContent(settings, locale)
  const colorVars = buildHomepageColorVars(settings)

  return (
    <div 
      className="hp-root flex flex-col min-h-screen bg-hp-parchment text-hp-ink dark:bg-hp-dark dark:text-hp-cream font-sans transition-colors duration-500" 
      dir={locale === 'ar' ? 'rtl' : 'ltr'} 
      style={colorVars as any}
    >
      <HomepageHeader />
      <main className="flex-1 relative">
        {children}
      </main>
      <HomepageFooter c={c} />
    </div>
  )
}
