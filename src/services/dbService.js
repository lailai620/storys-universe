/**
 * 📦 資料庫服務 — dbService.js
 * 抽象層：Supabase 可用時用 Supabase，否則用 localStorage
 * 所有頁面透過此服務存取資料，不直接操作 localStorage/supabase
 */
import { supabase, isSupabaseConfigured } from '../supabaseClient';
import { getCurrentUser } from './authService';

// ============================================
// 📝 故事 Stories
// ============================================

export const getStories = async () => {
    const user = getCurrentUser();
    if (isSupabaseConfigured && user && !user.isOffline) {
        const { data, error } = await supabase
            .from('wl_stories')
            .select('*')
            .order('created_at', { ascending: false });
        if (error) throw error;
        return data;
    }
    return JSON.parse(localStorage.getItem('weaving_stories') || '[]');
};

export const saveStory = async (story) => {
    const user = getCurrentUser();
    if (isSupabaseConfigured && user && !user.isOffline) {
        const { data, error } = await supabase
            .from('wl_stories')
            .upsert({ ...story, user_id: user.id })
            .select()
            .single();
        if (error) throw error;
        return data;
    }
    // localStorage fallback
    const stories = JSON.parse(localStorage.getItem('weaving_stories') || '[]');
    const existing = stories.findIndex(s => s.id === story.id);
    if (existing >= 0) {
        stories[existing] = { ...stories[existing], ...story, updatedAt: new Date().toISOString() };
    } else {
        stories.unshift({ ...story, id: story.id || `story_${Date.now()}`, createdAt: new Date().toISOString() });
    }
    localStorage.setItem('weaving_stories', JSON.stringify(stories));
    return stories[existing >= 0 ? existing : 0];
};

export const deleteStory = async (storyId) => {
    const user = getCurrentUser();
    if (isSupabaseConfigured && user && !user.isOffline) {
        const { error } = await supabase.from('wl_stories').delete().eq('id', storyId);
        if (error) throw error;
        return;
    }
    const stories = JSON.parse(localStorage.getItem('weaving_stories') || '[]');
    localStorage.setItem('weaving_stories', JSON.stringify(stories.filter(s => s.id !== storyId)));
};

// ============================================
// 🎤 語音 Voice Messages
// ============================================

export const getVoiceMessages = async () => {
    const user = getCurrentUser();
    if (isSupabaseConfigured && user && !user.isOffline) {
        const { data, error } = await supabase
            .from('wl_voice_messages')
            .select('*')
            .order('created_at', { ascending: false });
        if (error) throw error;
        return data;
    }
    return JSON.parse(localStorage.getItem('weaving_voice_messages') || '[]');
};

export const saveVoiceMessage = async (msg, audioBlob = null) => {
    const user = getCurrentUser();
    if (isSupabaseConfigured && user && !user.isOffline && audioBlob) {
        // 上傳音檔到 Storage
        const path = `${user.id}/${Date.now()}.webm`;
        const { error: uploadError } = await supabase.storage
            .from('voice-messages')
            .upload(path, audioBlob, { contentType: 'audio/webm' });
        if (uploadError) throw uploadError;

        const { data, error } = await supabase
            .from('wl_voice_messages')
            .insert({ ...msg, user_id: user.id, storage_path: path })
            .select()
            .single();
        if (error) throw error;
        return data;
    }
    // localStorage fallback
    const messages = JSON.parse(localStorage.getItem('weaving_voice_messages') || '[]');
    const newMsg = { ...msg, id: `voice_${Date.now()}`, createdAt: new Date().toISOString() };
    messages.unshift(newMsg);
    localStorage.setItem('weaving_voice_messages', JSON.stringify(messages));
    return newMsg;
};

// ============================================
// 📸 記憶照片 Memories
// ============================================

export const getMemories = async () => {
    const user = getCurrentUser();
    if (isSupabaseConfigured && user && !user.isOffline) {
        const { data, error } = await supabase
            .from('wl_memories')
            .select('*')
            .order('created_at', { ascending: false });
        if (error) throw error;
        return data;
    }
    return JSON.parse(localStorage.getItem('weaving_photos') || '[]');
};

export const saveMemory = async (memory, photos = []) => {
    const user = getCurrentUser();
    if (isSupabaseConfigured && user && !user.isOffline) {
        // 上傳照片到 Storage
        const photoUrls = [];
        for (const photo of photos) {
            const path = `${user.id}/${Date.now()}_${Math.random().toString(36).slice(2)}.jpg`;
            const { error: uploadError } = await supabase.storage
                .from('photos')
                .upload(path, photo, { contentType: 'image/jpeg' });
            if (!uploadError) {
                const { data: { publicUrl } } = supabase.storage.from('photos').getPublicUrl(path);
                photoUrls.push(publicUrl);
            }
        }

        const { data, error } = await supabase
            .from('wl_memories')
            .insert({ ...memory, user_id: user.id, photo_urls: photoUrls })
            .select()
            .single();
        if (error) throw error;
        return data;
    }
    // localStorage fallback
    const memories = JSON.parse(localStorage.getItem('weaving_photos') || '[]');
    const newMemory = { ...memory, id: `memory_${Date.now()}`, createdAt: new Date().toISOString() };
    memories.unshift(newMemory);
    localStorage.setItem('weaving_photos', JSON.stringify(memories));
    return newMemory;
};

