/**
 * ============================================================================
 * 🌟 織光 AI 服務層 — 溫柔採訪者 (Gentle Interviewer)
 * ============================================================================
 * v5.0 — 雙引擎情感共振版 (Dual-Engine Empathetic Resonance)
 *
 * 架構：前端 → ai-proxy Edge Function
 *              ↓ [Brain Router]
 *              ├→ Groq Llama-3-8B (日常閒聊 80%，低成本)
 *              └→ Claude 3.5 Sonnet (情緒波動/故事生成 20%，高品質)
 *
 * 新增功能：
 *   - 情緒快取器 (Emotion Cache)：每 3 輪對話才更新情緒，節省 66% 前端偵測開銷
 *   - emotionTags 傳遞：前端偵測的情緒標籤會一起傳給後端路由器
 *   - turnCount 追蹤：超過 15 輪自動標記故事生成模式
 *   - LINE 推播觸發：故事完成後通知家族子女
 *   - 記憶提取：從對話中靜默提取重要情感記憶存入向量庫
 */

// ─── 設定 ───────────────────────────────────────────────────────
import { supabase, isSupabaseConfigured } from '../supabaseClient';

// Edge Function 端點
const AI_PROXY_URL = isSupabaseConfigured
    ? `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-proxy`
    : '';
const LINE_PUSH_URL = isSupabaseConfigured
    ? `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/line-push`
    : '';

const useEdgeFunction = isSupabaseConfigured && !!AI_PROXY_URL;

export const isAIConfigured = useEdgeFunction;

// ─── 情緒快取器 (Emotion Cache) ──────────────────────────────────
// 每 3 輪對話才重新偵測情緒，中間複用快取，節省前端處理開銷
let _emotionCache = { emotion: 'calm', tags: { calm: 1.0 } };
let _turnSinceLastEmotionUpdate = 0;
const EMOTION_UPDATE_INTERVAL = 3;  // 每 3 輪更新一次

