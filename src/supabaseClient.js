// src/supabaseClient.js
import { createClient } from '@supabase/supabase-js';

// 使用環境變數讀取 Supabase 設定 (安全做法)
// 前往 Supabase Dashboard -> Settings -> API 取得這些值
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// 防呆機制：如果變數沒讀到，在 Console 發出警告
if (!supabaseUrl || !supabaseKey) {
    console.error('⚠️ Supabase 環境變數未設定！請檢查 .env 檔案。');
    console.error('請複製 .env.example 為 .env 並填入您的 Supabase 設定。');
}

export const supabase = createClient(supabaseUrl, supabaseKey);