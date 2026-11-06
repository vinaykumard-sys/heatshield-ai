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
        // HeatShield 2.0 Modern Design System
        app: {
          bg: '#F5F8FC',        // Modern clean background
          surface: '#FFFFFF',   // Pure White Card Surface
          subtle: '#F8FAFC',    // Subtle pill/section fill
          muted: '#EEF3F8',     // Muted fill / hover
          border: '#E5EDF5',    // Very light blue-grey border
          'border-dark': '#CBD5E1',
        },
        slate: {
          900: '#0F172A',       // Deep Navy
          800: '#1E293B',
          700: '#334155',       // Secondary Dark
          600: '#475569',
          500: '#64748B',       // Cool Grey Muted
          400: '#94A3B8',       // Light Muted
          200: '#E2E8F0',       // Light border
          100: '#F1F5F9',       // Hover fill
          50: '#F8FAFC',        // Ultra-subtle
        },
        brand: {
          DEFAULT: '#1E60F2',   // HeatShield Trustworthy Blue
          50: '#EFF6FF',
          100: '#DBEAFE',
          200: '#BFDBFE',
          300: '#93C5FD',
          400: '#60A5FA',
          500: '#3B82F6',
          600: '#1E60F2',
          700: '#184FD0',
          800: '#143EB0',
          900: '#0F2C82',
        },
        heat: {
          low: '#10B981',       // Soft Green
          moderate: '#F59E0B',  // Soft Amber
          warning: '#F97316',   // Soft Orange
          critical: '#EF4444',  // Soft Red
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
        'card': '20px',
        'card-lg': '24px',
        'card-sm': '14px',
      },
      boxShadow: {
        'subtle': '0 1px 3px 0 rgba(15, 23, 42, 0.04)',
        'card': '0 2px 10px -2px rgba(15, 23, 42, 0.04), 0 1px 3px 0 rgba(15, 23, 42, 0.02)',
        'card-hover': '0 8px 24px -4px rgba(15, 23, 42, 0.08), 0 2px 6px -1px rgba(15, 23, 42, 0.03)',
        'dropdown': '0 10px 25px -4px rgba(15, 23, 42, 0.08), 0 4px 8px -2px rgba(15, 23, 42, 0.03)',
        'modal': '0 20px 40px -8px rgba(15, 23, 42, 0.12), 0 8px 16px -4px rgba(15, 23, 42, 0.04)',
        'floating': '0 12px 32px -4px rgba(15, 23, 42, 0.12), 0 4px 12px -2px rgba(15, 23, 42, 0.04)',
      },
      keyframes: {
        'page-enter': {
          '0%': { opacity: '0', transform: 'translateY(4px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'card-enter': {
          '0%': { opacity: '0', transform: 'translateY(6px)' },
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
        'page-enter': 'page-enter 200ms cubic-bezier(0.16, 1, 0.3, 1) forwards',
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
