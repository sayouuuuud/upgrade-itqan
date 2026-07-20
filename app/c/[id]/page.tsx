"use client"

import { useState, useEffect, use } from "react"
import Link from "next/link"
import { useI18n } from "@/lib/i18n/context"
import { Loader2, Download, Award, ShieldCheck, ExternalLink } from "lucide-react"

type CertificateData = {
    student_id: string
    student_name: string
    name_en: string | null
    university: string
    city: string
    issued_date: string
    platform_seal_url?: string
    certificate_pdf_url?: string
    certificate_image_url?: string
    certificate_photo_url?: string
    serial_code?: string
}

export default function PublicCertificatePage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params)
    const { locale } = useI18n()
    const isAr = locale === "ar"

    const [cert, setCert] = useState<CertificateData | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState("")
    const [imgLoaded, setImgLoaded] = useState(false)

    useEffect(() => {
        async function fetchCert() {
            try {
                const res = await fetch(`/api/c/${id}`)
                if (res.ok) {
                    const data = await res.json()
                    setCert(data.certificate)
                    if (typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('print') === '1') {
                        setTimeout(() => window.print(), 800)
                    }
                } else {
                    setError(isAr ? "الشهادة غير موجودة أو لم يتم إصدارها بعد" : "Certificate not found or not yet issued")
                }
            } catch {
                setError(isAr ? "حدث خطأ أثناء تحميل الشهادة" : "Error loading certificate")
            } finally {
                setLoading(false)
            }
        }
        fetchCert()
    }, [id, isAr])

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <Loader2 className="w-10 h-10 animate-spin text-[#1B5E3B]" />
            </div>
        )
    }

    if (error || !cert) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
                <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 text-center max-w-md w-full">
                    <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Award className="w-8 h-8 opacity-50" />
                    </div>
                    <h1 className="text-xl font-bold text-slate-800 mb-2">{isAr ? "عذراً" : "Oops"}</h1>
                    <p className="text-slate-500 mb-6">{error || (isAr ? "لا تتوفر شهادة لهذا المستخدم" : "No certificate available for this user")}</p>
                    <Link href="/" className="inline-block bg-[#1B5E3B] text-white px-6 py-2 rounded-xl font-bold transition-all hover:bg-[#124028]">
                        {isAr ? "العودة للمنصة" : "Back to Platform"}
                    </Link>
                </div>
            </div>
        )
    }

    // ── If we have a generated certificate image, show it directly ──────────
    if (cert.certificate_image_url) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-[#1B5E3B]/20 flex flex-col items-center justify-center py-12 px-4 print:bg-white print:p-0">
                {/* Certificate Image */}
                <div className="relative w-full max-w-5xl animate-in fade-in zoom-in-95 duration-700">
                    {/* Glow */}
                    <div className="absolute -inset-4 bg-[#C9A227]/20 rounded-3xl blur-3xl pointer-events-none" />

                    <div className="relative rounded-2xl overflow-hidden shadow-[0_40px_100px_-20px_rgba(0,0,0,0.8)] border border-white/10">
                        {!imgLoaded && (
                            <div className="absolute inset-0 bg-slate-800 flex items-center justify-center">
                                <Loader2 className="w-10 h-10 animate-spin text-[#C9A227]" />
                            </div>
                        )}
                        <img
                            src={cert.certificate_image_url}
                            alt={`Certificate for ${cert.name_en || cert.student_name}`}
                            className={`w-full h-auto block transition-opacity duration-500 ${imgLoaded ? 'opacity-100' : 'opacity-0'}`}
                            onLoad={() => setImgLoaded(true)}
                        />
                    </div>
                </div>

                {/* Verification badge */}
                {cert.serial_code && (
                    <div className="mt-8 flex items-center gap-3 px-6 py-3 bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl text-white print:hidden">
                        <ShieldCheck className="w-5 h-5 text-emerald-400" />
                        <span className="text-sm font-medium text-white/70">{isAr ? "رقم الشهادة:" : "Certificate ID:"}</span>
                        <span className="font-mono font-bold tracking-widest text-[#C9A227]">{cert.serial_code}</span>
                    </div>
                )}

                {/* Download button */}
                <div className="mt-6 flex gap-4 print:hidden">
                    <a
                        href={cert.certificate_image_url}
                        download={`certificate-${id}.png`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 bg-gradient-to-r from-[#C9A227] to-[#A6841E] text-white font-bold py-4 px-8 rounded-2xl shadow-2xl hover:shadow-[#C9A227]/30 hover:-translate-y-1 transition-all"
                    >
                        <Download className="w-5 h-5" />
                        <span>{isAr ? "تحميل الشهادة (PNG)" : "Download Certificate (PNG)"}</span>
                    </a>

                    <button
                        onClick={() => window.print()}
                        className="flex items-center gap-3 bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 text-white font-bold py-4 px-8 rounded-2xl transition-all"
                    >
                        <ExternalLink className="w-5 h-5" />
                        <span>{isAr ? "طباعة" : "Print"}</span>
                    </button>
                </div>

                {/* Print styles */}
                <style jsx global>{`
                    @media print {
                        body { background: white !important; margin: 0 !important; padding: 0 !important; }
                        .min-h-screen { min-height: auto !important; padding: 0 !important; }
                        @page { size: landscape; margin: 0; }
                    }
                `}</style>
            </div>
        )
    }

    // ── Fallback: HTML certificate (before image is generated) ────────────────
    const formattedDate = new Date(cert.issued_date).toLocaleDateString(isAr ? 'ar-SA' : 'en-US', {
        day: 'numeric', month: 'long', year: 'numeric'
    })

    return (
        <div className="min-h-screen bg-slate-100 flex flex-col items-center py-12 px-6 print:bg-white print:p-0 print:py-0">
            <div className="certificate-container relative bg-white shadow-2xl overflow-hidden print:shadow-none print:m-0"
                style={{ width: '210mm', height: '297mm', minWidth: '210mm' }}>
                <div className="absolute inset-8 border-[12px] border-double border-[#C9A227]/30 pointer-events-none" />
                <div className="absolute inset-12 border border-[#C9A227]/20 pointer-events-none" />
                <div className="relative h-full flex flex-col items-center pt-24 px-24 text-center">
                    <div className="mb-12">
                        <div className="w-24 h-24 bg-[#1B5E3B] rounded-2xl flex items-center justify-center shadow-xl rotate-45 mx-auto">
                            <Award className="w-12 h-12 text-[#C9A227] -rotate-45" />
                        </div>
                        <div className="mt-8">
                            <h1 className="text-4xl font-extrabold text-[#1B5E3B] tracking-tight">{isAr ? "منصة متقن الفاتحة" : "Itqaan Al-Fatiha Platform"}</h1>
                            <p className="text-[#C9A227] font-bold text-xl mt-2 tracking-widest">{isAr ? "مبادرة تصحيح وذكر" : "Recitation & Mastery Initiative"}</p>
                        </div>
                    </div>
                    <div className="w-32 h-1 bg-[#C9A227]/20 mb-16" />
                    <div className="space-y-8">
                        <h2 className="text-3xl font-serif text-slate-700 italic">{isAr ? "يُمنح هذا التبرير لـ" : "This certificate is awarded to"}</h2>
                        <h3 className="text-6xl font-black text-[#1B5E3B] underline underline-offset-[16px] decoration-[#C9A227]/40">
                            {cert.name_en || cert.student_name}
                        </h3>
                        <p className="text-2xl text-slate-600 leading-relaxed max-w-2xl mt-12">
                            {isAr
                                ? "وذلك تقديراً لإتمامه متقن قراءة سورة الفاتحة على الوجه المطلوب."
                                : "In recognition of achieving full mastery in the recitation of Surah Al-Fatiha."}
                        </p>
                    </div>
                    <div className="grid grid-cols-2 gap-x-20 gap-y-12 mt-20 text-right w-full max-w-xl">
                        {cert.serial_code && (
                            <div className="flex flex-col gap-2 col-span-2">
                                <span className="text-sm font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                    <ShieldCheck className="w-4 h-4" /> {isAr ? "رقم الشهادة" : "Certificate ID"}
                                </span>
                                <span className="text-xl font-mono font-bold text-slate-800">{cert.serial_code}</span>
                            </div>
                        )}
                        <div className="flex flex-col gap-2">
                            <span className="text-sm font-bold text-slate-400 uppercase tracking-widest">{isAr ? "الجامعة" : "University"}</span>
                            <span className="text-xl font-bold text-slate-800">{cert.university || (isAr ? "غير محدد" : "N/A")}</span>
                        </div>
                        <div className="flex flex-col gap-2">
                            <span className="text-sm font-bold text-slate-400 uppercase tracking-widest">{isAr ? "المدينة" : "City"}</span>
                            <span className="text-xl font-bold text-slate-800">{cert.city || (isAr ? "غير محدد" : "N/A")}</span>
                        </div>
                        <div className="flex flex-col gap-2">
                            <span className="text-sm font-bold text-slate-400 uppercase tracking-widest">{isAr ? "تاريخ الإصدار" : "Issue Date"}</span>
                            <span className="text-xl font-bold text-slate-800">{formattedDate}</span>
                        </div>
                    </div>
                </div>
            </div>
            <style jsx global>{`
                @media print {
                    body { background: white !important; }
                    .certificate-container { width: 100% !important; height: 100vh !important; margin: 0 !important; }
                    @page { size: A4; margin: 0; }
                }
            `}</style>
        </div>
    )
}
