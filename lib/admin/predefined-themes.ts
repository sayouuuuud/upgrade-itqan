import { type ThemeConfig, DEFAULT_THEME } from "./theme";

export type PredefinedThemeId = "default" | "ocean" | "sunset" | "royal" | "nature" | "rose" | "teal" | "gold" | "slate";

export const PREDEFINED_THEMES: Record<
  PredefinedThemeId,
  {
    labelAr: string;
    labelEn: string;
    theme: ThemeConfig;
  }
> = {
  default: {
    labelAr: "مُتْقِن (الافتراضي)",
    labelEn: "motqen (Default)",
    theme: DEFAULT_THEME,
  },
  ocean: {
    labelAr: "المحيط (أزرق)",
    labelEn: "Ocean (Blue)",
    theme: {
      ...DEFAULT_THEME,
      light: {
        colors: {
          ...DEFAULT_THEME.light.colors,
          primary: "#1E40AF", // Blue-800
          primaryForeground: "#FFFFFF",
          secondary: "#EFF6FF", // Blue-50
          secondaryForeground: "#1E40AF",
          accent: "#3B82F6", // Blue-500
          accentForeground: "#FFFFFF",
          background: "#F8FAFC",
          foreground: "#0F172A",
          ring: "#1E40AF",
          sidebarPrimary: "#1E40AF",
          sidebarPrimaryForeground: "#FFFFFF",
          sidebarAccent: "#EFF6FF",
          sidebarAccentForeground: "#1E40AF",
          academyPrimary: "#1E3A8A", // Blue-900
          maintenanceBg: "#0F172A",
          maintenanceGold: "#3B82F6",
        } as any,
      },
      dark: {
        colors: {
          ...DEFAULT_THEME.dark.colors,
          primary: "#60A5FA", // Blue-400
          primaryForeground: "#0F172A",
          secondary: "#1E293B",
          secondaryForeground: "#60A5FA",
          accent: "#3B82F6",
          accentForeground: "#FFFFFF",
          background: "#020617",
          foreground: "#F8FAFC",
          ring: "#60A5FA",
          card: "#0F172A",
          popover: "#0F172A",
          sidebar: "#0F172A",
          sidebarPrimary: "#60A5FA",
          sidebarPrimaryForeground: "#0F172A",
          academyPrimary: "#3B82F6",
          maintenanceBg: "#020617",
          maintenanceGold: "#60A5FA",
        } as any,
      },
    },
  },
  sunset: {
    labelAr: "الغروب (برتقالي)",
    labelEn: "Sunset (Orange)",
    theme: {
      ...DEFAULT_THEME,
      light: {
        colors: {
          ...DEFAULT_THEME.light.colors,
          primary: "#C2410C", // Orange-700
          primaryForeground: "#FFFFFF",
          secondary: "#FFF7ED", // Orange-50
          secondaryForeground: "#C2410C",
          accent: "#EA580C", // Orange-600
          accentForeground: "#FFFFFF",
          background: "#FAFAFA",
          foreground: "#18181B",
          ring: "#C2410C",
          sidebarPrimary: "#C2410C",
          sidebarPrimaryForeground: "#FFFFFF",
          sidebarAccent: "#FFF7ED",
          sidebarAccentForeground: "#C2410C",
          academyPrimary: "#9A3412", // Orange-800
          maintenanceBg: "#27272A",
          maintenanceGold: "#EA580C",
        } as any,
      },
      dark: {
        colors: {
          ...DEFAULT_THEME.dark.colors,
          primary: "#FB923C", // Orange-400
          primaryForeground: "#18181B",
          secondary: "#27272A",
          secondaryForeground: "#FB923C",
          accent: "#F97316", // Orange-500
          accentForeground: "#FFFFFF",
          background: "#09090B",
          foreground: "#FAFAFA",
          ring: "#FB923C",
          card: "#18181B",
          popover: "#18181B",
          sidebar: "#18181B",
          sidebarPrimary: "#FB923C",
          sidebarPrimaryForeground: "#18181B",
          academyPrimary: "#F97316",
          maintenanceBg: "#09090B",
          maintenanceGold: "#FB923C",
        } as any,
      },
    },
  },
  royal: {
    labelAr: "الملكي (أرجواني)",
    labelEn: "Royal (Purple)",
    theme: {
      ...DEFAULT_THEME,
      light: {
        colors: {
          ...DEFAULT_THEME.light.colors,
          primary: "#6D28D9", // Violet-700
          primaryForeground: "#FFFFFF",
          secondary: "#F5F3FF", // Violet-50
          secondaryForeground: "#6D28D9",
          accent: "#D97706", // Gold
          accentForeground: "#FFFFFF",
          background: "#FCFCFD",
          foreground: "#171717",
          ring: "#6D28D9",
          sidebarPrimary: "#6D28D9",
          sidebarPrimaryForeground: "#FFFFFF",
          sidebarAccent: "#F5F3FF",
          sidebarAccentForeground: "#6D28D9",
          academyPrimary: "#5B21B6", // Violet-800
          maintenanceBg: "#171717",
          maintenanceGold: "#D97706",
        } as any,
      },
      dark: {
        colors: {
          ...DEFAULT_THEME.dark.colors,
          primary: "#A78BFA", // Violet-400
          primaryForeground: "#171717",
          secondary: "#262626",
          secondaryForeground: "#A78BFA",
          accent: "#FBBF24", // Gold
          accentForeground: "#171717",
          background: "#0A0A0A",
          foreground: "#F5F5F5",
          ring: "#A78BFA",
          card: "#171717",
          popover: "#171717",
          sidebar: "#171717",
          sidebarPrimary: "#A78BFA",
          sidebarPrimaryForeground: "#171717",
          academyPrimary: "#8B5CF6",
          maintenanceBg: "#0A0A0A",
          maintenanceGold: "#FBBF24",
        } as any,
      },
    },
  },
  nature: {
    labelAr: "الطبيعة (أخضر زاهي)",
    labelEn: "Nature (Lime/Green)",
    theme: {
      ...DEFAULT_THEME,
      light: {
        colors: {
          ...DEFAULT_THEME.light.colors,
          primary: "#4D7C0F", // Lime-700
          primaryForeground: "#FFFFFF",
          secondary: "#F7FEE7", // Lime-50
          secondaryForeground: "#4D7C0F",
          accent: "#65A30D", // Lime-600
          accentForeground: "#FFFFFF",
          background: "#FAFAFA",
          foreground: "#1C1917",
          ring: "#4D7C0F",
          sidebarPrimary: "#4D7C0F",
          sidebarPrimaryForeground: "#FFFFFF",
          sidebarAccent: "#F7FEE7",
          sidebarAccentForeground: "#4D7C0F",
          academyPrimary: "#3F6212", // Lime-800
          maintenanceBg: "#1C1917",
          maintenanceGold: "#84CC16",
        } as any,
      },
      dark: {
        colors: {
          ...DEFAULT_THEME.dark.colors,
          primary: "#A3E635", // Lime-400
          primaryForeground: "#1C1917",
          secondary: "#292524",
          secondaryForeground: "#A3E635",
          accent: "#84CC16", // Lime-500
          accentForeground: "#1C1917",
          background: "#0C0A09",
          foreground: "#FAFAFA",
          ring: "#A3E635",
          card: "#1C1917",
          popover: "#1C1917",
          sidebar: "#1C1917",
          sidebarPrimary: "#A3E635",
          sidebarPrimaryForeground: "#1C1917",
          academyPrimary: "#65A30D",
          maintenanceBg: "#0C0A09",
          maintenanceGold: "#A3E635",
        } as any,
      },
    },
  },
  rose: {
    labelAr: "الوردي (Rose)",
    labelEn: "Rose (Pink)",
    theme: {
      ...DEFAULT_THEME,
      light: {
        colors: {
          ...DEFAULT_THEME.light.colors,
          primary: "#BE185D", // Rose-700
          primaryForeground: "#FFFFFF",
          secondary: "#FFF1F2", // Rose-50
          secondaryForeground: "#BE185D",
          accent: "#E11D48", // Rose-600
          accentForeground: "#FFFFFF",
          background: "#FAFAFA",
          foreground: "#1C1917",
          ring: "#BE185D",
          sidebarPrimary: "#BE185D",
          sidebarPrimaryForeground: "#FFFFFF",
          sidebarAccent: "#FFF1F2",
          sidebarAccentForeground: "#BE185D",
          academyPrimary: "#9F1239", // Rose-800
          maintenanceBg: "#1C1917",
          maintenanceGold: "#FB7185", // Rose-400
        } as any,
      },
      dark: {
        colors: {
          ...DEFAULT_THEME.dark.colors,
          primary: "#FDA4AF", // Rose-300
          primaryForeground: "#1C1917",
          secondary: "#292524",
          secondaryForeground: "#FDA4AF",
          accent: "#FB7185", // Rose-400
          accentForeground: "#1C1917",
          background: "#0C0A09",
          foreground: "#FAFAFA",
          ring: "#FDA4AF",
          card: "#1C1917",
          popover: "#1C1917",
          sidebar: "#1C1917",
          sidebarPrimary: "#FDA4AF",
          sidebarPrimaryForeground: "#1C1917",
          academyPrimary: "#E11D48",
          maintenanceBg: "#0C0A09",
          maintenanceGold: "#FDA4AF",
        } as any,
      },
    },
  },
  teal: {
    labelAr: "الفيروزي (Teal)",
    labelEn: "Teal (Cyan)",
    theme: {
      ...DEFAULT_THEME,
      light: {
        colors: {
          ...DEFAULT_THEME.light.colors,
          primary: "#0F766E", // Teal-700
          primaryForeground: "#FFFFFF",
          secondary: "#F0FDFA", // Teal-50
          secondaryForeground: "#0F766E",
          accent: "#0891B2", // Cyan-600
          accentForeground: "#FFFFFF",
          background: "#FAFAFA",
          foreground: "#134E4A", // Teal-900
          ring: "#0F766E",
          sidebarPrimary: "#0F766E",
          sidebarPrimaryForeground: "#FFFFFF",
          sidebarAccent: "#F0FDFA",
          sidebarAccentForeground: "#0F766E",
          academyPrimary: "#115E59", // Teal-800
          maintenanceBg: "#134E4A",
          maintenanceGold: "#14B8A6", // Teal-500
        } as any,
      },
      dark: {
        colors: {
          ...DEFAULT_THEME.dark.colors,
          primary: "#2DD4BF", // Teal-400
          primaryForeground: "#134E4A",
          secondary: "#115E59",
          secondaryForeground: "#2DD4BF",
          accent: "#22D3EE", // Cyan-400
          accentForeground: "#164E63", // Cyan-900
          background: "#042F2E", // Teal-950
          foreground: "#F0FDFA",
          ring: "#2DD4BF",
          card: "#134E4A",
          popover: "#134E4A",
          sidebar: "#134E4A",
          sidebarPrimary: "#2DD4BF",
          sidebarPrimaryForeground: "#134E4A",
          academyPrimary: "#14B8A6",
          maintenanceBg: "#042F2E",
          maintenanceGold: "#2DD4BF",
        } as any,
      },
    },
  },
  gold: {
    labelAr: "الذهبي الملكي (Gold)",
    labelEn: "Royal Gold (Amber)",
    theme: {
      ...DEFAULT_THEME,
      light: {
        colors: {
          ...DEFAULT_THEME.light.colors,
          primary: "#B45309", // Amber-700
          primaryForeground: "#FFFFFF",
          secondary: "#FFFBEB", // Amber-50
          secondaryForeground: "#B45309",
          accent: "#CA8A04", // Yellow-600
          accentForeground: "#FFFFFF",
          background: "#FAFAFA",
          foreground: "#451A03", // Amber-950
          ring: "#B45309",
          sidebarPrimary: "#B45309",
          sidebarPrimaryForeground: "#FFFFFF",
          sidebarAccent: "#FFFBEB",
          sidebarAccentForeground: "#B45309",
          academyPrimary: "#92400E", // Amber-800
          maintenanceBg: "#451A03",
          maintenanceGold: "#F59E0B", // Amber-500
        } as any,
      },
      dark: {
        colors: {
          ...DEFAULT_THEME.dark.colors,
          primary: "#FBBF24", // Amber-400
          primaryForeground: "#451A03",
          secondary: "#78350F", // Amber-900
          secondaryForeground: "#FBBF24",
          accent: "#FACC15", // Yellow-400
          accentForeground: "#422006", // Yellow-950
          background: "#221102",
          foreground: "#FEF3C7",
          ring: "#FBBF24",
          card: "#451A03",
          popover: "#451A03",
          sidebar: "#451A03",
          sidebarPrimary: "#FBBF24",
          sidebarPrimaryForeground: "#451A03",
          academyPrimary: "#F59E0B",
          maintenanceBg: "#221102",
          maintenanceGold: "#FBBF24",
        } as any,
      },
    },
  },
  slate: {
    labelAr: "الرمادي الأنيق (Slate)",
    labelEn: "Elegant Slate (Monochrome)",
    theme: {
      ...DEFAULT_THEME,
      light: {
        colors: {
          ...DEFAULT_THEME.light.colors,
          primary: "#334155", // Slate-700
          primaryForeground: "#FFFFFF",
          secondary: "#F8FAFC", // Slate-50
          secondaryForeground: "#334155",
          accent: "#475569", // Slate-600
          accentForeground: "#FFFFFF",
          background: "#FAFAFA",
          foreground: "#0F172A", // Slate-900
          ring: "#334155",
          sidebarPrimary: "#334155",
          sidebarPrimaryForeground: "#FFFFFF",
          sidebarAccent: "#F8FAFC",
          sidebarAccentForeground: "#334155",
          academyPrimary: "#1E293B", // Slate-800
          maintenanceBg: "#0F172A",
          maintenanceGold: "#64748B", // Slate-500
        } as any,
      },
      dark: {
        colors: {
          ...DEFAULT_THEME.dark.colors,
          primary: "#94A3B8", // Slate-400
          primaryForeground: "#0F172A",
          secondary: "#1E293B", // Slate-800
          secondaryForeground: "#94A3B8",
          accent: "#CBD5E1", // Slate-300
          accentForeground: "#0F172A",
          background: "#020617", // Slate-950
          foreground: "#F8FAFC",
          ring: "#94A3B8",
          card: "#0F172A",
          popover: "#0F172A",
          sidebar: "#0F172A",
          sidebarPrimary: "#94A3B8",
          sidebarPrimaryForeground: "#0F172A",
          academyPrimary: "#64748B",
          maintenanceBg: "#020617",
          maintenanceGold: "#94A3B8",
        } as any,
      },
    },
  },
};
