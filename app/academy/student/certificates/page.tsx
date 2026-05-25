import StudentCertificatesCenter from "@/components/certificates-center/student-center"

export default function AcademyCertificatesPage() {
  return (
    <StudentCertificatesCenter
      apiBase="/api/academy/student/certificates"
      requestBase="/academy/student/certificates/request"
      title_ar="شهاداتي"
      title_en="My Certificates"
      subtitle_ar="كل شهاداتك في مكان واحد — الصادرة، قيد المراجعة، والتي تنتظر إكمال بياناتها."
      subtitle_en="All your certificates in one place — issued, pending review, and awaiting your data."
    />
  )
}
