# 🔒 Storys Universe 資安審計報告

**審計日期**: 2026-01-26  
**審計類型**: 前端敏感資訊暴露掃描

---

## 🛑 發現問題總覽

| 風險等級 | 數量 |
|----------|------|
| 🔴 HIGH | 2 |
| 🟡 MEDIUM | 2 |
| 🟢 LOW | 1 |

---

## 🔴 HIGH - 需立即修復

### 1. Supabase Key 直接暴露在程式碼中
**檔案**: `src/supabaseClient.js`

```javascript
// ⚠️ 危險：直接寫死在程式碼中
const supabaseUrl = 'https://bvcbrneysdhkfwkwoptb.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...';
```

**風險**:
- 推送到 GitHub 後，任何人都可以看到並使用您的 Supabase 專案
- 雖然是 `anon` key（相對安全），但仍不應直接暴露

**修復方式**:
```javascript
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
```

---

### 2. AI API Keys 預留位置設計不當
**檔案**: `src/aiService.js`

```javascript
// ⚠️ 危險：誘導開發者在此填入真實金鑰
const GROQ_API_KEY = "您的_GROQ_API_KEY"; 
const REPLICATE_API_KEY = "您的_REPLICATE_API_KEY";
```

**風險**:
- 開發者可能直接在此填入真實 API Key
- 推送到 GitHub 後會導致金鑰外洩，帳單爆炸

**修復方式**:
- 移除此設計，改用 Supabase Edge Functions 在後端呼叫 AI API

---

## 🟡 MEDIUM - 建議儘快修復

### 3. .gitignore 未包含 .env
**檔案**: `.gitignore`

**現狀**: 未明確排除 `.env` 檔案

**修復方式**:
```gitignore
# Environment variables
.env
.env.local
.env.production
```

---

### 4. 缺少 .env.example 範本
**現狀**: 專案沒有 `.env.example` 檔案供開發者參考

**修復方式**: 建立 `.env.example`
```bash
VITE_SUPABASE_URL=your_supabase_url_here
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here
```

---

## 🟢 LOW - 可接受

### 5. 重複的 Supabase 設定檔
- `src/supabaseClient.js` - 直接 hardcode
- `src/firebaseConfig.js` - 使用環境變數 ✅

**建議**: 統一使用 `firebaseConfig.js` 並移除 `supabaseClient.js`，避免混淆。

---

## ✅ 正確做法確認

| 檔案 | 狀態 |
|------|------|
| `src/firebaseConfig.js` | ✅ 正確使用 `import.meta.env` |
| `src/pages/Login.jsx` | ✅ password 僅作為表單變數使用 |
| `src/context/StoryContext.jsx` | ✅ 密碼正確傳遞給 Supabase Auth |

---

## 📋 建議修復順序

1. **立即**：更新 `.gitignore` 加入 `.env` 規則
2. **今日**：修復 `src/supabaseClient.js` 改用環境變數
3. **本週**：建立 Supabase Edge Functions 處理 AI 呼叫
4. **上線前**：移除 `aiService.js` 中的前端 API 呼叫設計

---

*報告由 AI 自動產生，建議人工複查*
