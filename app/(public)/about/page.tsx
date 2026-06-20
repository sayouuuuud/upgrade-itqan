"use client"

import { useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { BookOpen, Target, Heart, Eye } from 'lucide-react'
import { useI18n } from '@/lib/i18n/context'

export default function AboutPage() {
  const { t } = useI18n()

  useEffect(() => {
    if (t?.aboutPage?.metaTitle) {
      document.title = t.aboutPage.metaTitle
    }
  }, [t?.aboutPage?.metaTitle])

  const values = [
    { icon: Target, title: t?.aboutPage?.value1Title || '', description: t?.aboutPage?.value1Desc || '' },
    { icon: Heart, title: t?.aboutPage?.value2Title || '', description: t?.aboutPage?.value2Desc || '' },
    { icon: Eye, title: t?.aboutPage?.value3Title || '', description: t?.aboutPage?.value3Desc || '' },
  ]

  const team = [
    { name: t?.aboutPage?.teamMember1Name || '', role: t?.aboutPage?.teamMember1Role || '', bio: t?.aboutPage?.teamMember1Bio || '' },
    { name: t?.aboutPage?.teamMember2Name || '', role: t?.aboutPage?.teamMember2Role || '', bio: t?.aboutPage?.teamMember2Bio || '' },
    { name: t?.aboutPage?.teamMember3Name || '', role: t?.aboutPage?.teamMember3Role || '', bio: t?.aboutPage?.teamMember3Bio || '' },
  ]

  return (
    <div>
      {/* Hero */}
      <section className="bg-secondary border-b border-border">
        <div className="mx-auto max-w-7xl px-4 py-16 lg:py-24 lg:px-8">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-1.5 rounded-full text-sm font-medium mb-6">
              <BookOpen className="w-4 h-4" />
              {t?.aboutPage?.badge}
            </div>
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground leading-tight text-balance">
              {t?.aboutPage?.heroTitle}
            </h1>
            <p className="mt-6 text-lg text-muted-foreground leading-relaxed">
              {t?.aboutPage?.heroDesc}
            </p>
          </div>
        </div>
      </section>

      {/* Mission */}
      <section className="bg-background py-16 lg:py-24">
        <div className="mx-auto max-w-7xl px-4 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-6">{t?.aboutPage?.missionTitle}</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                {t?.aboutPage?.missionP1}
              </p>
              <p className="text-muted-foreground leading-relaxed mb-4">
                {t?.aboutPage?.missionP2}
              </p>
              <p className="text-muted-foreground leading-relaxed">
                {t?.aboutPage?.missionP3}
              </p>
            </div>
            <div className="bg-secondary rounded-2xl p-8 border border-border">
              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <span className="text-primary font-bold">+</span>
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">{t?.aboutPage?.feature1Title}</p>
                    <p className="text-sm text-muted-foreground">{t?.aboutPage?.feature1Desc}</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <span className="text-primary font-bold">+</span>
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">{t?.aboutPage?.feature2Title}</p>
                    <p className="text-sm text-muted-foreground">{t?.aboutPage?.feature2Desc}</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <span className="text-primary font-bold">+</span>
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">{t?.aboutPage?.feature3Title}</p>
                    <p className="text-sm text-muted-foreground">{t?.aboutPage?.feature3Desc}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="bg-secondary py-16 lg:py-24 border-y border-border">
        <div className="mx-auto max-w-7xl px-4 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-bold text-foreground">{t?.aboutPage?.valuesTitle}</h2>
            <p className="mt-3 text-muted-foreground">{t?.aboutPage?.valuesSubtitle}</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {values.map((v, i) => (
              <Card key={i} className="text-center border-border/60">
                <CardContent className="pt-8 pb-6">
                  <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                    <v.icon className="w-7 h-7 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">{v.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{v.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Team */}
      <section className="bg-background py-16 lg:py-24">
        <div className="mx-auto max-w-7xl px-4 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-bold text-foreground">{t?.aboutPage?.teamTitle}</h2>
            <p className="mt-3 text-muted-foreground">{t?.aboutPage?.teamSubtitle}</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {team.map((member, i) => (
              <Card key={i} className="border-border/60">
                <CardContent className="pt-6">
                  <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                    <span className="text-primary text-xl font-bold">{member.name ? member.name[0] : ''}{member.name && member.name.split(' ')[1]?.[0] ? member.name.split(' ')[1][0] : ''}</span>
                  </div>
                  <div className="text-center">
                    <h3 className="font-semibold text-foreground">{member.name}</h3>
                    <p className="text-sm text-primary font-medium mb-2">{member.role}</p>
                    <p className="text-sm text-muted-foreground leading-relaxed">{member.bio}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
