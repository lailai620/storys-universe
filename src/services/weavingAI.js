/**
 * ============================================================================
 * 🌟 織光 AI 服務層 — 溫柔採訪者 (Gentle Interviewer)
 * ============================================================================
 * 使用 Anthropic Claude 3.5 Sonnet 引導使用者回憶並記錄珍貴的生命故事。
 * 支援動態情緒判定引擎：根據使用者情緒回傳 emotion tag 供前端 UI 連動。
 *
 * 架構：前端 → Supabase Edge Function (ai-proxy) → Claude API
 */

// ─── 設定 ───────────────────────────────────────────────────────
import { supabase, isSupabaseConfigured } from '../supabaseClient';

// 新版 Edge Function（Claude AI Proxy）
const AI_PROXY_URL = isSupabaseConfigured
    ? `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-proxy`
    : '';

// 向上相容：如果新版失敗，可考慮回退到舊版 gemini-proxy
const LEGACY_PROXY_URL = isSupabaseConfigured
    ? `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/gemini-proxy`
    : '';

// 優先使用 Edge Function
const useEdgeFunction = isSupabaseConfigured && !!AI_PROXY_URL;

export const isAIConfigured = useEdgeFunction;

// ─── 情緒→UI 映射 ────────────────────────────────────────────────
/**
 * 根據 AI 回傳的 emotion tag 決定前端 UI 的視覺狀態
 * @param {'joy'|'sadness'|'angry'|'anxious'|'calm'} emotion
 * @returns {{ gradient: string, glowColor: string, ttsRate: number }}
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

// ─── 系統 Prompt ────────────────────────────────────────────────
const SYSTEM_PROMPT = `你是「織光」App 的溫柔採訪者。你的使命是用溫暖、耐心的方式引導使用者回憶並記錄生命中珍貴的故事——無論是關於家人、朋友、同事、寵物，或是使用者自己的回憶。

## 你的個性
- 你像一位溫柔的好朋友，善於傾聽
- 你對每一個回憶都充滿好奇和溫暖
- 你會適時給予肯定和共鳴

## 對話規則
1. 每次只問一個問題，不要連問多個
2. 用具體的感官細節追問（當時的聲音？氣味？觸感？光線？溫度？）
3. 適時肯定使用者的分享，用1句話回應後再問下一個問題
4. 全程使用繁體中文，語氣自然輕鬆
5. 回應控制在 2-3 句以內，不要太長
6. 不要用條列式或編號，要像自然對話
7. 如果使用者的回答很短或模糊，溫柔地引導他多說一些
8. 當累積了足夠的素材（約 5-6 輪對話後），可以提議幫使用者整理成一篇短文

## 你不能做的事
- 不要編造使用者沒有提到的細節
- 不要給建議或說教
- 不要使用 emoji 表情符號
- 不要跳出「回憶採訪者」的角色`;

// ─── 分類開場白 ─────────────────────────────────────────────────
const CATEGORY_GREETINGS = {
    family: '嗨！今天想聊聊家人之間的故事。讓我們從一個簡單的開始：最近一次和家人在一起，最讓你忍不住微笑的瞬間是什麼？',
    friends: '嗨！好朋友之間總有說不完的故事。你有沒有一段跟朋友之間的回憶，每次想到都覺得特別溫暖的？',
    work: '嗨！工作中也有很多值得記住的時刻。有沒有一個同事或一件事，讓你覺得「幸好我在這裡」？',
    pets: '嗨！毛孩子的故事總是特別暖心。可以告訴我你家毛寶貝的名字嗎？還有你們是怎麼相遇的？',
    self: '嗨！今天我們來聊聊你自己。回想一下，有沒有一個瞬間讓你覺得「原來我比想像中更勇敢」？',
    default: '嗨！準備好來聊聊了嗎？我會引導你回憶那些溫暖的時刻。讓我們從一個簡單的問題開始：你最近一次感到特別幸福的瞬間是什麼？',
};

// ─── Fallback 回應（無 API Key 或 API 失敗時使用）──────────────
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
 * @param {string} category - 光源分類 (family/friends/work/pets/self)
 * @returns {string}
 */
export const getInitialGreeting = (category = 'default') => {
    return CATEGORY_GREETINGS[category] || CATEGORY_GREETINGS.default;
};

/**
 * 發送訊息給 AI 並取得回應
 * @param {Array<{role: string, text: string}>} history - 對話歷史
 * @param {string} userMessage - 使用者新訊息
 * @returns {Promise<string>} AI 回應文字
 */
/**
 * 發送訊息給 AI 並取得帶有情緒的回應物件
 * @param {Array<{role: string, text: string}>} history - 對話歷史
 * @param {string} userMessage - 使用者新訊息
 * @returns {Promise<{emotion: string, spoken_reply: string, story_content: string}|string>}
 *   成功時回傳情緒物件，失敗時回傳 fallback 純文字
 */
