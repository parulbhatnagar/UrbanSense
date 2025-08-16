import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api/watson/infer': {
        target: 'http://127.0.0.1:5001',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api\/watson\/infer/, '/api/watson/infer')
      }
    }
  }
})
