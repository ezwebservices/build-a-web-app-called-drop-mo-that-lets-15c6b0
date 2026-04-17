/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        drop: {
          50: '#fff5f2',
          100: '#ffe4db',
          200: '#ffc4b0',
          300: '#ff9975',
          400: '#ff6a3d',
          500: '#ff4714',
          600: '#ed2f09',
          700: '#c42208',
          800: '#9c1f0d',
          900: '#7f1e0f',
        },
        ink: {
          900: '#0b0c10',
          800: '#13151c',
          700: '#1c1f29',
          600: '#2a2e3b',
          500: '#3d4251',
          400: '#6b7186',
          300: '#9096a8',
          200: '#c7cbd6',
          100: '#e9ebf1',
        },
      },
      fontFamily: {
        display: ['"Instrument Serif"', 'ui-serif', 'Georgia', 'serif'],
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
    },
  },
  plugins: [],
};
