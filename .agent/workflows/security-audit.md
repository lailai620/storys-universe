---
description: 掃描前端程式碼中暴露的敏感 API Keys 與資安風險
---

# 資安審計工作流程 (Security Audit)

此工作流程會檢查專案中可能暴露的敏感資訊。

## 執行步驟

### 1. 掃描暴露的 API Keys
// turbo
```bash
grep -rn "VITE_\|apiKey\|api_key\|secret\|password\|token" src/ --include="*.js" --include="*.jsx" --include="*.ts" --include="*.tsx" | grep -v "node_modules"
```

### 2. 檢查 aiService.js
檢視 `src/services/aiService.js`，確認：
- [ ] API Key 是否透過環境變數注入
- [ ] 是否有 hardcoded 的金鑰
- [ ] 呼叫是否應該移至 Edge Functions

### 3. 檢查 supabaseClient.js
檢視 `src/services/supabaseClient.js`，確認：
- [ ] 僅使用 `anon` key（公開可用）
- [ ] `service_role` key 絕不能出現在前端

### 4. 檢查 .env 檔案
// turbo
```bash
cat .env.example
```
確認：
- [ ] `.env` 已加入 `.gitignore`
- [ ] `.env.example` 不含真實金鑰

### 5. 產出報告
在 `SECURITY_AUDIT_REPORT.md` 中記錄：
- 發現的問題
- 風險等級 (High/Medium/Low)
- 建議修復方式

---

## 預期產出
- `SECURITY_AUDIT_REPORT.md` - 完整的資安審計報告
