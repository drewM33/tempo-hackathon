import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './lib/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        surface: '#0a0a0f',
        'surface-2': '#12121a',
        'surface-3': '#1a1a25',
        border: '#2a2a3a',
        'tier-green': '#22c55e',
        'tier-yellow': '#eab308',
        'tier-orange': '#f97316',
        'tier-red': '#ef4444',
        'tier-gray': '#6b7280',
      },
      fontFamily: {
        sans: ['Calibri', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['SF Mono', 'Menlo', 'Consolas', 'monospace'],
      },
      fontSize: {
        'min': '14px',
      },
      animation: {
        'pulse-green': 'pulse-green 2s ease-in-out infinite',
        'slide-up': 'slide-up 0.3s ease-out',
        'border-pulse': 'border-pulse 2s ease-in-out',
        'count-up': 'count-up 0.6s ease-out',
      },
      keyframes: {
        'pulse-green': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.5' },
        },
        'slide-up': {
          from: { transform: 'translateY(20px)', opacity: '0' },
          to: { transform: 'translateY(0)', opacity: '1' },
        },
        'border-pulse': {
          '0%': { borderColor: '#3b82f6' },
          '50%': { borderColor: '#60a5fa' },
          '100%': { borderColor: 'transparent' },
        },
      },
    },
  },
  plugins: [],
};
export default config;
