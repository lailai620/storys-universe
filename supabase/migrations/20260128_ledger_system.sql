-- ==========================================
-- Storys Universe 交易帳本系統 (Transaction Ledger)
-- ==========================================

-- 1. [Profiles] 資料表：存儲用戶額外資訊（如星塵餘額）
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  email TEXT,
  token_balance INTEGER DEFAULT 120, -- 預設給予 120 星塵
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. [Transactions] 資料表：紀錄每一筆星塵變動
CREATE TABLE IF NOT EXISTS public.transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  amount INTEGER NOT NULL, -- 正值為增加，負值為扣除
  type TEXT NOT NULL,      -- e.g., 'create_story', 'topup', 'daily_bonus'
  reference_id TEXT,       -- 關聯的 ID (如 story_id)
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. 自動更新 Profiles 餘額的觸發器
CREATE OR REPLACE FUNCTION public.handle_balance_update()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.profiles
  SET token_balance = token_balance + NEW.amount,
      updated_at = NOW()
  WHERE id = NEW.user_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_transaction_inserted
  AFTER INSERT ON public.transactions
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_balance_update();

-- 4. 自動建立 Profile 的觸發器 (當 Supabase Auth 有新使用者時)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, token_balance)
  VALUES (NEW.id, NEW.email, 120);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 注意：這需要連結到 auth.users 表，通常需要超級用戶權限執行
-- 在 Supabase SQL Editor 執行時，確保您有對應權限
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
