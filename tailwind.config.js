/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        roxo: { DEFAULT: '#7B2FA0', dark: '#5A1E78', light: '#9D4ED8' },
        verde: { DEFAULT: '#5FA82B', dark: '#4A8420', light: '#7DC845' },
      },
      fontFamily: { sans: ['Inter', 'system-ui', 'sans-serif'] },
    },
  },
  plugins: [],
}
