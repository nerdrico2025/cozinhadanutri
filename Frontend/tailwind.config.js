/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: '#16a34a',
        'brand-orange': '#f49100',
        'brand-light': '#fff7eb',
      },
      width: {
        '50': '12.5rem',
      },
      height: {
        '50': '12.5rem',
      },
    },
  },
  plugins: [],
}
