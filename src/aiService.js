import { supabase } from './supabaseClient';

/**
 * ============================================================================
 * 🚀 STORYS Universe AI 服務層 (Commercial Build)
 * ============================================================================
 * * 目前狀態：開發模式 (Development Mode)
 * 切換方式：當您準備好上線時，請填入 API Key 並切換下方的開關。
 * * [商業思維註記]:
 * 1. 使用 Proxy 或 Edge Function 呼叫 AI 是更安全的做法 (避免 Key 暴露在前端)。
 * 2. 但為了 MVP 快速驗證，我們先在前端直接呼叫，上線前再移至 Supabase Edge Functions。
 */

// ⚠️ 未來請在這裡填入您的真實 Key (不要上傳到 GitHub 公開倉庫！)
const GROQ_API_KEY = "您的_GROQ_API_KEY"; 
const REPLICATE_API_KEY = "您的_REPLICATE_API_KEY";

// 🔴 開發模式開關 (true = 省錢測試版, false = 燒錢正式版)
const USE_MOCK_MODE = true; 

// ============================================================================
// 1. 劇本生成引擎 (Llama-3 via Groq)
// ============================================================================

export const generateStoryFromGroq = async (prompt) => {
  // --- A. 測試模式 (省錢、快速、穩定) ---
  if (USE_MOCK_MODE) {
    console.log("🚧 [Dev Mode] Llama-3 模擬生成中...");
    await new Promise(r => setTimeout(r, 1500)); // 模擬思考延遲
    
    // 根據關鍵字回傳高品質假資料，方便測試 UI
    if (prompt.includes("兒童")) {
        return {
            title: "✨ 測試版：勇敢的小熊",
            cover_prompt: "cute teddy bear in forest, ghibli style",
            pages: [
                { text: "這是一個測試故事，為了不浪費您的 API 額度。", image_prompt: "bear 1" },
                { text: "當您準備好上線時，請將 USE_MOCK_MODE 改為 false。", image_prompt: "bear 2" },
                { text: "屆時 AI 將會根據您的指令，即時生成獨一無二的內容。", image_prompt: "bear 3" }
            ]
        };
    }
    return {
        title: "🚀 商業版預備中",
        cover_prompt: "futuristic city, cyberpunk",
        pages: [
            { text: "您的產品架構已經準備好接軌真實 AI。", image_prompt: "city 1" },
            { text: "請申請 Groq 與 Replicate 的 API Key。", image_prompt: "city 2" },
            { text: "填入後即可開始正式營運。", image_prompt: "city 3" }
        ]
    };
  }

  // --- B. 正式模式 (真實 AI 運算) ---
  // 這是您未來真正會跑的程式碼
  try {
      console.log("🔥 [Prod Mode] 正在呼叫真實 Groq API...");
      
      const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
          method: "POST",
          headers: {
              "Authorization": `Bearer ${GROQ_API_KEY}`,
              "Content-Type": "application/json"
          },
          body: JSON.stringify({
              model: "llama3-8b-8192", // 速度快、成本低的商業選擇
              messages: [
                  {
                      role: "system",
                      content: `你是一個專業的繪本與小說家。請輸出純 JSON 格式，不要有任何多餘文字。
                      格式如下：
                      {
                        "title": "故事標題",
                        "cover_prompt": "英文的封面生成指令(適合Flux模型)",
                        "pages": [
                           { "text": "第1頁故事內容(中文)", "image_prompt": "第1頁插圖指令(英文)" },
                           { "text": "第2頁故事內容...", "image_prompt": "..." },
                           { "text": "第3頁故事內容...", "image_prompt": "..." },
                           { "text": "第4頁故事內容...", "image_prompt": "..." }
                        ]
                      }`
                  },
                  { role: "user", content: prompt }
              ],
              temperature: 0.7
          })
      });

      const data = await response.json();
      const jsonContent = data.choices[0].message.content;
      return JSON.parse(jsonContent); // 將 AI 回傳的字串轉為物件

  } catch (error) {
      console.error("Groq API Error:", error);
      throw new Error("AI 腦力激盪失敗，請檢查 API Key 或額度。");
  }
};

// ============================================================================
// 2. 插圖繪製引擎 (Flux via Replicate)
// ============================================================================

export const generateImageFromFlux = async (prompt) => {
  // --- A. 測試模式 ---
  if (USE_MOCK_MODE) {
    console.log("🚧 [Dev Mode] Flux 模擬繪圖中...");
    await new Promise(r => setTimeout(r, 2000));
    const seed = Math.floor(Math.random() * 1000);
    return `https://picsum.photos/seed/${seed}/800/600`; // 高品質隨機圖
  }

  // --- B. 正式模式 (真實 AI 繪圖) ---
  try {
      console.log("🎨 [Prod Mode] 正在呼叫真實 Replicate API...");
      
      // 注意：Replicate 通常需要透過 Proxy 呼叫，直接在前端呼叫會有 CORS 問題
      // 這裡示範的是標準呼叫邏輯，正式上線建議搬到 Supabase Edge Function
      
      const response = await fetch("https://api.replicate.com/v1/predictions", {
          method: "POST",
          headers: {
              "Authorization": `Token ${REPLICATE_API_KEY}`,
              "Content-Type": "application/json"
          },
          body: JSON.stringify({
              version: "black-forest-labs/flux-schnell", // 最新的快繪模型
              input: { prompt: prompt }
          })
      });

      const prediction = await response.json();
      
      // Replicate 是非同步的，通常需要輪詢 (Polling) 結果
      // 這裡簡化為直接回傳 (實際商業版需要寫一個輪詢函數)
      return prediction.output?.[0] || "https://via.placeholder.com/800x600?text=Generating...";

  } catch (error) {
      console.error("Replicate API Error:", error);
      throw new Error("繪圖失敗，請檢查 API Key。");
  }
};