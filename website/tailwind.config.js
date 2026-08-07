/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'haroti-blue': '#0047AB',
        'haroti-orange': '#FF6B35',
        'haroti-green': '#28A745',
        'haroti-gray': '#6C757D',
      },
      fontFamily: {
        'sans': ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
