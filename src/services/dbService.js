/**
 * 📦 資料庫服務 — dbService.js
 * 抽象層：Supabase 可用時用 Supabase，否則用 IndexedDB (storageService)
 * 所有頁面透過此服務存取資料，不直接操作 localStorage/supabase
 */
import { supabase, isSupabaseConfigured } from '../supabaseClient';
import { getCurrentUser } from './authService';
import { getItem, setItem } from './storageService';

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
    return await getItem('weaving_stories', []);
};

export const getStoryById = async (storyId) => {
    const user = getCurrentUser();
    // 1. 優先嘗試從雲端拿最新的單篇故事
    if (isSupabaseConfigured && user && !user.isOffline) {
        try {
            const { data, error } = await supabase
                .from('wl_stories')
                .select('*')
                .eq('id', storyId)
                .single();
            if (!error && data) return data;
        } catch (e) {
            console.warn('雲端找不到該則故事，將回退至本機快取', e);
        }
    }
    // 2. 如果沒網路或是雲端找不到，再查 IndexedDB
    const stories = await getItem('weaving_stories', []);
    return stories.find(s => s.id === storyId) || null;
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
    // IndexedDB fallback
    const stories = await getItem('weaving_stories', []);
    const existing = stories.findIndex(s => s.id === story.id);
    const occurredTime = story.occurred_at || new Date().toISOString();
    
    if (existing >= 0) {
        // 如果是要更新且沒有帶 occurred_at，不覆寫原來的
        const originalOccurredAt = stories[existing].occurred_at || stories[existing].createdAt;
        stories[existing] = { 
            ...stories[existing], 
            ...story, 
            occurred_at: story.occurred_at || originalOccurredAt,
            updatedAt: new Date().toISOString() 
        };
    } else {
        stories.unshift({ 
            ...story, 
            id: story.id || `story_${Date.now()}`, 
            occurred_at: occurredTime,
            createdAt: new Date().toISOString() 
        });
    }
    await setItem('weaving_stories', stories);
    return stories[existing >= 0 ? existing : 0];
};

export const deleteStory = async (storyId) => {
    const user = getCurrentUser();
    if (isSupabaseConfigured && user && !user.isOffline) {
        const { error } = await supabase.from('wl_stories').delete().eq('id', storyId);
        if (error) throw error;
        return;
    }
    const stories = await getItem('weaving_stories', []);
    await setItem('weaving_stories', stories.filter(s => s.id !== storyId));
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
    return await getItem('weaving_voice_messages', []);
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
    // IndexedDB fallback
    const messages = await getItem('weaving_voice_messages', []);
    const newMsg = { ...msg, id: `voice_${Date.now()}`, createdAt: new Date().toISOString() };
    messages.unshift(newMsg);
    await setItem('weaving_voice_messages', messages);
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
    return await getItem('weaving_photos', []);
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
    // IndexedDB fallback
    const memories = await getItem('weaving_photos', []);
    const newMemory = { ...memory, id: `memory_${Date.now()}`, createdAt: new Date().toISOString() };
    memories.unshift(newMemory);
    await setItem('weaving_photos', memories);
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
    return await getItem('weaving_family_members', []);
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
    const members = await getItem('weaving_family_members', []);
    const newMember = { ...member, id: `member_${Date.now()}` };
    members.push(newMember);
    await setItem('weaving_family_members', members);
    return newMember;
};

export const removeFamilyMember = async (memberId) => {
    const user = getCurrentUser();
    if (isSupabaseConfigured && user && !user.isOffline) {
        const { error } = await supabase.from('wl_family_members').delete().eq('id', memberId);
        if (error) throw error;
        return;
    }
    const members = await getItem('weaving_family_members', []);
    await setItem('weaving_family_members', members.filter(m => m.id !== memberId));
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
    return await getItem('weaving_book_config', null);
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
    await setItem('weaving_book_config', config);
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

    // 遷移故事（從 IndexedDB 或 localStorage）
    const localStories = await getItem('weaving_stories', []);
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
    const localFamily = await getItem('weaving_family_members', []);
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
    const localBookConfig = await getItem('weaving_book_config', null);
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
