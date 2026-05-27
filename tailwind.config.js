/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#4f46e5',
          glow: 'rgba(79, 70, 229, 0.25)',
        },
      },
    },
  },
  plugins: [],
}

