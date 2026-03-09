import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  base: './',
  plugins: [
    react(),
  ],
  build: {
    // 生產環境移除所有 console 和 debugger
    target: 'es2020',
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          'vendor-supabase': ['@supabase/supabase-js'],
          'vendor-ui': ['lucide-react'],
        }
      }
    },
    // 啟用壓縮
    minify: 'esbuild',
    // 生產環境不需要 sourcemap（減少洩露）
    sourcemap: false,
  },
  esbuild: {
    // 生產環境自動移除 console 和 debugger
    drop: [],  // 暫時不移除 console，方便偵錯
  },
}))
