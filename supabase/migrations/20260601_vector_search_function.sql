-- ============================================================
-- 向量記憶搜尋函數 (pgvector)
-- 讓 AI 能透過語意相似度搜尋長輩的長期記憶
-- 
-- 使用方法：在 Supabase Dashboard → SQL Editor 中執行此檔案
-- ============================================================

-- 確保 pgvector extension 已啟用
CREATE EXTENSION IF NOT EXISTS vector;

-- 為 wl_user_memories 的 embedding 欄位建立向量索引（加速搜尋）
-- 如果已存在會自動跳過
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE tablename = 'wl_user_memories' 
        AND indexname = 'wl_user_memories_embedding_idx'
    ) THEN
        CREATE INDEX wl_user_memories_embedding_idx 
        ON wl_user_memories 
        USING ivfflat (embedding vector_cosine_ops)
        WITH (lists = 100);
    END IF;
END $$;

-- ============================================================
-- 建立向量搜尋 RPC 函數
-- 參數：
--   p_user_id  : 使用者 ID（只搜尋該使用者的記憶）
--   p_embedding: 查詢向量（1536 維，JSON 陣列格式）
--   p_limit    : 最多回傳幾筆結果（預設 5）
--   p_threshold: 相似度閾值，0.0~1.0（預設 0.75，越高越嚴格）
-- ============================================================
CREATE OR REPLACE FUNCTION search_memories(
    p_user_id  UUID,
    p_embedding TEXT,           -- 傳入 JSON 陣列字串，在函數內部轉型
    p_limit    INT  DEFAULT 5,
    p_threshold FLOAT DEFAULT 0.75
)
RETURNS TABLE (
    id          UUID,
    entity_name TEXT,
    event_detail TEXT,
    event_date  TEXT,
    emotion_tag TEXT,
    similarity  FLOAT,
    created_at  TIMESTAMPTZ
)
LANGUAGE plpgsql
AS $$
DECLARE
    v_embedding vector(1536);
BEGIN
    -- 將 JSON 字串轉型為 pgvector 格式
    v_embedding := p_embedding::vector(1536);

    RETURN QUERY
    SELECT
        m.id,
        m.entity_name,
        m.event_detail,
        m.event_date,
        m.emotion_tag,
        -- 使用餘弦相似度（1 - 距離 = 相似度）
        (1 - (m.embedding <=> v_embedding))::FLOAT AS similarity,
        m.created_at
    FROM wl_user_memories m
    WHERE
        m.user_id = p_user_id
        AND m.embedding IS NOT NULL
        -- 過濾相似度低於閾值的結果
        AND (1 - (m.embedding <=> v_embedding)) >= p_threshold
    ORDER BY
        m.embedding <=> v_embedding  -- 距離越小越靠前
    LIMIT p_limit;
END;
$$;

-- 授權前端匿名角色可呼叫此 RPC（若使用 service role key 則不需要）
GRANT EXECUTE ON FUNCTION search_memories TO authenticated;
GRANT EXECUTE ON FUNCTION search_memories TO service_role;

-- ============================================================
-- 驗證函數是否建立成功
-- ============================================================
SELECT 
    routine_name, 
    routine_type,
    routine_schema
FROM information_schema.routines 
WHERE routine_name = 'search_memories';
