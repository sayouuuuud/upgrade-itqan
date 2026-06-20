"use client"

import { useEffect } from 'react'
import { useI18n } from '@/lib/i18n/context'

export default function PrivacyPage() {
    const { t } = useI18n()

    useEffect(() => {
        if (t?.privacyPage?.title) {
            document.title = t.privacyPage.title
        }
    }, [t?.privacyPage?.title])

    return (
        <div className="bg-background min-h-[80vh] py-16">
            <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
                <div className="bg-card rounded-3xl p-8 md:p-12 shadow-sm border border-border/40">
                    <h1 className="text-3xl font-black text-foreground mb-8 text-center">{t?.privacyPage?.title}</h1>

                    <div className="space-y-8 text-start font-medium text-muted-foreground leading-relaxed">
                        <section>
                            <h2 className="text-xl font-bold text-foreground mb-4">{t?.privacyPage?.sec1Title}</h2>
                            <p>{t?.privacyPage?.sec1Text}</p>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold text-foreground mb-4">{t?.privacyPage?.sec2Title}</h2>
                            <p>{t?.privacyPage?.sec2Text}</p>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold text-foreground mb-4">{t?.privacyPage?.sec3Title}</h2>
                            <p>{t?.privacyPage?.sec3Text}</p>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold text-foreground mb-4">{t?.privacyPage?.sec4Title}</h2>
                            <p>{t?.privacyPage?.sec4Text}</p>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold text-foreground mb-4">{t?.privacyPage?.sec5Title}</h2>
                            <p>{t?.privacyPage?.sec5Text}</p>
                        </section>
                    </div>
                </div>
            </div>
        </div>
    )
}
