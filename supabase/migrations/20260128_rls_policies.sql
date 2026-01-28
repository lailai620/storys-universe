-- ==========================================
-- Storys Universe RLS 安全政策 (Security Policies)
-- ==========================================

-- 1. [Stories] 資料表策略
-- 開啟 RLS
ALTER TABLE stories ENABLE ROW LEVEL SECURITY;

-- 允許任何人查看公開故事
CREATE POLICY "Public stories are viewable by everyone"
ON stories FOR SELECT
USING (visibility = 'public');

-- 允許登入用戶查看自己的所有故事 (包含私有)
CREATE POLICY "Users can view own stories"
ON stories FOR SELECT
TO authenticated
USING (auth.uid() = author_id);

-- 允許登入用戶創建故事 (必須是自己的 ID)
CREATE POLICY "Users can create stories"
ON stories FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = author_id);

-- 允許登入用戶更新自己的故事
CREATE POLICY "Users can update own stories"
ON stories FOR UPDATE
TO authenticated
USING (auth.uid() = author_id)
WITH CHECK (auth.uid() = author_id);

-- 允許登入用戶刪除自己的故事
CREATE POLICY "Users can delete own stories"
ON stories FOR DELETE
TO authenticated
USING (auth.uid() = author_id);


-- 2. [Profiles] 資料表策略 (如有)
-- 開啟 RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- 用戶只能讀取自己的個人資料
CREATE POLICY "Users can view own profile"
ON profiles FOR SELECT
TO authenticated
USING (auth.uid() = id);

-- 用戶只能更新自己的個人資料
CREATE POLICY "Users can update own profile"
ON profiles FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);


-- 3. [Transactions] 資料表策略 (未來實作交易帳本時使用)
-- 開啟 RLS
ALTER TABLE IF EXISTS transactions ENABLE ROW LEVEL SECURITY;

-- 用戶只能查看自己的交易紀錄
CREATE POLICY "Users can view own transactions"
ON transactions FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- 注意：INSERT 權限通常僅限 Edge Functions 使用 service_role，不開放給前端。
