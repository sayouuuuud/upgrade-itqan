// Shared definitions for the placeable fields on a certificate template.
// PR2 uses these in:
//   - the visual editor (admin marks the positions)
//   - the render engine (HTML overlay positioned by field_positions)

export interface FieldDef {
  key: string
  label_ar: string
  label_en: string
  sample: string // text used in the editor preview / empty-state
  // sensible per-field defaults applied when admin first places it
  default_size?: number // in % of template short side
  default_weight?: "normal" | "bold"
  default_color?: string
  default_align?: "left" | "center" | "right"
  default_max_width?: number // 0..1 relative to template width
}

export interface FieldAnchor {
  // Normalised (0..1) position of the *anchor point* of the text.
  // Combined with `align`, this means:
  //   align=center → x is the horizontal center
  //   align=left   → x is the left edge of the text box
  //   align=right  → x is the right edge of the text box
  x: number
  y: number

  // Optional overrides for the default styling.
  font_size?: number // % of template short side, e.g. 5 == 5% of min(w,h)
  weight?: "normal" | "bold"
  color?: string
  align?: "left" | "center" | "right"
  max_width?: number // 0..1 relative to template width
  rotate?: number
  letter_spacing?: number
}

export const ALL_FIELDS: FieldDef[] = [
  {
    key: "student_name",
    label_ar: "اسم الطالب",
    label_en: "Student name",
    sample: "محمد علي عبد الرحمن",
    default_size: 6,
    default_weight: "bold",
    default_color: "#0f172a",
    default_align: "center",
    default_max_width: 0.7,
  },
  {
    key: "teacher_name",
    label_ar: "اسم المعلم",
    label_en: "Teacher name",
    sample: "الشيخ خالد ياسين",
    default_size: 4,
    default_weight: "normal",
    default_color: "#334155",
    default_align: "center",
    default_max_width: 0.55,
  },
  {
    key: "source_label",
    label_ar: "اسم الدورة / المسار",
    label_en: "Course / Path",
    sample: "مسار حفظ سورة البقرة",
    default_size: 4.5,
    default_weight: "bold",
    default_color: "#1e293b",
    default_align: "center",
    default_max_width: 0.7,
  },
  {
    key: "reason",
    label_ar: "السبب / المركز",
    label_en: "Reason / Rank",
    sample: "المركز الأول",
    default_size: 4,
    default_weight: "bold",
    default_color: "#0f172a",
    default_align: "center",
    default_max_width: 0.55,
  },
  {
    key: "date",
    label_ar: "التاريخ",
    label_en: "Date",
    sample: "12 من شعبان 1446هـ",
    default_size: 2.6,
    default_weight: "normal",
    default_color: "#334155",
    default_align: "center",
    default_max_width: 0.35,
  },
  {
    key: "certificate_number",
    label_ar: "الرقم التسلسلي",
    label_en: "Serial number",
    sample: "ITQ-ACA-00000001",
    default_size: 2,
    default_weight: "normal",
    default_color: "#475569",
    default_align: "center",
    default_max_width: 0.3,
  },
  {
    key: "platform_name",
    label_ar: "اسم المنصة",
    label_en: "Platform name",
    sample: "أكاديمية إتقان",
    default_size: 3.5,
    default_weight: "bold",
    default_color: "#0f172a",
    default_align: "center",
    default_max_width: 0.5,
  },
  {
    key: "signer_name",
    label_ar: "اسم الموقّع",
    label_en: "Signer name",
    sample: "أ.د. عبد الله المطيري",
    default_size: 3,
    default_weight: "bold",
    default_color: "#0f172a",
    default_align: "center",
    default_max_width: 0.35,
  },
  {
    key: "signer_title",
    label_ar: "المسمى الوظيفي",
    label_en: "Signer title",
    sample: "المدير الأكاديمي",
    default_size: 2.4,
    default_weight: "normal",
    default_color: "#475569",
    default_align: "center",
    default_max_width: 0.35,
  },
  {
    key: "logo",
    label_ar: "الشعار",
    label_en: "Logo",
    sample: "[شعار المنصة]",
    default_size: 12, // for images, this is the desired image width in %
    default_align: "center",
  },
  {
    key: "watermark",
    label_ar: "العلامة المائية",
    label_en: "Watermark",
    sample: "[علامة مائية]",
    default_size: 40, // wider — typically fills a good chunk
    default_align: "center",
  },
  {
    key: "signature",
    label_ar: "التوقيع",
    label_en: "Signature",
    sample: "[توقيع]",
    default_size: 14,
    default_align: "center",
  },
]

export const FIELD_KEYS = ALL_FIELDS.map((f) => f.key)

export function getFieldDef(key: string): FieldDef | undefined {
  return ALL_FIELDS.find((f) => f.key === key)
}

export interface FieldValues {
  student_name?: string
  teacher_name?: string
  source_label?: string
  reason?: string
  date?: string
  certificate_number?: string
  platform_name?: string
  signer_name?: string
  signer_title?: string
  logo?: string // image url
  watermark?: string // image url
  signature?: string // image url
}
