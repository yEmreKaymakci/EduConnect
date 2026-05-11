/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        primary:   { DEFAULT: '#6366f1', dark: '#4f46e5', light: '#818cf8' },
        secondary: { DEFAULT: '#0ea5e9', dark: '#0284c7' },
        accent:    { DEFAULT: '#8b5cf6', dark: '#7c3aed' },
        surface:   { DEFAULT: '#1e1e2e', card: '#2a2a3e', border: '#3a3a52' },
        text:      { primary: '#e2e8f0', secondary: '#94a3b8', muted: '#64748b' },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      backgroundImage: {
        'gradient-primary': 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
        'gradient-dark':    'linear-gradient(180deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
      },
    },
  },
  plugins: [],
};
