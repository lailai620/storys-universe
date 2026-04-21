/**
 * ============================================================================
 * 🌟 織光 AI 服務層 — 溫柔採訪者 (Gentle Interviewer)
 * ============================================================================
 * v3.2 — 所有 AI 呼叫統一透過 Supabase Edge Function (ai-proxy) 中繼。
 * 前端不再持有任何第三方 API Key（Anthropic / OpenAI / Gemini）。
 * 
 * 架構：前端 → Supabase Edge Function (ai-proxy) → Claude / OpenAI API
 */

// ─── 設定 ───────────────────────────────────────────────────────
import { supabase, isSupabaseConfigured } from '../supabaseClient';

// Edge Function 端點
const AI_PROXY_URL = isSupabaseConfigured
    ? `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-proxy`
    : '';

const useEdgeFunction = isSupabaseConfigured && !!AI_PROXY_URL;

export const isAIConfigured = useEdgeFunction;

// ─── 情緒→UI 映射 ────────────────────────────────────────────────
/**
 * 根據 AI 回傳的 emotion tag 決定前端 UI 的視覺狀態
 */
export const getEmotionStyle = (emotion) => {
    const styles = {
        joy:     { gradient: 'from-amber-400/20 to-orange-300/10',  glowColor: '#F5A623', ttsRate: 1.0 },
        sadness: { gradient: 'from-blue-900/30 to-indigo-800/20',   glowColor: '#2C5F8A', ttsRate: 0.85 },
        angry:   { gradient: 'from-red-700/25 to-orange-600/15',    glowColor: '#C0392B', ttsRate: 1.0 },
        anxious: { gradient: 'from-green-700/20 to-emerald-500/10', glowColor: '#27AE60', ttsRate: 0.9 },
        calm:    { gradient: 'from-purple-800/20 to-violet-600/10', glowColor: '#8E44AD', ttsRate: 0.95 },
    };
    return styles[emotion] || styles.calm;
};

// AI 使用狀態（用於 UI 顯示）
let aiUsageInfo = { remaining: null, limit: null, isPro: false };
export const getAIUsageInfo = () => aiUsageInfo;

// ─── 統一的 Edge Function 呼叫器 ────────────────────────────────
/**
 * 向 ai-proxy Edge Function 發送請求
 * @param {object} payload - 請求本體
 * @returns {Promise<object>}
 */
const callEdgeFunction = async (payload) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
        throw new Error('AUTH_ERROR: 找不到使用者連線');
    }

    const response = await fetch(AI_PROXY_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify(payload),
    });

    if (response.status === 429) {
        const errorData = await response.json();
        aiUsageInfo = { remaining: 0, limit: errorData.limit, isPro: errorData.isPro };
        throw new Error(errorData.message || 'AI 對話次數已用完');
    }

    if (!response.ok) {
        const errText = await response.text();
        throw new Error(`AI_PROXY_HTTP_ERROR_${response.status}: ${errText}`);
    }

    const data = await response.json();
    if (data.remaining !== undefined) {
        aiUsageInfo = { remaining: data.remaining, limit: data.limit, isPro: data.isPro };
    }
    return data;
};

// ─── 系統 Prompt（僅用於本地 fallback 開場白）────────────────────

// ─── 分類開場白 ─────────────────────────────────────────────────
const CATEGORY_GREETINGS = {
    family: '嗨！今天想聊聊家人之間的故事。讓我們從一個簡單的開始：最近一次和家人在一起，最讓你忍不住微笑的瞬間是什麼？',
    friends: '嗨！好朋友之間總有說不完的故事。你有沒有一段跟朋友之間的回憶，每次想到都覺得特別溫暖的？',
    work: '嗨！工作中也有很多值得記住的時刻。有沒有一個同事或一件事，讓你覺得「幸好我在這裡」？',
    pets: '嗨！毛孩子的故事總是特別暖心。可以告訴我你家毛寶貝的名字嗎？還有你們是怎麼相遇的？',
    self: '嗨！今天我們來聊聊你自己。回想一下，有沒有一個瞬間讓你覺得「原來我比想像中更勇敢」？',
    default: '嗨！準備好來聊聊了嗎？我會引導你回憶那些溫暖的時刻。讓我們從一個簡單的問題開始：你最近一次感到特別幸福的瞬間是什麼？',
};

