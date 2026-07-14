import { getSession } from "@/lib/auth"
import { PublicNavbar } from "@/components/public-navbar"
import { PublicFooter } from "@/components/public-footer"

export default async function PublicLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession()
  const user = session ? { role: session.role } : null

  return (
    <div className="flex flex-col min-h-screen">
      <PublicNavbar initialUser={user} />
      <main className="flex-1">
        {children}
      </main>
      <PublicFooter />
    </div>
  )
}
