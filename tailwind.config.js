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
        // Linear / Stripe style enterprise healthcare theme
        app: {
          bg: '#F8FAFC',        // Primary background (Slate 50)
          surface: '#FFFFFF',   // Main surface (White)
          subtle: '#F1F5F9',    // Subtle surface (Slate 100)
          muted: '#E2E8F0',     // Muted fill (Slate 200)
          border: '#E2E8F0',    // Clean hairline borders
          'border-dark': '#CBD5E1', // Active / hover borders
        },
        slate: {
          900: '#0F172A',       // Primary text
          700: '#334155',       // Secondary dark text
          500: '#64748B',       // Secondary muted text
          400: '#94A3B8',       // Placeholder / tertiary text
          200: '#E2E8F0',       // Borders
          100: '#F1F5F9',       // Hover states
          50: '#F8FAFC',        // Canvas
        },
        brand: {
          DEFAULT: '#2563EB',   // Primary accent (Trustworthy Blue 600)
          50: '#EFF6FF',
          100: '#DBEAFE',
          200: '#BFDBFE',
          500: '#3B82F6',
          600: '#2563EB',
          700: '#1D4ED8',
          800: '#1E40AF',
        },
        heat: {
          low: '#16A34A',       // Success / Green 600
          moderate: '#CA8A04',  // Amber 600
          warning: '#EA580C',   // Heat warning (Orange 600)
          critical: '#DC2626',  // Critical heat warning (Red 600)
        },
        success: '#16A34A',
        warning: '#EA580C',
        critical: '#DC2626',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      boxShadow: {
        'subtle': '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        'card': '0 1px 3px 0 rgba(15, 23, 42, 0.06), 0 1px 2px -1px rgba(15, 23, 42, 0.04)',
        'card-hover': '0 4px 6px -1px rgba(15, 23, 42, 0.08), 0 2px 4px -2px rgba(15, 23, 42, 0.04)',
        'dropdown': '0 10px 15px -3px rgba(15, 23, 42, 0.08), 0 4px 6px -4px rgba(15, 23, 42, 0.04)',
        'modal': '0 20px 25px -5px rgba(15, 23, 42, 0.1), 0 8px 10px -6px rgba(15, 23, 42, 0.05)',
      }
    },
  },
  plugins: [],
}