// ─── Fallback 回應（無 API 或失敗時使用）──────────────────────
const FALLBACK_RESPONSES = [
    '那真是一個美好的回憶呢！能再多說一些嗎？比如當時的天氣、氣味，或是周圍的聲音？',
    '謝謝你的分享。我很好奇，當時你心裡是什麼感覺？有沒有什麼畫面特別深刻？',
    '聽起來好溫暖。那個時刻裡，還有誰在場嗎？他們的反應是什麼？',
    '這個細節好珍貴。如果用一個詞來形容那個瞬間，你會選什麼詞？',
    '你說的這些我都能感受到。那後來呢？這件事有沒有改變了什麼？',
    '真的嗎？我好像也能想像那個畫面。你還記得那天穿了什麼嗎？或者有什麼特別的味道？',
    '你講得好生動，就像我也在場一樣。你覺得這段回憶對你來說為什麼特別重要？',
];

let fallbackIndex = 0;

/**
 * 取得初始問候語
 */
export const getInitialGreeting = (category = 'default') => {
    return CATEGORY_GREETINGS[category] || CATEGORY_GREETINGS.default;
};

/**
 * 發送訊息給 AI 並取得帶有情緒的回應物件
 * @returns {Promise<{emotion: string, spoken_reply: string, story_content: string}|string>}
 */
export const sendMessage = async (history, userMessage) => {
    if (!isAIConfigured) {
        await simulateDelay();
        return { emotion: 'calm', spoken_reply: getFallbackResponse(), story_content: '' };
    }

    try {
        const contents = buildGeminiContents(history, userMessage);
        const data = await callEdgeFunction({ contents, action: 'chat' });

        if (data.emotion && data.spoken_reply) {
            return {
                emotion: data.emotion,
                spoken_reply: data.spoken_reply,
                story_content: data.story_content || '',
            };
        }
        throw new Error('AI_PROXY_FORMAT_ERROR');
    } catch (error) {
        console.error('AI 回應失敗:', error);
        if (error.message?.includes('次數') || error.message?.includes('用完')) {
            throw error;
        }
        return { emotion: 'calm', spoken_reply: getFallbackResponse(), story_content: '' };
    }
};

/**
 * 🔊 使用 OpenAI TTS 將文字轉為語音並播放（透過 Edge Function 中繼）
 */
export const speakWithOpenAI = async (text, rate = 1.0) => {
    if (!text || !isAIConfigured) {
        // Fallback: 使用瀏覽器內建 TTS
        if ('speechSynthesis' in window) {
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.lang = 'zh-TW';
            utterance.rate = rate;
            speechSynthesis.speak(utterance);
        }
        return;
    }

    try {
        const data = await callEdgeFunction({
            action: 'tts',
            text,
            voice: 'nova',
            speed: rate,
        });

        if (data.audio) {
            // 將 base64 audio 轉成 Blob 播放
            const binaryString = atob(data.audio);
            const bytes = new Uint8Array(binaryString.length);
            for (let i = 0; i < binaryString.length; i++) {
                bytes[i] = binaryString.charCodeAt(i);
            }
            const blob = new Blob([bytes], { type: 'audio/mp3' });
            const audioUrl = URL.createObjectURL(blob);
            const audio = new Audio(audioUrl);
            audio.play();
            audio.onended = () => URL.revokeObjectURL(audioUrl);
        }
    } catch (err) {
        console.warn('Edge TTS 失敗，退回 Web Speech API:', err);
        if ('speechSynthesis' in window) {
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.lang = 'zh-TW';
            utterance.rate = rate;
            speechSynthesis.speak(utterance);
        }
    }
};

/**
 * 📝 將故事對話整理成短文（透過 Edge Function）
 */
