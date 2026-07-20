import Link from "next/link"
import { OrnamentDivider } from "@/components/ui/ornament-divider"

export function HomepageFooter({ c }: { c: any }) {
  return (
    <footer className="relative bg-hp-navy-deep text-hp-parchment/85 pt-20 pb-10 overflow-hidden">
      {/* Ottoman carpet — woven texture beneath the dark wash */}
      <div
        className="absolute inset-0 bg-repeat opacity-[0.18] mix-blend-overlay pointer-events-none"
        style={{
          backgroundImage: "url(/patterns/ottoman-carpet.jpg)",
          backgroundSize: "440px",
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-hp-navy-deep via-hp-navy-deep/92 to-hp-navy-deep pointer-events-none" />
      {/* Top thin gold seam */}
      <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-hp-gold/40 to-transparent" />

      <div className="container mx-auto px-6 relative">
        <div className="grid lg:grid-cols-12 gap-10 pb-12 border-b border-hp-parchment/10">
          <div className="lg:col-span-5">
            <div className="flex items-center gap-3 mb-6">
              <div className="relative w-12 h-12">
                {c.logoUrl ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img src={c.logoUrl} alt={c.brandName} className="w-full h-full object-contain p-1.5" />
                ) : (
                  <div className="w-full h-full bg-hp-gold/20 rounded-full flex items-center justify-center text-hp-gold text-xs font-bold">
                    {c.brandName?.[0]}
                  </div>
                )}
              </div>
              <div>
                <div className="text-2xl font-bold text-hp-parchment" style={{ fontFamily: "var(--font-heading)" }}>
                  {c.brandName}
                </div>
                <div className="text-[10px] tracking-[0.2em] text-hp-parchment/50 uppercase">
                  {c.brandTagline}
                </div>
              </div>
            </div>
            <p className="text-hp-parchment/60 leading-loose max-w-md mb-6">
              {c.footerDesc}
            </p>
            <OrnamentDivider className="w-40 h-6 text-hp-gold/50" />
          </div>

          <div className="lg:col-span-7 grid grid-cols-2 md:grid-cols-3 gap-8">
            {c.footerColumns.map((col: any, i: number) => (
              <div key={i}>
                <h4 className="text-sm font-bold text-hp-gold mb-5 tracking-wider">{col.title}</h4>
                <ul className="space-y-3 text-sm">
                  {col.links.map((l: any, k: number) => (
                    <li key={k}><Link href={l.href} className="hover:text-hp-gold transition-colors">{l.label}</Link></li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-hp-parchment/55">
          <div>© {new Date().getFullYear()} {c.footerCopyright}</div>
          <div className="flex items-center gap-2">
            <span>{c.footerMadePre}</span>
            <span className="text-hp-gold">♥</span>
            <span>{c.footerMadePost}</span>
          </div>
        </div>
      </div>
    </footer>
  )
}
