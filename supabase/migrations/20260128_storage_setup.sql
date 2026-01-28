-- ==========================================
-- Storys Universe 儲存空間設定 (Storage Setup)
-- ==========================================

-- 1. 建立名為 'stories' 的 Bucket
-- 如果已經存在會跳過，但通常建議在 Dashboard 手動建立
INSERT INTO storage.buckets (id, name, public) 
VALUES ('stories', 'stories', true)
ON CONFLICT (id) DO NOTHING;

-- 2. 開啟 RLS (Bucket 預設可能已開啟，這邊確保政策存在)
-- 政策：允許任何人公開讀取圖片
CREATE POLICY "Public images are accessible by everyone"
ON storage.objects FOR SELECT
USING (bucket_id = 'stories');

-- 政策：允許登入用戶上傳圖片到自己的資料夾
-- 資料夾路徑格式預期為：/stories/user_id/story_id/filename.webp
CREATE POLICY "Users can upload own story images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'stories' AND 
  (storage.foldername(name))[1] = auth.uid()::text
);

-- 政策：允許用戶刪除自己的圖片
CREATE POLICY "Users can delete own story images"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'stories' AND 
  (storage.foldername(name))[1] = auth.uid()::text
);
