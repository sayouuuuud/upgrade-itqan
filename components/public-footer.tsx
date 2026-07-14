"use client"

import Link from 'next/link'
import { useI18n } from '@/lib/i18n/context'

export function PublicFooter() {
  const { t } = useI18n()

  return (
    <footer className="bg-[#082A1F] text-white/80 border-t border-white/5 pt-16 pb-8">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
          <div className="md:col-span-2">
            <h3 className="text-3xl font-bold text-[#D4A843] mb-4">{t.appName}</h3>
            <p className="text-sm text-white/40 leading-relaxed mb-6 max-w-sm">
              {t.footer.desc}
            </p>
            <div className="flex flex-col gap-3 text-sm text-white/40">
              <div className="flex items-center gap-2">
                <span className="text-[#D4A843]">العنوان:</span>
                <span>{t.landing.address}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[#D4A843]">تواصل:</span>
                <a href={`https://wa.me/${t.landing.phoneVal.replace(/\s/g, '')}`} target="_blank" rel="noopener noreferrer" className="hover:text-[#25D366] transition-colors">
                  {t.landing.phoneVal} (واتساب)
                </a>
              </div>
            </div>
          </div>

          <div>
            <h4 className="font-bold text-white mb-4">{t.footer.quickLinks}</h4>
            <ul className="space-y-2 text-sm text-white/40">
              <li><Link href="/about" className="hover:text-[#D4A843] transition-colors">{t.about}</Link></li>
              <li><Link href="/faq" className="hover:text-[#D4A843] transition-colors">{t.footer.faq}</Link></li>
              <li><Link href="/login" className="hover:text-[#D4A843] transition-colors">{t.landing.footerLogin}</Link></li>
              <li><Link href="/reader-register" className="hover:text-[#D4A843] transition-colors">{t.landing.footerJoin}</Link></li>
              <li><Link href="/contact" className="hover:text-[#D4A843] transition-colors">{t.contact}</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-white mb-4">{t.footer.support}</h4>
            <ul className="space-y-2 text-sm text-white/40">
              <li><Link href="/terms" className="hover:text-[#D4A843] transition-colors">{t.footer.terms}</Link></li>
              <li><Link href="/privacy" className="hover:text-[#D4A843] transition-colors">{t.footer.privacy}</Link></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-white/5 pt-8 text-center text-xs text-white/20">
          {'2026 '}{t.appName}{'. '}{t.footer.rights}
        </div>
      </div>
    </footer>
  )
}
