/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        // Official Haroti brand palette (green, blue, white)
        'haroti-green': '#007A44',
        'haroti-green-dark': '#005C33',
        'haroti-blue': '#2E3095',
        'haroti-blue-dark': '#232578',
        'haroti-white': '#FFFFFF',
        // Derived UI tokens
        'haroti-forest': '#007A44',
        'haroti-forest-deep': '#005C33',
        'haroti-leaf': '#007A44',
        'haroti-leaf-bright': '#00995A',
        'haroti-paper': '#FFFFFF',
        'haroti-mist': '#EEF2F8',
        'haroti-ink': '#1A1F36',
        'haroti-muted': '#5A6478',
        // Accent (secondary CTAs only)
        'haroti-flame': '#2E3095',
        'haroti-flame-hot': '#232578',
        'haroti-flame-soft': '#DDE3F5',
        // Legacy token names used across page components
        'haroti-orange': '#2E3095',
        'haroti-gray': '#5A6478',
      },
      fontFamily: {
        sans: ['DM Sans', 'system-ui', 'sans-serif'],
        serif: ['Fraunces', 'Georgia', 'serif'],
      },
    },
  },
  plugins: [],
};
