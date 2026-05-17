import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    allowedHosts: ['frp-fun.com', 'frp-boy.com', 'bazooka-blandness-parted.ngrok-free.dev', 'localhost'],
    proxy: {
      '/api': {
        target: 'https://bazooka-blandness-parted.ngrok-free.dev',
        changeOrigin: true,
        headers: {
          'ngrok-skip-browser-warning': 'true'
        }
      }
    },
    cors: true,
    origin: '*'
  }
})
