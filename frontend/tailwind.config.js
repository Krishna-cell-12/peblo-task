/** @type {import('tailwindcss').Config} */
export default {
  // Enable dark mode via a class on the root element
  darkMode: 'class',
  content: [
    './index.html',
    './src/**/*.{js,jsx,ts,tsx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      colors: {
        // Primary brand palette — deep violet/indigo
        brand: {
          50:  '#f0f0ff',
          100: '#e2e2ff',
          200: '#c4c4ff',
          300: '#a3a3ff',
          400: '#8484ff',
          500: '#6c63ff',  // Primary
          600: '#5a52e0',
          700: '#4840c0',
          800: '#382fa0',
          900: '#282080',
        },
        // Dark mode surfaces
        dark: {
          900: '#0d0d14',
          800: '#13131f',
          700: '#1a1a2e',
          600: '#222238',
          500: '#2d2d4a',
          400: '#3a3a5c',
          300: '#4f4f75',
        },
      },
      animation: {
        'fade-in':    'fadeIn 0.2s ease-out',
        'slide-up':   'slideUp 0.3s ease-out',
        'slide-in':   'slideIn 0.25s ease-out',
        'pulse-soft': 'pulseSoft 2s ease-in-out infinite',
        'spin-slow':  'spin 3s linear infinite',
      },
      keyframes: {
        fadeIn:    { from: { opacity: 0 },                    to: { opacity: 1 } },
        slideUp:   { from: { opacity: 0, transform: 'translateY(12px)' }, to: { opacity: 1, transform: 'translateY(0)' } },
        slideIn:   { from: { opacity: 0, transform: 'translateX(-12px)' }, to: { opacity: 1, transform: 'translateX(0)' } },
        pulseSoft: { '0%,100%': { opacity: 1 }, '50%': { opacity: 0.6 } },
      },
      backdropBlur: { xs: '2px' },
      boxShadow: {
        'glow':      '0 0 20px rgba(108, 99, 255, 0.35)',
        'glow-sm':   '0 0 10px rgba(108, 99, 255, 0.2)',
        'card':      '0 4px 24px rgba(0,0,0,0.12)',
        'card-dark': '0 4px 24px rgba(0,0,0,0.5)',
      },
    },
  },
  plugins: [],
};
