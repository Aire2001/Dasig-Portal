/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        navy: '#001d5c',
        blue: '#1a56db',
        indigo: '#4f46e5',
        orange: '#f97316',
        rose: '#e11d48',
      },
    },
  },
  plugins: [],
}

