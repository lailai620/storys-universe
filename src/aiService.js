import { supabase } from './supabaseClient';

/**
 * ============================================================================
 * 🚀 STORYS Universe AI 服務層 (Commercial Build - Edge version)
 * ============================================================================
 * * 目前狀態：安全性優化版 (Security Optimized)
 * * 重大改動：
 *   1. 移除了前端硬編碼的 API Keys。
 *   2. 所有 AI 邏輯遷移至 Supabase Edge Functions。
 *   3. 圖片生成現支援伺服器端輪詢 (Polling)。
 */

// 🔴 開發模式開關 (true = 呼叫 Edge Function 的 Mock 邏輯, false = 呼叫真實 AI 邏輯)
// 注意：即使設為 false，也需要您在 Supabase Dashboard 設定好 Secrets 才會生效。
const USE_MOCK_MODE = true;

// ============================================================================
// 1. 劇本生成引擎 (Llama-3 via Edge Function)
// ============================================================================

export const generateStoryFromGroq = async (prompt) => {
    try {
        console.log(`🚀 [AI Service] 正在呼叫 Edge Function (generate-story), Mock: ${USE_MOCK_MODE}`);

        const { data, error } = await supabase.functions.invoke('generate-story', {
            body: { prompt, mock: USE_MOCK_MODE }
        });

        if (error) throw error;
        return data;

    } catch (error) {
        console.error("Story Generation Error:", error);
        throw new Error(error.message || "AI 故事生成失敗，請稍後再試。");
    }
};

// ============================================================================
// 2. 插圖繪製引擎 (Flux via Edge Function)
// ============================================================================

export const generateImageFromFlux = async (prompt, options = {}) => {
    try {
        const { userId, storyId, type } = options;
        const { data, error } = await supabase.functions.invoke('generate-image', {
            body: {
                prompt,
                mock: USE_MOCK_MODE,
                userId,
                storyId,
                type
            }
        });

        if (error) throw error;

        // Edge Function 會直接輪詢直到成功，並回傳 { url: '...' }
        return data.url || "https://via.placeholder.com/800x600?text=Image+Not+Found";

    } catch (error) {
        console.error("Image Generation Error:", error);
        throw new Error(error.message || "AI 繪圖失敗，請稍後再試。");
    }
};

/**
 * 3. 語音朗讀引擎 (OpenAI TTS via Edge Function)
 */
export const generateSpeech = async (text, options = {}) => {
    try {
        console.log(`🎙️ [AI Service] 正在呼叫 Edge Function (generate-speech), Mock: ${USE_MOCK_MODE}`);
        const { voice = 'nova' } = options;

        const { data, error } = await supabase.functions.invoke('generate-speech', {
            body: { text, voice, mock: USE_MOCK_MODE }
        });

        if (error) throw error;

        // 如果回傳的是 Blob (正式模式)
        if (data instanceof Blob) {
            return URL.createObjectURL(data);
        }

        // 如果回傳的是 JSON (Mock 模式)
        if (data?.url) {
            return data.url;
        }

        return null;
    } catch (error) {
        console.error("Speech Generation Error:", error);
        throw error;
    }
};
