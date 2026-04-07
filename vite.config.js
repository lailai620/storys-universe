import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  base: './',
  plugins: [
    react(),
  ],
  build: {
    target: 'es2020',
    rollupOptions: {
      // 移除自訂分塊，讓 Rollup 自行判斷最佳、最安全的分塊方式
    },
    chunkSizeWarningLimit: 1500,
    minify: 'esbuild',
    sourcemap: false,
  },
  esbuild: {
    drop: [],
  },
}))


