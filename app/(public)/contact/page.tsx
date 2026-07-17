'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Mail, Phone, MapPin, CheckCircle, Send, Bell } from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'
import { useI18n } from '@/lib/i18n/context'

export default function ContactPage() {
  const { t } = useI18n()
  const app = (t as any).app as Record<string, string> | undefined
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)
  const [contactInfo, setContactInfo] = useState({
    email: 'info@itqaan.com',
    phone: '+966 50 000 0000',
    address: (t.addedTranslations_2026?.['الرياض، المملكة العربية السعودية'] || 'الرياض، المملكة العربية السعودية')
  })

  useEffect(() => {
    if (t?.contactPage?.title) {
      document.title = t.contactPage.title
    }
  }, [t?.contactPage?.title])

  useEffect(() => {
    async function fetchInfo() {
      try {
        const res = await fetch('/api/public-settings')
        if (res.ok) {
          const data = await res.json()
          if (data.contactInfo) {
            setContactInfo(data.contactInfo)
          }
        }
      } catch (error) {
        console.error("Error fetching contact info:", error)
      }
    }

    // Check if user is admin
    async function checkAdmin() {
      try {
        const res = await fetch('/api/auth/me')
        if (res.ok) {
          const data = await res.json()
          setIsAdmin(data.role === 'admin')
        }
      } catch (error) {
        console.error("Error checking admin status:", error)
      }
    }

    fetchInfo()
    checkAdmin()
  }, [])

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)

    const formData = new FormData(e.currentTarget)
    const data = {
      name: formData.get('name'),
      email: formData.get('email'),
      subject: formData.get('subject'),
      message: formData.get('message'),
    }

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (res.ok) {
        setSubmitted(true)
        toast.success(t?.contactPage?.successTitle || (t.addedTranslations_2026?.['تم إرسال رسالتك بنجاح'] || 'تم إرسال رسالتك بنجاح'))
      } else {
        const err = await res.json()
        toast.error(err.error || t?.contactPage?.connectionError || (t.addedTranslations_2026?.['حدث خطأ أثناء إرسال الرسالة'] || 'حدث خطأ أثناء إرسال الرسالة'))
      }
    } catch (error) {
      toast.error(t?.contactPage?.connectionError || (t.addedTranslations_2026?.['حدث خطأ في الاتصال بالخادم'] || 'حدث خطأ في الاتصال بالخادم'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-secondary min-h-[80vh]">
      <div className="mx-auto max-w-7xl px-4 py-16 lg:py-24 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-3xl md:text-4xl font-bold text-foreground text-balance">{t?.contactPage?.title}</h1>
          <p className="mt-4 text-muted-foreground text-lg max-w-xl mx-auto">{t?.contactPage?.subtitle}</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {/* Contact Info */}
          <div className="space-y-4">
            <Card className="border-border/60">
              <CardContent className="pt-6 flex items-start gap-4">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <Mail className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium text-foreground text-sm">{t?.contactPage?.emailLabel}</p>
                  <p className="text-sm text-muted-foreground mt-1">{contactInfo.email}</p>
                </div>
              </CardContent>
            </Card>
            <Card className="border-border/60">
              <CardContent className="pt-6 flex items-start gap-4">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <Phone className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium text-foreground text-sm">{t?.contactPage?.phoneLabel}</p>
                  <p className="text-sm text-muted-foreground mt-1 direction-ltr text-end" dir="ltr">{contactInfo.phone}</p>
                </div>
              </CardContent>
            </Card>
            <Card className="border-border/60">
              <CardContent className="pt-6 flex items-start gap-4">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <MapPin className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium text-foreground text-sm">{t?.contactPage?.addressLabel}</p>
                  <p className="text-sm text-muted-foreground mt-1">{contactInfo.address}</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Contact Form */}
          <div className="lg:col-span-2">
            <Card className="border-border/60">
              <CardHeader>
                <CardTitle>{t?.contactPage?.formTitle}</CardTitle>
                <CardDescription>{t?.contactPage?.formSubtitle}</CardDescription>
              </CardHeader>
              <CardContent>
                {submitted ? (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
                      <CheckCircle className="w-8 h-8 text-emerald-600" />
                    </div>
                    <h3 className="text-lg font-semibold text-foreground mb-2">{t?.contactPage?.successTitle}</h3>
                    <p className="text-sm text-muted-foreground mb-6">{t?.contactPage?.successDesc}</p>
                    <div className="flex flex-col sm:flex-row gap-3 justify-center">
                      <Button variant="outline" onClick={() => setSubmitted(false)}>
                        {t?.contactPage?.anotherMessage}
                      </Button>
                      {isAdmin && (
                        <Link href="/admin/notifications">
                          <Button variant="default" className="flex items-center gap-2">
                            <Bell className="w-4 h-4" />
                            {t?.contactPage?.viewNotifications}
                          </Button>
                        </Link>
                      )}
                    </div>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="name">{t?.contactPage?.fullNameLabel}</Label>
                        <Input id="name" name="name" placeholder={t?.contactPage?.fullNamePlaceholder || ''} required />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email">{t?.contactPage?.emailLabelForm}</Label>
                        <Input id="email" name="email" type="email" placeholder={t?.contactPage?.emailPlaceholder || ''} dir="ltr" className="text-start" required />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="subject">{t?.contactPage?.subjectLabel}</Label>
                      <Input id="subject" name="subject" placeholder={t?.contactPage?.subjectPlaceholder || ''} required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="message">{t?.contactPage?.messageLabel}</Label>
                      <Textarea id="message" name="message" placeholder={t?.contactPage?.messagePlaceholder || ''} rows={5} required />
                    </div>
                    <Button type="submit" disabled={loading} className="w-full sm:w-auto">
                      {loading ? (
                        <span className="flex items-center gap-2">
                          <span className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                          {t?.contactPage?.sendingButton}
                        </span>
                      ) : (
                        <span className="flex items-center gap-2">
                          <Send className="w-4 h-4" />
                          {t?.contactPage?.submitButton}
                        </span>
                      )}
                    </Button>
                  </form>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
