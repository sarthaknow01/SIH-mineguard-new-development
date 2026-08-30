/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        coal: {
          950: '#0b0f19',
          900: '#111827',
          850: '#151f32',
          800: '#1f293d',
          700: '#334155',
          600: '#475569',
        },
        hazard: {
          yellow: '#f59e0b',
          orange: '#f97316',
          red: '#ef4444',
          green: '#10b981',
          blue: '#3b82f6',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'Courier New', 'monospace'],
      }
    },
  },
  plugins: [],
}