// ─── 全局對話輪次計數器 ────────────────────────────────────────
let _globalTurnCount = 0;
export const resetTurnCount = () => { _globalTurnCount = 0; _turnSinceLastEmotionUpdate = 0; };
export const getTurnCount = () => _globalTurnCount;

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
        body: JSON.stringify({
            ...payload,
            forcePro: import.meta.env.VITE_FORCE_PRO === 'true'
        }),
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
    family: '嗨～今天想聊什麼都行。家人之間最有意思的，往往是那些很小很小的事。你有沒有哪個家人，最近讓你特別想到他？',
    friends: '嗨！說起朋友，有時候一個眼神就能笑翻。你最近有沒有跟某個朋友發生什麼有趣或印象深刻的事？',
    work: '嗨～工作這件事，有時候真的很難說。有沒有最近發生了什麼小事，讓你覺得「咦，還不錯嘛」？',
    pets: '嗨！毛孩子永遠有說不完的故事哈哈。你家寶貝最近有沒有什麼讓你又崩潰又融化的時刻？',
    self: '嗨！今天想聊聊你自己的故事。最近有沒有某一刻，你突然覺得「原來我可以做到」或「其實我很想要⋯⋯」？',
    default: '嗨！很高興你來這裡。不用準備什麼，就隨便聊聊也好——最近生活怎麼樣？有什麼讓你特別放不下的事嗎？',
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
        '聽起來那段時間真的很不好受。不用急著解釋什麼，你願意多說說當時的狀況嗎？',
        '我陪著你。那個最難的瞬間，你身邊有人嗎？',
        '有時候低落是有原因的，你覺得那時候最讓你難以承受的是什麼？',
    ],
    angry: [
        '天啊，換作是我大概也會氣翻。那個當下你有沒有想直接爆發？',
        '完全可以理解那種憤怒。那件事後來有解決嗎，還是還卡在那裡？',
        '那種被委屈的感覺真的很難受。你有沒有跟對方說過你的想法？',
    ],
    anxious: [
        '好，先深呼吸一下。你說的這件事，最讓你擔心的核心是什麼？',
        '焦慮的時候腦子會轉個不停，我懂。你有沒有試過先把它寫下來？',
        '我在這裡，不用急著整理清楚。你最近睡得還好嗎？',
    ],
    calm: [
        '哦真的嗎！那個當下你是什麼反應？',
        '聽起來挺有意思的，後來呢？',
        '你記得那天大概是什麼時候嗎？或者當時在哪裡？',
        '哈哈我很好奇——你那時候第一個念頭是什麼？',
        '這讓我想多問一下，那件事對你來說現在還有什麼感覺嗎？',
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
 *
 * 升級（v5.0）：
 *   - 每 3 輪才重新偵測情緒（情緒快取機制）
 *   - 將 emotionTags 傳給後端路由器決定走 Groq 還是 Claude
 *   - turnCount > 15 時自動標記 isFinalStoryGeneration
 *
 * @returns {Promise<{emotion, spoken_reply, story_content, modelUsed?}>}
 */
export const sendMessage = async (history, userMessage) => {
    // 遞增全局輪次計數器
    _globalTurnCount++;
    _turnSinceLastEmotionUpdate++;

    // ── 情緒快取機制：每 3 輪才重新偵測 ─────────────────────
    let currentEmotion = _emotionCache.emotion;
    if (_turnSinceLastEmotionUpdate >= EMOTION_UPDATE_INTERVAL) {
        const freshEmotion = detectEmotion(userMessage);
        // 將關鍵字情緒映射為強度分數（模擬 Hume API 回傳的格式）
        const freshTags = emotionToTags(freshEmotion);
        _emotionCache = { emotion: freshEmotion, tags: freshTags };
        _turnSinceLastEmotionUpdate = 0;
        currentEmotion = freshEmotion;
    }

    if (!isAIConfigured) {
        await simulateDelay();
        return { emotion: currentEmotion, spoken_reply: getFallbackResponse(currentEmotion), story_content: '' };
    }

    try {
        const contents = buildGeminiContents(history, userMessage);
        const isFinalStoryGeneration = _globalTurnCount > 15;

        const data = await callEdgeFunction({
            contents,
            action: 'chat',
            // 傳遞情緒標籤給後端大腦路由器
            emotionTags: _emotionCache.tags,
            isFinalStoryGeneration,
            turnCount: _globalTurnCount,
        });

        if (data.emotion && data.spoken_reply) {
            // 在開發模式下顯示路由資訊（方便 debug）
            if (import.meta.env.DEV && data.modelUsed) {
                console.debug(`[AI Router] 輪次 ${_globalTurnCount} | 模型: ${data.modelUsed} | 原因: ${data.routerReason}`);
            }
            return {
                emotion: data.emotion,
                spoken_reply: data.spoken_reply,
                story_content: data.story_content || '',
                modelUsed: data.modelUsed,
            };
        }
        throw new Error('AI_PROXY_FORMAT_ERROR');
    } catch (error) {
        console.error('AI 回應失敗:', error);
        if (error.message?.includes('次數') || error.message?.includes('用完')) {
            throw error;
        }
        return { emotion: currentEmotion, spoken_reply: getFallbackResponse(currentEmotion), story_content: '' };
    }
};

/**
 * 將關鍵字偵測的情緒名稱轉換為強度分數 JSON
 * 模擬 Hume EVI API 回傳的格式，讓後端路由器可以統一處理
 * 待 Hume API 取得後，此函數可直接替換為真實 Hume API 呼叫
 */
function emotionToTags(emotion) {
    const tagMap = {
        sadness:  { sadness: 0.85, nostalgia: 0.60, calm: 0.10 },
        angry:    { angry: 0.85, anxious: 0.30, calm: 0.10 },
        anxious:  { anxiety: 0.85, anxious: 0.85, calm: 0.10 },
        calm:     { calm: 0.90, joy: 0.20 },
        joy:      { joy: 0.85, calm: 0.40 },
    };
    return tagMap[emotion] || tagMap.calm;
}

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

/**
 * 🎙️ 獲取 Hume EVI 的臨時 Access Token 與 Config ID（供前端語音通話使用）
 * 確保 API Key 與 Secret Key 不會洩漏給前端
 * @returns {Promise<{accessToken: string, configId: string}>}
 */
export const getHumeAccessToken = async () => {
    if (!isAIConfigured) {
        throw new Error('需要登入並連線才能使用 Hume AI');
    }

    try {
        const data = await callEdgeFunction({
            action: 'get_hume_token',
        });

        return {
            accessToken: data.accessToken,
            configId: data.configId,
        };
    } catch (error) {
        console.error('獲取 Hume Token 失敗:', error);
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
import { generateUUID } from '../utils/uuid';

export const saveCompletedStory = async (story) => {
    try {
        await saveStory({
            ...story,
            id: story.id || generateUUID(),
            createdAt: new Date().toISOString(),
        });
        return true;
    } catch (e) {
        console.error('儲存故事失敗:', e);
        return false;
    }
};

/**
 * 🔔 觸發 LINE 代際推播
 * 故事完成儲存後，通知家族子女閱讀並共創
 * @param {string} storyId - 完成的故事 ID
 * @param {string} userId  - 長輩的 user ID
 */
export const triggerLinePush = async (storyId, userId) => {
    if (!isAIConfigured || !LINE_PUSH_URL) {
        console.log('[LINE Push] 未設定 Supabase，跳過推播');
        return { pushed: 0 };
    }

    try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return { pushed: 0 };

        const response = await fetch(LINE_PUSH_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${session.access_token}`,
            },
            body: JSON.stringify({ story_id: storyId, user_id: userId }),
        });

        if (!response.ok) return { pushed: 0 };
        const result = await response.json();
        console.log(`[LINE Push] 已推播給 ${result.pushed} 位家族成員`);
        return result;
    } catch (err) {
        console.warn('[LINE Push] 推播失敗:', err);
        return { pushed: 0 };
    }
};

/**
 * 🧠 從對話中靜默提取長期記憶
 * 在故事整理完成後呼叫，將重要情感記憶存入向量庫
 * 不計入 AI 使用次數（由後端路由至 Groq 低成本模型）
 * @param {string} conversationText - 完整的對話文字
 */
export const saveMemoryFromConversation = async (conversationText) => {
    if (!isAIConfigured || !conversationText) return;

    try {
        await callEdgeFunction({
            action: 'save_memory',
            text: conversationText,
        });
        console.log('[Memory] 記憶提取完成');
    } catch (err) {
        // 靜默失敗，不影響主流程
        console.warn('[Memory] 記憶提取失敗（非致命）:', err);
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
