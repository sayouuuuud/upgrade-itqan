'use client'

import { useState, useEffect } from 'react'
import { useI18n } from '@/lib/i18n/context'
import { Card, CardContent } from '@/components/ui/card'
import { Award, Download, Share2, Calendar, User, Loader2, BookOpen } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface AcademyCertificate {
  id: string
  course_name: string
  teacher_name: string
  issue_date: string
  pdf_url: string
}

export default function AcademyCertificatesPage() {
  const { t, locale } = useI18n()
  const isAr = locale === 'ar'
  const [certificates, setCertificates] = useState<AcademyCertificate[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/academy/student/certificates')
      .then(r => r.json())
      .then(d => {
        if (d.certificates) setCertificates(d.certificates)
      })
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-12" dir={isAr ? "rtl" : "ltr"}>
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold uppercase tracking-wider mb-2">
            <Award className="w-4 h-4" />
            {isAr ? "الشهادات الأكاديمية" : "Academy Certificates"}
          </div>
          <h1 className="text-3xl lg:text-4xl font-black tracking-tight text-foreground">
            {isAr ? "شهادات إتمام الدورات" : "Course Completion Certificates"}
          </h1>
          <p className="text-muted-foreground font-medium max-w-2xl">
            {isAr ? "سجل إنجازاتك والشهادات التي حصلت عليها بعد إتمام الدورات التعليمية." : "Your track record of achievements and certificates earned from completed courses."}
          </p>
        </div>
      </div>

      {certificates.length === 0 ? (
        <Card className="border border-border/50 shadow-sm bg-card overflow-hidden rounded-3xl">
          <CardContent className="p-16 text-center space-y-6">
            <div className="w-24 h-24 bg-primary/5 rounded-full flex items-center justify-center mx-auto mb-6">
              <Award className="w-12 h-12 text-primary/40" />
            </div>
            <h3 className="text-2xl font-black text-foreground">
              {isAr ? 'لا توجد شهادات حتى الآن' : 'No Certificates Yet'}
            </h3>
            <p className="text-muted-foreground font-medium leading-relaxed max-w-sm mx-auto">
              {isAr 
                ? 'أكمل الدورات التعليمية بنسبة 100% ليقوم أستاذك بإصدار شهادة إتمام لك.' 
                : 'Complete courses with 100% progress for your teacher to issue a completion certificate.'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {certificates.map(cert => (
            <Card key={cert.id} className="group border border-border/50 shadow-sm hover:shadow-xl hover:-translate-y-1 hover:border-primary/20 transition-all duration-300 bg-card overflow-hidden rounded-3xl relative">
              <div className="absolute top-0 right-0 p-6 opacity-5 pointer-events-none transition-opacity group-hover:opacity-10">
                <Award className="w-32 h-32 text-primary -rotate-12 translate-x-8 -translate-y-8" />
              </div>
              <CardContent className="p-0">
                <div className="p-6 pb-0 space-y-4">
                  <div className="flex items-center gap-2">
                    <span className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <BookOpen className="w-4 h-4 text-primary" />
                    </span>
                    <h3 className="text-xl font-bold text-foreground line-clamp-2">
                      {cert.course_name}
                    </h3>
                  </div>
                  
                  <div className="space-y-3 pt-4 border-t border-border/50">
                    <div className="flex items-center gap-3 text-sm font-medium text-muted-foreground">
                      <User className="w-4 h-4 text-primary/70 shrink-0" />
                      <span>{isAr ? "الأستاذ: " : "Teacher: "}{cert.teacher_name}</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm font-medium text-muted-foreground">
                      <Calendar className="w-4 h-4 text-primary/70 shrink-0" />
                      <span dir="ltr">{new Date(cert.issue_date).toLocaleDateString(isAr ? 'ar-SA' : 'en-US')}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-8 p-6 bg-muted/30 border-t border-border/50 flex items-center gap-3">
                  <Button variant="default" className="flex-1 bg-primary text-primary-foreground font-bold rounded-xl shadow-md hover:shadow-lg transition-all" onClick={() => window.open(cert.pdf_url)}>
                    <Download className={`w-4 h-4 ${isAr ? "ml-2" : "mr-2"}`} />
                    {isAr ? "تنزيل PDF" : "Download PDF"}
                  </Button>
                  <Button variant="outline" size="icon" className="shrink-0 aspect-square rounded-xl border-border bg-card hover:bg-muted text-foreground">
                    <Share2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
