import CertificatesAdminCenter from "@/components/certificates-center/admin-center"

export default function AcademyAdminCertificatesPage() {
  return (
    <CertificatesAdminCenter
      apiBase="/api/academy/admin/certificates"
      scope="academy"
      title_ar="مركز الشهادات"
      title_en="Certificates Center"
      subtitle_ar="إدارة قوالب الشهادات، الإعدادات، وطلبات الإصدار للأكاديمية."
      subtitle_en="Manage certificate templates, settings, and issuance requests for the Academy."
    />
  )
}
