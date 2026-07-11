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
        saffron: {
          50: '#fff8e1',
          100: '#ffecb3',
          200: '#ffe082',
          300: '#ffd54f',
          400: '#ffca28',
          500: '#ffb300',
          600: '#ff8f00',
          700: '#ff6f00',
          800: '#e65100',
          900: '#bf360c',
        },
        gold: {
          50: '#fbf7e6',
          100: '#f6ebc1',
          200: '#efdc98',
          300: '#e7cc6d',
          400: '#e0be4a',
          500: '#d4af37',
          600: '#bfa02f',
          700: '#a38725',
          800: '#876e1d',
          900: '#6c5614',
        }
      }
    },
  },
  plugins: [],
}
