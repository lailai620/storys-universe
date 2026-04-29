/**
 * ============================================================================
 * 🌟 織光 AI 服務層 — 溫柔採訪者 (Gentle Interviewer)
 * ============================================================================
 * v4.0 — 所有 AI 呼叫統一透過 Supabase Edge Function (ai-proxy) 中繼。
 * 前端不再持有任何第三方 API Key。
 * 
 * 架構：前端 → Supabase Edge Function (ai-proxy) → Claude 3.5 Sonnet + OpenAI TTS
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

// ─── 情緒關鍵字偵測 ─────────────────────────────────────────────
const SADNESS_KEYWORDS = ['傷心', '難過', '悲傷', '痛苦', '哭', '失落', '委屈', '心碎', '崩潰', '絕望', '沮喪', '不好', '很糟', '很差', '痛', '後悔', '遺憾'];
const ANGRY_KEYWORDS = ['憤怒', '生氣', '火大', '憤恨', '不爽', '怒', '討厭', '煩', '氣死', '受夠'];
const ANXIOUS_KEYWORDS = ['焦慮', '不安', '緊張', '擔心', '害怕', '迷茫', '不知道', '茫然', '壓力', '煩惱'];

function detectEmotion(text) {
    if (!text) return 'calm';
    if (SADNESS_KEYWORDS.some(k => text.includes(k))) return 'sadness';
    if (ANGRY_KEYWORDS.some(k => text.includes(k))) return 'angry';
    if (ANXIOUS_KEYWORDS.some(k => text.includes(k))) return 'anxious';
    return 'calm';
}

// ─── 情緒對應的 Fallback 回應組 ─────────────────────────────────
const FALLBACK_BY_EMOTION = {
    sadness: [
        '嗯……我聽到了。那種感覺真的很重，你願意繼續說嗎？當時你一個人嗎？',
        '你能感受到那份傷心，不需要假裝沒事。我想多了解一點——那個最難受的瞬間是什麼？',
        '這些眼淚都是有意義的。那段時間，有什麼事或什麼人，讓你撐下來了？',
    ],
    angry: [
        '你有這樣的感受非常正常，換誰遇到都會這樣。可以告訴我，是什麼讓你最崩潰的嗎？',
        '我懂那種憤怒。那個當下，你最想說什麼卻沒說出口的話是什麼？',
        '那種委屈和憤怒是真實的，不需要壓下去。後來這件事怎麼了？',
    ],
    anxious: [
        '那種不確定感很難受。你現在最擔心的那一件事，具體是什麼？',
        '感覺到焦慮是很正常的。可以說說，是從什麼時候開始這樣的嗎？',
        '我在這裡，不用急。你說的這些，有讓你睡不著嗎？',
    ],
    calm: [
        '謝謝你告訴我這些。我很好奇，當時你心裡是什麼感覺？有沒有什麼畫面特別深刻？',
        '能再多說一些嗎？比如當時的天氣、氣味，或是周圍的聲音？',
        '這個細節很珍貴。那個時刻裡，還有誰在場嗎？他們的反應是什麼？',
        '你說的這些我都能感受到。那後來呢？這件事有沒有改變了什麼？',
        '你還記得那天的光線或氣味嗎？那種感官記憶有時候特別清晰。',
    ],
};

const fallbackCounters = { sadness: 0, angry: 0, anxious: 0, calm: 0 };

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
    // 情緒感知 fallback（無論 API 有無，都先偵測情緒作為備用）
    const detectedEmotion = detectEmotion(userMessage);

    if (!isAIConfigured) {
        await simulateDelay();
        return { emotion: detectedEmotion, spoken_reply: getFallbackResponse(detectedEmotion), story_content: '' };
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
        // ⚠️ 使用情緒感知 fallback，不再用固定的正向語句
        return { emotion: detectedEmotion, spoken_reply: getFallbackResponse(detectedEmotion), story_content: '' };
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
 * @param {string} base64Audio - 音訊的 base64 字串（不含 data: 前綴）
 * @param {string} mimeType    - 音訊格式，例如 'audio/webm'
 */
export const transcribeAndPolishVoice = async (base64Audio, mimeType) => {
    if (!isAIConfigured) {
        throw new Error('未設定 AI 服務，無法進行語音轉錄。');
    }

    try {
        const data = await callEdgeFunction({
            action: 'transcribe',
            audio: base64Audio,   // ✅ 傳音訊 base64
            mimeType: mimeType || 'audio/webm',
        });

        return {
            transcript: data.transcript || '',
            polished: data.polished || data.summary || '',
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
    // Step 1: 組合完整對話，避免末尾訊息重複堆疊
    const fullHistory = [...history];
    const lastMsg = fullHistory[fullHistory.length - 1];
    if (!lastMsg || lastMsg.role !== 'user' || lastMsg.text !== userMessage) {
        fullHistory.push({ role: 'user', text: userMessage });
    }

    const contents = [];
    let lastRole = null;

    for (const msg of fullHistory) {
        const mappedRole = msg.role === 'user' ? 'user' : 'model';

        // Step 2: Gemini 規定第一句必須是 user，若是 AI 開場白則先插入隱形的 user 起手式
        if (contents.length === 0 && mappedRole === 'model') {
            contents.push({ role: 'user', parts: [{ text: '(準備開始)' }] });
            lastRole = 'user';
        }

        // Step 3: 同一角色連續發言則合併成一段，避免踩中嚴格交替規定
        if (mappedRole === lastRole) {
            contents[contents.length - 1].parts[0].text += '\n' + msg.text;
        } else {
            contents.push({
                role: mappedRole,
                parts: [{ text: msg.text }],
            });
            lastRole = mappedRole;
        }
    }

    return contents;
}

function getFallbackResponse(emotion = 'calm') {
    const pool = FALLBACK_BY_EMOTION[emotion] || FALLBACK_BY_EMOTION.calm;
    const idx = fallbackCounters[emotion] || 0;
    fallbackCounters[emotion] = (idx + 1) % pool.length;
    return pool[idx];
}

function simulateDelay() {
    return new Promise(resolve => setTimeout(resolve, 800 + Math.random() * 1200));
}
