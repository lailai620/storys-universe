CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS wl_stories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL DEFAULT '無標題',
  content TEXT DEFAULT '',
  category TEXT DEFAULT 'default',
  tags TEXT[] DEFAULT '{}',
  is_ai_generated BOOLEAN DEFAULT FALSE,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS wl_voice_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT DEFAULT '',
  duration_seconds REAL DEFAULT 0,
  storage_path TEXT NOT NULL,
  transcript TEXT DEFAULT '',
  sender TEXT DEFAULT '我',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS wl_memories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT DEFAULT '',
  photo_urls TEXT[] DEFAULT '{}',
  tags TEXT[] DEFAULT '{}',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS wl_family_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  role TEXT DEFAULT 'member',
  joined BOOLEAN DEFAULT FALSE,
  invited_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS wl_collab_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT DEFAULT '',
  contributions JSONB DEFAULT '[]',
  duration_seconds INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS wl_book_configs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT DEFAULT '我的故事書',
  cover TEXT DEFAULT 'classic',
  font TEXT DEFAULT 'serif',
  style TEXT DEFAULT 'minimal',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE wl_stories ENABLE ROW LEVEL SECURITY;
ALTER TABLE wl_voice_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE wl_memories ENABLE ROW LEVEL SECURITY;
ALTER TABLE wl_family_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE wl_collab_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE wl_book_configs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "wl_stories_policy" ON wl_stories;
CREATE POLICY "wl_stories_policy" ON wl_stories FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "wl_voices_policy" ON wl_voice_messages;
CREATE POLICY "wl_voices_policy" ON wl_voice_messages FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "wl_memories_policy" ON wl_memories;
CREATE POLICY "wl_memories_policy" ON wl_memories FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "wl_family_policy" ON wl_family_members;
CREATE POLICY "wl_family_policy" ON wl_family_members FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "wl_collabs_policy" ON wl_collab_sessions;
CREATE POLICY "wl_collabs_policy" ON wl_collab_sessions FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "wl_books_policy" ON wl_book_configs;
CREATE POLICY "wl_books_policy" ON wl_book_configs FOR ALL USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, display_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email, ''))
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
