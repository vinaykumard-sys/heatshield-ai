/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // HeatShield 2.0 Modern Weather OS Design System (SkySense / Horizon Aesthetic)
        app: {
          bg: '#EEF3FB',          // Soft pastel background
          canvas: '#F4F7FE',      // Floating inner application canvas
          backdrop: '#E9EFF8',    // Outer gradient tint
          surface: '#FFFFFF',     // Pure White Card Surface
          subtle: '#F8FAFC',      // Subtle pill/section fill
          muted: '#EEF3F8',       // Muted fill / hover
          border: '#E9F0FA',      // Soft pillowy border
          'border-subtle': '#F1F5F9',
          'border-dark': '#CBD5E1',
        },
        slate: {
          900: '#0F172A',       // Deep Navy
          800: '#1E293B',       // Primary Dark text
          700: '#334155',       // Secondary Dark
          600: '#475569',
          500: '#64748B',       // Cool Grey Muted
          400: '#94A3B8',       // Light Muted
          200: '#E2E8F0',       // Light border
          100: '#F1F5F9',       // Hover fill
          50: '#F8FAFC',        // Ultra-subtle
        },
        brand: {
          DEFAULT: '#2563EB',   // Royal / Vibrant Sky Blue
          50: '#EFF6FF',
          100: '#DBEAFE',
          200: '#BFDBFE',
          300: '#93C5FD',
          400: '#60A5FA',
          500: '#3B82F6',
          600: '#2563EB',
          700: '#1D4ED8',
          800: '#1E40AF',
          900: '#1E3A8A',
        },
        sky: {
          DEFAULT: '#3B82F6',
          soft: '#E0EDFD',
        },
        cooling: {
          DEFAULT: '#06B6D4',
          light: '#ECFEFF',
          emerald: '#10B981',
        },
        heat: {
          safe: '#06B6D4',
          low: '#10B981',       // Safe / Cooling Green
          moderate: '#F59E0B',  // Moderate Heat Amber
          warning: '#F97316',   // Warning / High Heat Orange
          critical: '#EF4444',  // Critical Heat Red
          'critical-dark': '#DC2626',
        },
        success: '#10B981',
        warning: '#F59E0B',
        critical: '#EF4444',
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      borderRadius: {
        'card': '28px',
        'card-lg': '32px',
        'card-sm': '16px',
        'pill': '9999px',
        '3xl': '24px',
        '4xl': '28px',
        '5xl': '32px',
      },
      boxShadow: {
        'subtle': '0 2px 8px 0 rgba(20, 50, 90, 0.04)',
        'soft-sm': '0 4px 16px -2px rgba(20, 50, 90, 0.05)',
        'soft': '0 10px 35px -5px rgba(20, 50, 90, 0.06), 0 4px 16px -2px rgba(20, 50, 90, 0.04)',
        'soft-lg': '0 20px 45px -10px rgba(20, 50, 90, 0.08), 0 8px 20px -4px rgba(20, 50, 90, 0.04)',
        'soft-xl': '0 25px 60px -12px rgba(20, 50, 90, 0.12)',
        'card': '0 10px 35px -5px rgba(20, 50, 90, 0.06), 0 4px 16px -2px rgba(20, 50, 90, 0.04)',
        'card-hover': '0 16px 45px -8px rgba(20, 50, 90, 0.10), 0 6px 18px -2px rgba(20, 50, 90, 0.05)',
        'dropdown': '0 12px 30px -4px rgba(20, 50, 90, 0.10), 0 4px 10px -2px rgba(20, 50, 90, 0.04)',
        'modal': '0 25px 60px -10px rgba(20, 50, 90, 0.18), 0 10px 24px -5px rgba(20, 50, 90, 0.06)',
        'floating': '0 20px 50px -12px rgba(20, 50, 90, 0.12), 0 0 0 1px rgba(255, 255, 255, 0.8)',
        'glow-blue': '0 0 25px -4px rgba(37, 99, 235, 0.35)',
        'glow-red': '0 0 25px -4px rgba(239, 68, 68, 0.35)',
      },
      keyframes: {
        'page-enter': {
          '0%': { opacity: '0', transform: 'translateY(6px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'card-enter': {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'scale-in': {
          '0%': { opacity: '0', transform: 'scale(0.97)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        'pulse-subtle': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.65' },
        },
        'waveform': {
          '0%, 100%': { transform: 'scaleY(0.35)' },
          '50%': { transform: 'scaleY(1)' },
        },
        'typing': {
          '0%, 100%': { transform: 'translateY(0)', opacity: '0.4' },
          '50%': { transform: 'translateY(-3px)', opacity: '1' },
        }
      },
      animation: {
        'page-enter': 'page-enter 220ms cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'card-enter': 'card-enter 250ms cubic-bezier(0.16, 1, 0.3, 1) both',
        'fade-in': 'fade-in 180ms ease-out forwards',
        'scale-in': 'scale-in 150ms cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'pulse-subtle': 'pulse-subtle 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'waveform-1': 'waveform 0.8s ease-in-out infinite',
        'waveform-2': 'waveform 0.8s ease-in-out infinite 0.15s',
        'waveform-3': 'waveform 0.8s ease-in-out infinite 0.3s',
        'waveform-4': 'waveform 0.8s ease-in-out infinite 0.45s',
        'typing-1': 'typing 1.2s infinite ease-in-out 0s',
        'typing-2': 'typing 1.2s infinite ease-in-out 0.2s',
        'typing-3': 'typing 1.2s infinite ease-in-out 0.4s',
      }
    },
  },
  plugins: [],
}
