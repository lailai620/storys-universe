# Storys Universe 商業化優化藍圖 (Commercial Optimization Roadmap)

要將 **Storys Universe** 升級為真正的「商業級產品 (Commercial Grade Product)」，我們不能只停留在功能實作，必須深入考量 **穩定性、安全性、成本控制、可擴展性** 與 **變現能力**。

以下是針對目前架構提出的優化建議，分為三個優先級：

---

## 🛑 第一階段：核心基建與安全性 (Critical Infrastructure)
*這些是上線收費前 **必須** 完成的項目，否則會有資安風險或嚴重虧損。*

### 1. 資安升級 (Security Hardening)
- **移除前端金鑰 (Remove Frontend Keys)**:
  - **現狀**: `aiService.js` 與 `supabaseClient.js` 把 API Key 暴露在瀏覽器端。
  - **解法**: 建立 **Supabase Edge Functions** (類似 AWS Lambda) 作為中間層 (Middleware)。
  - **流程**: 前端呼叫 Edge Function -> Function 驗證用戶權限 -> Function 使用後端專用 Key 呼叫 Groq/Replicate -> 回傳結果給前端。
- **資料庫權限 (RLS Policies)**:
  - **現狀**: 依賴前端過濾資料。
  - **解法**: 在 Postgres 資料庫層級設定嚴格的 **Row Level Security**。確保使用者**絕對無法**讀取或修改不屬於他們的私有故事。

### 2. AI 成本控管 (Cost Control)
- **速率限制 (Rate Limiting)**:
  - **風險**: 惡意用戶或腳本可能在一分鐘內發送數千次生成請求，導致帳單爆炸。
  - **解法**: 對每個用戶實施 API 呼叫限制 (例如：普通用戶每小時 5 次，付費用戶每小時 50 次)。
- **配額系統 (Quota System)**:
  - **實作**: 嚴格檢查 `token_balance`，在後端扣款成功後才執行 AI 生成，避免「先享受沒付費」的漏洞。

### 3. 交易帳本 (Transaction Ledger)
- **現狀**: 直接修改 `token_balance` 數字 (`setBalance(prev - 10)`), 
- **風險**: 無法追蹤資金流向，若發生爭議無法查帳。
- **解法**: 建立 `transactions` 表格 (Double-entry bookkeeping 概念)。
  - 欄位: `user_id`, `amount` (-10), `type` ('create_story'), `reference_id` (story_id), `created_at`。
  - 餘額應由 `transactions` 加總計算，或透過 Database Trigger 自動更新。

---

## 🚀 第二階段：使用者體驗與效能 (UX & Performance)
*提升留存率與轉換率的關鍵。*

### 1. 搜尋引擎優化 (SEO & Social Sharing)
- **現狀**: 純 React SPA (Single Page App)，爬蟲只看得到空白 HTML。
- **解法 (中程)**: 使用 `React Helmet` 動態替換 `<meta>` 標籤，讓分享到 FB/Line/Twitter 時能顯示故事封面與標題。
- **解法 (長程)**: 考慮遷移至 **Next.js** (SSR/ISR)，這對內容型網站 (Content Platform) 來說是標準配置。

### 2. 圖片/資源優化 (Asset Optimization)
- **現狀**: 直接讀取原圖。
- **解法**: 導入 CDN 與圖片處理服務 (如 Cloudinary 或 Supabase Image Transformation)。
  - 自動轉檔 WebP/AVIF。
  - 根據裝置尺寸載入縮圖 (RWD Images)，大幅加快手機版載入速度。

### 3. PWA (Progressive Web App)
- **目標**: 讓網站能像 App 一樣安裝在手機桌面。
- **功能**: 添加 `manifest.json` 與 Service Worker，支援離線瀏覽已讀過的故事。

---

## 💰 第三階段：營利與營運 (Monetization & Ops)
*支援規模化經營與變現的功能。*

### 1. 支付閘道整合 (Payment Gateway)
- **整合**: Stripe (國際) 或 TapPay/藍新/ECPay (台灣)。
- **商品**: 
  - **訂閱制 (SaaS)**: 每月固定星塵額度 + 無限閱讀。
  - **單次購買**: 儲值星塵包。

### 2. 監控與數據分析 (Monitoring & Analytics)
- **錯誤追蹤**: 整合 **Sentry**，在用戶遇到白畫面時自動報警並回傳錯誤堆疊。
- **行為分析**: 整合 **PostHog** 或 Google Analytics 4，追蹤轉換漏斗 (Landing -> Login -> Create -> Pay)。

### 3. 內容審查 (Content Moderation)
- **風險**: 用戶生成色情、暴力或侵權內容導致平台被封殺。
- **解法**: 在 AI 生成流程中加入「敏感詞過濾」或使用 AI 審查模型 (如 OpenAI Moderation API) 預先掃描。

---

## 💡 建議執行順序
1. **立刻執行**: 資安升級 (Edge Functions) — 保護你的錢包與名聲。
2. **緊接執行**: 交易帳本 — 確保經濟系統邏輯正確。
3. **上線前執行**: 錯誤追蹤 (Sentry) — 當第一批用戶進入時，你必須知道發生了什麼事。
