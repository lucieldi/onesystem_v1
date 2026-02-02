/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./**/*.{js,ts,jsx,tsx}"
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      colors: {
        notion: {
          bg: '#191919',
          sidebar: '#202020',
          card: '#2C2C2C',
          hover: '#333333',
          text: '#D4D4D4',
          muted: '#9B9B9B',
          accent: '#2383E2'
        }
      },
      backgroundImage: {
         'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
      }
    },
  },
  plugins: [
    require("tailwindcss-animate")
  ],
}