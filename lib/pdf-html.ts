import { queryOne } from "@/lib/db"

/**
 * Generate certificate HTML for a student.
 * @param id - student_id
 * @param skipIssuedCheck - if true, skip the certificate_issued check (used during issuance flow)
 */
export async function getCertificateHtml(id: string, skipIssuedCheck = false): Promise<string | null> {
  const certData = await queryOne<{
    student_id: string;
    certificate_issued: boolean;
    university: string;
    city: string;
    student_name: string;
    issued_date: Date;
    entity_seal_url: string | null;
    entity_name: string | null;
  }>(
    `SELECT cd.student_id, cd.certificate_issued, cd.university, cd.city, cd.updated_at as issued_date, 
            u.name as student_name, ae.seal_url as entity_seal_url, ae.name as entity_name
     FROM certificate_data cd
     JOIN users u ON u.id = cd.student_id
     LEFT JOIN authorized_entities ae ON ae.id = cd.entity_id
     WHERE cd.student_id = $1`,
    [id]
  )

  if (!certData) {
    return null
  }

  if (!skipIssuedCheck && !certData.certificate_issued) {
    return null
  }

  const formattedDate = new Date(certData.issued_date || new Date()).toLocaleDateString('ar-SA', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  })

  const studentName = certData.student_name
  const university = certData.university || 'غير محدد'
  const city = certData.city || 'غير محدد'
  const verificationCode = id.slice(0, 8).toUpperCase()

  // Seal logic: Use entity seal if available, otherwise default platform seal
  const sealUrl = certData.entity_seal_url || null
  const sealLabel = certData.entity_name || 'ختم المنصة'

  // Generate HTML for certificate - exact replica of the web version styles
  return `
<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>شهادة متقن الفاتحة</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;900&display=swap');
    
    * {
      box-sizing: border-box;
      -webkit-print-color-adjust: exact;
    }

    body {
      font-family: 'Cairo', Arial, sans-serif;
      margin: 0;
      padding: 0;
      background: #f1f5f9;
      direction: rtl;
    }

    .certificate-container {
      position: relative;
      width: 210mm;
      height: 297mm;
      background: white;
      margin: 0 auto;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      align-items: center;
    }

    /* Decorative Borders */
    .outer-border {
      position: absolute;
      top: 32px;
      left: 32px;
      right: 32px;
      bottom: 32px;
      border: 12px double rgba(212, 168, 67, 0.3);
      pointer-events: none;
      z-index: 10;
    }

    .inner-border {
      position: absolute;
      top: 48px;
      left: 48px;
      right: 48px;
      bottom: 48px;
      border: 1px solid rgba(212, 168, 67, 0.2);
      pointer-events: none;
      z-index: 10;
    }

    .content {
      position: relative;
      width: 100%;
      height: 100%;
      padding: 80px 80px 60px; /* Reduced top padding */
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
      z-index: 20;
    }

    .header-section {
      margin-bottom: 32px; /* Reduced from 48 */
    }

    .logo-container {
      width: 90px; /* Slightly smaller logo */
      height: 90px;
      background: #0B3D2E;
      border-radius: 20px;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 15px 20px -5px rgba(0, 0, 0, 0.1);
      transform: rotate(45deg);
      margin: 0 auto 24px;
    }

    .logo-icon {
      width: 44px;
      height: 44px;
      color: #D4A843;
      transform: rotate(-45deg);
    }

    .platform-title {
      font-size: 32px; /* Slightly smaller */
      font-weight: 900;
      color: #0B3D2E;
      margin: 0;
      line-height: 1.2;
    }

    .platform-subtitle {
      font-size: 18px; /* Slightly smaller */
      font-weight: 700;
      color: #D4A843;
      margin: 4px 0 0;
      letter-spacing: 2px;
    }

    .divider {
      width: 100px;
      height: 3px;
      background: rgba(212, 168, 67, 0.2);
      margin: 32px 0; /* Reduced from 64 */
    }

    .main-text-section {
      width: 100%;
    }

    .award-text {
      font-size: 26px; /* Slightly smaller */
      color: #475569;
      font-style: italic;
      margin-bottom: 24px;
    }

    .student-name {
      font-size: 56px; /* Slightly smaller */
      font-weight: 900;
      color: #0B3D2E;
      text-decoration: underline;
      text-decoration-color: rgba(212, 168, 67, 0.4);
      text-underline-offset: 14px;
      margin: 24px 0 32px;
      line-height: 1.1;
      padding: 4px 0;
    }

    .achievement-desc {
      font-size: 22px;
      color: #475569;
      line-height: 1.6;
      max-width: 580px;
      margin: 0 auto;
    }

    .details-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 28px 60px;
      margin-top: 40px; /* Reduced from 80 */
      width: 100%;
      max-width: 540px;
      text-align: right;
    }

    .detail-item {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    .detail-label {
      font-size: 13px;
      font-weight: 700;
      color: #94a3b8;
      text-transform: uppercase;
      letter-spacing: 1px;
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .detail-value {
      font-size: 18px;
      font-weight: 700;
      color: #1e293b;
    }

    .footer-section {
      margin-top: auto;
      width: 100%;
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      padding-bottom: 20px;
    }

    .seal-item {
      text-align: center;
    }

    .seal-box {
      width: 88px;
      height: 88px;
      border: 2px solid #e2e8f0;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 8px;
      background: white;
    }

    .seal-label {
      font-size: 11px;
      font-weight: 700;
      color: #94a3b8;
    }

    .management-section {
      display: flex;
      flex-direction: column;
      align-items: center;
    }

    .management-title {
      font-size: 18px;
      font-weight: 700;
      color: #0B3D2E;
      border-bottom: 2px solid #D4A843;
      padding: 0 14px 4px;
      margin-bottom: 12px;
    }

    .management-dots {
      display: flex;
      gap: 4px;
    }

    .dot {
      width: 7px;
      height: 7px;
      border-radius: 50%;
      background: #D4A843;
    }

    /* Watermark */
    .watermark {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -10%); /* Centered vertically relative to text area */
      width: 550px;
      height: 550px;
      opacity: 0.025;
      color: #0B3D2E;
      z-index: 5;
    }

    @media print {
      body {
        background: white;
      }
      .certificate-container {
        box-shadow: none;
      }
    }
  </style>
</head>
<body>
  <div class="certificate-container">
    <div class="outer-border"></div>
    <div class="inner-border"></div>
    
    <!-- Watermark SVG - Award Badge icon instead of star -->
    <svg class="watermark" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <circle cx="12" cy="8" r="7"></circle>
      <polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"></polyline>
    </svg>

    <div class="content">
      <div class="header-section">
        <div class="logo-container">
          <!-- Award Icon SVG -->
          <svg class="logo-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="8" r="7"></circle>
            <polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"></polyline>
          </svg>
        </div>
        <h1 class="platform-title">منصة متقن الفاتحة</h1>
        <p class="platform-subtitle">مبادرة تصحيح وذكر</p>
      </div>

      <div class="divider"></div>

      <div class="main-text-section">
        <h2 class="award-text">يُمنح هذا التبرير لـ</h2>
        <h3 class="student-name">${studentName}</h3>
        <p class="achievement-desc">
          وذلك تقديراً لإتمامه متقن قراءة سورة الفاتحة على الوجه المطلوب والمجاز من قبل اللجان العلمية بالمنصة.
        </p>
      </div>

      <div class="details-grid">
        <div class="detail-item">
          <span class="detail-label">الجهة التابع لها</span>
          <span class="detail-value">${university}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">المدينة</span>
          <span class="detail-value">${city}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">تاريخ الإصدار</span>
          <span class="detail-value">${formattedDate}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">رمز الموثوقية</span>
          <span class="detail-value" style="font-family: monospace;">${verificationCode}</span>
        </div>
      </div>

      <div class="footer-section">
        <div class="seal-item">
          <div class="seal-box">
             ${sealUrl ? `<img src="${sealUrl}" style="width: 100%; height: 100%; border-radius: 50%; object-fit: cover;" />` : '<div style="font-size: 22px; color: #cbd5e1; display: flex; align-items: center; justify-content: center; height: 100%;">★</div>'}
          </div>
          <p class="seal-label">${sealLabel}</p>
        </div>

        <div class="management-section">
          <p class="management-title">إدارة مبادرة إتقان</p>
          <div class="management-dots">
            <div class="dot"></div>
            <div class="dot"></div>
            <div class="dot"></div>
            <div class="dot"></div>
            <div class="dot"></div>
          </div>
        </div>
      </div>
    </div>
  </div>
</body>
</html>`
}
