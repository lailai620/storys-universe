-- ==========================================
-- Storys Universe Collections 表格設置
-- 用於儲存使用者的故事收藏
-- ==========================================

-- 1. 建立 collections 表格 (如果不存在)
CREATE TABLE IF NOT EXISTS collections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  story_id UUID NOT NULL REFERENCES stories(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- 確保同一用戶不能重複收藏同一故事
  UNIQUE(user_id, story_id)
);

-- 2. 建立索引以加速查詢
CREATE INDEX IF NOT EXISTS idx_collections_user_id ON collections(user_id);
CREATE INDEX IF NOT EXISTS idx_collections_story_id ON collections(story_id);

-- 3. 開啟 RLS
ALTER TABLE collections ENABLE ROW LEVEL SECURITY;

-- 4. RLS 政策

-- 允許登入用戶查看自己的收藏
CREATE POLICY "Users can view own collections"
ON collections FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- 允許登入用戶新增收藏
CREATE POLICY "Users can insert own collections"
ON collections FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- 允許登入用戶刪除自己的收藏
CREATE POLICY "Users can delete own collections"
ON collections FOR DELETE
TO authenticated
USING (auth.uid() = user_id);


-- ==========================================
-- 5. reading_progress 表格設置 (閱讀進度)
-- ==========================================

CREATE TABLE IF NOT EXISTS reading_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  story_id UUID NOT NULL REFERENCES stories(id) ON DELETE CASCADE,
  last_page INTEGER DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(user_id, story_id)
);

-- 開啟 RLS
ALTER TABLE reading_progress ENABLE ROW LEVEL SECURITY;

-- 允許登入用戶查看自己的閱讀進度
CREATE POLICY "Users can view own reading_progress"
ON reading_progress FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- 允許登入用戶插入/更新自己的閱讀進度
CREATE POLICY "Users can insert own reading_progress"
ON reading_progress FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own reading_progress"
ON reading_progress FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);
