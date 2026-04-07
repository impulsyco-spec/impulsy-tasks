/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        navy: {
          900: '#0D1F3C',
          800: '#112347',
          700: '#163060',
        },
        cyan: {
          brand: '#00B4D8',
          light: '#E0F7FC',
        },
      },
    },
  },
  plugins: [],
}
