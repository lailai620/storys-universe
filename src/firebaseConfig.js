import { createClient } from '@supabase/supabase-js'

// 使用 import.meta.env 來讀取 VITE_ 開頭的環境變數
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_KEY

// 防呆機制：如果變數沒讀到，在 Console 發出警告
if (!supabaseUrl || !supabaseKey) {
  console.error('⚠️ Supabase 環境變數未設定！請檢查 .env 檔案或是 Vercel 設定。')
}

export const supabase = createClient(supabaseUrl, supabaseKey)