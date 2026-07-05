'use client'

import { useEffect, useRef } from 'react'

export function MisbahaLoader() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const DPR = window.devicePixelRatio || 1
    const W = 160
    const H = 260
    canvas.width = W * DPR
    canvas.height = H * DPR
    canvas.style.width  = `${W}px`
    canvas.style.height = `${H}px`
    ctx.scale(DPR, DPR)

    // ── إعدادات المسبحة ──────────────────────────────────────
    const BEAD_COUNT = 10
    const BEAD_R     = 8
    // خرز أرفع مع مسافة بسيطة: المسافة بين مركزين = 2*BEAD_R + 4px فراغ
    const RING_R     = Math.round(BEAD_R / Math.sin(Math.PI / BEAD_COUNT)) + 4
    const CX         = W / 2
    const CY         = W / 2
    const CYCLE_MS   = 3200   // ثانية وثلاثة أعشار لكل دورة كاملة

    // ── ألوان الخشب المطفي (بدون لمعة) ──────────────────────
    // الخشب الطبيعي: بني دافئ مع تدرج هادئ بدون highlight ساطع
    const WOOD_TOP   = '#A0622A'   // بني متوسط فاتح (وجه الخرزة)
    const WOOD_MID   = '#7A4520'   // بني متوسط
    const WOOD_DARK  = '#4E2A0C'   // بني غامق (عمق)
    const WOOD_EDGE  = '#331A05'   // حافة داكنة جداً

    // ── ألوان الخيط ───────────────────────────────────────────
    const THREAD     = '#3D6B4A'   // أخضر زيتي داكن

    // ── ألوان النحاس (تيبيليك) ────────────────────────────────
    const BRASS_HI   = '#C9A03E'
    const BRASS_MID  = '#8F6920'
    const BRASS_DARK = '#5C420D'

    let startTime: number | null = null
    let rafId = 0

    // ── رسم خرزة خشبية مطفية (بدون لمعة ساطعة) ──────────────
    function drawBead(
      x: number, y: number, r: number,
      isActive: boolean, activeFrac: number
    ) {
      // ظل خفيف أسفل الخرزة النشطة فقط — بدلاً من توهج ساطع
      if (isActive && activeFrac > 0) {
        ctx.save()
        ctx.globalAlpha = 0.18 * activeFrac
        ctx.fillStyle = '#2A1000'
        ctx.beginPath()
        ctx.ellipse(x, y + r + 2, r * 0.7, r * 0.25, 0, 0, Math.PI * 2)
        ctx.fill()
        ctx.restore()
      }

      // جسم الخرزة — gradient يحاكي سطح الخشب المطفي
      // مركز الضوء منزاح للأعلى-اليسار بشكل هادئ (ليس ساطعاً)
      const grad = ctx.createRadialGradient(
        x - r * 0.25, y - r * 0.28, r * 0.08,
        x,            y,             r
      )

      if (isActive) {
        // الخرزة النشطة: أفتح قليلاً لكن ليست لامعة
        grad.addColorStop(0.00, '#B8742E')
        grad.addColorStop(0.30, WOOD_TOP)
        grad.addColorStop(0.60, WOOD_MID)
        grad.addColorStop(0.85, WOOD_DARK)
        grad.addColorStop(1.00, WOOD_EDGE)
      } else {
        // الخرزة العادية: أغمق وأكثر طبيعية
        grad.addColorStop(0.00, '#8C5222')
        grad.addColorStop(0.40, WOOD_MID)
        grad.addColorStop(0.80, WOOD_DARK)
        grad.addColorStop(1.00, WOOD_EDGE)
      }

      ctx.fillStyle = grad
      ctx.beginPath()
      ctx.arc(x, y, r, 0, Math.PI * 2)
      ctx.fill()

      // حافة داكنة خفيفة
      ctx.strokeStyle = `rgba(40,15,0,0.5)`
      ctx.lineWidth = 0.7
      ctx.stroke()

      // لمسة ضوء صغيرة جداً مطفية (ليست لامعة)
      // تحاكي مسام الخشب لا المعدن
      const sheen = ctx.createRadialGradient(
        x - r * 0.28, y - r * 0.30, 0,
        x - r * 0.28, y - r * 0.30, r * 0.36
      )
      sheen.addColorStop(0,   `rgba(210,160,100,${isActive ? 0.22 : 0.13})`)
      sheen.addColorStop(1,   'rgba(210,160,100,0)')
      ctx.fillStyle = sheen
      ctx.beginPath()
      ctx.arc(x, y, r, 0, Math.PI * 2)
      ctx.fill()
    }

    // ── رسم التيبيليك (قطعة النحاس) ──────────────────────────
    function drawBrassConnector(cx: number, topY: number) {
      const capW = 8
      const capH = 16
      const r    = 2.5

      const brassGrad = ctx.createLinearGradient(cx - capW, topY, cx + capW, topY)
      brassGrad.addColorStop(0,    BRASS_DARK)
      brassGrad.addColorStop(0.2,  BRASS_MID)
      brassGrad.addColorStop(0.5,  BRASS_HI)
      brassGrad.addColorStop(0.8,  BRASS_MID)
      brassGrad.addColorStop(1,    BRASS_DARK)

      const x = cx - capW
      const y = topY
      ctx.fillStyle = brassGrad
      ctx.beginPath()
      ctx.moveTo(x + r, y)
      ctx.lineTo(x + capW * 2 - r, y)
      ctx.quadraticCurveTo(x + capW * 2, y, x + capW * 2, y + r)
      ctx.lineTo(x + capW * 2, y + capH - r)
      ctx.quadraticCurveTo(x + capW * 2, y + capH, x + capW * 2 - r, y + capH)
      ctx.lineTo(x + r, y + capH)
      ctx.quadraticCurveTo(x, y + capH, x, y + capH - r)
      ctx.lineTo(x, y + r)
      ctx.quadraticCurveTo(x, y, x + r, y)
      ctx.closePath()
      ctx.fill()

      ctx.strokeStyle = BRASS_DARK
      ctx.lineWidth = 0.8
      ctx.stroke()

      // خطوط زينة أفقية
      ctx.strokeStyle = `rgba(200,160,60,0.55)`
      ctx.lineWidth = 1
      ;[0.35, 0.62].forEach(frac => {
        ctx.beginPath()
        ctx.moveTo(cx - capW + 2, topY + capH * frac)
        ctx.lineTo(cx + capW - 2, topY + capH * frac)
        ctx.stroke()
      })
    }

    // ── رسم الشراشيب — أقصر ومتقاربة مع ميل بسيط ────────────
    const TILT = 5   // ميل الشراشيب لليمين

    function drawTassel(cx: number, startY: number, elapsed: number) {
      const strands   = 10
      const tasselLen = 36    // أقصر من قبل
      const spread    = 6     // أضيق من قبل (متقاربة)

      for (let i = 0; i < strands; i++) {
        const t    = (i / (strands - 1)) - 0.5   // -0.5 → 0.5
        // ميل عام لليمين مع انتشار ضيق
        const endX = cx + t * spread * 2 + TILT
        // الشراشيب الجانبية أطول قليلاً بشكل طبيعي
        const endY = startY + tasselLen + Math.abs(t) * 4

        // تذبذب ناعم جداً
        const wobble = Math.sin(elapsed * 0.9 + i * 0.8) * 0.9

        const alpha = Math.abs(t) > 0.45 ? 0.4 : 0.82

        ctx.strokeStyle = `rgba(61,107,74,${alpha})`
        ctx.lineWidth   = 1.2
        ctx.lineCap     = 'round'
        ctx.beginPath()
        ctx.moveTo(cx + TILT * 0.15 + wobble * 0.15, startY)
        ctx.quadraticCurveTo(
          endX + wobble * 0.5,
          startY + tasselLen * 0.5,
          endX + wobble,
          endY
        )
        ctx.stroke()
      }
    }

    // ── رسم الخيط الثابت ──────────────────────────────────────
    // الخيط ثابت لا يدور — يُرسم كدائرة في موضع ثابت
    function drawThread() {
      ctx.save()
      ctx.globalAlpha = 0.55
      ctx.strokeStyle = THREAD
      ctx.lineWidth   = 1.6
      ctx.lineCap     = 'round'
      ctx.beginPath()
      ctx.arc(CX, CY, RING_R, 0, Math.PI * 2)
      ctx.stroke()
      ctx.restore()
    }

    // ── رسم خرز الذيل الثابتة ─────────────────────────────────
    function drawTailBeads(elapsed: number) {
      // نقطة الخروج: أسفل الدائرة (الساعة 6)
      const tailX = CX
      const tailY = CY + RING_R

      // خيط من حافة الدائرة للخرزة الأولى
      ctx.strokeStyle = THREAD
      ctx.lineWidth   = 1.5
      ctx.lineCap     = 'round'
      ctx.beginPath()
      ctx.moveTo(tailX, tailY)
      ctx.lineTo(tailX, tailY + 7)
      ctx.stroke()

      // الخرزة الأولى (imam) — حجم 8
      const b1Y = tailY + 7 + 8
      drawBead(tailX, b1Y, 8, false, 0)

      // خيط قصير
      ctx.strokeStyle = THREAD
      ctx.lineWidth   = 1.5
      ctx.beginPath()
      ctx.moveTo(tailX, b1Y + 8)
      ctx.lineTo(tailX, b1Y + 8 + 5)
      ctx.stroke()

      // الخرزة الثانية — حجم 6
      const b2Y = b1Y + 8 + 5 + 6
      drawBead(tailX, b2Y, 6, false, 0)

      // خيط للتيبيليك
      ctx.strokeStyle = THREAD
      ctx.lineWidth   = 1.5
      ctx.beginPath()
      ctx.moveTo(tailX, b2Y + 6)
      ctx.lineTo(tailX, b2Y + 6 + 5)
      ctx.stroke()

      // التيبيليك (النحاس)
      drawBrassConnector(tailX, b2Y + 7 + 5)

      // الشراشيب
      drawTassel(tailX, b2Y + 7 + 5 + 16, elapsed)
    }

    // ── حلقة الرسم الرئيسية ───────────────────────────────────
    const animate = (ts: number) => {
      if (startTime === null) startTime = ts
      const elapsed = ts - startTime

      ctx.clearRect(0, 0, W, H)

      // تقدم الدورة (0 → 1)
      const progress  = (elapsed % CYCLE_MS) / CYCLE_MS
      const floatIdx  = progress * BEAD_COUNT
      const activeIdx = Math.floor(floatIdx) % BEAD_COUNT
      const frac      = floatIdx - Math.floor(floatIdx)  // 0 → 1

      // ── الخيط الثابت (لا يدور)
      drawThread()

      // ── الخرزات في مواضعها الثابتة — فقط الحجم يتغير
      for (let i = 0; i < BEAD_COUNT; i++) {
        // مواضع ثابتة (لا يُضاف progress للزاوية)
        const angle = (i / BEAD_COUNT) * Math.PI * 2 - Math.PI / 2
        const bx    = CX + Math.cos(angle) * RING_R
        const by    = CY + Math.sin(angle) * RING_R

        const isActive = i === activeIdx
        let r = BEAD_R

        if (isActive) {
          // الخرزة تكبر بسلاسة ثم تصغر خلال cycle الخرزة الواحدة
          const scale = 0.28 * Math.sin(frac * Math.PI)  // 0 → peak → 0
          r = BEAD_R * (1 + scale)
        }

        drawBead(bx, by, r, isActive, isActive ? Math.sin(frac * Math.PI) : 0)
      }

      // ── ذيل المسبحة الثابت
      drawTailBeads(elapsed / 1000)

      rafId = requestAnimationFrame(animate)
    }

    rafId = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(rafId)
  }, [])

  return (
    <canvas
      ref={canvasRef}
      width={160}
      height={260}
      style={{ display: 'block', margin: '0 auto', width: '160px', height: '260px' }}
      aria-label="مسبحة صلاة متحركة"
    />
  )
}
