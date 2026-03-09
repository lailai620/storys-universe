/**
 * ============================================================================
 * 🌟 織光 AI 服務層 — 溫柔採訪者 (Gentle Interviewer)
 * ============================================================================
 * 使用 Google Gemini API 引導使用者回憶並記錄珍貴的生命故事。
 *
 * 開發階段：前端直連 Gemini API
 * 正式上線：遷移至 Supabase Edge Function
 */

// ─── 設定 ───────────────────────────────────────────────────────
import { supabase, isSupabaseConfigured } from '../supabaseClient';

// 開發階段用前端 Key（正式版將移除）
const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY || '';
const GEMINI_MODEL = 'gemini-2.0-flash';
const GEMINI_ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`;

// Edge Function URL
const EDGE_FUNCTION_URL = isSupabaseConfigured
    ? `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/gemini-proxy`
    : '';

// 優先使用 Edge Function，落回前端直連
const useEdgeFunction = isSupabaseConfigured && !!EDGE_FUNCTION_URL;

export const isAIConfigured = !!GEMINI_API_KEY || useEdgeFunction;

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
export const sendMessage = async (history, userMessage) => {
    // 沒有 AI 設定 → 使用 fallback
    if (!isAIConfigured) {
        await simulateDelay();
        return getFallbackResponse();
    }

    try {
        const contents = buildGeminiContents(history, userMessage);

        // 優先使用 Edge Function
        if (useEdgeFunction) {
            const { data: { session } } = await supabase.auth.getSession();
            if (session) {
                const response = await fetch(EDGE_FUNCTION_URL, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${session.access_token}`,
                    },
                    body: JSON.stringify({
                        contents,
                        systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
                        generationConfig: { temperature: 0.8, topP: 0.9, topK: 40, maxOutputTokens: 300 },
                        action: 'chat',
                    }),
                });

                if (response.status === 429) {
                    const errorData = await response.json();
                    aiUsageInfo = { remaining: 0, limit: errorData.limit, isPro: errorData.isPro };
                    throw new Error(errorData.message || 'AI 對話次數已用完');
                }

                if (response.ok) {
                    const data = await response.json();
                    aiUsageInfo = { remaining: data.remaining, limit: data.limit, isPro: data.isPro };
                    const aiText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
                    if (aiText) return aiText.trim();
                }
            }
        }

        // Fallback: 前端直連（開發用）
        if (GEMINI_API_KEY) {
            const response = await fetch(GEMINI_ENDPOINT, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents,
                    systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
                    generationConfig: { temperature: 0.8, topP: 0.9, topK: 40, maxOutputTokens: 300 },
                    safetySettings: [
                        { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_NONE' },
                        { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_NONE' },
                        { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE' },
                        { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' },
                    ],
                }),
            });

            if (!response.ok) throw new Error(`API error: ${response.status}`);
            const data = await response.json();
            const aiText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
            if (aiText) return aiText.trim();
        }

        throw new Error('No AI response');
    } catch (error) {
        console.error('AI 回應失敗:', error);
        // 如果是次數限制錯誤，拋出讓 UI 處理
        if (error.message?.includes('次數') || error.message?.includes('用完')) {
            throw error;
        }
        return getFallbackResponse();
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
