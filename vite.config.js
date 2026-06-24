import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// base = '/garagem-acai/' para servir como GitHub Pages de projeto
// (https://<user>.github.io/garagem-acai/)
export default defineConfig({
  base: '/garagem-acai/',
  plugins: [react()],
})
