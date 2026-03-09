-- ============================================
-- 🤖 AI 使用次數追蹤
-- ============================================

CREATE TABLE IF NOT EXISTS wl_ai_usage (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    call_count INTEGER DEFAULT 0,
    period_start TIMESTAMPTZ DEFAULT NOW(),
    period_type TEXT DEFAULT 'weekly' CHECK (period_type IN ('weekly', 'monthly')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, period_type)
);

-- RLS
ALTER TABLE wl_ai_usage ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own usage" ON wl_ai_usage
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own usage" ON wl_ai_usage
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own usage" ON wl_ai_usage
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ============================================
-- 👨‍👩‍👧 家庭群組
-- ============================================

CREATE TABLE IF NOT EXISTS wl_family_groups (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT DEFAULT '我的家庭',
    invite_code TEXT UNIQUE DEFAULT substr(md5(random()::text), 1, 8),
    max_members INTEGER DEFAULT 5,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS wl_family_group_members (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    group_id UUID NOT NULL REFERENCES wl_family_groups(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT DEFAULT 'member' CHECK (role IN ('owner', 'member')),
    joined_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(group_id, user_id)
);

-- RLS
ALTER TABLE wl_family_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE wl_family_group_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Group owners can manage" ON wl_family_groups
    FOR ALL USING (auth.uid() = owner_id);

CREATE POLICY "Members can view their groups" ON wl_family_groups
    FOR SELECT USING (
        id IN (SELECT group_id FROM wl_family_group_members WHERE user_id = auth.uid())
    );

CREATE POLICY "Members can view group members" ON wl_family_group_members
    FOR SELECT USING (
        group_id IN (SELECT group_id FROM wl_family_group_members WHERE user_id = auth.uid())
    );

CREATE POLICY "Group owners can manage members" ON wl_family_group_members
    FOR ALL USING (
        group_id IN (SELECT id FROM wl_family_groups WHERE owner_id = auth.uid())
    );

CREATE POLICY "Users can join groups" ON wl_family_group_members
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ============================================
-- 💎 Pro 狀態更新（profiles 表補欄位）
-- ============================================

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS pro_plan TEXT DEFAULT 'free' CHECK (pro_plan IN ('free', 'monthly', 'yearly', 'family'));
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS pro_started_at TIMESTAMPTZ;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS family_group_id UUID REFERENCES wl_family_groups(id);

-- 函數：檢查使用者是否為 Pro（含家庭方案繼承）
CREATE OR REPLACE FUNCTION is_user_pro(check_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    user_pro BOOLEAN;
    user_expires TIMESTAMPTZ;
    family_owner_pro BOOLEAN;
    family_owner_expires TIMESTAMPTZ;
BEGIN
    -- 直接檢查個人 Pro
    SELECT is_pro, pro_expires_at INTO user_pro, user_expires
    FROM profiles WHERE id = check_user_id;

    IF user_pro AND (user_expires IS NULL OR user_expires > NOW()) THEN
        RETURN TRUE;
    END IF;

    -- 檢查家庭群組繼承
    SELECT p.is_pro, p.pro_expires_at INTO family_owner_pro, family_owner_expires
    FROM wl_family_group_members fgm
    JOIN wl_family_groups fg ON fgm.group_id = fg.id
    JOIN profiles p ON fg.owner_id = p.id
    WHERE fgm.user_id = check_user_id
      AND p.pro_plan = 'family'
    LIMIT 1;

    IF family_owner_pro AND (family_owner_expires IS NULL OR family_owner_expires > NOW()) THEN
        RETURN TRUE;
    END IF;

    RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
