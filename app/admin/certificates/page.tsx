import CertificatesAdminCenter from "@/components/certificates-center/admin-center"

export default function MaqraaAdminCertificatesPage() {
  return (
    <CertificatesAdminCenter
      apiBase="/api/admin/certificates-center"
      scope="maqraa"
      title_ar="مركز الشهادات"
      title_en="Certificates Center"
      subtitle_ar="إدارة قوالب الشهادات، الإعدادات، وطلبات الإصدار للمقرأة."
      subtitle_en="Manage certificate templates, settings, and issuance requests for the Maqraa."
    />
  )
}
