import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  base: process.env.VITE_BASE_URL || '/storys-universe/',
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
          'vendor-ui': ['lucide-react', 'recharts'],
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
    drop: mode === 'production' ? ['console', 'debugger'] : [],
  },
}))
