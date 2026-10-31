import { Platform } from "react-native";

export const Colors = {
  light: {
    surface: "#FFFFFF",
    surfaceMuted: "#F6F8FA",
    surfaceCard: "#FFFFFF",
    surfaceBrand: "#D6E9F4",
    surfaceBrandSoft: "#EAF4F9",
    border: "#E3E9EE",
    ink: "#0B1B2B",
    inkMuted: "#60646C",
    iconMuted: "#AEB7C2",
    brand: "#1F4B75",
    brandStrong: "#173A5C",
    onBrand: "#FFFFFF",
    risk: "#A33A3A",
    onRisk: "#FFFFFF",
    surfaceRisk: "#F4D6D6",
    borderRisk: "#E7B4B4",
    safe: "#1F7A5C",
    surfaceSafe: "#D9EFE7",
    text: "#0B1B2B",
    background: "#ffffff",
    backgroundElement: "#F6F8FA",
    backgroundSelected: "#D6E9F4",
    textSecondary: "#60646C",
  },
  dark: {
    surface: "#0B1220",
    surfaceMuted: "#131C2A",
    surfaceCard: "#131C2A",
    surfaceBrand: "#1E3A52",
    surfaceBrandSoft: "#17293D",
    border: "#243244",
    ink: "#F5F7FA",
    inkMuted: "#A9B4C2",
    iconMuted: "#6B7A8C",
    brand: "#7FB3D9",
    brandStrong: "#A9CBE8",
    onBrand: "#0B1220",
    risk: "#F08A8A",
    onRisk: "#2A0F12",
    surfaceRisk: "#3A1E22",
    borderRisk: "#5A2C31",
    safe: "#6FD3AE",
    surfaceSafe: "#16332A",
    text: "#F5F7FA",
    background: "#0B1220",
    backgroundElement: "#131C2A",
    backgroundSelected: "#1E3A52",
    textSecondary: "#A9B4C2",
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: "system-ui",
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: "ui-serif",
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: "ui-rounded",
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: "ui-monospace",
  },
  default: {
    sans: "normal",
    serif: "serif",
    rounded: "normal",
    mono: "monospace",
  },
  web: {
    sans: "var(--font-display)",
    serif: "var(--font-serif)",
    rounded: "var(--font-rounded)",
    mono: "var(--font-mono)",
  },
});

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;

export const UI = {
  gutter: 20,
  gap: 12,
  sectionGap: 24,
  cardRadius: 16,
  sheetRadius: 24,
  iconSize: 24,
  logoSize: 176,
  tabHeight: 64,
  label: { fontSize: 14, lineHeight: 20, fontWeight: "600" },
} as const;