export const summarizeStory = async (history) => {
    if (!isAIConfigured) {
        return history.filter(m => m.role === 'user').map(m => m.text).join('\n\n');
    }

    try {
        const conversationText = history
            .map(m => `${m.role === 'user' ? '使用者' : '採訪者'}：${m.text}`)
            .join('\n');

        const data = await callEdgeFunction({
            action: 'summarize',
            text: conversationText,
        });

        return data.summary || '';
    } catch (error) {
        console.error('故事整理失敗:', error);
        return history.filter(m => m.role === 'user').map(m => m.text).join('\n\n');
    }
};

/**
 * 🎙️ 語音轉錄與散文精煉（透過 Edge Function）
 */
export const transcribeAndPolishVoice = async (transcriptText) => {
    if (!isAIConfigured) {
        throw new Error('未設定 AI 服務，無法進行語音轉錄。');
    }

    try {
        const data = await callEdgeFunction({
            action: 'transcribe',
            text: transcriptText,
        });

        return {
            transcript: data.transcript || '',
            polished: data.polished || '',
        };
    } catch (error) {
        console.error('語音轉錄失敗:', error);
        throw error;
    }
};

/**
 * 🔍 AI 時光機 — 語意搜尋故事
 * @param {string} query - 使用者的自然語言搜尋（如「找出去年跟阿嬤的故事」）
 * @returns {Promise<{results: Array<{id: string, relevance: string}>, message: string}>}
 */
export const searchMemories = async (query) => {
    if (!isAIConfigured) {
        throw new Error('需要登入並連線才能使用 AI 時光機');
    }

    try {
        const data = await callEdgeFunction({
            action: 'search',
            text: query,
        });

        return {
            results: data.results || [],
            message: data.message || '',
        };
    } catch (error) {
        console.error('AI 搜尋失敗:', error);
        throw error;
    }
};

// ─── 對話持久化（IndexedDB via storageService）─────────────────
import { getItem, setItem } from './storageService';

const STORAGE_KEY = 'weaving_chat_sessions';

/**
 * 儲存對話
 */
export const saveSession = async (sessionId, messages, metadata = {}) => {
    try {
        const sessions = await getItem(STORAGE_KEY, {});
        sessions[sessionId] = {
            messages,
            metadata: {
                ...metadata,
                updatedAt: new Date().toISOString(),
            },
        };
        await setItem(STORAGE_KEY, sessions);
    } catch (e) {
        console.error('儲存對話失敗:', e);
    }
};

/**
 * 載入對話
 */
export const loadSession = async (sessionId) => {
    try {
        const sessions = await getItem(STORAGE_KEY, {});
        return sessions[sessionId] || null;
    } catch {
        return null;
    }
};

/**
 * 取得所有對話列表
 */
export const getAllSessions = async () => {
    try {
        const sessions = await getItem(STORAGE_KEY, {});
        return Object.entries(sessions).map(([id, data]) => ({
            id,
            metadata: data.metadata,
            messageCount: data.messages?.length || 0,
        }));
    } catch {
        return [];
    }
};

/**
 * 儲存完成的故事（透過 dbService）
 */
import { saveStory } from './dbService';

export const saveCompletedStory = async (story) => {
    try {
        await saveStory({
            ...story,
            id: story.id || `story_${Date.now()}`,
            createdAt: new Date().toISOString(),
        });
        return true;
    } catch (e) {
        console.error('儲存故事失敗:', e);
        return false;
    }
};

// ─── 工具函數 ──────────────────────────────────────────────────

function buildGeminiContents(history, userMessage) {
    const contents = [];
    for (const msg of history) {
        contents.push({
            role: msg.role === 'user' ? 'user' : 'model',
            parts: [{ text: msg.text }],
        });
    }
    contents.push({
        role: 'user',
        parts: [{ text: userMessage }],
    });
    return contents;
}

function getFallbackResponse() {
    const response = FALLBACK_RESPONSES[fallbackIndex % FALLBACK_RESPONSES.length];
    fallbackIndex++;
    return response;
}

function simulateDelay() {
    return new Promise(resolve => setTimeout(resolve, 800 + Math.random() * 1200));
}
