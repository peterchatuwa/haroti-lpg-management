/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        // ERP-aligned Haroti palette
        'haroti-forest': '#0a3a2c',
        'haroti-forest-deep': '#041f18',
        'haroti-leaf': '#1a6b4d',
        'haroti-leaf-bright': '#2d8f68',
        'haroti-flame': '#f0b429',
        'haroti-flame-hot': '#ff8a1f',
        'haroti-flame-soft': '#ffe7a3',
        'haroti-paper': '#f3f7f4',
        'haroti-mist': '#e4efe9',
        'haroti-ink': '#102019',
        'haroti-muted': '#5a6e64',
        // Legacy token names used across page components
        'haroti-blue': '#0a3a2c',
        'haroti-orange': '#f0b429',
        'haroti-green': '#1a6b4d',
        'haroti-gray': '#5a6e64',
      },
      fontFamily: {
        sans: ['DM Sans', 'system-ui', 'sans-serif'],
        serif: ['Fraunces', 'Georgia', 'serif'],
      },
    },
  },
  plugins: [],
};
