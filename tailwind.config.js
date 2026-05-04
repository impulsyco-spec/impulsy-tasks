/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#12fcd9',
          glow: 'rgba(18, 252, 217, 0.25)',
        },
      },
    },
  },
  plugins: [],
}

