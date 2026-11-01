const color = (name) => `rgb(var(--color-${name}) / <alpha-value>)`;

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  darkMode: "media",
  theme: {
    extend: {
      colors: {
        surface: { DEFAULT: color("surface"), dark: color("surface") },
        "surface-muted": {
          DEFAULT: color("surfaceMuted"),
          dark: color("surfaceMuted"),
        },
        "surface-card": {
          DEFAULT: color("surfaceCard"),
          dark: color("surfaceCard"),
        },
        "surface-brand": {
          DEFAULT: color("surfaceBrand"),
          dark: color("surfaceBrand"),
        },
        "surface-brand-soft": {
          DEFAULT: color("surfaceBrandSoft"),
          dark: color("surfaceBrandSoft"),
        },
        border: { DEFAULT: color("border"), dark: color("border") },
        ink: {
          DEFAULT: color("ink"),
          muted: color("inkMuted"),
          dark: color("ink"),
          "dark-muted": color("inkMuted"),
        },
        "icon-muted": { DEFAULT: color("iconMuted"), dark: color("iconMuted") },
        brand: {
          DEFAULT: color("brand"),
          strong: color("brandStrong"),
          light: color("brand"),
          "strong-dark": color("brandStrong"),
        },
        "on-brand": { DEFAULT: color("onBrand"), dark: color("onBrand") },
        risk: {
          DEFAULT: color("risk"),
          light: color("risk"),
          surface: color("surfaceRisk"),
          "surface-dark": color("surfaceRisk"),
          border: color("borderRisk"),
          "border-dark": color("borderRisk"),
        },
        "on-risk": { DEFAULT: color("onRisk"), dark: color("onRisk") },
        safe: { DEFAULT: color("safe"), light: color("safe") },
        "surface-safe": {
          DEFAULT: color("surfaceSafe"),
          dark: color("surfaceSafe"),
        },
      },
      fontSize: {
        display: ["32px", { lineHeight: "40px" }],
        title: ["24px", { lineHeight: "32px" }],
        subtitle: ["18px", { lineHeight: "26px" }],
        body: ["16px", { lineHeight: "24px" }],
        label: ["14px", { lineHeight: "20px" }],
        caption: ["12px", { lineHeight: "16px" }],
      },
      borderRadius: { card: "16px", sheet: "24px", pill: "999px" },
      maxWidth: { content: "800px" },
    },
  },
  plugins: [],
};
