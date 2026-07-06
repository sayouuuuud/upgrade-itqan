import Image from "next/image"
import { getSetting } from "@/lib/settings"

export const dynamic = "force-dynamic"

export default async function MaintenancePage() {
  const message = await getSetting<string>(
    "maqraah_maintenance_message",
    "المنصة تحت الصيانة حالياً، نعود قريباً بإذن الله."
  )

  return (
    <div
      dir="rtl"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        overflow: "auto",
        backgroundColor: "#0B3D2E",
        fontFamily: "'Amiri', 'Scheherazade New', 'Noto Naskh Arabic', serif",
      }}
    >
        {/* Geometric SVG background pattern */}
        <div
          aria-hidden="true"
          style={{
            position: "fixed",
            inset: 0,
            opacity: 0.07,
            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='80' height='80' viewBox='0 0 80 80'%3E%3Cg fill='%23D4A843'%3E%3Cpolygon points='40,0 47,28 74,28 52,46 60,74 40,58 20,74 28,46 6,28 33,28'/%3E%3C/g%3E%3C/svg%3E")`,
            backgroundSize: "80px 80px",
          }}
        />

        {/* Top gold border line */}
        <div
          aria-hidden="true"
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            height: "4px",
            background: "linear-gradient(90deg, transparent, #D4A843, #F5D78E, #D4A843, transparent)",
          }}
        />

        <main
          style={{
            position: "relative",
            zIndex: 10,
            minHeight: "100vh",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: "2rem 1.5rem",
            gap: "2.5rem",
          }}
        >
          {/* Logo / Platform name */}
          <div style={{ textAlign: "center" }}>
            <p
              style={{
                fontSize: "0.875rem",
                letterSpacing: "0.2em",
                color: "#D4A843",
                marginBottom: "0.5rem",
                opacity: 0.8,
              }}
            >
              منصة
            </p>
            <h1
              style={{
                fontSize: "clamp(2rem, 6vw, 3.5rem)",
                fontWeight: 700,
                color: "#F5F0E8",
                margin: 0,
                lineHeight: 1.2,
              }}
            >
              إتقان
            </h1>
            {/* Gold divider */}
            <div
              style={{
                margin: "1rem auto 0",
                width: "80px",
                height: "2px",
                background: "linear-gradient(90deg, transparent, #D4A843, transparent)",
              }}
            />
          </div>

          {/* Illustration */}
          <div
            style={{
              width: "100%",
              maxWidth: "480px",
              borderRadius: "1.5rem",
              overflow: "hidden",
              border: "1px solid rgba(212,168,67,0.25)",
              boxShadow: "0 20px 60px rgba(0,0,0,0.4)",
            }}
          >
            <Image
              src="/images/maintenance.png"
              alt="صورة صيانة إسلامية"
              width={960}
              height={540}
              style={{ width: "100%", height: "auto", display: "block" }}
              priority
            />
          </div>

          {/* Text content */}
          <div
            style={{
              textAlign: "center",
              maxWidth: "560px",
            }}
          >
            {/* Ornamental top */}
            <p
              aria-hidden="true"
              style={{
                fontSize: "1.5rem",
                color: "#D4A843",
                margin: "0 0 1rem",
                opacity: 0.6,
              }}
            >
              ✦ ✦ ✦
            </p>

            <h2
              style={{
                fontSize: "clamp(1.4rem, 4vw, 2rem)",
                fontWeight: 700,
                color: "#F5F0E8",
                margin: "0 0 1.25rem",
                lineHeight: 1.4,
              }}
            >
              المنصة تحت الصيانة
            </h2>

            <p
              style={{
                fontSize: "clamp(1rem, 2.5vw, 1.2rem)",
                color: "rgba(245,240,232,0.75)",
                lineHeight: 1.8,
                margin: 0,
              }}
            >
              {message}
            </p>

            {/* Ornamental bottom */}
            <p
              aria-hidden="true"
              style={{
                fontSize: "1.5rem",
                color: "#D4A843",
                margin: "1.25rem 0 0",
                opacity: 0.6,
              }}
            >
              ✦ ✦ ✦
            </p>
          </div>

          {/* Bottom caption */}
          <p
            style={{
              fontSize: "0.8rem",
              color: "rgba(245,240,232,0.4)",
              margin: 0,
              textAlign: "center",
            }}
          >
            جزاكم الله خيراً على صبركم
          </p>

          {/* Admin login link — lets an administrator sign in to disable maintenance */}
          <a
            href="/login"
            style={{
              fontSize: "0.75rem",
              color: "rgba(212,168,67,0.55)",
              textDecoration: "none",
              borderBottom: "1px dotted rgba(212,168,67,0.4)",
              paddingBottom: "1px",
            }}
          >
            دخول المشرفين
          </a>
        </main>

        {/* Bottom gold border line */}
        <div
          aria-hidden="true"
          style={{
            position: "fixed",
            bottom: 0,
            left: 0,
            right: 0,
            height: "4px",
            background: "linear-gradient(90deg, transparent, #D4A843, #F5D78E, #D4A843, transparent)",
          }}
        />
    </div>
  )
}
