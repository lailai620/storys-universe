import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    // ⚠️ 關鍵：這裡我們只保留 react()
    // 如果原本有 VitePWA(...) 或其他快取外掛，都已經被這個版本清除了
  ],
})