// ============================================
// 👨‍👩‍👧 家人成員 Family Members
// ============================================

export const getFamilyMembers = async () => {
    const user = getCurrentUser();
    if (isSupabaseConfigured && user && !user.isOffline) {
        const { data, error } = await supabase
            .from('wl_family_members')
            .select('*')
            .order('invited_at', { ascending: true });
        if (error) throw error;
        return data;
    }
    return JSON.parse(localStorage.getItem('weaving_family_members') || '[]');
};

export const saveFamilyMember = async (member) => {
    const user = getCurrentUser();
    if (isSupabaseConfigured && user && !user.isOffline) {
        const { data, error } = await supabase
            .from('wl_family_members')
            .insert({ ...member, user_id: user.id })
            .select()
            .single();
        if (error) throw error;
        return data;
    }
    const members = JSON.parse(localStorage.getItem('weaving_family_members') || '[]');
    const newMember = { ...member, id: `member_${Date.now()}` };
    members.push(newMember);
    localStorage.setItem('weaving_family_members', JSON.stringify(members));
    return newMember;
};

export const removeFamilyMember = async (memberId) => {
    const user = getCurrentUser();
    if (isSupabaseConfigured && user && !user.isOffline) {
        const { error } = await supabase.from('wl_family_members').delete().eq('id', memberId);
        if (error) throw error;
        return;
    }
    const members = JSON.parse(localStorage.getItem('weaving_family_members') || '[]');
    localStorage.setItem('weaving_family_members', JSON.stringify(members.filter(m => m.id !== memberId)));
};

// ============================================
// 📖 書籍設定 Book Config
// ============================================

export const getBookConfig = async () => {
    const user = getCurrentUser();
    if (isSupabaseConfigured && user && !user.isOffline) {
        const { data } = await supabase
            .from('wl_book_configs')
            .select('*')
            .eq('user_id', user.id)
            .single();
        return data;
    }
    return JSON.parse(localStorage.getItem('weaving_book_config') || 'null');
};

export const saveBookConfig = async (config) => {
    const user = getCurrentUser();
    if (isSupabaseConfigured && user && !user.isOffline) {
        const { data, error } = await supabase
            .from('wl_book_configs')
            .upsert({ ...config, user_id: user.id }, { onConflict: 'user_id' })
            .select()
            .single();
        if (error) throw error;
        return data;
    }
    localStorage.setItem('weaving_book_config', JSON.stringify(config));
    return config;
};

// ============================================
// 📊 統計數據 (WeavingHome 使用)
// ============================================

export const getStats = async () => {
    const stories = await getStories();
    const voices = await getVoiceMessages();
    const memories = await getMemories();

    return {
        storyCount: stories.length,
        voiceCount: voices.length,
        photoCount: memories.reduce((sum, m) => sum + (m.photo_urls?.length || m.photos?.length || 0), 0),
        totalDays: calculateActiveDays(stories, voices, memories),
    };
};

function calculateActiveDays(stories, voices, memories) {
    const dates = new Set();
    const addDate = (item) => {
        const d = item.created_at || item.createdAt;
        if (d) dates.add(new Date(d).toDateString());
    };
    stories.forEach(addDate);
    voices.forEach(addDate);
    memories.forEach(addDate);
    return dates.size || 1;
}

// ============================================
// 🔄 localStorage → Supabase 遷移工具
// ============================================

export const migrateLocalDataToSupabase = async () => {
    const user = getCurrentUser();
    if (!isSupabaseConfigured || !user || user.isOffline) {
        return { migrated: false, reason: 'Supabase 未設定或未登入' };
    }

    let migratedCount = 0;

    // 遷移故事
    const localStories = JSON.parse(localStorage.getItem('weaving_stories') || '[]');
    for (const story of localStories) {
        try {
            await supabase.from('wl_stories').upsert({
                id: story.id?.startsWith('story_') ? undefined : story.id,
                user_id: user.id,
                title: story.title || '無標題',
                content: story.content || story.summary || '',
                category: story.category || 'default',
                tags: story.tags || [],
                is_ai_generated: story.isAI || false,
                metadata: { originalId: story.id, source: 'localStorage_migration' },
                created_at: story.createdAt || new Date().toISOString(),
            });
            migratedCount++;
        } catch (e) {
            console.warn('故事遷移失敗:', story.id, e);
        }
    }

    // 遷移家人
    const localFamily = JSON.parse(localStorage.getItem('weaving_family_members') || '[]');
    for (const member of localFamily) {
        try {
            await supabase.from('wl_family_members').insert({
                user_id: user.id,
                name: member.name,
                role: member.role || 'member',
                joined: member.joined || false,
            });
            migratedCount++;
        } catch (e) {
            console.warn('家人遷移失敗:', member.name, e);
        }
    }

    // 遷移書籍設定
    const localBookConfig = JSON.parse(localStorage.getItem('weaving_book_config') || 'null');
    if (localBookConfig) {
        try {
            await supabase.from('wl_book_configs').upsert({
                user_id: user.id,
                ...localBookConfig,
            }, { onConflict: 'user_id' });
            migratedCount++;
        } catch (e) {
            console.warn('書籍設定遷移失敗:', e);
        }
    }

    return { migrated: true, count: migratedCount };
};
