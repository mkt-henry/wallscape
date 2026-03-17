import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: 'class',
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        background: '#08080C',
        surface: '#13131A',
        'surface-2': '#1C1C26',
        'surface-3': '#262632',
        primary: {
          DEFAULT: '#D946EF',
          hover: '#E36CF3',
          active: '#C026D3',
        },
        secondary: {
          DEFAULT: '#22D3EE',
          hover: '#4ADDF2',
          active: '#06B6D4',
        },
        accent: {
          DEFAULT: '#CCFF00',
          hover: '#D9FF33',
          active: '#B8E600',
        },
        text: {
          primary: '#FFFFFF',
          secondary: '#9CA3AF',
          muted: '#6B7280',
        },
        border: {
          DEFAULT: '#262632',
          light: '#363645',
        },
        error: '#FF4466',
        success: '#34D399',
        warning: '#FBBF24',
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
      },
      spacing: {
        'safe-top': 'env(safe-area-inset-top)',
        'safe-bottom': 'env(safe-area-inset-bottom)',
        'safe-left': 'env(safe-area-inset-left)',
        'safe-right': 'env(safe-area-inset-right)',
        'bottom-nav': '64px',
      },
      height: {
        'screen-safe': 'calc(100dvh - env(safe-area-inset-top) - env(safe-area-inset-bottom))',
      },
      animation: {
        'slide-up': 'slideUp 0.3s ease-out',
        'slide-down': 'slideDown 0.3s ease-out',
        'fade-in': 'fadeIn 0.2s ease-out',
        'scale-in': 'scaleIn 0.2s ease-out',
        'pulse-soft': 'pulseSoft 2s ease-in-out infinite',
        'spin-slow': 'spin 3s linear infinite',
      },
      keyframes: {
        slideUp: {
          '0%': { transform: 'translateY(100%)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideDown: {
          '0%': { transform: 'translateY(-100%)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        scaleIn: {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        pulseSoft: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.6' },
        },
      },
      backdropBlur: {
        xs: '2px',
      },
      borderRadius: {
        '4xl': '2rem',
      },
      boxShadow: {
        'glow-primary': '0 0 24px rgba(217, 70, 239, 0.35)',
        'glow-secondary': '0 0 24px rgba(34, 211, 238, 0.3)',
        'glow-accent': '0 0 24px rgba(204, 255, 0, 0.25)',
        'glow-brand': '0 0 40px rgba(217, 70, 239, 0.2), 0 0 80px rgba(34, 211, 238, 0.1)',
        'card': '0 4px 24px rgba(0, 0, 0, 0.5)',
        'bottom-nav': '0 -1px 0 rgba(255, 255, 255, 0.05)',
      },
    },
  },
  plugins: [],
}

export default config
