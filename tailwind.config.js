/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  darkMode: 'media',
  theme: {
    extend: {
      colors: {
        surface: { DEFAULT: '#FFFFFF', dark: '#0B1220' },
        'surface-muted': { DEFAULT: '#F6F8FA', dark: '#131C2A' },
        'surface-card': { DEFAULT: '#FFFFFF', dark: '#131C2A' },
        'surface-brand': { DEFAULT: '#D6E9F4', dark: '#1E3A52' },
        'surface-brand-soft': { DEFAULT: '#EAF4F9', dark: '#17293D' },
        border: { DEFAULT: '#E3E9EE', dark: '#243244' },
        ink: {
          DEFAULT: '#0B1B2B',
          muted: '#60646C',
          dark: '#F5F7FA',
          'dark-muted': '#A9B4C2',
        },
        'icon-muted': { DEFAULT: '#AEB7C2', dark: '#6B7A8C' },
        brand: { DEFAULT: '#1F4B75', strong: '#173A5C', light: '#7FB3D9' },
        'on-brand': '#FFFFFF',
        risk: {
          DEFAULT: '#A33A3A',
          light: '#F08A8A',
          surface: '#F4D6D6',
          'surface-dark': '#3A1E22',
          border: '#E7B4B4',
          'border-dark': '#5A2C31',
        },
        'on-risk': '#FFFFFF',
        safe: { DEFAULT: '#1F7A5C', light: '#6FD3AE' },
        'surface-safe': { DEFAULT: '#D9EFE7', dark: '#16332A' },
      },
      fontSize: {
        display: ['32px', { lineHeight: '40px' }],
        title: ['24px', { lineHeight: '32px' }],
        subtitle: ['18px', { lineHeight: '26px' }],
        body: ['16px', { lineHeight: '24px' }],
        label: ['14px', { lineHeight: '20px' }],
        caption: ['12px', { lineHeight: '16px' }],
      },
      borderRadius: {
        card: '16px',
        sheet: '24px',
        pill: '999px',
      },
      maxWidth: {
        content: '800px',
      },
    },
  },
  plugins: [],
};
