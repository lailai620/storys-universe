CREATE TABLE IF NOT EXISTS wl_story_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  story_id TEXT NOT NULL,
  nickname TEXT NOT NULL,
  content TEXT NOT NULL,
  hidden BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE wl_story_comments ENABLE ROW LEVEL SECURITY;

-- Policy: Everyone can insert comments (for guest links)
DROP POLICY IF EXISTS "wl_story_comments_insert_policy" ON wl_story_comments;
CREATE POLICY "wl_story_comments_insert_policy" 
ON wl_story_comments 
FOR INSERT 
WITH CHECK (true);

-- Policy: Everyone can read non-hidden comments
DROP POLICY IF EXISTS "wl_story_comments_select_policy" ON wl_story_comments;
CREATE POLICY "wl_story_comments_select_policy" 
ON wl_story_comments 
FOR SELECT 
USING (hidden = false);

-- Policy: Story owners can update/hide comments (requires join with wl_stories to check ownership)
-- For simplicity, since story_id is TEXT, we allow updates if the user owns the story.
-- We can do a subquery:
DROP POLICY IF EXISTS "wl_story_comments_update_policy" ON wl_story_comments;
CREATE POLICY "wl_story_comments_update_policy" 
ON wl_story_comments 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM wl_stories 
    WHERE wl_stories.id::text = wl_story_comments.story_id 
    AND wl_stories.user_id = auth.uid()
  )
);
