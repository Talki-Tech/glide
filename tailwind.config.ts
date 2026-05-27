import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/renderer/**/*.{html,ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: [
          'Inter',
          '-apple-system',
          'BlinkMacSystemFont',
          'SF Pro Display',
          'Segoe UI',
          'Roboto',
          'Helvetica Neue',
          'sans-serif',
        ],
        mono: ['JetBrains Mono', 'Menlo', 'Monaco', 'Consolas', 'monospace'],
      },
      colors: {
        // Deep neutrals (Vercel-esque)
        ink: {
          950: '#07080A',
          900: '#0A0B0D',
          850: '#0E1013',
          800: '#13161A',
          750: '#181C21',
          700: '#1E2329',
          600: '#2A3038',
          500: '#3A4049',
          400: '#5A6270',
          300: '#828B98',
          200: '#B3BAC4',
          100: '#E4E7EC',
          50: '#F4F6F8',
        },
        // Signature mint-green neon
        mint: {
          50: '#E7FFF6',
          100: '#C8FFEB',
          200: '#9CFFDB',
          300: '#6BFAC4',
          400: '#3CF0AE',
          500: '#1FE39A',
          600: '#10C885',
          700: '#0AA56E',
          800: '#0A8059',
          900: '#0A5C42',
        },
      },
      boxShadow: {
        'mint-glow': '0 0 0 1px rgba(31, 227, 154, 0.35), 0 0 24px -4px rgba(31, 227, 154, 0.55)',
        'mint-glow-soft': '0 0 0 1px rgba(31, 227, 154, 0.18), 0 0 40px -8px rgba(31, 227, 154, 0.25)',
        'panel': '0 24px 80px -20px rgba(0, 0, 0, 0.7), 0 8px 24px -8px rgba(0, 0, 0, 0.5)',
        'inner-hairline': 'inset 0 0 0 1px rgba(255, 255, 255, 0.04)',
      },
      backgroundImage: {
        'mint-gradient':
          'linear-gradient(135deg, rgba(31,227,154,0.18) 0%, rgba(31,227,154,0.04) 60%, rgba(31,227,154,0) 100%)',
        'glass':
          'linear-gradient(180deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.015) 100%)',
      },
      keyframes: {
        breathe: {
          '0%, 100%': {
            boxShadow:
              '0 0 0 1px rgba(31, 227, 154, 0.55), 0 0 24px -4px rgba(31, 227, 154, 0.55)',
          },
          '50%': {
            boxShadow:
              '0 0 0 1px rgba(31, 227, 154, 0.85), 0 0 36px -2px rgba(31, 227, 154, 0.75)',
          },
        },
        statusPulse: {
          '0%, 100%': { opacity: '1', transform: 'scale(1)' },
          '50%': { opacity: '0.6', transform: 'scale(1.15)' },
        },
        statusHalo: {
          '0%': { transform: 'scale(0.8)', opacity: '0.7' },
          '100%': { transform: 'scale(2.4)', opacity: '0' },
        },
      },
      animation: {
        breathe: 'breathe 2.6s ease-in-out infinite',
        'status-pulse': 'statusPulse 1.8s ease-in-out infinite',
        'status-halo': 'statusHalo 1.8s ease-out infinite',
      },
      borderRadius: {
        md: '4px',
        lg: '6px',
        xl: '8px',
        '2xl': '10px',
      },
    },
  },
  plugins: [],
};

export default config;
