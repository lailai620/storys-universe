-- ============================================================
-- 🌟 織光雙引擎升級 Migration
-- 執行時間: 2026-06-01
-- 功能:
--   1. 新增 wl_user_memories (向量長期記憶表)
--   2. 新增 wl_story_highlights (LINE 推播高光語音表)
--   3. profiles 補充 line_id, family 方案支援
--   4. 新增每日 LINE 推播節流記錄表
-- ============================================================

-- ============================================================
-- Step 0: 啟用 pgvector（若尚未啟用）
-- ============================================================
CREATE EXTENSION IF NOT EXISTS vector;

-- ============================================================
-- Step 1: 長期向量記憶表 (Memoir Vector Brain)
-- 存放 AI 從對話中提取的重要情感記憶實體
-- 讓 AI 下次對話可以記住「阿嬤的忌日」、「最愛喝鐵觀音」等細節
-- ============================================================
CREATE TABLE IF NOT EXISTS wl_user_memories (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    entity_name TEXT NOT NULL,              -- 例: "老伴阿美", "金門當兵"
    event_detail TEXT NOT NULL,             -- 記憶描述
    event_date TEXT,                        -- 格式 MM-DD，用於忌日/紀念日觸發
    emotion_tag TEXT DEFAULT 'calm',        -- nostalgia, sadness, joy, anxious, calm
    embedding vector(1536),                 -- 語意向量（OpenAI text-embedding-3-small）
    story_id UUID REFERENCES wl_stories(id) ON DELETE SET NULL,  -- 關聯故事
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 向量語意搜尋索引
CREATE INDEX IF NOT EXISTS wl_user_memories_embedding_idx
    ON wl_user_memories USING ivfflat (embedding vector_cosine_ops)
    WITH (lists = 50);

-- 日期提醒索引（快速查詢今天是否有忌日/紀念日）
CREATE INDEX IF NOT EXISTS wl_user_memories_date_idx
    ON wl_user_memories (event_date)
    WHERE event_date IS NOT NULL;

-- RLS
ALTER TABLE wl_user_memories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own memories" ON wl_user_memories
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Family members can read elder memories" ON wl_user_memories
    FOR SELECT USING (
        user_id IN (
            SELECT fg.owner_id
            FROM wl_family_group_members fgm
            JOIN wl_family_groups fg ON fgm.group_id = fg.id
            WHERE fgm.user_id = auth.uid()
        )
    );

-- ============================================================
-- Step 2: 故事高光語音表 (LINE 推播素材)
-- 當長輩完成一章故事後，AI 自動剪輯出情感最強的 15 秒
-- 存放於此表，供 LINE 推播 Edge Function 使用
-- ============================================================
CREATE TABLE IF NOT EXISTS wl_story_highlights (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    story_id UUID NOT NULL REFERENCES wl_stories(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    audio_url TEXT,                         -- Supabase Storage 中的語音片段 URL
    emotion_peak TEXT DEFAULT 'nostalgia',  -- 最高峰的情緒標籤
    emotion_score NUMERIC(3,2) DEFAULT 0.0, -- 情緒強度 0.0~1.0
    summary TEXT,                           -- 故事的一句話摘要（供 LINE 推播訊息用）
    line_pushed_at TIMESTAMPTZ,             -- 上次 LINE 推播時間（節流判斷用）
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS
ALTER TABLE wl_story_highlights ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own highlights" ON wl_story_highlights
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Service role can update highlight push status" ON wl_story_highlights
    FOR UPDATE USING (true);  -- Edge Function 使用 service_role 更新推播時間

-- ============================================================
-- Step 3: 補充 profiles 欄位
-- ============================================================

-- LINE User ID（取得後存放，用於 LINE 推播）
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS line_id TEXT;

-- 更新 pro_plan 的 check 約束，加入 'family' 方案
-- 注意：PostgreSQL 無法直接 ALTER CHECK constraint，需先刪再加
DO $$
BEGIN
    -- 若已有 pro_plan 欄位，更新其 CHECK constraint
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'profiles' AND column_name = 'pro_plan'
    ) THEN
        -- 刪除舊 constraint（若存在）
        ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_pro_plan_check;
        -- 加入新 constraint，允許 'family' 方案
        ALTER TABLE profiles ADD CONSTRAINT profiles_pro_plan_check
            CHECK (pro_plan IN ('free', 'monthly', 'yearly', 'family'));
    END IF;
END $$;

-- ============================================================
-- Step 4: 自動更新 updated_at 觸發器 (wl_user_memories)
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_wl_user_memories_updated_at ON wl_user_memories;
CREATE TRIGGER update_wl_user_memories_updated_at
    BEFORE UPDATE ON wl_user_memories
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- Step 5: 輔助函數 — 查詢今天有忌日的用戶（供 Cron Job 使用）
-- ============================================================
CREATE OR REPLACE FUNCTION get_users_with_anniversary_today()
RETURNS TABLE (
    user_id UUID,
    entity_name TEXT,
    event_detail TEXT,
    emotion_tag TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT m.user_id, m.entity_name, m.event_detail, m.emotion_tag
    FROM wl_user_memories m
    WHERE m.event_date = TO_CHAR(NOW(), 'MM-DD');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
