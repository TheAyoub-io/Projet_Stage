/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#1e3a8a',
          hover: '#1e40af',
          light: '#3b82f6',
        },
        secondary: {
          DEFAULT: '#4f46e5',
        },
        accent: {
          DEFAULT: '#0ea5e9',
        },
        danger: {
          DEFAULT: '#ef4444',
        },
        success: {
          DEFAULT: '#10b981',
        },
        warning: {
          DEFAULT: '#f59e0b',
        }
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      borderRadius: {
        'xl': '1rem',
        'lg': '0.75rem',
        'md': '0.5rem',
        'sm': '0.375rem',
      }
    },
  },
  plugins: [],
}
