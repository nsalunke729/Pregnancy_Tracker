import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './lib/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        rose: {
          50: '#fff1f2',
          100: '#ffe4e6',
          200: '#fecdd3',
          300: '#fda4af',
          400: '#fb7185',
          500: '#f43f5e',
          600: '#e11d48',
          700: '#be123c',
          800: '#9f1239',
          900: '#881337',
        },
      },
      fontFamily: {
        sans: ['system-ui', '-apple-system', 'sans-serif'],
      },
    },
  },
  safelist: [
    // EmojiMoodPicker selected states — returned from a switch-case, scanner may miss them
    'bg-red-500',    'border-red-500',
    'bg-orange-400', 'border-orange-400',
    'bg-amber-400',  'border-amber-400',
    'bg-lime-500',   'border-lime-500',
    'bg-green-500',  'border-green-500',
  ],
  plugins: [],
}

export default config
