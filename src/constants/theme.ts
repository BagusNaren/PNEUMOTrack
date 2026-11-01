import { Platform } from "react-native";
import palette from "./palette.json";

export const Colors = {
  light: {
    ...palette.light,
    text: palette.light.ink,
    background: palette.light.surface,
    backgroundElement: palette.light.surfaceMuted,
    backgroundSelected: palette.light.surfaceBrand,
    textSecondary: palette.light.inkMuted,
  },
  dark: {
    ...palette.dark,
    text: palette.dark.ink,
    background: palette.dark.surface,
    backgroundElement: palette.dark.surfaceMuted,
    backgroundSelected: palette.dark.surfaceBrand,
    textSecondary: palette.dark.inkMuted,
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
