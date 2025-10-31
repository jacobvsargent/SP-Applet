import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/SP-Applet/',
  server: {
    port: 3000
  }
})

