import type { Config } from 'tailwindcss';
import tailwindcssAnimate from 'tailwindcss-animate';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // ALBASTRU - baza (concentrare, logică, atenție susținută)
        primary: {
          DEFAULT: '#3B82F6',  // Blue-500 (academic blue)
          50: '#EFF6FF',
          100: '#DBEAFE',
          200: '#BFDBFE',
          300: '#93C5FD',
          400: '#60A5FA',
          500: '#3B82F6',  // Main UI color
          600: '#2563EB',  // Dark mode primary
          700: '#1D4ED8',
          800: '#1E3A8A',  // Academic blue (darker)
          900: '#1E40AF',
        },
        // VERDE - progres, XP, success, feedback pozitiv
        success: {
          DEFAULT: '#22C55E',  // Green-500
          400: '#4ADE80',
          500: '#22C55E',  // XP gain, progress
          600: '#16A34A',
          700: '#15803D',
        },
        // PORTOCALIU/GALBEN - recompense, gamificare, rewards
        reward: {
          DEFAULT: '#F59E0B',  // Amber-500
          400: '#FBBF24',      // Yellow-400 (dark mode)
          500: '#F59E0B',      // Rewards, badges, streaks
          600: '#D97706',
        },
        // ROȘU - doar pentru erori (minim)
        error: {
          DEFAULT: '#EF4444',
          400: '#F87171',      // Dark mode
          500: '#EF4444',
          600: '#DC2626',
        },
        // Backgrounds (dark mode optimizat)
        background: {
          dark: '#0B1220',     // Dark background
          surface: '#111827',  // Surface elements
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'Consolas', 'monospace'],
      },
      animation: {
        'xp-gain': 'xp-gain 1.5s cubic-bezier(0.34, 1.56, 0.64, 1)',
        'level-up': 'level-up 0.8s cubic-bezier(0.34, 1.56, 0.64, 1)',
        'slide-in': 'slide-in 0.3s ease-out',
        'fade-in': 'fade-in 0.5s ease-out',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
        'glow-green': 'glow-green 2s ease-in-out infinite alternate',
        'glow-amber': 'glow-amber 2s ease-in-out infinite alternate',
        'shine': 'shine 3s linear infinite',
        'float': 'float 3s ease-in-out infinite',
        'bounce-slow': 'bounce 2s infinite',
        'spin-slow': 'spin 3s linear infinite',
        'gradient-shift': 'gradient-shift 8s ease infinite',
      },
      keyframes: {
        'xp-gain': {
          '0%': { transform: 'scale(0) rotate(-10deg)', opacity: '0' },
          '50%': { transform: 'scale(1.2) rotate(5deg)', opacity: '1' },
          '100%': { transform: 'scale(1) rotate(0deg)', opacity: '0' },
        },
        'level-up': {
          '0%': { transform: 'scale(0) rotateY(180deg)', opacity: '0' },
          '50%': { transform: 'scale(1.1) rotateY(0deg)', opacity: '1' },
          '100%': { transform: 'scale(1) rotateY(0deg)', opacity: '1' },
        },
        'slide-in': {
          'from': { transform: 'translateX(100%)', opacity: '0' },
          'to': { transform: 'translateX(0)', opacity: '1' },
        },
        'fade-in': {
          'from': { opacity: '0', transform: 'translateY(10px)' },
          'to': { opacity: '1', transform: 'translateY(0)' },
        },
        'glow': {
          '0%, 100%': { boxShadow: '0 0 20px rgba(59, 130, 246, 0.5)' },
          '50%': { boxShadow: '0 0 40px rgba(59, 130, 246, 0.8), 0 0 60px rgba(37, 99, 235, 0.4)' },
        },
        'glow-green': {
          '0%, 100%': { boxShadow: '0 0 20px rgba(34, 197, 94, 0.5)' },
          '50%': { boxShadow: '0 0 40px rgba(34, 197, 94, 0.8), 0 0 60px rgba(22, 163, 74, 0.4)' },
        },
        'glow-amber': {
          '0%, 100%': { boxShadow: '0 0 20px rgba(245, 158, 11, 0.5)' },
          '50%': { boxShadow: '0 0 40px rgba(245, 158, 11, 0.8), 0 0 60px rgba(217, 119, 6, 0.4)' },
        },
        'shine': {
          '0%': { backgroundPosition: '-200% center' },
          '100%': { backgroundPosition: '200% center' },
        },
        'float': {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        'gradient-shift': {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
        },
      },
      backdropBlur: {
        xs: '2px',
      },
    }
  },
  plugins: [tailwindcssAnimate]
} satisfies Config;












