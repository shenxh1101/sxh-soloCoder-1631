/** @type {import('tailwindcss').Config} */

export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    container: {
      center: true,
      padding: '1rem',
      screens: {
        'sm': '640px',
        'md': '768px',
        'lg': '1024px',
        'xl': '1280px',
        '2xl': '1400px',
      },
    },
    extend: {
      colors: {
        primary: {
          50: '#E8F3FF',
          100: '#BEDAFF',
          200: '#94C2FF',
          300: '#5E9FFF',
          400: '#4080FF',
          500: '#165DFF',
          600: '#0E42D2',
          700: '#0A33A5',
        },
        accent: {
          50: '#FFF7E8',
          100: '#FFE7C2',
          200: '#FFD79B',
          300: '#FFC774',
          400: '#FFB74D',
          500: '#FF7D00',
          600: '#E07000',
        },
        success: '#00B42A',
        danger: '#F53F3F',
        purple: '#722ED1',
        cyan: '#0FC6C2',
        gray: {
          50: '#F7F8FA',
          100: '#E5E6EB',
          200: '#C9CDD4',
          300: '#86909C',
          400: '#4E5969',
          500: '#272E3B',
          600: '#1D2129',
        },
      },
      fontFamily: {
        sans: ['Noto Sans SC', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-out forwards',
        'pulse-soft': 'pulseSoft 2s ease-in-out infinite',
      },
    },
    keyframes: {
      fadeIn: {
        '0%': { opacity: '0', transform: 'translateY(10px)' },
        '100%': { opacity: '1', transform: 'translateY(0)' },
      },
      pulseSoft: {
        '0%, 100%': { opacity: '1' },
        '50%': { opacity: '0.7' },
      },
    },
  },
  plugins: [],
};
