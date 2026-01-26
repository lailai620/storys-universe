# Storys Universe 專案進度報告

## 1. 專案概覽 (Project Overview)
**Storys Universe** 是一個結合 AI 輔助創作與沉浸式閱讀的平台。使用者可以創作、閱讀並分享互動式故事。專案採用現代化的 Web 技術堆疊，強調「深邃宇宙 (Dark Cosmic)」的視覺風格與流暢的互動體驗。

## 2. 技術架構 (Technical Architecture)
### 核心技術 (Core Stack)
- **前端框架**: React 18 + Vite (建置工具)
- **語言**: JavaScript (ES6+)
- **樣式系統**: Tailwind CSS (Utility-first) + Sass + `tailwindcss-animate` (動畫擴充)
- **路由**: React Router v6 (支援 GitHub Pages `basename` 設定)
- **國際化 (I18n)**: `i18next` + `react-i18next` (目前支援 zh-TW, en，預設 zh-TW)

### 狀態管理 & 核心服務 (State & Services)
- **Context API (與全域 Hook)**:
  - `StoryContext`: 管理故事 CRUD、訪客模式、權限判斷 (`isAdmin`)。
  - `AudioContext`: 處理全站音效，強制實作 `playClick()` 互動回饋。
  - `ToastContext`: 統一的通知提示 (`showToast()`)。
- **後端服務 (BaaS)**:
  - **Supabase**:
    - **Auth**: Email/Password 登入，支援 Session 管理。
    - **Database**: Postgres，存放使用者資料與故事。
    - **Storage**: 存放封面圖片等資源。
- **AI 整合 (AI Services)**:
  - **架構現況**: 混合模式 (Hybrid)。
    - **開發模式 (Mock Mode)**: 前端直接回傳高品質假資料 (如「勇敢的小熊」)，節省 API 成本並加速 UI 迭代。
    - **正式模式 (Production)**:
      - **文本**: 整合 **Groq API** (Llama-3 模型)，生成 JSON 格式的故事結構。
      - **影像**: 整合 **Replicate API** (Flux 模型)，依據提示詞生成配圖。
  - **未來規劃**: 建議將 API Key 移至 Supabase Edge Functions 以提升安全性。

### 基礎設施與部署 (Infrastructure & Deployment)
- **託管平台**: GitHub Pages
- **CI/CD 流水線**: GitHub Actions (`deploy.yml`)
  - **觸發**: 推送至 main 分支時自動建置並部署。
  - **環境**: Node.js 20，自動注入 GitHub Secrets (`SUPABASE_URL`, `ANON_KEY`)。

## 3. UI/UX 設計數據 (UI/UX Technical Data)
### 3.1 色彩系統 (Color System)
- **基礎底色**: `#0f1016` (Deep Space Black) - 沉浸式宇宙深黑。
- **介面層級**: `#1a1b26` - 卡片與容器背景。
- **強調色**:
  - **品牌**: Indigo-Purple Gradient (`from-indigo-500 to-purple-500`)。
  - **星塵 (貨幣)**: `#fcd34d` (Amber-300) + Glow Effect。
  - **文字**: `#e2e8f0` (Slate-200) 為主，閱讀舒適。

### 3.2 視覺與互動 (Visual & Interaction)
- **玻璃擬態 (Glassmorphism)**: 廣泛應用於導覽列與側邊欄 (`bg-white/5` + `backdrop-blur-md`)。
- **全屏氛圍**:
  - `ScreenEffects.jsx`: 動態高斯模糊光球 (`blur-[100px]`) + SVG Noise Texture (膠卷質感)。
  - 四大主題色變換: Space (藍紫), Memoir (褐橙), Novel (墨綠), Kids (暖杏)。
- **微互動**: 按鈕懸停放大 (`scale-105`)、圖示旋轉、點擊音效回饋。

## 4. 詳細功能規格 (Detailed Feature Specs)

### 4.1 核心資料模型 (Data Models)
根據 `StoryContext` 與程式碼推導之關鍵欄位：
- **Story (故事)**:
  - `id`, `title`, `content` (頁面陣列), `cover_image`
  - `category` (novel/fable...), `style` (scifi/watercolor...)
  - `visibility` (public/private), `memory_date`
  - `author_id` (關聯用戶), `balance_cost` (創建扣除 10 星塵)
- **User (用戶)**:
  - `id`, `email`, `token_balance` (星塵餘額)

### 4.2 獨特功能亮點 (Unique Features)
- **訪客模式 (Guest Mode)**:
  - 允許未登入使用者創作與閱讀。
  - 資料暫存於 `localStorage` (`guest_stories`)。
  - 登入後自動觸發 `syncGuestStories`，將作品上傳至雲端。
- **權限控管 (RBAC)**:
  - 簡易管理員判斷 (`email.includes('admin')`)。
  - `ProtectedRoute`: 防止未授權訪問特定頁面。
- **PDF/圖片匯出**: 整合 `html2canvas` + `jspdf`，支援將故事匯出為實體檔案。

### 4.3 頁面清單 (Page Map)
- **公開區**: `/` (聖所), `/gallery` (畫廊), `/login` (登入)
- **會員區**: `/profile` (個人檔案/星塵庫/設置), `/creator` (創作工坊)
- **動態區**: `/story/:id` (閱讀器 - 支援動態路由)

## 5. 待辦事項與風險 (Next Steps & Risks)
- **安全性 (High)**: `aiService.js` 與 `supabaseClient.js` 目前在前端包含敏感 Key 或邏輯，正式上線前 **必須** 遷移至後端 Proxy 或 Edge Functions。
- **支付串接 (Medium)**: `PaymentModal` 需確認與第三方支付的實際串接流程。
- **AI 穩定性 (Medium)**: 需驗證 Groq/Replicate 在高併發下的回應速度與錯誤處理機制。
- **RWD 優化 (Low)**: 持續優化手機版閱讀體驗。

---
*報告完整版 - 產生時間: 2026-01-26*
