/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        drop: {
          50:  '#FFF6F1',
          100: '#FFE6D6',
          200: '#FFC9A8',
          300: '#FFA776',
          400: '#FF8A52',
          500: '#F86F37',
          600: '#DB5A24',
          700: '#B0481D',
          800: '#8A3917',
          900: '#6B2D12',
        },
        sun: {
          100: '#FFF1C7',
          300: '#F8D67A',
          400: '#F2BE3D',
          600: '#B7860C',
        },
        mint: {
          100: '#DDF3E5',
          400: '#5FCB95',
          600: '#1F8F5C',
        },
        ink: {
          900: '#1A1410',
          800: '#221C17',
          700: '#3A322D',
          600: '#534941',
          500: '#6B6058',
          400: '#8A8079',
          300: '#A89E96',
          200: '#D9D2CC',
          100: '#EDE8E3',
        },
        paper: '#FFFBF7',
        cream: '#FFF6F1',
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
