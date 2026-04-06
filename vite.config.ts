import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  base: process.env.BASE_PATH ?? '/',
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 5173,
  },
  preview: {
    host: '0.0.0.0',
    port: 4173,
  },
  build: {
    sourcemap: true,
    target: 'es2022',
    cssCodeSplit: true,
    reportCompressedSize: true,
  },
})
