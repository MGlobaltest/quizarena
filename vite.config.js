import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    tailwindcss(),
    react(),
  ],
  server: {
    host: true, // Listen on all local IPs (0.0.0.0) so mobile phones can connect
    port: 5173,
    allowedHosts: true,
  },
})