export const sendMessage = async (history, userMessage) => {
    // 沒有 AI 設定 → 使用 fallback
    if (!isAIConfigured) {
        await simulateDelay();
        return { emotion: 'calm', spoken_reply: getFallbackResponse(), story_content: '' };
    }

    try {
        const contents = buildGeminiContents(history, userMessage);

        // 呼叫新版 Claude ai-proxy
        if (useEdgeFunction) {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                throw new Error('AUTH_ERROR: 找不到使用者連線 (Session null)');
            }
            if (session) {
                const response = await fetch(AI_PROXY_URL, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${session.access_token}`,
                    },
                    body: JSON.stringify({ contents, action: 'chat' }),
                });

                if (response.status === 429) {
                    const errorData = await response.json();
                    aiUsageInfo = { remaining: 0, limit: errorData.limit, isPro: errorData.isPro };
                    throw new Error(errorData.message || 'AI 對話次數已用完');
                }

                if (response.ok) {
                    const data = await response.json();
                    aiUsageInfo = { remaining: data.remaining, limit: data.limit, isPro: data.isPro };
                    if (data.emotion && data.spoken_reply) {
                        return {
                            emotion: data.emotion,
                            spoken_reply: data.spoken_reply,
                            story_content: data.story_content || '',
                        };
                    } else {
                        throw new Error(`AI_PROXY_FORMAT_ERROR: ${JSON.stringify(data)}`);
                    }
                } else {
                    const errText = await response.text();
                    throw new Error(`AI_PROXY_HTTP_ERROR_${response.status}: ${errText}`);
                }
            }
        }

        throw new Error('No AI response (fell through)');
    } catch (error) {
        console.error('AI 回應失敗:', error);
        if (error.message?.includes('次數') || error.message?.includes('用完')) {
            throw error;
        }
        return { emotion: 'calm', spoken_reply: getFallbackResponse(), story_content: '' };
    }
};

// ─── OpenAI TTS ──────────────────────────────────────────────────
const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY || '';

/**
 * 使用 OpenAI TTS 將文字轉為語音並播放
 * @param {string} text - 要朗讀的文字
 * @param {number} rate - 語速倍率（0.5 ～ 1.5），情緒引擎會傳入調整後的值
 */
export const speakWithOpenAI = async (text, rate = 1.0) => {
    if (!OPENAI_API_KEY || !text) return;
    try {
        const response = await fetch('https://api.openai.com/v1/audio/speech', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${OPENAI_API_KEY}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: 'tts-1',
                input: text,
                voice: 'nova',   // nova = 溫柔女聲，最適合陪伴情境
                speed: Math.max(0.5, Math.min(1.5, rate)),
            }),
        });
        if (!response.ok) throw new Error('TTS failed');
        const audioBlob = await response.blob();
        const audioUrl = URL.createObjectURL(audioBlob);
        const audio = new Audio(audioUrl);
        audio.play();
        // 播放完畢後釋放記憶體
        audio.onended = () => URL.revokeObjectURL(audioUrl);
    } catch (err) {
        console.warn('OpenAI TTS 失敗，退回 Web Speech API:', err);
        // Fallback: 使用瀏覽器內建 TTS
        if ('speechSynthesis' in window) {
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.lang = 'zh-TW';
            utterance.rate = rate;
            speechSynthesis.speak(utterance);
        }
    }
};

/**
 * 將故事對話整理成短文
 * @param {Array<{role: string, text: string}>} history - 完整對話歷史
 * @returns {Promise<string>} 整理後的故事文字
 */
export const summarizeStory = async (history) => {
    if (!isAIConfigured) {
        // Fallback: 直接拼接使用者訊息
        return history
            .filter(m => m.role === 'user')
            .map(m => m.text)
            .join('\n\n');
    }

    try {
        const conversationText = history
            .map(m => `${m.role === 'user' ? '使用者' : '採訪者'}：${m.text}`)
            .join('\n');

        const response = await fetch(GEMINI_ENDPOINT, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{
                    role: 'user',
                    parts: [{ text: `請根據以下對話內容，整理成一篇溫暖的第一人稱短文（約200-300字）。保留所有具體細節，不要添加對話中沒有的內容。語氣溫柔自然，像是寫給未來自己的一封信。\n\n對話內容：\n${conversationText}` }],
                }],
                systemInstruction: {
                    parts: [{ text: '你是一位優秀的文字編輯，擅長將對話整理成流暢的散文。使用繁體中文。' }],
                },
                generationConfig: {
                    temperature: 0.7,
                    maxOutputTokens: 500,
                },
            }),
        });

        if (!response.ok) throw new Error(`API error: ${response.status}`);

        const data = await response.json();
        return data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '';
    } catch (error) {
        console.error('故事整理失敗:', error);
        return history
            .filter(m => m.role === 'user')
            .map(m => m.text)
            .join('\n\n');
    }
};

/**
 * 【戰略級優化】自動語音轉錄與散文精煉
 * 透過 Gemini 1.5 Pro 的原生 Audio Understanding 能力，將錄音檔轉為逐字稿與優美散文。
 * @param {string} base64Audio - 不含 Data URL 標頭的 Base64 字串
 * @param {string} mimeType - 音訊 MIME Type (ex. 'audio/webm')
 * @returns {Promise<{transcript: string, polished: string}>}
 */
export const transcribeAndPolishVoice = async (base64Audio, mimeType = 'audio/webm') => {
    if (!GEMINI_API_KEY && !useEdgeFunction) {
        throw new Error('未設定 AI API 金鑰，無法進行語音轉錄。');
    }

    try {
        const payload = {
            contents: [{
                role: 'user',
                parts: [
                    {
                        inlineData: {
                            mimeType: mimeType.split(';')[0], // Gemini 不接受 ;codecs=opus 這種後綴
                            data: base64Audio
                        }
                    },
                    { 
                        text: "請仔細聆聽這段錄音。請先將這段語音完整轉錄為逐字稿（不要漏掉細節），然後扮演一位溫柔的文學編輯，將這段口語對話精煉為一篇感情真摯、適合收錄在回憶錄中的第一人稱散文。如果語音中只有雜音，請回傳空字串。\n請務必以 JSON 格式回傳，格式為：{\"transcript\": \"逐字稿內容\", \"polished\": \"精煉後的散文內容\"}" 
                    }
                ],
            }],
            systemInstruction: {
                parts: [{ text: '你是一位溫柔且具有同理心的文學編輯，擅長將日常口語轉化為感動人心的散文。全篇請使用繁體中文。' }],
            },
            generationConfig: {
                temperature: 0.4, // 稍微降低溫度以確保 JSON 格式穩定
                responseMimeType: "application/json",
            },
        };

        let response;
        if (useEdgeFunction) {
            // TODO: 若 Edge Function 有實作 audio proxy 再支援，先強制 fallback 或直連
            // 這裡為了快速驗證並讓前端直接傳遞 Blob，若未實作 Edge Function proxy，暫時放行直連
            response = await fetch(GEMINI_ENDPOINT, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });
        } else {
            response = await fetch(GEMINI_ENDPOINT, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });
        }

        if (!response.ok) {
            const errBody = await response.text();
            throw new Error(`API error: ${response.status} - ${errBody}`);
        }

        const data = await response.json();
        const aiText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
        
        if (aiText) {
            try {
                const parsed = JSON.parse(aiText);
                return {
                    transcript: parsed.transcript || '',
                    polished: parsed.polished || ''
                };
            } catch (jsonErr) {
                console.warn('AI 回傳的可能不是純 JSON:', aiText);
                return { transcript: aiText, polished: aiText };
            }
        }
        
        throw new Error('No AI transcription content');
    } catch (error) {
        console.error('語音轉錄失敗:', error);
        throw error;
    }
};

// ─── 對話持久化（localStorage）────────────────────────────────
const STORAGE_KEY = 'weaving_chat_sessions';

/**
 * 儲存對話到 localStorage
 * @param {string} sessionId
 * @param {Array} messages
 * @param {object} metadata - { category, title, createdAt }
 */
export const saveSession = (sessionId, messages, metadata = {}) => {
    try {
        const sessions = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
        sessions[sessionId] = {
            messages,
            metadata: {
                ...metadata,
                updatedAt: new Date().toISOString(),
            },
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
    } catch (e) {
        console.error('儲存對話失敗:', e);
    }
};

/**
 * 載入對話
 * @param {string} sessionId
 * @returns {{ messages: Array, metadata: object } | null}
 */
export const loadSession = (sessionId) => {
    try {
        const sessions = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
        return sessions[sessionId] || null;
    } catch {
        return null;
    }
};

/**
 * 取得所有對話列表
 * @returns {Array<{ id: string, metadata: object }>}
 */
export const getAllSessions = () => {
    try {
        const sessions = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
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
 * 儲存完成的故事到 localStorage
 */
export const saveCompletedStory = (story) => {
    try {
        const stories = JSON.parse(localStorage.getItem('weaving_stories') || '[]');
        stories.unshift({
            ...story,
            id: `story_${Date.now()}`,
            createdAt: new Date().toISOString(),
        });
        localStorage.setItem('weaving_stories', JSON.stringify(stories));
        return true;
    } catch (e) {
        console.error('儲存故事失敗:', e);
        return false;
    }
};

// ─── 工具函數 ──────────────────────────────────────────────────

function buildGeminiContents(history, userMessage) {
    const contents = [];

    // 將歷史訊息轉換為 Gemini 格式
    for (const msg of history) {
        // 跳過系統的初始問候（第一條 AI 訊息）
        contents.push({
            role: msg.role === 'user' ? 'user' : 'model',
            parts: [{ text: msg.text }],
        });
    }

    // 加入最新的使用者訊息
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
