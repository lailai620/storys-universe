-- ==========================================
-- Storys Universe 會員制度擴充
-- ==========================================

-- 1. 新增 membership_tier 到 profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS membership_tier TEXT DEFAULT 'free';

-- 2. 新增 membership_expires_at (未來擴充定期訂閱用)
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS membership_expires_at TIMESTAMP WITH TIME ZONE;

-- 3. 安全性：確保所有人都能讀取自己的會員狀態
-- (這已包含在之前的 RLS 中，但保險起見確認一下)
