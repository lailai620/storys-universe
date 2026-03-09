// src/supabaseClient.js
import { createClient } from '@supabase/supabase-js';

// 使用環境變數讀取 Supabase 設定 (安全做法)
// 前往 Supabase Dashboard -> Settings -> API 取得這些值
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// 防呆機制：如果變數沒讀到，在 Console 發出警告
if (!supabaseUrl || !supabaseKey) {
    console.warn('⚠️ Supabase 環境變數未設定！部分功能可能無法使用。');
    console.warn('請複製 .env.example 為 .env 並填入您的 Supabase 設定。');
}

// 提供 fallback 避免 createClient 因 undefined 而崩潰
export const supabase = (supabaseUrl && supabaseKey)
    ? createClient(supabaseUrl, supabaseKey, {
        auth: {
            persistSession: true,       // 登入 session 持久化到 localStorage
            autoRefreshToken: true,      // 自動刷新 JWT token
            detectSessionInUrl: true,    // 偵測 OAuth redirect 的 session
            storageKey: 'weaving-auth',  // localStorage key
        },
    })
    : null;

// 判斷 Supabase 是否可用
export const isSupabaseConfigured = !!(supabaseUrl && supabaseKey);
