import StudentCertificatesCenter from "@/components/certificates-center/student-center"

export default function MaqraaStudentCertificatesPage() {
  return (
    <StudentCertificatesCenter
      apiBase="/api/student/certificates"
      requestBase="/student/certificates/request"
      title_ar="شهاداتي"
      title_en="My Certificates"
      subtitle_ar="كل شهادات المقرأة في مكان واحد — الصادرة، قيد المراجعة، والتي تنتظر إكمال بياناتها."
      subtitle_en="All your Maqraa certificates in one place — issued, pending review, and awaiting your data."
    />
  )
}
