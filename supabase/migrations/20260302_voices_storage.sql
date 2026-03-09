-- ==========================================
-- 織光 — 語音 Storage Bucket 設定
-- 在 Supabase Dashboard → SQL Editor 執行此檔案
-- ==========================================

-- 1. 建立 voices bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('voices', 'voices', false)
ON CONFLICT (id) DO NOTHING;

-- 2. 允許登入用戶上傳語音到自己的資料夾
-- 路徑格式：/voices/{user_id}/{filename}.webm
CREATE POLICY "Users can upload own voices"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'voices' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- 3. 允許用戶讀取自己的語音
CREATE POLICY "Users can read own voices"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'voices' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- 4. 允許用戶刪除自己的語音
CREATE POLICY "Users can delete own voices"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'voices' AND
  (storage.foldername(name))[1] = auth.uid()::text
);
