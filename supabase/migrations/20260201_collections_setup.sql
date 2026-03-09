-- ==========================================
-- 織光 Collections & Reading Progress 表格設置
-- 修正：使用正確的 wl_stories 表名
-- ==========================================

-- 1. 建立 collections 表格
CREATE TABLE IF NOT EXISTS collections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  story_id UUID NOT NULL REFERENCES wl_stories(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(user_id, story_id)
);

-- 2. 建立索引
CREATE INDEX IF NOT EXISTS idx_collections_user_id ON collections(user_id);
CREATE INDEX IF NOT EXISTS idx_collections_story_id ON collections(story_id);

-- 3. 開啟 RLS
ALTER TABLE collections ENABLE ROW LEVEL SECURITY;

-- 4. RLS 政策
DROP POLICY IF EXISTS "collections_select_policy" ON collections;
CREATE POLICY "collections_select_policy"
ON collections FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "collections_insert_policy" ON collections;
CREATE POLICY "collections_insert_policy"
ON collections FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "collections_delete_policy" ON collections;
CREATE POLICY "collections_delete_policy"
ON collections FOR DELETE
TO authenticated
USING (auth.uid() = user_id);


-- ==========================================
-- 5. reading_progress 表格
-- ==========================================

CREATE TABLE IF NOT EXISTS reading_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  story_id UUID NOT NULL REFERENCES wl_stories(id) ON DELETE CASCADE,
  last_page INTEGER DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(user_id, story_id)
);

ALTER TABLE reading_progress ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "reading_progress_select_policy" ON reading_progress;
CREATE POLICY "reading_progress_select_policy"
ON reading_progress FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "reading_progress_insert_policy" ON reading_progress;
CREATE POLICY "reading_progress_insert_policy"
ON reading_progress FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "reading_progress_update_policy" ON reading_progress;
CREATE POLICY "reading_progress_update_policy"
ON reading_progress FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);
