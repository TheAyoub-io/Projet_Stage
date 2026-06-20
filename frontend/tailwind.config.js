/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        academic: {
          blue: '#1E3A8A', // Deep professional blue
          lightBlue: '#3B82F6',
          gray: '#F3F4F6', // Light background gray
          darkGray: '#374151', // Text gray
          white: '#FFFFFF',
        }
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
